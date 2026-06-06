import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  vehicleId: string;

  @Prop({ type: Object })
  payload: Record<string, unknown>;

  @Prop({ required: true })
  eventTimestamp: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
