import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { AppController } from './app.controller';
import { AppService } from './app.service';
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

    // ── Feature Modules ────────────────────────────────────────
    BrandsModule,
    ModelsModule,
    VehiclesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
