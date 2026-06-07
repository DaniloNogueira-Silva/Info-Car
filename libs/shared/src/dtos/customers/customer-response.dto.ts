import { ApiProperty } from '@nestjs/swagger';

export class CustomerResponseDto {
  @ApiProperty({ example: 'f8f9e68b-592d-45db-b27a-7208d13b2d18' })
  id: string;

  @ApiProperty({ example: 'João Silva' })
  name: string;

  @ApiProperty({ example: 'joao.silva@example.com' })
  email: string;

  @ApiProperty({ example: '12345678900' })
  cnh: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
