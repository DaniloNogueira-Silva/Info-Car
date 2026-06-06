import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { AuditService } from './services/audit.service';
import { CacheService } from './services/cache.service';
import { VehicleEventConsumer } from './consumers/vehicle-event.consumer';
import { RedisModule } from 'libs/infrastructure/redis/redis.module';

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
    RedisModule,
  ],
  controllers: [VehicleEventConsumer],
  providers: [AuditService, CacheService],
})
export class WorkerModule {}
