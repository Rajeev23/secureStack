import type { Metadata } from "next";
import { appConfig } from "@/config/app";
import { HomePage } from "@/features/home";

export const metadata: Metadata = {
  title: {
    absolute: appConfig.name,
  },
  description: appConfig.description,
};

export default function Page() {
  return <HomePage />;
}
