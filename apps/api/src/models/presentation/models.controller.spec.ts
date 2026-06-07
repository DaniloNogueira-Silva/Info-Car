import { Test, TestingModule } from '@nestjs/testing';
import { ModelsController } from './models.controller';
import { ModelsService } from '../application/models.service';
import { ModelResponseDto, PaginatedResultDto } from '@app/shared';

describe('ModelsController', () => {
  let controller: ModelsController;
  let service: jest.Mocked<ModelsService>;

  beforeEach(async () => {
    const mockModelsService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByBrandId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModelsController],
      providers: [
        {
          provide: ModelsService,
          useValue: mockModelsService,
        },
      ],
    }).compile();

    controller = module.get<ModelsController>(ModelsController);
    service = module.get(ModelsService);
  });

  describe('findAll', () => {
    it('deve retornar paginação de modelos quando nenhum brand_id for passado', async () => {
      const resultDto = new PaginatedResultDto<ModelResponseDto>([], 0, 1, 10);
      service.findAll.mockResolvedValue(resultDto as any);

      const result = await controller.findAll({});
      expect(result).toEqual(resultDto);
      expect(service.findAll).toHaveBeenCalledWith({});
    });

    it('deve retornar lista de modelos filtrada por brand_id', async () => {
      const models = [{ id: 'uuid', name: 'Corolla' }];
      service.findByBrandId.mockResolvedValue(models as any);

      const result = await controller.findAll({}, 'brand-uuid');
      expect(result).toEqual(models);
      expect(service.findByBrandId).toHaveBeenCalledWith('brand-uuid');
    });
  });

  describe('findById', () => {
    it('deve retornar um modelo pelo ID', async () => {
      const mockModel = { id: 'uuid', name: 'Corolla' };
      service.findById.mockResolvedValue(mockModel as any);

      const result = await controller.findById('uuid');
      expect(result).toEqual(mockModel);
      expect(service.findById).toHaveBeenCalledWith('uuid');
    });
  });

  describe('create', () => {
    it('deve criar um modelo', async () => {
      const createDto = { name: 'Corolla', brand_id: 'brand-uuid' };
      const user = { id: 'user-uuid' };
      const createdModel = { id: 'uuid', ...createDto, created_by: 'user-uuid' };
      service.create.mockResolvedValue(createdModel as any);

      const result = await controller.create(createDto, user);
      expect(result).toEqual(createdModel);
      expect(service.create).toHaveBeenCalledWith({ ...createDto, created_by: 'user-uuid' });
    });
  });

  describe('update', () => {
    it('deve atualizar um modelo', async () => {
      const updateDto = { name: 'Corolla 2' };
      const updatedModel = { id: 'uuid', name: 'Corolla 2' };
      service.update.mockResolvedValue(updatedModel as any);

      const result = await controller.update('uuid', updateDto);
      expect(result).toEqual(updatedModel);
      expect(service.update).toHaveBeenCalledWith('uuid', updateDto);
    });
  });

  describe('remove', () => {
    it('deve remover um modelo', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('uuid');
      expect(service.remove).toHaveBeenCalledWith('uuid');
    });
  });
});
