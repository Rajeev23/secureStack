"use client";

import Link from "next/link";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { remarkCodeFilename, slugifyHeading } from "@/features/documentation/lib/heading";
import { DocCodeBlock, getCodeMeta } from "@/components/doc-layout/doc-code-block";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function headingIdFromChildren(children: unknown): string {
  const text = Array.isArray(children)
    ? children.map((child) => (typeof child === "string" ? child : "")).join("")
    : typeof children === "string"
      ? children
      : "";
  return slugifyHeading(text);
}

const components: Components = {
  h2: ({ children }) => (
    <h2
      id={headingIdFromChildren(children)}
      className="scroll-mt-24 border-t border-border pt-10 text-xl font-semibold tracking-tight text-foreground first:border-t-0 first:pt-0"
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      id={headingIdFromChildren(children)}
      className="scroll-mt-24 text-base font-semibold tracking-tight text-foreground"
    >
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-[15px] leading-7 text-muted-foreground">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc space-y-1.5 pl-5 text-[15px] leading-7 text-muted-foreground">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal space-y-1.5 pl-5 text-[15px] leading-7 text-muted-foreground">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="[&>p]:inline">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-medium text-foreground">{children}</strong>
  ),
  a: ({ href, children }) => {
    const className =
      "font-medium text-link underline-offset-4 hover:underline";
    if (href?.startsWith("/")) {
      return (
        <Link href={href} className={className}>
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        className={className}
        target={href?.startsWith("http") ? "_blank" : undefined}
        rel={href?.startsWith("http") ? "noreferrer" : undefined}
      >
        {children}
      </a>
    );
  },
  code: ({ className, children, ...props }) => {
    if (className) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[12.5px] text-link"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => {
    const meta = getCodeMeta(children);
    return (
      <DocCodeBlock filename={meta.filename} language={meta.language}>
        {meta.code}
      </DocCodeBlock>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-[14px] leading-6 text-muted-foreground [&>p]:text-[14px]">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>{children}</Table>
    </div>
  ),
  thead: ({ children }) => <TableHeader>{children}</TableHeader>,
  tbody: ({ children }) => <TableBody>{children}</TableBody>,
  tr: ({ children }) => <TableRow>{children}</TableRow>,
  th: ({ children }) => (
    <TableHead className="bg-muted/40 font-mono text-[11px] whitespace-normal">
      {children}
    </TableHead>
  ),
  td: ({ children }) => (
    <TableCell className="whitespace-normal text-[13px] text-muted-foreground [&_code]:text-[12px]">
      {children}
    </TableCell>
  ),
  hr: () => <hr className="border-border" />,
};

export function DocMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className={cn("doc-prose space-y-5")}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkCodeFilename]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
