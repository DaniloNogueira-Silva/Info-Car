import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { AuditService } from './services/audit.service';
import { CacheService } from './services/cache.service';
import { VehicleEventConsumer } from './consumers/vehicle-event.consumer';
import { FinesConsumer } from './consumers/fines.consumer';
import { RedisModule } from 'libs/infrastructure/redis/redis.module';
import { FineOrmEntity } from '../../api/src/fines/infrastructure/entities/fine.orm-entity';
import { RentalOrmEntity } from '../../api/src/rentals/infrastructure/entities/rental.orm-entity';
import { CustomerOrmEntity } from '../../api/src/rentals/infrastructure/entities/customer.orm-entity';
import { ModelOrmEntity } from '../../api/src/models/infrastructure/entities/model.orm-entity';
import { BrandOrmEntity } from '../../api/src/brands/infrastructure/entities/brand.orm-entity';
import { VehicleOrmEntity } from '../../api/src/vehicles/infrastructure/entities/vehicle.orm-entity';
import { DatabaseModule } from 'libs/infrastructure/database/database.module';
import { MongodbModule } from 'libs/infrastructure/database/mongodb.module';

@Module({
  imports: [
    // Environment Variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // SQL Server
    DatabaseModule,
    TypeOrmModule.forFeature([
      FineOrmEntity, 
      RentalOrmEntity, 
      VehicleOrmEntity, 
      CustomerOrmEntity, 
      ModelOrmEntity, 
      BrandOrmEntity
    ]),

    //  MongoDB
    MongodbModule,

    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),

    // Redis Cache
    RedisModule,
  ],
  controllers: [VehicleEventConsumer, FinesConsumer],
  providers: [AuditService, CacheService],
})
export class WorkerModule {}
