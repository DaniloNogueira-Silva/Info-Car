import { Vehicle } from '../../domain/entities/vehicle.entity';

export interface IVehicleRepository {
  findAll(page?: number, limit?: number, filter?: string): Promise<{ data: Vehicle[]; total: number }>;
  findById(id: string): Promise<Vehicle | null>;
  findByLicensePlate(licensePlate: string): Promise<Vehicle | null>;
  findByChassis(chassis: string): Promise<Vehicle | null>;
  findByRenavam(renavam: string): Promise<Vehicle | null>;
  create(vehicle: Partial<Vehicle>): Promise<Vehicle>;
  update(id: string, vehicle: Partial<Vehicle>): Promise<Vehicle>;
  delete(id: string): Promise<void>;
}

export const VEHICLE_REPOSITORY = Symbol('IVehicleRepository');
