import { expect, test } from "@playwright/test";

test("home is public and offers a scan without signup", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "Scan a repository" })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "Sign in" })).toHaveCount(0);
  await expect(page.getByRole("banner").getByRole("link", { name: "Sign up" })).toHaveCount(0);
});

test("documentation is public", async ({ page }) => {
  await page.goto("/documentation");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page).toHaveURL(/\/documentation/);
});

test("header scan opens the scan page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "Scan a repository" }).click();
  await expect(page).toHaveURL(/\/scan/);
  await expect(page.getByRole("heading", { name: "Scan" })).toBeVisible();
});

test("dashboard is public and empty until a scan", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening)/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Scan a repository" })).toBeVisible();
});

test("leftover login and signup URLs do not require an account", async ({ page }) => {
  await page.goto("/login");
  await expect(page).not.toHaveURL(/\/login/);
  await page.goto("/signup");
  await expect(page).not.toHaveURL(/\/signup/);
});

test("session scan API rejects anonymous empty bodies without hanging", async ({ request }) => {
  const scan = await request.post("/api/session/scan", { data: {} });
  expect(scan.status()).toBe(400);

  const github = await request.get("/api/session/github");
  expect(github.status()).toBe(200);
  await expect(github.json()).resolves.toMatchObject({ connected: false });
});
