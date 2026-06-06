import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WorkerController } from './worker.controller';
import { WorkerService } from './worker.service';

@Module({
  imports: [
    // ── Environment Variables ──────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [WorkerController],
  providers: [WorkerService],
})
export class WorkerModule {}
