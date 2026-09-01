import { NextResponse } from "next/server";

/** GitHub OAuth now starts from GET /api/session/github?connect=1. */
export async function GET(request: Request) {
  const url = new URL("/api/session/github", request.url);
  url.searchParams.set("connect", "1");
  const returnTo = new URL(request.url).searchParams.get("returnTo");
  if (returnTo) url.searchParams.set("returnTo", returnTo);
  return NextResponse.redirect(url);
}
