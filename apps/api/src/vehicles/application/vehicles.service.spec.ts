import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';

import { VehiclesService } from './vehicles.service';
import {
  Vehicle,
  VEHICLE_REPOSITORY,
  MODEL_REPOSITORY,
  RABBITMQ_SERVICE,
  VEHICLE_MUTATED_EVENT,
} from '@app/shared';
import type { IVehicleRepository, IModelRepository } from '@app/shared';
import { RedisService } from 'libs/infrastructure/redis/redis.service';
import { Model, Brand } from '@app/shared';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let vehicleRepo: jest.Mocked<IVehicleRepository>;
  let modelRepo: jest.Mocked<IModelRepository>;
  let cache: jest.Mocked<RedisService>;
  let rmqClient: jest.Mocked<Pick<ClientProxy, 'emit'>>;

  const mockModel = new Model({
    id: 'uuid-model-1',
    name: 'Corolla',
    brand_id: 'uuid-brand-1',
    brand: new Brand({ id: 'uuid-brand-1', name: 'Toyota' }),
  });

  const mockVehicle = new Vehicle({
    id: 'uuid-vehicle-1',
    license_plate: 'ABC-1D23',
    chassis: '9BWZZZ377VT004251',
    renavam: '00123456789',
    year: 2024,
    model_id: 'uuid-model-1',
    model: mockModel,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    created_by: 'system',
  });

  beforeEach(async () => {
    const mockVehicleRepo: jest.Mocked<IVehicleRepository> = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByLicensePlate: jest.fn(),
      findByChassis: jest.fn(),
      findByRenavam: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockModelRepo: jest.Mocked<IModelRepository> = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByBrandId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockCache: jest.Mocked<RedisService> = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    } as any;

    const mockRmqClient = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: VEHICLE_REPOSITORY, useValue: mockVehicleRepo },
        { provide: MODEL_REPOSITORY, useValue: mockModelRepo },
        { provide: RedisService, useValue: mockCache },
        { provide: RABBITMQ_SERVICE, useValue: mockRmqClient },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('60') },
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
    vehicleRepo = module.get(VEHICLE_REPOSITORY);
    modelRepo = module.get(MODEL_REPOSITORY);
    cache = module.get(RedisService);
    rmqClient = module.get(RABBITMQ_SERVICE);
  });

  // ── findAll ──────────────────────────────────────────────────

  describe('findAll', () => {
    it('deve retornar veículos do cache quando disponível', async () => {
      // Arrange
      const resultDto = { data: [mockVehicle], total: 1, currentPage: 1, limit: 10, totalPages: 1 };
      cache.get.mockResolvedValue(resultDto);

      // Act
      const result = await service.findAll({});

      // Assert
      expect(result).toEqual(resultDto);
      expect(cache.get).toHaveBeenCalledWith('vehicles:all:1:10:');
      expect(vehicleRepo.findAll).not.toHaveBeenCalled();
    });

    it('deve buscar do repositório e popular cache quando cache vazio', async () => {
      // Arrange
      const vehicles = [mockVehicle];
      const total = 1;
      cache.get.mockResolvedValue(undefined);
      vehicleRepo.findAll.mockResolvedValue({ data: vehicles, total });

      // Act
      const result = await service.findAll({});

      // Assert
      expect(result.data).toEqual(vehicles);
      expect(result.total).toEqual(total);
      expect(vehicleRepo.findAll).toHaveBeenCalledTimes(1);
      expect(cache.set).toHaveBeenCalledWith(
        'vehicles:all:1:10:',
        JSON.parse(JSON.stringify(result)),
        60000,
      );
    });
  });

  // ── findById ─────────────────────────────────────────────────

  describe('findById', () => {
    it('deve retornar veículo do cache quando disponível', async () => {
      // Arrange
      cache.get.mockResolvedValue(mockVehicle);

      // Act
      const result = await service.findById('uuid-vehicle-1');

      // Assert
      expect(result).toEqual(mockVehicle);
      expect(cache.get).toHaveBeenCalledWith('vehicles:uuid-vehicle-1');
      expect(vehicleRepo.findById).not.toHaveBeenCalled();
    });

    it('deve buscar do repositório quando cache vazio e popular cache', async () => {
      // Arrange
      cache.get.mockResolvedValue(undefined);
      vehicleRepo.findById.mockResolvedValue(mockVehicle);

      // Act
      const result = await service.findById('uuid-vehicle-1');

      // Assert
      expect(result).toEqual(mockVehicle);
      expect(vehicleRepo.findById).toHaveBeenCalledWith('uuid-vehicle-1');
      expect(cache.set).toHaveBeenCalledWith(
        'vehicles:uuid-vehicle-1',
        mockVehicle,
        60000,
      );
    });

    it('deve lançar NotFoundException quando veículo não existe', async () => {
      // Arrange
      cache.get.mockResolvedValue(undefined);
      vehicleRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById('uuid-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── create ───────────────────────────────────────────────────

  describe('create', () => {
    const createData: Partial<Vehicle> = {
      license_plate: 'XYZ-9A87',
      chassis: '1HGBH41JXMN109186',
      renavam: '99887766554',
      year: 2025,
      model_id: 'uuid-model-1',
      created_by: 'system',
    };

    it('deve criar veículo e emitir evento no RabbitMQ', async () => {
      // Arrange
      const created = new Vehicle({ ...createData, id: 'uuid-vehicle-2' });
      modelRepo.findById.mockResolvedValue(mockModel);
      vehicleRepo.findByLicensePlate.mockResolvedValue(null);
      vehicleRepo.findByChassis.mockResolvedValue(null);
      vehicleRepo.findByRenavam.mockResolvedValue(null);
      vehicleRepo.create.mockResolvedValue(created);

      // Act
      const result = await service.create(createData);

      // Assert
      expect(result).toEqual(created);
      expect(modelRepo.findById).toHaveBeenCalledWith('uuid-model-1');
      expect(vehicleRepo.create).toHaveBeenCalledWith(createData);
      expect(rmqClient.emit).toHaveBeenCalledWith(
        VEHICLE_MUTATED_EVENT,
        expect.objectContaining({
          action: 'created',
          vehicleId: 'uuid-vehicle-2',
        }),
      );
    });

    it('deve lançar NotFoundException quando modelo não existe', async () => {
      // Arrange
      modelRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createData)).rejects.toThrow(
        NotFoundException,
      );
      expect(vehicleRepo.create).not.toHaveBeenCalled();
      expect(rmqClient.emit).not.toHaveBeenCalled();
    });

    it('deve lançar ConflictException quando placa já existe', async () => {
      // Arrange
      modelRepo.findById.mockResolvedValue(mockModel);
      vehicleRepo.findByLicensePlate.mockResolvedValue(mockVehicle);

      // Act & Assert
      await expect(service.create(createData)).rejects.toThrow(
        ConflictException,
      );
      expect(vehicleRepo.create).not.toHaveBeenCalled();
    });

    it('deve lançar ConflictException quando chassi já existe', async () => {
      // Arrange
      modelRepo.findById.mockResolvedValue(mockModel);
      vehicleRepo.findByLicensePlate.mockResolvedValue(null);
      vehicleRepo.findByChassis.mockResolvedValue(mockVehicle);

      // Act & Assert
      await expect(service.create(createData)).rejects.toThrow(
        ConflictException,
      );
    });

    it('deve lançar ConflictException quando RENAVAM já existe', async () => {
      // Arrange
      modelRepo.findById.mockResolvedValue(mockModel);
      vehicleRepo.findByLicensePlate.mockResolvedValue(null);
      vehicleRepo.findByChassis.mockResolvedValue(null);
      vehicleRepo.findByRenavam.mockResolvedValue(mockVehicle);

      // Act & Assert
      await expect(service.create(createData)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ── update ───────────────────────────────────────────────────

  describe('update', () => {
    it('deve atualizar veículo e emitir evento no RabbitMQ', async () => {
      // Arrange
      const updateData: Partial<Vehicle> = { year: 2026 };
      const updated = new Vehicle({ ...mockVehicle, ...updateData });
      vehicleRepo.findById.mockResolvedValue(mockVehicle);
      vehicleRepo.update.mockResolvedValue(updated);

      // Act
      const result = await service.update('uuid-vehicle-1', updateData);

      // Assert
      expect(result).toEqual(updated);
      expect(rmqClient.emit).toHaveBeenCalledWith(
        VEHICLE_MUTATED_EVENT,
        expect.objectContaining({
          action: 'updated',
          vehicleId: 'uuid-vehicle-1',
        }),
      );
    });

    it('deve lançar NotFoundException quando veículo não existe', async () => {
      // Arrange
      vehicleRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.update('uuid-inexistente', { year: 2026 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve validar unicidade da placa quando alterada', async () => {
      // Arrange
      const updateData: Partial<Vehicle> = { license_plate: 'NOVA-1234' };
      vehicleRepo.findById.mockResolvedValue(mockVehicle);
      vehicleRepo.findByLicensePlate.mockResolvedValue(
        new Vehicle({ id: 'outro-uuid', license_plate: 'NOVA-1234' }),
      );

      // Act & Assert
      await expect(
        service.update('uuid-vehicle-1', updateData),
      ).rejects.toThrow(ConflictException);
    });

    it('não deve validar unicidade quando placa não muda', async () => {
      // Arrange
      const updateData: Partial<Vehicle> = {
        license_plate: mockVehicle.license_plate, // mesma placa
        year: 2026,
      };
      const updated = new Vehicle({ ...mockVehicle, ...updateData });
      vehicleRepo.findById.mockResolvedValue(mockVehicle);
      vehicleRepo.update.mockResolvedValue(updated);

      // Act
      const result = await service.update('uuid-vehicle-1', updateData);

      // Assert
      expect(result).toEqual(updated);
      expect(vehicleRepo.findByLicensePlate).not.toHaveBeenCalled();
    });
  });

  // ── remove ───────────────────────────────────────────────────

  describe('remove', () => {
    it('deve remover veículo e emitir evento no RabbitMQ', async () => {
      // Arrange
      vehicleRepo.findById.mockResolvedValue(mockVehicle);
      vehicleRepo.delete.mockResolvedValue(undefined);

      // Act
      await service.remove('uuid-vehicle-1');

      // Assert
      expect(vehicleRepo.delete).toHaveBeenCalledWith('uuid-vehicle-1');
      expect(rmqClient.emit).toHaveBeenCalledWith(
        VEHICLE_MUTATED_EVENT,
        expect.objectContaining({
          action: 'deleted',
          vehicleId: 'uuid-vehicle-1',
        }),
      );
    });

    it('deve lançar NotFoundException quando veículo não existe', async () => {
      // Arrange
      vehicleRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove('uuid-inexistente')).rejects.toThrow(
        NotFoundException,
      );
      expect(vehicleRepo.delete).not.toHaveBeenCalled();
      expect(rmqClient.emit).not.toHaveBeenCalled();
    });
  });
});
