import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { BrandsModule } from './brands/brands.module';
import { ModelsModule } from './models/models.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { RabbitMqModule } from 'libs/infrastructure/rabbitmq/rabbitmq.module';
import { RedisModule } from 'libs/infrastructure/redis/redis.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { DatabaseModule } from 'libs/infrastructure/database/database.module';

import { FinesSimulatorModule } from './fines-simulator/fines-simulator.module';
import { CustomersModule } from './customers/customers.module';
import { RentalsModule } from './rentals/rentals.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // Environment Variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [{
        ttl: parseInt(config.get<string>('THROTTLE_TTL', '60000'), 10),
        limit: parseInt(config.get<string>('THROTTLE_LIMIT', '100'), 10),
      }],
    }),

    FinesSimulatorModule,


    // Database — SQL Server
    DatabaseModule,
    // Redis Cache
    RedisModule,

    RabbitMqModule,

    // Auth & Users
    UsersModule,
    AuthModule,

    // Feature Modules
    BrandsModule,
    ModelsModule,
    VehiclesModule,
    CustomersModule,
    RentalsModule,
  ],
  controllers: [],
  providers: [
    // Global Guards
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [],
})
export class AppModule { }

