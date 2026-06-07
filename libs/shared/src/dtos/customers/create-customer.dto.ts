import { IsString, IsEmail, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Nome do cliente', example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Email do cliente', example: 'joao.silva@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'CNH do cliente', example: '12345678900' })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  cnh: string;
}
