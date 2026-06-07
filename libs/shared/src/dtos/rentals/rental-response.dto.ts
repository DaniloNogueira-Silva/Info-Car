import { ApiProperty } from '@nestjs/swagger';
import { CustomerResponseDto } from '../customers/customer-response.dto';
import { VehicleResponseDto } from '../vehicles/vehicle-response.dto';

export class RentalResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  vehicle_id: string;

  @ApiProperty()
  customer_id: string;

  @ApiProperty()
  start_date: Date;

  @ApiProperty({ required: false })
  end_date: Date;

  @ApiProperty()
  status: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty({ type: () => CustomerResponseDto, required: false })
  customer?: CustomerResponseDto;

  @ApiProperty({ type: () => VehicleResponseDto, required: false })
  vehicle?: VehicleResponseDto;
}
