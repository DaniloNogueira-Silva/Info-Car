import {
  Inject,
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import type { IVehicleRepository, IModelRepository } from '@app/shared';
import { Vehicle, VEHICLE_REPOSITORY, MODEL_REPOSITORY } from '@app/shared';

@Injectable()
export class VehiclesService {
  private readonly cacheTtl: number;

  private readonly CACHE_KEY_ALL = 'vehicles:all';
  private readonly CACHE_KEY_PREFIX = 'vehicles:';

  constructor(
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicleRepository: IVehicleRepository,
    @Inject(MODEL_REPOSITORY)
    private readonly modelRepository: IModelRepository,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
    private readonly config: ConfigService,
  ) {
    this.cacheTtl = parseInt(this.config.get<string>('CACHE_TTL', '60'), 10);
  }

  // ── Queries (com cache) ──────────────────────────────────────

  async findAll(): Promise<Vehicle[]> {
    const cached = await this.cache.get<Vehicle[]>(this.CACHE_KEY_ALL);
    if (cached) {
      return cached;
    }

    const vehicles = await this.vehicleRepository.findAll();
    await this.cache.set(this.CACHE_KEY_ALL, vehicles, this.cacheTtl * 1000);
    return vehicles;
  }

  async findById(id: string): Promise<Vehicle> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${id}`;
    const cached = await this.cache.get<Vehicle>(cacheKey);
    if (cached) {
      return cached;
    }

    const vehicle = await this.vehicleRepository.findById(id);
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with id "${id}" not found`);
    }

    await this.cache.set(cacheKey, vehicle, this.cacheTtl * 1000);
    return vehicle;
  }

  // ── Commands (invalidam cache) ───────────────────────────────

  async create(data: Partial<Vehicle>): Promise<Vehicle> {
    // Validar modelo existe
    const model = await this.modelRepository.findById(data.model_id!);
    if (!model) {
      throw new NotFoundException(`Model with id "${data.model_id}" not found`);
    }

    // Validações de unicidade no domínio
    await this.ensureUniqueLicensePlate(data.license_plate!);
    await this.ensureUniqueChassis(data.chassis!);
    await this.ensureUniqueRenavam(data.renavam!);

    const vehicle = await this.vehicleRepository.create(data);
    await this.invalidateCache();
    return vehicle;
  }

  async update(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    const existing = await this.vehicleRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Vehicle with id "${id}" not found`);
    }

    // Validar modelo se fornecido
    if (data.model_id) {
      const model = await this.modelRepository.findById(data.model_id);
      if (!model) {
        throw new NotFoundException(`Model with id "${data.model_id}" not found`);
      }
    }

    // Validações de unicidade (excluindo o próprio registro)
    if (data.license_plate && data.license_plate !== existing.license_plate) {
      await this.ensureUniqueLicensePlate(data.license_plate);
    }
    if (data.chassis && data.chassis !== existing.chassis) {
      await this.ensureUniqueChassis(data.chassis);
    }
    if (data.renavam && data.renavam !== existing.renavam) {
      await this.ensureUniqueRenavam(data.renavam);
    }

    const vehicle = await this.vehicleRepository.update(id, data);
    await this.invalidateCache(id);
    return vehicle;
  }

  async remove(id: string): Promise<void> {
    const existing = await this.vehicleRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Vehicle with id "${id}" not found`);
    }

    await this.vehicleRepository.delete(id);
    await this.invalidateCache(id);
  }

  // ── Validações de domínio (unicidade) ────────────────────────

  private async ensureUniqueLicensePlate(licensePlate: string): Promise<void> {
    const existing = await this.vehicleRepository.findByLicensePlate(licensePlate);
    if (existing) {
      throw new ConflictException(`A placa "${licensePlate}" já está cadastrada.`);
    }
  }

  private async ensureUniqueChassis(chassis: string): Promise<void> {
    const existing = await this.vehicleRepository.findByChassis(chassis);
    if (existing) {
      throw new ConflictException(`O chassi "${chassis}" já está cadastrado.`);
    }
  }

  private async ensureUniqueRenavam(renavam: string): Promise<void> {
    const existing = await this.vehicleRepository.findByRenavam(renavam);
    if (existing) {
      throw new ConflictException(`O RENAVAM "${renavam}" já está cadastrado.`);
    }
  }

  // ── Cache helpers ────────────────────────────────────────────

  private async invalidateCache(vehicleId?: string): Promise<void> {
    await this.cache.del(this.CACHE_KEY_ALL);
    if (vehicleId) {
      await this.cache.del(`${this.CACHE_KEY_PREFIX}${vehicleId}`);
    }
  }
}
