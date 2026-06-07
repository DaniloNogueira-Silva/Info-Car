import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter string to search by main fields' })
  @IsOptional()
  @IsString()
  filter?: string;
}

export class PaginatedResultDto<T> {
  @ApiProperty({ description: 'List of items' })
  data: T[];

  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  currentPage: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  constructor(data: T[], total: number, currentPage: number, limit: number) {
    this.data = data;
    this.total = total;
    this.currentPage = currentPage;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
  }
}
