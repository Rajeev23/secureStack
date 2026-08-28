export const APP_HOME_PATH = "/";

/** Fallback identity while the session hydrates. Not a login account. */
export const DEMO_USER = {
  id: "00000000-0000-0000-0000-000000000000",
  name: "SecureStack",
  email: "",
  role: "ADMIN",
} as const;
