import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;

const db: Record<string, Row[]> = {
  users: [],
  companies: [],
  projects: [],
  findings: [],
};

function matches(row: Row, filters: Array<[string, unknown]>) {
  return filters.every(([column, value]) => row[column] === value);
}

function createClient() {
  return {
    from(table: string) {
      let filters: Array<[string, unknown]> = [];
      const builder = {
        select() {
          return builder;
        },
        eq(column: string, value: unknown) {
          filters = [...filters, [column, value]];
          return builder;
        },
        in() {
          return builder;
        },
        order() {
          return builder;
        },
        limit() {
          return builder;
        },
        maybeSingle: async () => {
          const row = (db[table] ?? []).find((item) => matches(item, filters)) ?? null;
          return { data: row, error: null };
        },
        single: async () => {
          const row = (db[table] ?? []).find((item) => matches(item, filters)) ?? null;
          return { data: row, error: row ? null : { message: "not found" } };
        },
        update() {
          return builder;
        },
        insert() {
          return builder;
        },
        delete() {
          return builder;
        },
      };
      return builder;
    },
  };
}

vi.mock("@/server/supabase/admin", () => ({
  createSupabaseAdminClient: () => createClient(),
}));

const companyA = {
  id: "company-a",
  name: "Acme",
  slug: "acme",
  status: "active",
  github_connection: null,
  monitoring: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const userA = {
  id: "user-a",
  company_id: "company-a",
  name: "Ada",
  email: "ada@acme.test",
  role: "ADMIN",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  db.users = [{ ...userA }];
  db.companies = [{ ...companyA }];
  db.projects = [
    {
      id: "project-a",
      company_id: "company-a",
      name: "Owned",
      description: null,
      repositories: [],
      monitoring: null,
      status: "active",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "project-b",
      company_id: "company-b",
      name: "Other company",
      description: null,
      repositories: [],
      monitoring: null,
      status: "active",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
  ];
  db.findings = [
    {
      id: "finding-b",
      project_id: "project-b",
      component_name: "axios",
      ecosystem: "npm",
      current_version: "1.0.0",
      recommended_version: "1.8.0",
      finding_type: "SECURITY",
      severity: "HIGH",
      external_reference: "CVE-2024-1",
      status: "OPEN",
      recommendation: "Upgrade axios",
      first_detected_at: "2026-01-01T00:00:00.000Z",
      last_detected_at: "2026-01-01T00:00:00.000Z",
      resolved_at: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
  ];
});

describe("company-scoped project access", () => {
  it("returns a project in the caller company", async () => {
    const { getProject } = await import("@/services/api/projects");
    const project = await getProject("user-a", "project-a");
    expect(project.name).toBe("Owned");
  });

  it("hides another company's project as not found", async () => {
    const { getProject } = await import("@/services/api/projects");
    await expect(getProject("user-a", "project-b")).rejects.toMatchObject({
      name: "DomainError",
      status: 404,
    });
  });
});

describe("finding status", () => {
  it("rejects status updates until findings are persisted", async () => {
    const { updateFindingStatus } = await import("@/services/api/findings");
    await expect(updateFindingStatus("user-a", "finding-b", "ACKNOWLEDGED")).rejects.toMatchObject({
      name: "DomainError",
      status: 501,
    });
  });
});

describe("onboarding", () => {
  it("returns the existing company instead of creating a second one", async () => {
    const { createCompanyForUser } = await import("@/services/api/company");
    const result = await createCompanyForUser("user-a", "Should not replace");
    expect(result.company?.name).toBe("Acme");
    expect(db.companies).toHaveLength(1);
  });

  it("rejects an empty company name", async () => {
    db.users = [];
    db.companies = [];
    const { createCompanyForUser } = await import("@/services/api/company");
    await expect(createCompanyForUser("user-a", "   ")).rejects.toMatchObject({
      name: "DomainError",
      status: 400,
    });
  });
});
