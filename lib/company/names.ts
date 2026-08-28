import { z } from "zod";

export const NAME_MAX_LENGTH = 80;

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required.")
  .max(NAME_MAX_LENGTH, `Name must be at most ${NAME_MAX_LENGTH} characters.`);

export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}
