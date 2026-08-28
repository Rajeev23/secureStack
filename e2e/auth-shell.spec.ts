import { expect, test } from "@playwright/test";

test("home is public and shows Sign in and Sign up", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "Sign up" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
});

test("documentation is public", async ({ page }) => {
  await page.goto("/documentation");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page).toHaveURL(/\/documentation/);
});

test("login page is public", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Forgot password?" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create account" })).toBeVisible();
});

test("signup page is public", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
  await expect(page.getByLabel("Name")).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
});

test("forgot password page is public", async ({ page }) => {
  await page.goto("/forgot-password");
  await expect(page.getByRole("heading", { name: "Reset password" })).toBeVisible();
});

test("reset password page is public", async ({ page }) => {
  await page.goto("/reset-password");
  await expect(page.getByRole("heading", { name: "Choose a new password" })).toBeVisible();
});

test("header Sign in opens login", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("header Sign up opens signup", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "Sign up" }).click();
  await expect(page).toHaveURL(/\/signup/);
  await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
});

test("anonymous dashboard visitors are sent to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("anonymous onboarding visitors are sent to login", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("login shows a field error when submitted empty", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Password is required.")).toBeVisible();
});

test("signup shows a field error for an invalid email", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Name").fill("Test User");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByRole("textbox", { name: "Password" }).fill("password1");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
});

test("auth APIs reject anonymous and invalid input without hanging", async ({ request }) => {
  const me = await request.get("/api/auth/me");
  expect(me.status()).toBe(401);
  await expect(me.json()).resolves.toMatchObject({ user: null });

  const login = await request.post("/api/auth/login", {
    data: { email: "not-an-email", password: "x" },
  });
  expect(login.status()).toBe(400);

  const signup = await request.post("/api/auth/signup", {
    data: { name: "", email: "nope", password: "short" },
  });
  expect(signup.status()).toBe(400);

  const forgot = await request.post("/api/auth/forgot-password", {
    data: { email: "nope" },
  });
  expect(forgot.status()).toBe(400);

  const forgotUnknown = await request.post("/api/auth/forgot-password", {
    data: { email: "e2e-unknown@example.com" },
  });
  expect(forgotUnknown.status()).toBe(200);
  await expect(forgotUnknown.json()).resolves.toMatchObject({ ok: true });

  const reset = await request.post("/api/auth/reset-password", {
    data: { password: "password1" },
  });
  expect(reset.status()).toBe(401);

  const logout = await request.post("/api/auth/logout");
  expect(logout.status()).toBe(200);
});

test("unknown credentials do not create a session", async ({ request }) => {
  const response = await request.post("/api/auth/login", {
    data: {
      email: "e2e-unknown@example.com",
      password: "wrong-password-1",
    },
  });
  expect([401, 429]).toContain(response.status());

  const me = await request.get("/api/auth/me");
  expect(me.status()).toBe(401);
});
