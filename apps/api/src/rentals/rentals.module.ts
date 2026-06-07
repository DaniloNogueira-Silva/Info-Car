import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RentalOrmEntity } from './infrastructure/entities/rental.orm-entity';
import { VehicleOrmEntity } from '../vehicles/infrastructure/entities/vehicle.orm-entity';
import { CustomerOrmEntity } from '../customers/infrastructure/entities/customer.orm-entity';
import { RentalsService } from './application/rentals.service';
import { RentalsController } from './presentation/rentals.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([RentalOrmEntity, VehicleOrmEntity, CustomerOrmEntity]),
  ],
  controllers: [RentalsController],
  providers: [RentalsService],
  exports: [RentalsService],
})
export class RentalsModule {}
