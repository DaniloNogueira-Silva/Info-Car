import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VehicleMutatedEventDto } from '@app/shared';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async saveAuditLog(event: VehicleMutatedEventDto): Promise<void> {
    const log = new this.auditLogModel({
      action: event.action,
      vehicleId: event.vehicleId,
      payload: event.payload,
      eventTimestamp: event.timestamp,
    });

    await log.save();

    this.logger.log(
      `Audit log saved: [${event.action}] vehicle ${event.vehicleId}`,
    );
  }
}
