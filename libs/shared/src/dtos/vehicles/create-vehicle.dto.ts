import { IsString, IsNotEmpty, IsNumber, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty({ example: 'ABC-1D23', description: 'Placa do veículo (formato Mercosul ou antigo)' })
  @IsString()
  @IsNotEmpty()
  license_plate: string;

  @ApiProperty({ example: '9BWZZZ377VT004251', description: 'Número do chassi (17 caracteres)' })
  @IsString()
  @IsNotEmpty()
  @Length(17, 17)
  chassis: string;

  @ApiProperty({ example: '00123456789', description: 'Código RENAVAM (11 dígitos)' })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  renavam: string;

  @ApiProperty({ example: 2024, description: 'Ano do veículo' })
  @IsNumber()
  year: number;

  @ApiProperty({ example: 'uuid-do-modelo', description: 'ID do modelo (FK)' })
  @IsString()
  @IsNotEmpty()
  model_id: string;
}
