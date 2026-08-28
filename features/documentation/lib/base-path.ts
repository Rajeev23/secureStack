/** Public documentation site base path (enterprise-style URL). */
export const DOCS_BASE_PATH = "/documentation" as const;

export function docsHref(...segments: string[]): string {
  if (segments.length === 0) return DOCS_BASE_PATH;
  return `${DOCS_BASE_PATH}/${segments.join("/")}`;
}
