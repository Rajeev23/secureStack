export function scanSourceLabel(source: string): string {
  if (source === "schedule") return "Scheduled";
  if (source === "sbom") return "SBOM";
  if (source === "github") return "GitHub";
  if (source === "files") return "Files";
  return source ? source.charAt(0).toUpperCase() + source.slice(1) : "Scan";
}
