import { describe, expect, it } from "vitest";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/lib/auth/signup-schema";
import { getSafeInternalPath } from "@/lib/auth/proxy-access";

describe("signupSchema", () => {
  it("accepts a complete signup", () => {
    const parsed = signupSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "password1",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a short password and invalid email", () => {
    const parsed = signupSchema.safeParse({
      name: "Jane",
      email: "not-an-email",
      password: "short",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("requires a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "you@example.com" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("requires at least 8 characters", () => {
    expect(resetPasswordSchema.safeParse({ password: "password1" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ password: "short" }).success).toBe(false);
  });
});

describe("getSafeInternalPath", () => {
  it("allows same-origin paths and rejects open redirects", () => {
    expect(getSafeInternalPath("/dashboard", "/login")).toBe("/dashboard");
    expect(getSafeInternalPath("/login?checkEmail=1", "/login")).toBe("/login?checkEmail=1");
    expect(getSafeInternalPath("//evil.example", "/login")).toBe("/login");
    expect(getSafeInternalPath("https://evil.example/phish", "/login")).toBe("/login");
    expect(getSafeInternalPath(null, "/reset-password")).toBe("/reset-password");
  });
});
