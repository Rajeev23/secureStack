import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { AuthUser, CompanyPublic, CompanyRow, UserRow } from "@/server/supabase/types";
import { parseCompanyMonitoring } from "@/services/monitoring/schedule";
import { nameFromUserMetadata } from "@/lib/auth/display-name";
import { AUTH_LOOKUP_TIMEOUT_MS, withTimeout } from "@/lib/auth/fetch-timeout";
import { DomainError } from "@/lib/errors";
import { normalizeName } from "@/lib/company/names";

export function toAuthUser(row: Pick<UserRow, "id" | "name" | "email" | "role">): AuthUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
  };
}

export function toPublicCompany(
  row: Pick<CompanyRow, "id" | "name" | "slug" | "status" | "created_at" | "updated_at"> & {
    github_connection?: CompanyRow["github_connection"];
    monitoring?: CompanyRow["monitoring"];
  },
): CompanyPublic {
  const monitoring = parseCompanyMonitoring(row.monitoring);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    githubConnected: Boolean(row.github_connection?.encryptedAccessToken),
    githubAccountLogin: row.github_connection?.accountLogin ?? null,
    scanIntervalHours: monitoring.scanIntervalHours,
    alertsEnabled: monitoring.alertsEnabled,
    slackConfigured: Boolean(monitoring.slackWebhookUrl),
    notifyEmail: monitoring.notifyEmail,
    digestMode: monitoring.digestMode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAuthUserById(userId: string): Promise<AuthUser | null> {
  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin.from("users").select("*").eq("id", userId).maybeSingle();
  if (profile) return toAuthUser(profile as UserRow);

  try {
    const { data, error } = await withTimeout(
      admin.auth.admin.getUserById(userId),
      AUTH_LOOKUP_TIMEOUT_MS,
    );
    if (error || !data.user) return null;
    const email = data.user.email ?? "";
    return {
      id: data.user.id,
      name: nameFromUserMetadata(data.user.user_metadata, email),
      email,
      role: "ADMIN",
    };
  } catch {
    return {
      id: userId,
      name: "Account",
      email: "",
      role: "ADMIN",
    };
  }
}

export async function updateAuthUserName(userId: string, rawName: string): Promise<AuthUser> {
  const name = normalizeName(rawName);
  if (!name) throw new DomainError("Name is required.", 400);

  const admin = createSupabaseAdminClient();
  const { error: metadataError } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: { name },
  });
  if (metadataError) {
    throw new DomainError(metadataError.message, 500);
  }

  const { data: profile } = await admin.from("users").select("id").eq("id", userId).maybeSingle();
  if (profile) {
    const { error } = await admin.from("users").update({ name }).eq("id", userId);
    if (error) throw new DomainError(error.message, 500);
  }

  const user = await getAuthUserById(userId);
  if (!user) throw new DomainError("Account not found.", 401);
  return user;
}

export async function resolvePostAuthRedirect(userId: string): Promise<string> {
  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin.from("users").select("id").eq("id", userId).maybeSingle();
  return profile ? "/dashboard" : "/onboarding";
}

export async function getDemoAuthUser(): Promise<AuthUser> {
  return {
    id: "00000000-0000-0000-0000-000000000000",
    name: "SecureStack",
    email: "",
    role: "ADMIN",
  };
}

export { DomainError };
