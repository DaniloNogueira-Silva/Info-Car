import {
  Inject,
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'libs/infrastructure/redis/redis.service';
import type { IVehicleRepository, IModelRepository } from '@app/shared';
import {
  Vehicle,
  VEHICLE_REPOSITORY,
  MODEL_REPOSITORY,
  RABBITMQ_SERVICE,
  VEHICLE_MUTATED_EVENT,
  VehicleMutatedEventDto,
  PaginationQueryDto,
  PaginatedResultDto,
} from '@app/shared';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);
  private readonly cacheTtl: number;

  private readonly CACHE_KEY_ALL = 'vehicles:all';
  private readonly CACHE_KEY_PREFIX = 'vehicles:';

  constructor(
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicleRepository: IVehicleRepository,
    @Inject(MODEL_REPOSITORY)
    private readonly modelRepository: IModelRepository,
    private readonly cache: RedisService,
    @Inject(RABBITMQ_SERVICE)
    private readonly rmqClient: ClientProxy,
    private readonly config: ConfigService,
  ) {
    this.cacheTtl = parseInt(this.config.get<string>('CACHE_TTL', '60'), 10);
  }

  // ── Queries (com cache) ──────────────────────────────────────

  async findAll(query: PaginationQueryDto): Promise<PaginatedResultDto<Vehicle>> {
    this.logger.debug('Fetching all vehicles...');
    const { page = 1, limit = 10, filter } = query;
    const cacheKey = `${this.CACHE_KEY_ALL}:${page}:${limit}:${filter || ''}`;

    const cached = await this.cache.get<PaginatedResultDto<Vehicle>>(cacheKey);
    if (cached) {
      this.logger.debug('Returning vehicles from cache');
      return cached;
    }

    this.logger.debug('Cache miss. Fetching vehicles from database');
    const { data, total } = await this.vehicleRepository.findAll(page, limit, filter);
    const result = new PaginatedResultDto<Vehicle>(data, total, page, limit);

    const plainResult = JSON.parse(JSON.stringify(result));

    await this.cache.set(cacheKey, plainResult, this.cacheTtl * 1000);
    return result;
  }

  async findById(id: string): Promise<Vehicle> {
    this.logger.debug(`Fetching vehicle by id: ${id}`);
    const cacheKey = `${this.CACHE_KEY_PREFIX}${id}`;

    const cached = await this.cache.get<Vehicle>(cacheKey);
    if (cached) {
      this.logger.debug(`Returning vehicle ${id} from cache`);
      return cached;
    }

    this.logger.debug(`Cache miss. Fetching vehicle ${id} from database`);
    const vehicle = await this.vehicleRepository.findById(id);
    if (!vehicle) {
      this.logger.warn(`Vehicle with id "${id}" not found`);
      throw new NotFoundException(`Vehicle with id "${id}" not found`);
    }

    await this.cache.set(cacheKey, vehicle, this.cacheTtl * 1000);
    return vehicle;
  }

  // ── Commands (publicam evento no RabbitMQ) ───────────────────

  async create(data: Partial<Vehicle>): Promise<Vehicle> {
    this.logger.log('Creating a new vehicle...');

    // Validar modelo existe
    const model = await this.modelRepository.findById(data.model_id!);
    if (!model) {
      this.logger.warn(`Creation failed: Model with id "${data.model_id}" not found`);
      throw new NotFoundException(`Model with id "${data.model_id}" not found`);
    }

    // Validações de unicidade no domínio
    await this.ensureUniqueLicensePlate(data.license_plate!);
    await this.ensureUniqueChassis(data.chassis!);
    await this.ensureUniqueRenavam(data.renavam!);

    const vehicle = await this.vehicleRepository.create(data);
    this.logger.log(`Vehicle created successfully with id: ${vehicle.id}`);

    await this.publishVehicleMutatedEvent('created', vehicle.id, data);
    return vehicle;
  }

  async update(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    this.logger.log(`Updating vehicle with id: ${id}`);

    const existing = await this.vehicleRepository.findById(id);
    if (!existing) {
      this.logger.warn(`Update failed: Vehicle with id "${id}" not found`);
      throw new NotFoundException(`Vehicle with id "${id}" not found`);
    }

    // Validar modelo se fornecido
    if (data.model_id) {
      const model = await this.modelRepository.findById(data.model_id);
      if (!model) {
        this.logger.warn(`Update failed: Model with id "${data.model_id}" not found`);
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
    this.logger.log(`Vehicle updated successfully with id: ${id}`);

    await this.publishVehicleMutatedEvent('updated', id, data);
    return vehicle;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removing vehicle with id: ${id}`);

    const existing = await this.vehicleRepository.findById(id);
    if (!existing) {
      this.logger.warn(`Removal failed: Vehicle with id "${id}" not found`);
      throw new NotFoundException(`Vehicle with id "${id}" not found`);
    }

    await this.vehicleRepository.delete(id);
    this.logger.log(`Vehicle removed successfully with id: ${id}`);

    await this.publishVehicleMutatedEvent('deleted', id);
  }

  // ── Validações de domínio (unicidade) ────────────────────────

  private async ensureUniqueLicensePlate(licensePlate: string): Promise<void> {
    const existing = await this.vehicleRepository.findByLicensePlate(licensePlate);
    if (existing) {
      this.logger.warn(`Conflict: License plate "${licensePlate}" already exists`);
      throw new ConflictException(`A placa "${licensePlate}" já está cadastrada.`);
    }
  }

  private async ensureUniqueChassis(chassis: string): Promise<void> {
    const existing = await this.vehicleRepository.findByChassis(chassis);
    if (existing) {
      this.logger.warn(`Conflict: Chassis "${chassis}" already exists`);
      throw new ConflictException(`O chassi "${chassis}" já está cadastrado.`);
    }
  }

  private async ensureUniqueRenavam(renavam: string): Promise<void> {
    const existing = await this.vehicleRepository.findByRenavam(renavam);
    if (existing) {
      this.logger.warn(`Conflict: RENAVAM "${renavam}" already exists`);
      throw new ConflictException(`O RENAVAM "${renavam}" já está cadastrado.`);
    }
  }

  // ── RabbitMQ Publisher ──────────────────────────────────────

  private async publishVehicleMutatedEvent(
    action: VehicleMutatedEventDto['action'],
    vehicleId: string,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    this.logger.debug(`Publishing event to RabbitMQ: vehicle ${action} (id: ${vehicleId})`);

    const event: VehicleMutatedEventDto = {
      action,
      vehicleId,
      timestamp: new Date(),
      payload,
    };

    await this.rmqClient.emit(VEHICLE_MUTATED_EVENT, event);
  }
}