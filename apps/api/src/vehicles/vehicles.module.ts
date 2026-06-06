import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VEHICLE_REPOSITORY } from '@app/shared';
import { VehicleOrmEntity } from './infrastructure/entities/vehicle.orm-entity';
import { VehicleTypeOrmRepository } from './infrastructure/repositories/vehicle-typeorm.repository';
import { VehiclesService } from './application/vehicles.service';
import { VehiclesController } from './presentation/vehicles.controller';
import { ModelsModule } from '../models/models.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VehicleOrmEntity]),
    ModelsModule,
  ],
  controllers: [VehiclesController],
  providers: [
    VehiclesService,
    {
      provide: VEHICLE_REPOSITORY,
      useClass: VehicleTypeOrmRepository,
    },
  ],
  exports: [VEHICLE_REPOSITORY],
})
export class VehiclesModule {}
