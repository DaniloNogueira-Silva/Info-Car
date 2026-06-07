import { ApiProperty } from '@nestjs/swagger';

export class BrandResponseDto {
  @ApiProperty({ example: 'uuid-gerado' })
  id: string;

  @ApiProperty({ example: 'Toyota' })
  name: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updated_at: Date;

  @ApiProperty({ example: 'admin' })
  created_by: string;
}
