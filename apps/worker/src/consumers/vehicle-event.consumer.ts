import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import {
  VEHICLE_MUTATED_EVENT,
  VehicleMutatedEventDto,
} from '@app/shared';
import { AuditService } from '../services/audit.service';
import { CacheService } from '../services/cache.service';

@Controller()
export class VehicleEventConsumer {
  private readonly logger = new Logger(VehicleEventConsumer.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly cacheService: CacheService,
  ) {}

  @EventPattern(VEHICLE_MUTATED_EVENT)
  async handleVehicleMutated(
    @Payload() data: VehicleMutatedEventDto,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      this.logger.log(
        `Processing vehicle.mutated event: [${data.action}] vehicle ${data.vehicleId}`,
      );

      // 1. Salvar log de auditoria no MongoDB
      await this.auditService.saveAuditLog(data);

      // 2. Invalidar cache no Redis
      await this.cacheService.invalidateVehicleCache(data);

      // Acknowledge a mensagem após ambos processarem com sucesso
      channel.ack(originalMsg);

      this.logger.log(
        `Event processed successfully: [${data.action}] vehicle ${data.vehicleId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process vehicle.mutated event: ${error.message}`,
        error.stack,
      );
      // Negative acknowledgment — requeue a mensagem
      channel.nack(originalMsg, false, true);
    }
  }
}
