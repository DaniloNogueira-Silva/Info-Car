import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateRentalDto } from './create-rental.dto';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateRentalDto extends PartialType(CreateRentalDto) {
  @ApiProperty({ description: 'Status da locação', example: 'FINISHED', required: false })
  @IsString()
  @IsOptional()
  @IsIn(['ACTIVE', 'FINISHED', 'CANCELLED'])
  status?: string;
}
