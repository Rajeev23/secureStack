import type { Metadata } from "next";
import { ResetPasswordPage } from "@/features/auth/components/reset-password-page";

export const metadata: Metadata = {
  title: "Set a new password",
  description: "Choose a new password after using a reset link.",
};

export default function Page() {
  return <ResetPasswordPage />;
}
