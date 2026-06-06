import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BrandsModule } from './brands/brands.module';
import { ModelsModule } from './models/models.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { RabbitMqModule } from 'libs/infrastructure/rabbitmq/rabbitmq.module';
import { RedisModule } from 'libs/infrastructure/redis/redis.module';

@Module({
  imports: [
    // Environment Variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate Limiting — 100 req/min por IP
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),


    // TypeORM — SQL Server
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mssql' as const,
        host: config.get<string>('DB_HOST', 'localhost'),

        port: parseInt(config.get<string>('DATABASE_PORT', '1433'), 10) || 1433,

        username: config.get<string>('DB_USERNAME', 'sa'),
        password: config.get<string>('DB_PASSWORD', 'YourStrong!Passw0rd'),
        database: config.get<string>('DB_DATABASE', 'info-car'),
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNC', 'false') === 'true',
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      }),
    }),
    // Redis Cache
    RedisModule,

    RabbitMqModule,

    // Feature Modules
    BrandsModule,
    ModelsModule,
    VehiclesModule,
  ],
  controllers: [],
  providers: [
    // Global Guards
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [],
})
export class AppModule { }

