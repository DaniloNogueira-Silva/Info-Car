import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinesSimulatorService } from './fines-simulator.service';
import { RentalOrmEntity } from '../rentals/infrastructure/entities/rental.orm-entity';
import { RabbitMqModule } from '../../../../libs/infrastructure/rabbitmq/rabbitmq.module';

import { CustomerOrmEntity } from '../rentals/infrastructure/entities/customer.orm-entity';
import { VehicleOrmEntity } from '../vehicles/infrastructure/entities/vehicle.orm-entity';
import { FineOrmEntity } from '../fines/infrastructure/entities/fine.orm-entity';
import { ModelOrmEntity } from '../models/infrastructure/entities/model.orm-entity';
import { BrandOrmEntity } from '../brands/infrastructure/entities/brand.orm-entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RentalOrmEntity, 
      CustomerOrmEntity, 
      VehicleOrmEntity, 
      FineOrmEntity,
      ModelOrmEntity,
      BrandOrmEntity
    ]),
    RabbitMqModule,
  ],
  providers: [FinesSimulatorService],
})
export class FinesSimulatorModule {}
