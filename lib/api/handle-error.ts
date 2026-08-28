import { NextResponse } from "next/server";
import { DomainError } from "@/lib/errors";

export function jsonError(error: unknown, fallback = "Something went wrong.") {
  if (error instanceof DomainError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}
