import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { CompanyRow, UserRow } from "@/server/supabase/types";
import { slugifyCompanyName } from "@/lib/company/slug";
import { nameFromUserMetadata } from "@/lib/auth/display-name";
import {
  parseCompanyMonitoring,
  type CompanyMonitoring,
  type DigestMode,
} from "@/services/monitoring/schedule";
import { DomainError } from "@/lib/errors";
import { normalizeName } from "@/lib/company/names";
import { getAuthUserById, toAuthUser, toPublicCompany } from "@/services/api/auth";

export { toPublicCompany };

export type CompanyContext = {
  onboardingStep: "company" | "complete";
  company: ReturnType<typeof toPublicCompany> | null;
  user: ReturnType<typeof toAuthUser> | null;
};

export async function getCompanyContext(userId: string): Promise<CompanyContext> {
  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin.from("users").select("*").eq("id", userId).maybeSingle();
  if (!profile) {
    return { onboardingStep: "company", company: null, user: null };
  }

  const { data: company, error } = await admin
    .from("companies")
    .select("*")
    .eq("id", (profile as UserRow).company_id)
    .maybeSingle();

  if (error || !company) {
    throw new DomainError("Company not found.", 404);
  }

  return {
    onboardingStep: "complete",
    company: toPublicCompany(company as CompanyRow),
    user: toAuthUser(profile as UserRow),
  };
}

export async function requireCompanyContext(userId: string) {
  const context = await getCompanyContext(userId);
  if (!context.company || !context.user) {
    throw new DomainError("Finish company setup first.", 403);
  }
  return { company: context.company, user: context.user, companyId: context.company.id };
}

export async function createCompanyForUser(userId: string, rawName: string): Promise<CompanyContext> {
  const name = normalizeName(rawName);
  if (!name) throw new DomainError("Company name is required.", 400);

  const existing = await getCompanyContext(userId);
  if (existing.company) {
    return existing;
  }

  const admin = createSupabaseAdminClient();
  const { data: authData, error: authError } = await admin.auth.admin.getUserById(userId);
  if (authError || !authData.user) {
    throw new DomainError("Account not found.", 401);
  }

  const email = authData.user.email?.trim().toLowerCase() ?? "";
  if (!email) {
    throw new DomainError("Account is missing an email address.", 400);
  }

  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({
      name,
      slug: slugifyCompanyName(name),
      status: "active",
    })
    .select("*")
    .single();

  if (companyError || !company) {
    throw new DomainError(companyError?.message ?? "Unable to create company.", 500);
  }

  const { error: userError } = await admin.from("users").insert({
    id: userId,
    company_id: company.id,
    name: nameFromUserMetadata(authData.user.user_metadata, email),
    email,
    role: "ADMIN",
  });

  if (userError) {
    await admin.from("companies").delete().eq("id", company.id);
    throw new DomainError(userError.message, 500);
  }

  return getCompanyContext(userId);
}

export async function updateCompany(
  userId: string,
  input: {
    name?: string;
    scanIntervalHours?: number;
    alertsEnabled?: boolean;
    slackWebhookUrl?: string | null;
    notifyEmail?: string | null;
    digestMode?: DigestMode;
  },
) {
  const { companyId } = await requireCompanyContext(userId);
  const admin = createSupabaseAdminClient();
  const { data: currentRow, error: currentError } = await admin
    .from("companies")
    .select("monitoring")
    .eq("id", companyId)
    .single();
  if (currentError || !currentRow) {
    throw new DomainError(currentError?.message ?? "Company not found.", 404);
  }

  const current = parseCompanyMonitoring((currentRow as CompanyRow).monitoring);
  const monitoring: CompanyMonitoring = parseCompanyMonitoring({
    ...current,
    scanIntervalHours: input.scanIntervalHours ?? current.scanIntervalHours,
    alertsEnabled: input.alertsEnabled ?? current.alertsEnabled,
    slackWebhookUrl:
      input.slackWebhookUrl === undefined
        ? current.slackWebhookUrl
        : input.slackWebhookUrl === "" || input.slackWebhookUrl === null
          ? null
          : input.slackWebhookUrl,
    notifyEmail: input.notifyEmail === undefined ? current.notifyEmail : input.notifyEmail,
    digestMode: input.digestMode ?? current.digestMode,
  });
  if (input.slackWebhookUrl && input.slackWebhookUrl !== "" && !monitoring.slackWebhookUrl) {
    throw new DomainError("Slack webhook must be an https://hooks.slack.com URL.", 400);
  }

  const patch: Record<string, unknown> = { monitoring };
  if (input.name) {
    const name = normalizeName(input.name);
    if (!name) throw new DomainError("Company name is required.", 400);
    patch.name = name;
  }

  const { data, error } = await admin.from("companies").update(patch).eq("id", companyId).select("*").single();
  if (error || !data) {
    throw new DomainError(error?.message ?? "Unable to update company.", 500);
  }
  return toPublicCompany(data as CompanyRow);
}

export async function markDigestSent(companyId: string, sentAt = new Date()): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("companies").select("monitoring").eq("id", companyId).maybeSingle();
  if (error || !data) return;
  const monitoring = parseCompanyMonitoring((data as CompanyRow).monitoring);
  await admin
    .from("companies")
    .update({ monitoring: { ...monitoring, lastDigestAt: sentAt.toISOString() } })
    .eq("id", companyId);
}

/** @deprecated use updateCompany */
export async function updateCompanyName(userId: string, rawName: string) {
  return updateCompany(userId, { name: rawName });
}

export async function getAuthProfileOrThrow(userId: string) {
  const user = await getAuthUserById(userId);
  if (!user) throw new DomainError("Unauthorized.", 401);
  return user;
}
