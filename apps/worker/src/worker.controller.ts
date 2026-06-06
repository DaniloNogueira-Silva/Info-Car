import { Controller } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { WorkerService } from './worker.service';

@Controller()
export class WorkerController {
  constructor(private readonly workerService: WorkerService) {}

  @EventPattern('vehicle.mutated')
  async handleVehicleMutated(
    @Payload() data: Record<string, unknown>,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.workerService.handleVehicleMutated(data);
      channel.ack(originalMsg);
    } catch (error) {
      // Negative acknowledgment — requeue the message
      channel.nack(originalMsg, false, true);
    }
  }

  @EventPattern('telemetry.location')
  async handleTelemetryLocation(
    @Payload() data: Record<string, unknown>,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.workerService.handleTelemetryLocation(data);
      channel.ack(originalMsg);
    } catch (error) {
      channel.nack(originalMsg, false, true);
    }
  }
}
