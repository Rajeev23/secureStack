import { decryptSecret, encryptSecret } from "@/lib/crypto/secret";
import { DomainError } from "@/lib/errors";
import {
  getGitHubAuthenticatedUser,
  listGitHubRepositories,
  parseGitHubBranch,
  parseGitHubRepoFullName,
} from "@/services/github/api";
import { listRepositoryBlobPaths } from "@/services/github/contents";
import { filterRepositoryFilePaths } from "@/services/scanner/search-files";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { CompanyRow, GithubConnection } from "@/server/supabase/types";
import { requireCompanyContext, toPublicCompany } from "@/services/api/company";

export async function saveGitHubConnection(
  userId: string,
  input: { accessToken: string; tokenType: string; scope: string },
) {
  const { companyId } = await requireCompanyContext(userId);
  const account = await getGitHubAuthenticatedUser(input.accessToken);

  const connection: GithubConnection = {
    provider: "github",
    accountLogin: account.login,
    accountId: account.id,
    encryptedAccessToken: encryptSecret(input.accessToken),
    tokenType: input.tokenType,
    scope: input.scope,
    connectedAt: new Date().toISOString(),
  };

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("companies")
    .update({ github_connection: connection })
    .eq("id", companyId)
    .select("*")
    .single();

  if (error || !data) {
    throw new DomainError(error?.message ?? "Unable to save GitHub connection.", 500);
  }

  return toPublicCompany(data as CompanyRow);
}

export async function getCompanyGitHubTokenForCompany(companyId: string): Promise<string> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("companies")
    .select("github_connection")
    .eq("id", companyId)
    .maybeSingle();

  if (error) throw new DomainError(error.message, 500);
  const connection = (data as { github_connection: GithubConnection | null } | null)?.github_connection;
  if (!connection?.encryptedAccessToken) {
    throw new DomainError("GitHub is not connected.", 409);
  }

  return decryptSecret(connection.encryptedAccessToken);
}

export async function getCompanyGitHubToken(userId: string): Promise<string> {
  const { companyId } = await requireCompanyContext(userId);
  return getCompanyGitHubTokenForCompany(companyId);
}

export async function listConnectedGitHubRepositories(userId: string) {
  const token = await getCompanyGitHubToken(userId);
  return listGitHubRepositories(token);
}

export async function searchConnectedGitHubFiles(
  userId: string,
  input: { fullName: string; branch: string; query: string },
): Promise<{ files: string[]; truncated: boolean; matched: number }> {
  const fullName = parseGitHubRepoFullName(input.fullName);
  const branch = parseGitHubBranch(input.branch);
  if (!fullName || !branch) {
    throw new DomainError("Invalid repository.", 400);
  }

  const token = await getCompanyGitHubToken(userId);
  try {
    const tree = await listRepositoryBlobPaths(token, fullName, branch);
    const filtered = filterRepositoryFilePaths(tree.paths, input.query);
    return {
      files: filtered.files,
      truncated: tree.truncated || filtered.truncated,
      matched: filtered.matched,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("GitHub API 404") || message.includes("GitHub API 403")) {
      throw new DomainError("Unable to list files in that repository.", 404);
    }
    throw new DomainError("Unable to search repository files.", 502);
  }
}
