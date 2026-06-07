import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBrandDto {
  @ApiProperty({ example: 'Toyota', description: 'Nome da marca' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
