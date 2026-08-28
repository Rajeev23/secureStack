export function stripVersionPrefix(raw: string): string {
  return raw
    .trim()
    .replace(/^workspace:.*/i, "workspace")
    .replace(/^npm:/, "")
    .replace(/^file:.*/i, "file")
    .replace(/^(?:>=|<=|>|<|~=|~>|~|\^|=)+/, "")
    .replace(/^v/, "")
    .trim();
}

export function normalizeComponentName(name: string, ecosystem: string): string {
  const trimmed = name.trim();
  if (ecosystem === "npm" || ecosystem === "pypi" || ecosystem === "rubygems" || ecosystem === "composer") {
    return trimmed.toLowerCase();
  }
  return trimmed;
}
