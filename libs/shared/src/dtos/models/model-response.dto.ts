import { ApiProperty } from '@nestjs/swagger';
import { BrandResponseDto } from '../brands/brand-response.dto';

export class ModelResponseDto {
  @ApiProperty({ example: 'uuid-gerado' })
  id: string;

  @ApiProperty({ example: 'Corolla' })
  name: string;

  @ApiProperty({ example: 'uuid-da-marca' })
  brand_id: string;

  @ApiProperty({ type: () => BrandResponseDto, required: false })
  brand?: BrandResponseDto;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updated_at: Date;

  @ApiProperty({ example: 'admin' })
  created_by: string;
}
