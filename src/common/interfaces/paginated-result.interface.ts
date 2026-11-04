export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export function buildPaginationMeta(
  params: PaginationParams,
  total: number,
): PaginationMeta {
  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / params.limit),
  };
}

/** Prisma `skip` / `take` for the given page. */
export function toSkipTake(params: PaginationParams): {
  skip: number;
  take: number;
} {
  return { skip: (params.page - 1) * params.limit, take: params.limit };
}
