"use client";

import {
  Children,
  isValidElement,
  useState,
  type ReactNode,
} from "react";
import { Check, Copy } from "lucide-react";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import { cn } from "@/lib/utils";

type LanguageBadge = {
  label: string;
};

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("css", css);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("xml", xml);

const LANGUAGE_BADGES: Record<string, LanguageBadge> = {
  ts: { label: "TS" },
  tsx: { label: "TS" },
  typescript: { label: "TS" },
  js: { label: "JS" },
  jsx: { label: "JS" },
  javascript: { label: "JS" },
  md: { label: "MD" },
  markdown: { label: "MD" },
  css: { label: "CSS" },
  json: { label: "{}" },
  bash: { label: ">_" },
  sh: { label: ">_" },
  shell: { label: ">_" },
  txt: { label: "TXT" },
};

const HIGHLIGHT_LANGUAGES: Record<string, string> = {
  bash: "bash",
  css: "css",
  js: "javascript",
  javascript: "javascript",
  jsx: "javascript",
  json: "json",
  md: "markdown",
  markdown: "markdown",
  sh: "bash",
  shell: "bash",
  ts: "typescript",
  tsx: "typescript",
  typescript: "typescript",
  html: "xml",
  xml: "xml",
};

export function getCodeLanguageBadge(
  language?: string,
  filename?: string,
): LanguageBadge | null {
  const fromLanguage = language?.trim().toLowerCase();
  if (fromLanguage && LANGUAGE_BADGES[fromLanguage]) {
    return LANGUAGE_BADGES[fromLanguage];
  }
  const ext = filename?.split(".").pop()?.toLowerCase();
  if (ext && LANGUAGE_BADGES[ext]) return LANGUAGE_BADGES[ext];
  return null;
}

function getNodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(getNodeText).join("");
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getNodeText(node.props.children);
  }
  return "";
}

export function highlightCode(code: string, language?: string): string {
  const normalized = language?.trim().toLowerCase();
  const highlighter = normalized ? HIGHLIGHT_LANGUAGES[normalized] : undefined;
  if (!highlighter) return hljs.highlightAuto(code).value;
  return hljs.highlight(code, { language: highlighter, ignoreIllegals: true }).value;
}

export function DocCodeBlock({
  children,
  filename,
  language,
}: {
  children: ReactNode;
  filename?: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);
  const code = getNodeText(children).replace(/\n$/, "");
  const badge = getCodeLanguageBadge(language, filename);
  const highlightedCode = highlightCode(code, language);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="group/code overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-border bg-muted/20 px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {badge ? (
            <span
              className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-[3px] bg-foreground px-1 font-mono text-[9px] font-bold tracking-tight text-background"
              aria-hidden
            >
              {badge.label}
            </span>
          ) : null}
          {filename ? (
            <span className="truncate text-[13px] font-medium text-muted-foreground">
              {filename}
            </span>
          ) : badge ? null : (
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              {language ?? "code"}
            </span>
          )}
        </div>
        <button
          type="button"
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
          onClick={() => {
            void handleCopy();
          }}
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? (
            <Check className="size-3.5" aria-hidden />
          ) : (
            <Copy className="size-3.5" aria-hidden />
          )}
        </button>
      </div>
      <pre className="overflow-x-auto bg-card p-6 text-[13px] leading-6">
        <code
          className={cn("doc-syntax font-mono text-foreground")}
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </pre>
    </div>
  );
}

export function getCodeMeta(children: ReactNode): {
  filename?: string;
  language?: string;
  code: ReactNode;
} {
  const child = Children.toArray(children)[0];
  if (!isValidElement<{
    className?: string;
    "data-filename"?: string;
    children?: ReactNode;
  }>(child)) {
    return { code: children };
  }

  const className = child.props.className ?? "";
  const language = /language-([^\s]+)/.exec(className)?.[1];

  return {
    filename: child.props["data-filename"],
    language,
    code: child.props.children,
  };
}
