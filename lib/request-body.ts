import { DomainError } from "@/lib/errors";

/** 40 uploaded files × 500k chars, plus JSON wrapping. */
export const MAX_SESSION_JSON_CHARS = 22 * 1024 * 1024;

export function assertBodyWithinLimit(text: string, maxChars = MAX_SESSION_JSON_CHARS): void {
  if (text.length > maxChars) {
    throw new DomainError("That upload is too large.", 413);
  }
}

export async function readJsonBody<T>(request: Request, fallback: T): Promise<T> {
  const text = await request.text();
  assertBodyWithinLimit(text);
  if (!text.trim()) return fallback;
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}
