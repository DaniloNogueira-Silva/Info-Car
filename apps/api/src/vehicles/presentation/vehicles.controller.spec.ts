import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from '../application/vehicles.service';
import { VehicleResponseDto, PaginatedResultDto } from '@app/shared';

describe('VehiclesController', () => {
  let controller: VehiclesController;
  let service: jest.Mocked<VehiclesService>;

  beforeEach(async () => {
    const mockVehiclesService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [
        {
          provide: VehiclesService,
          useValue: mockVehiclesService,
        },
      ],
    }).compile();

    controller = module.get<VehiclesController>(VehiclesController);
    service = module.get(VehiclesService);
  });

  describe('findAll', () => {
    it('deve retornar paginação de veículos', async () => {
      const resultDto = new PaginatedResultDto<VehicleResponseDto>([], 0, 1, 10);
      service.findAll.mockResolvedValue(resultDto as any);

      const result = await controller.findAll({});
      expect(result).toEqual(resultDto);
      expect(service.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('findById', () => {
    it('deve retornar um veículo pelo ID', async () => {
      const mockVehicle = { id: 'uuid', license_plate: 'ABC-1234' };
      service.findById.mockResolvedValue(mockVehicle as any);

      const result = await controller.findById('uuid');
      expect(result).toEqual(mockVehicle);
      expect(service.findById).toHaveBeenCalledWith('uuid');
    });
  });

  describe('create', () => {
    it('deve criar um veículo', async () => {
      const createDto = { license_plate: 'ABC-1234', chassis: 'abc', renavam: '123', year: 2024, model_id: 'model-uuid' };
      const user = { id: 'user-uuid' };
      const createdVehicle = { id: 'uuid', ...createDto, created_by: 'user-uuid' };
      service.create.mockResolvedValue(createdVehicle as any);

      const result = await controller.create(createDto, user);
      expect(result).toEqual(createdVehicle);
      expect(service.create).toHaveBeenCalledWith({ ...createDto, created_by: 'user-uuid' });
    });
  });

  describe('update', () => {
    it('deve atualizar um veículo', async () => {
      const updateDto = { year: 2025 };
      const updatedVehicle = { id: 'uuid', year: 2025 };
      service.update.mockResolvedValue(updatedVehicle as any);

      const result = await controller.update('uuid', updateDto);
      expect(result).toEqual(updatedVehicle);
      expect(service.update).toHaveBeenCalledWith('uuid', updateDto);
    });
  });

  describe('remove', () => {
    it('deve remover um veículo', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('uuid');
      expect(service.remove).toHaveBeenCalledWith('uuid');
    });
  });
});
