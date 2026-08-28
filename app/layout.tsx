import type { Metadata } from "next";
import Link from "next/link";
import { Providers } from "./providers";
import { appConfig } from "@/config/app";
import { fontVariables } from "@/lib/fonts";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: appConfig.name,
    template: `%s | ${appConfig.name}`,
  },
  description: appConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fontVariables} h-full`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col antialiased">
        <Link
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:shadow-md"
        >
          Skip to content
        </Link>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
