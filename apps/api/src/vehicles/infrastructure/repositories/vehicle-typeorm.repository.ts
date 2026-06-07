import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import type { IVehicleRepository } from '@app/shared';
import { Vehicle } from '@app/shared';
import { VehicleOrmEntity } from '../entities/vehicle.orm-entity';

@Injectable()
export class VehicleTypeOrmRepository implements IVehicleRepository {
  constructor(
    @InjectRepository(VehicleOrmEntity)
    private readonly repo: Repository<VehicleOrmEntity>,
  ) {}

  async findAll(page: number = 1, limit: number = 10, filter?: string): Promise<{ data: Vehicle[]; total: number }> {
    const skip = (page - 1) * limit;
    const where = filter ? { license_plate: Like(`%${filter}%`) } : {};

    const [entities, total] = await this.repo.findAndCount({
      where,
      relations: { model: { brand: true } },
      order: { license_plate: 'ASC' },
      skip,
      take: limit,
    });
    
    return {
      data: entities.map((e) => new Vehicle(e)),
      total,
    };
  }

  async findById(id: string): Promise<Vehicle | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: { model: { brand: true } },
    });
    return entity ? new Vehicle(entity) : null;
  }

  async findByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
    const entity = await this.repo.findOne({
      where: { license_plate: licensePlate },
    });
    return entity ? new Vehicle(entity) : null;
  }

  async findByChassis(chassis: string): Promise<Vehicle | null> {
    const entity = await this.repo.findOne({
      where: { chassis },
    });
    return entity ? new Vehicle(entity) : null;
  }

  async findByRenavam(renavam: string): Promise<Vehicle | null> {
    const entity = await this.repo.findOne({
      where: { renavam },
    });
    return entity ? new Vehicle(entity) : null;
  }

  async create(vehicle: Partial<Vehicle>): Promise<Vehicle> {
    const entity = this.repo.create(vehicle);
    const saved = await this.repo.save(entity);
    return this.findById(saved.id) as Promise<Vehicle>;
  }

  async update(id: string, vehicle: Partial<Vehicle>): Promise<Vehicle> {
    await this.repo.update(id, vehicle);
    return this.findById(id) as Promise<Vehicle>;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
