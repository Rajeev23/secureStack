import type { Metadata } from "next";
import { SignupPage } from "@/features/auth/components/signup-page";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a SecureStack account with your name, email, and password.",
};

export default function Page() {
  return <SignupPage />;
}
