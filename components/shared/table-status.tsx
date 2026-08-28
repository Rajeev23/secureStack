"use client";

import type { LucideProps } from "lucide-react";
import type { ComponentType } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Row values that can round-trip through a status map (including booleans). */
export type TableStatusValue = string | boolean | number | null | undefined;

/** Normalize booleans/numbers so `true` matches the map key `"true"`. */
export function statusKey(value: TableStatusValue): string {
  if (value == null) return "";
  return String(value);
}

export function statusKeys<T extends Record<string, unknown>>(map: T): (keyof T & string)[] {
  return Object.keys(map) as (keyof T & string)[];
}

export function resolveTableStatus<T extends Record<string, unknown>>(
  map: T,
  value: TableStatusValue,
): T[keyof T] | undefined {
  const key = statusKey(value);
  if (!key) return undefined;
  return map[key as keyof T];
}

export type TableStatusOption = {
  /** Visible name. Independent of the stored key (`active` → "Active"). */
  label: string;
  icon?: ComponentType<LucideProps>;
  /**
   * Icon classes — color and fill live here so each map can differ
   * (`fill-green-500 dark:fill-green-400`, `text-amber-500`, …).
   */
  iconClassName?: string;
};

/** One map per column / form. Keys are the stored values (`active`, `true`, `Done`). */
export type TableStatusMap<T extends string = string> = Record<T, TableStatusOption>;

function TableStatusGlyph({
  option,
  fallback,
}: {
  option: TableStatusOption | undefined;
  fallback: string;
}) {
  const Icon = option?.icon;
  return (
    <>
      {Icon ? (
        <Icon className={cn("text-muted-foreground", option.iconClassName)} aria-hidden />
      ) : null}
      {option?.label ?? fallback}
    </>
  );
}

/**
 * Outline badge with a per-status icon + label.
 * Pass a map — do not hardcode "Done" vs everything else.
 */
export function TableStatus<TMap extends TableStatusMap>({
  value,
  options,
  className,
}: {
  value: TableStatusValue;
  options: TMap;
  className?: string;
}) {
  const option = resolveTableStatus(options, value);
  const fallback = value == null || value === "" ? "—" : String(value);

  return (
    <Badge variant="outline" className={cn("px-1.5 text-muted-foreground", className)}>
      <TableStatusGlyph option={option} fallback={fallback} />
    </Badge>
  );
}

type TableStatusSelectProps<TMap extends TableStatusMap> = {
  options: TMap;
  value?: TableStatusValue;
  defaultValue?: TableStatusValue;
  onValueChange?: (value: keyof TMap & string) => void;
  placeholder?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "default";
};

/**
 * Select whose items reuse the same map as `TableStatus` (icon + name).
 * Values are the map keys. For booleans, compare with `"true"` / `"false"`.
 */
export function TableStatusSelect<TMap extends TableStatusMap>({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select a status",
  id,
  name,
  disabled,
  className,
  size = "default",
}: TableStatusSelectProps<TMap>) {
  const resolvedValue = value === undefined ? undefined : statusKey(value) || undefined;
  const resolvedDefault =
    defaultValue === undefined ? undefined : statusKey(defaultValue) || undefined;

  return (
    <Select
      {...(value !== undefined ? { value: resolvedValue } : {})}
      {...(defaultValue !== undefined ? { defaultValue: resolvedDefault } : {})}
      disabled={disabled}
      name={name}
      onValueChange={(next) => {
        if (next == null) return;
        onValueChange?.(next as keyof TMap & string);
      }}
    >
      <SelectTrigger id={id} size={size} className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {statusKeys(options).map((key) => (
          <SelectItem key={key} value={key}>
            <TableStatusGlyph option={options[key]} fallback={key} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
