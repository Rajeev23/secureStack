import { z } from "zod";

/** Standard pagination metadata returned by list APIs. */
export const paginatedMetaSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export type PaginatedMeta = z.infer<typeof paginatedMetaSchema>;

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: paginatedMetaSchema,
  });

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginatedMeta;
};

/** Build pagination meta from total row count and the current page request. */
export function createPaginatedMeta(
  total: number,
  page: number,
  pageSize: number,
): PaginatedMeta {
  const safePageSize = Math.max(1, pageSize);
  const safeTotal = Math.max(0, total);
  const totalPages = safeTotal === 0 ? 0 : Math.ceil(safeTotal / safePageSize);
  const safePage = Math.min(Math.max(1, page), Math.max(1, totalPages || 1));

  return paginatedMetaSchema.parse({
    page: safePage,
    pageSize: safePageSize,
    total: safeTotal,
    totalPages,
  });
}

export const DEFAULT_PAGE_SIZE = 100;
export const MAX_PAGE_SIZE = 250;

export type PageQuery = {
  offset: number;
  limit: number;
};

export type OffsetPage<T> = {
  items: T[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
};

export function parsePageQuery(searchParams: URLSearchParams): PageQuery {
  const rawLimit = Number.parseInt(searchParams.get("limit") ?? "", 10);
  const rawOffset = Number.parseInt(searchParams.get("offset") ?? "", 10);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(MAX_PAGE_SIZE, Math.max(1, rawLimit))
    : DEFAULT_PAGE_SIZE;
  const offset = Number.isFinite(rawOffset) ? Math.max(0, rawOffset) : 0;
  return { offset, limit };
}

export function paginate<T>(items: T[], offset: number, limit: number): OffsetPage<T> {
  const safeOffset = Math.max(0, offset);
  const safeLimit = Math.max(1, limit);
  return {
    items: items.slice(safeOffset, safeOffset + safeLimit),
    total: items.length,
    offset: safeOffset,
    limit: safeLimit,
    hasMore: safeOffset + safeLimit < items.length,
  };
}
