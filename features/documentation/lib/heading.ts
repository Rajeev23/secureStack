export type DocHeading = {
  id: string;
  title: string;
  level: 2 | 3;
};

const FENCE = /^```/;
const HEADING = /^(#{2,3})\s+(.+)$/;

/** Stable heading ids that keep camelCase component names readable. */
export function slugifyHeading(text: string): string {
  return text
    .replace(/[`*_]/g, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function headingText(raw: string): string {
  return raw.replace(/[`*_]/g, "").trim();
}

export function extractHeadings(markdown: string): DocHeading[] {
  const headings: DocHeading[] = [];
  const usedIds = new Map<string, number>();
  let inFence = false;

  for (const line of markdown.split("\n")) {
    if (FENCE.test(line.trim())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = HEADING.exec(line);
    if (!match) continue;

    const level = match[1].length as 2 | 3;
    const title = headingText(match[2]);
    const baseId = slugifyHeading(title);
    const count = usedIds.get(baseId) ?? 0;
    usedIds.set(baseId, count + 1);
    const id = count === 0 ? baseId : `${baseId}-${count + 1}`;

    headings.push({ id, title, level });
  }

  return headings;
}

type MdastNode = {
  type?: string;
  meta?: string | null;
  data?: { hProperties?: Record<string, string> };
  children?: MdastNode[];
};

/** Copies `filename="…"` from fenced-code meta onto the rendered `<code>` element. */
export function remarkCodeFilename() {
  return (tree: MdastNode) => {
    visit(tree, (node) => {
      if (node.type !== "code" || !node.meta) return;
      const filename =
        /(?:filename|title)="([^"]+)"/.exec(node.meta)?.[1] ??
        /(?:filename|title)=(\S+)/.exec(node.meta)?.[1];
      if (!filename) return;
      node.data = {
        ...node.data,
        hProperties: {
          ...node.data?.hProperties,
          "data-filename": filename,
        },
      };
    });
  };
}

function visit(node: MdastNode, fn: (node: MdastNode) => void) {
  fn(node);
  node.children?.forEach((child) => visit(child, fn));
}
