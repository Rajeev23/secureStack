"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type HomeRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function HomeReveal({ children, className }: HomeRevealProps) {
  return <div className={cn(className)}>{children}</div>;
}
