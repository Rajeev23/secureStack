export function slugifyCompanyName(name: string): string {
  const base =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "company";
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 6);
  return `${base}-${suffix}`;
}

export function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim() || "User";
  return local.charAt(0).toUpperCase() + local.slice(1);
}
