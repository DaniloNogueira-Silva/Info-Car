import { IsString, IsNotEmpty, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateModelDto {
  @ApiProperty({ example: 'Corolla', description: 'Nome do modelo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'uuid-da-marca', description: 'ID da marca (FK)' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  brand_id: string;
}
