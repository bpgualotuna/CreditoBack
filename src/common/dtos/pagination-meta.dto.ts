import { ApiProperty } from '@nestjs/swagger';
import type {
  PaginatedResult,
  PaginationMeta,
} from '../interfaces/paginated-result.interface';

export class PaginationMetaDto implements PaginationMeta {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 57 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

/** Maps a domain paginated result to a response DTO with mapped items. */
export function toPaginatedResponse<T, R>(
  result: PaginatedResult<T>,
  mapItem: (item: T) => R,
): { items: R[]; meta: PaginationMeta } {
  return { items: result.items.map(mapItem), meta: result.meta };
}
