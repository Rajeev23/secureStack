"use client";

import { type ReactNode } from "react";

type AnimatedGroupProps = {
  children: ReactNode;
  className?: string;
  variants?: unknown;
};

export function AnimatedGroup({ children, className }: AnimatedGroupProps) {
  return <div className={className}>{children}</div>;
}
