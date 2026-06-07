import { Test, TestingModule } from '@nestjs/testing';
import { BrandsController } from './brands.controller';
import { BrandsService } from '../application/brands.service';
import { BrandResponseDto, PaginatedResultDto } from '@app/shared';

describe('BrandsController', () => {
  let controller: BrandsController;
  let service: jest.Mocked<BrandsService>;

  beforeEach(async () => {
    const mockBrandsService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrandsController],
      providers: [
        {
          provide: BrandsService,
          useValue: mockBrandsService,
        },
      ],
    }).compile();

    controller = module.get<BrandsController>(BrandsController);
    service = module.get(BrandsService);
  });

  describe('findAll', () => {
    it('deve retornar paginação de marcas', async () => {
      const resultDto = new PaginatedResultDto<BrandResponseDto>([], 0, 1, 10);
      service.findAll.mockResolvedValue(resultDto as any);

      const result = await controller.findAll({});
      expect(result).toEqual(resultDto);
      expect(service.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('findById', () => {
    it('deve retornar uma marca pelo ID', async () => {
      const mockBrand = { id: 'uuid', name: 'Toyota', created_by: 'sys', created_at: new Date(), updated_at: new Date() };
      service.findById.mockResolvedValue(mockBrand as any);

      const result = await controller.findById('uuid');
      expect(result).toEqual(mockBrand);
      expect(service.findById).toHaveBeenCalledWith('uuid');
    });
  });

  describe('create', () => {
    it('deve criar uma marca', async () => {
      const createDto = { name: 'Toyota' };
      const user = { id: 'user-uuid' };
      const createdBrand = { id: 'uuid', name: 'Toyota', created_by: 'user-uuid', created_at: new Date(), updated_at: new Date() };
      service.create.mockResolvedValue(createdBrand as any);

      const result = await controller.create(createDto, user);
      expect(result).toEqual(createdBrand);
      expect(service.create).toHaveBeenCalledWith({ ...createDto, created_by: 'user-uuid' });
    });
  });

  describe('update', () => {
    it('deve atualizar uma marca', async () => {
      const updateDto = { name: 'Toyota 2' };
      const updatedBrand = { id: 'uuid', name: 'Toyota 2', created_by: 'sys', created_at: new Date(), updated_at: new Date() };
      service.update.mockResolvedValue(updatedBrand as any);

      const result = await controller.update('uuid', updateDto);
      expect(result).toEqual(updatedBrand);
      expect(service.update).toHaveBeenCalledWith('uuid', updateDto);
    });
  });

  describe('remove', () => {
    it('deve remover uma marca', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('uuid');
      expect(service.remove).toHaveBeenCalledWith('uuid');
    });
  });
});
