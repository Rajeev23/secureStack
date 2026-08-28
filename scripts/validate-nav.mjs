import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const navPath = join(root, "config/navigation.ts");
const navContent = readFileSync(navPath, "utf8");

/** Routes that live outside `app/(dashboard)` (public docs, etc.). */
const externalRoutes = new Set(["/documentation"]);

const hrefs = [...navContent.matchAll(/href:\s*"([^"]+)"/g)].map((match) => match[1]);
const uniquePaths = [...new Set(hrefs.map((href) => href.split("#")[0]))];

const missing = uniquePaths.filter((path) => {
  if (externalRoutes.has(path) || [...externalRoutes].some((route) => path.startsWith(`${route}/`))) {
    const segments = path.split("/").filter(Boolean);
    const pagePath = join(root, "app", ...segments, "page.tsx");
    return !existsSync(pagePath);
  }

  const segments = path.split("/").filter(Boolean);
  const pagePath = join(root, "app", "(dashboard)", ...segments, "page.tsx");
  return !existsSync(pagePath);
});

if (missing.length > 0) {
  console.error("Navigation routes missing matching page files:");
  for (const path of missing) {
    console.error(`  ${path}`);
  }
  process.exit(1);
}

console.log(`Navigation OK (${uniquePaths.length} routes).`);
