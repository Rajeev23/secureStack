export type ChangeSummary = {
  security: string[];
  bugfix: string[];
  performance: string[];
  breaking: string[];
  other: string[];
};

const MAX_ITEMS = 8;

export function emptyChangeSummary(): ChangeSummary {
  return { security: [], bugfix: [], performance: [], breaking: [], other: [] };
}

export function changeSummaryHasNotes(summary: ChangeSummary): boolean {
  return (
    summary.security.length +
      summary.bugfix.length +
      summary.performance.length +
      summary.breaking.length +
      summary.other.length >
    0
  );
}

function pushUnique(list: string[], item: string) {
  const cleaned = item.replace(/^[-*•]\s+/, "").replace(/^#{1,6}\s+/, "").trim();
  if (!cleaned || cleaned.length < 4) return;
  if (list.includes(cleaned)) return;
  if (list.length >= MAX_ITEMS) return;
  list.push(cleaned.slice(0, 240));
}

function classifyLine(line: string): keyof ChangeSummary {
  const text = line.toLowerCase();
  if (
    /\bcve-\d{4}-\d+\b/.test(text) ||
    /\b(ghsa-|security advisory|vulnerabilit|security fix|security update)\b/.test(text) ||
    (/\bsecurity\b/.test(text) && !/\bthread\b/.test(text))
  ) {
    return "security";
  }
  if (/\b(breaking change|breaking changes|incompatible|migration required)\b/.test(text)) {
    return "breaking";
  }
  if (/\b(performance|optimiz)/.test(text)) return "performance";
  if (/\b(bug\s*fix|bugfix|hotfix|fixed\b|fixes\b|stability)\b/.test(text)) return "bugfix";
  return "other";
}

function candidateLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      if (/^#{1,6}\s+/.test(line)) return false;
      return /^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line) || line.length > 12;
    });
}

export function classifyReleaseNotes(text: string | null | undefined): ChangeSummary {
  const summary = emptyChangeSummary();
  if (!text?.trim()) return summary;

  const lines = candidateLines(text);
  const source = lines.length ? lines : text.split(/\n+/).map((line) => line.trim()).filter(Boolean);

  for (const line of source.slice(0, 80)) {
    const kind = classifyLine(line);
    pushUnique(summary[kind], line.replace(/^\d+\.\s+/, ""));
  }

  return summary;
}

export function mergeChangeSummaries(items: ChangeSummary[]): ChangeSummary {
  const merged = emptyChangeSummary();
  for (const item of items) {
    for (const line of item.security) pushUnique(merged.security, line);
    for (const line of item.bugfix) pushUnique(merged.bugfix, line);
    for (const line of item.performance) pushUnique(merged.performance, line);
    for (const line of item.breaking) pushUnique(merged.breaking, line);
    for (const line of item.other) pushUnique(merged.other, line);
  }
  return merged;
}
