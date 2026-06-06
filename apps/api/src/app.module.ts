import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { redisStore } from 'cache-manager-redis-yet';
import { RABBITMQ_SERVICE, FLEET_EVENTS_QUEUE } from '@app/shared';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { BrandsModule } from './brands/brands.module';
import { ModelsModule } from './models/models.module';
import { VehiclesModule } from './vehicles/vehicles.module';

@Module({
  imports: [
    // ── Environment Variables ──────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ── Rate Limiting — 100 req/min por IP ─────────────────────
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // ── Auth (JWT) ─────────────────────────────────────────────
    AuthModule,

    // ── TypeORM — SQL Server ───────────────────────────────────
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

    // ── Redis Cache ────────────────────────────────────────────
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: config.get<string>('REDIS_HOST', 'localhost'),
            port: parseInt(config.get<string>('REDIS_PORT', '6379'), 10),
          },
        }),
        ttl: parseInt(config.get<string>('CACHE_TTL', '60'), 10) * 1000,
      }),
    }),

    // ── RabbitMQ Client (Publisher) ────────────────────────────
    ClientsModule.registerAsync([
      {
        name: RABBITMQ_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672')],
            queue: FLEET_EVENTS_QUEUE,
            queueOptions: { durable: true },
          },
        }),
      },
    ]),

    // ── Feature Modules ────────────────────────────────────────
    BrandsModule,
    ModelsModule,
    VehiclesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // ── Global Guards ────────────────────────────────────────────
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [ClientsModule],
})
export class AppModule { }

