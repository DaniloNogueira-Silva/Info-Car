import { IsUUID, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRentalDto {
  @ApiProperty({ description: 'ID do veículo (UUID)', example: 'f8f9e68b-592d-45db-b27a-7208d13b2d18' })
  @IsUUID()
  @IsNotEmpty()
  vehicle_id: string;

  @ApiProperty({ description: 'ID do cliente (UUID)', example: 'a5b9f805-59ae-4803-a60d-d573210b97eb' })
  @IsUUID()
  @IsNotEmpty()
  customer_id: string;

  @ApiProperty({ description: 'Data de início da locação', example: '2026-06-07T10:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  start_date: string;

  @ApiProperty({ description: 'Data de devolução prevista (opcional)', example: '2026-06-15T10:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  end_date?: string;
}
