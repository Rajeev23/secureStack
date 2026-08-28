"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const copyOptions = {
  url: true,
  markdown: false,
} as const;

type CopyPageButtonProps = {
  markdown: string;
  title: string;
};

export function CopyPageButton({ markdown, title }: CopyPageButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const payload = [
      copyOptions.url ? window.location.href : null,
      copyOptions.markdown ? `# ${title}\n\n${markdown}` : null,
    ]
      .filter((part): part is string => Boolean(part))
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      toast.success(copyOptions.markdown ? "Page copied" : "Link copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="shrink-0 gap-1.5"
      onClick={() => {
        void handleCopy();
      }}
    >
      {copied ? (
        <Check className="size-3.5" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
      {copied ? "Copied" : copyOptions.markdown ? "Copy page" : "Copy link"}
    </Button>
  );
}
