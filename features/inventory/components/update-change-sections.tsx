type ChangeSummaryView = {
  security?: string[];
  bugfix?: string[];
  performance?: string[];
  breaking?: string[];
  other?: string[];
};

function ChangeList({ title, items, empty }: { title: string; items?: string[]; empty?: string }) {
  if (!items?.length) {
    return empty ? (
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground">{empty}</p>
      </div>
    ) : null;
  }
  return (
    <div>
      <p className="font-medium">{title}</p>
      <ul className="mt-1 list-disc pl-5">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function UpdateChangeSections({
  summary,
  hasUpdate,
}: {
  summary?: ChangeSummaryView | null;
  hasUpdate: boolean;
}) {
  if (!hasUpdate) {
    return <p className="text-muted-foreground">This component is already on the latest scanned version.</p>;
  }

  const hasNotes = Boolean(
    summary?.security?.length ||
      summary?.bugfix?.length ||
      summary?.performance?.length ||
      summary?.breaking?.length ||
      summary?.other?.length,
  );

  if (!hasNotes) {
    return (
      <p className="text-muted-foreground">
        Upstream release notes were not available for this version. The recommendation uses version type and
        security advisories.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ChangeList title="Security" items={summary?.security} />
      <ChangeList title="Bug fixes" items={summary?.bugfix} />
      <ChangeList title="Performance" items={summary?.performance} />
      <ChangeList
        title="Breaking changes"
        items={summary?.breaking}
        empty={summary?.breaking?.length ? undefined : "None identified"}
      />
      <ChangeList title="Other changes" items={summary?.other} />
    </div>
  );
}
