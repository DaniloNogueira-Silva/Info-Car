export class VehicleMutatedEventDto {
  action: 'created' | 'updated' | 'deleted';
  vehicleId: string;
  timestamp: Date;
  payload?: Record<string, unknown>;
}
