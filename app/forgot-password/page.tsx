import type { Metadata } from "next";
import { ForgotPasswordPageWithSuspense as ForgotPasswordPage } from "@/features/auth/components/forgot-password-page-wrapper";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password reset email for your SecureStack account.",
};

export default function Page() {
  return <ForgotPasswordPage />;
}
