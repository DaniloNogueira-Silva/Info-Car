import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);

  async handleVehicleMutated(data: Record<string, unknown>): Promise<void> {
    this.logger.log(`Vehicle mutated event received: ${JSON.stringify(data)}`);
    // TODO: Invalidate Redis cache keys for the affected vehicle
  }

  async handleTelemetryLocation(data: Record<string, unknown>): Promise<void> {
    this.logger.log(
      `Telemetry location event received: ${JSON.stringify(data)}`,
    );
    // TODO: Save to MongoDB (time-series) and update Redis (last position)
  }
}
