import { displayNameFromEmail } from "@/lib/company/slug";
import { normalizeName } from "@/lib/company/names";

export function nameFromUserMetadata(metadata: unknown, email: string): string {
  if (metadata && typeof metadata === "object" && "name" in metadata) {
    const value = (metadata as { name?: unknown }).name;
    if (typeof value === "string") {
      const name = normalizeName(value);
      if (name) return name;
    }
  }
  return displayNameFromEmail(email);
}
