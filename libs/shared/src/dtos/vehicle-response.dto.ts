import { ApiProperty } from '@nestjs/swagger';

export class VehicleResponseDto {
  @ApiProperty({ example: 'uuid-gerado' })
  id: string;

  @ApiProperty({ example: 'ABC-1D23' })
  license_plate: string;

  @ApiProperty({ example: '9BWZZZ377VT004251' })
  chassis: string;

  @ApiProperty({ example: '00123456789' })
  renavam: string;

  @ApiProperty({ example: 2024 })
  year: number;

  @ApiProperty({ example: 'uuid-do-modelo' })
  model_id: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updated_at: Date;
}
