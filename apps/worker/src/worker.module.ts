import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { AuditService } from './services/audit.service';
import { CacheService } from './services/cache.service';
import { VehicleEventConsumer } from './consumers/vehicle-event.consumer';

@Module({
  imports: [
    // ── Environment Variables ──────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ── MongoDB (Mongoose) ────────────────────────────────────
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI', 'mongodb://localhost:27017/info-car'),
      }),
    }),

    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),

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
      }),
    }),
  ],
  controllers: [VehicleEventConsumer],
  providers: [AuditService, CacheService],
})
export class WorkerModule {}
