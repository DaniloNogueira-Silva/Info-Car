import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ModelsService } from './models.service';
import { Model, Brand, MODEL_REPOSITORY, BRAND_REPOSITORY } from '@app/shared';
import type { IModelRepository, IBrandRepository } from '@app/shared';

describe('ModelsService', () => {
  let service: ModelsService;
  let modelRepo: jest.Mocked<IModelRepository>;
  let brandRepo: jest.Mocked<IBrandRepository>;

  const mockBrand = new Brand({
    id: 'uuid-brand-1',
    name: 'Toyota',
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    created_by: 'system',
  });

  const mockModel = new Model({
    id: 'uuid-model-1',
    name: 'Corolla',
    brand_id: 'uuid-brand-1',
    brand: mockBrand,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    created_by: 'system',
  });

  beforeEach(async () => {
    const mockModelRepo: jest.Mocked<IModelRepository> = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByBrandId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockBrandRepo: jest.Mocked<IBrandRepository> = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModelsService,
        { provide: MODEL_REPOSITORY, useValue: mockModelRepo },
        { provide: BRAND_REPOSITORY, useValue: mockBrandRepo },
      ],
    }).compile();

    service = module.get<ModelsService>(ModelsService);
    modelRepo = module.get(MODEL_REPOSITORY);
    brandRepo = module.get(BRAND_REPOSITORY);
  });

  // ── findAll ──────────────────────────────────────────────────

  describe('findAll', () => {
    it('deve retornar todos os modelos', async () => {
      // Arrange
      const models = [mockModel];
      modelRepo.findAll.mockResolvedValue(models);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(models);
      expect(modelRepo.findAll).toHaveBeenCalledTimes(1);
    });
  });

  // ── findById ─────────────────────────────────────────────────

  describe('findById', () => {
    it('deve retornar o modelo quando encontrado', async () => {
      // Arrange
      modelRepo.findById.mockResolvedValue(mockModel);

      // Act
      const result = await service.findById('uuid-model-1');

      // Assert
      expect(result).toEqual(mockModel);
      expect(modelRepo.findById).toHaveBeenCalledWith('uuid-model-1');
    });

    it('deve lançar NotFoundException quando modelo não existe', async () => {
      // Arrange
      modelRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById('uuid-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── findByBrandId ────────────────────────────────────────────

  describe('findByBrandId', () => {
    it('deve retornar modelos da marca informada', async () => {
      // Arrange
      const models = [mockModel];
      modelRepo.findByBrandId.mockResolvedValue(models);

      // Act
      const result = await service.findByBrandId('uuid-brand-1');

      // Assert
      expect(result).toEqual(models);
      expect(modelRepo.findByBrandId).toHaveBeenCalledWith('uuid-brand-1');
    });

    it('deve retornar lista vazia quando marca não possui modelos', async () => {
      // Arrange
      modelRepo.findByBrandId.mockResolvedValue([]);

      // Act
      const result = await service.findByBrandId('uuid-brand-sem-modelos');

      // Assert
      expect(result).toEqual([]);
    });
  });

  // ── create ───────────────────────────────────────────────────

  describe('create', () => {
    it('deve criar modelo quando a marca existe', async () => {
      // Arrange
      const createData: Partial<Model> = {
        name: 'Civic',
        brand_id: 'uuid-brand-1',
        created_by: 'system',
      };
      const created = new Model({ ...createData, id: 'uuid-model-2' });
      brandRepo.findById.mockResolvedValue(mockBrand);
      modelRepo.create.mockResolvedValue(created);

      // Act
      const result = await service.create(createData);

      // Assert
      expect(result).toEqual(created);
      expect(brandRepo.findById).toHaveBeenCalledWith('uuid-brand-1');
      expect(modelRepo.create).toHaveBeenCalledWith(createData);
    });

    it('deve lançar NotFoundException quando marca não existe', async () => {
      // Arrange
      const createData: Partial<Model> = {
        name: 'Civic',
        brand_id: 'uuid-inexistente',
        created_by: 'system',
      };
      brandRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createData)).rejects.toThrow(
        NotFoundException,
      );
      expect(modelRepo.create).not.toHaveBeenCalled();
    });
  });

  // ── update ───────────────────────────────────────────────────

  describe('update', () => {
    it('deve atualizar modelo com sucesso', async () => {
      // Arrange
      const updateData: Partial<Model> = { name: 'Corolla Cross' };
      const updated = new Model({ ...mockModel, ...updateData });
      modelRepo.findById.mockResolvedValue(mockModel);
      modelRepo.update.mockResolvedValue(updated);

      // Act
      const result = await service.update('uuid-model-1', updateData);

      // Assert
      expect(result).toEqual(updated);
      expect(modelRepo.update).toHaveBeenCalledWith('uuid-model-1', updateData);
    });

    it('deve lançar NotFoundException quando modelo não existe', async () => {
      // Arrange
      modelRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.update('uuid-inexistente', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException quando brand_id informado não existe', async () => {
      // Arrange
      modelRepo.findById.mockResolvedValue(mockModel);
      brandRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.update('uuid-model-1', { brand_id: 'uuid-brand-inexistente' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve atualizar modelo com novo brand_id válido', async () => {
      // Arrange
      const newBrand = new Brand({ id: 'uuid-brand-2', name: 'Honda' });
      const updateData: Partial<Model> = { brand_id: 'uuid-brand-2' };
      const updated = new Model({ ...mockModel, ...updateData });
      modelRepo.findById.mockResolvedValue(mockModel);
      brandRepo.findById.mockResolvedValue(newBrand);
      modelRepo.update.mockResolvedValue(updated);

      // Act
      const result = await service.update('uuid-model-1', updateData);

      // Assert
      expect(result).toEqual(updated);
      expect(brandRepo.findById).toHaveBeenCalledWith('uuid-brand-2');
    });
  });

  // ── remove ───────────────────────────────────────────────────

  describe('remove', () => {
    it('deve remover o modelo com sucesso', async () => {
      // Arrange
      modelRepo.findById.mockResolvedValue(mockModel);
      modelRepo.delete.mockResolvedValue(undefined);

      // Act
      await service.remove('uuid-model-1');

      // Assert
      expect(modelRepo.delete).toHaveBeenCalledWith('uuid-model-1');
    });

    it('deve lançar NotFoundException quando modelo não existe', async () => {
      // Arrange
      modelRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove('uuid-inexistente')).rejects.toThrow(
        NotFoundException,
      );
      expect(modelRepo.delete).not.toHaveBeenCalled();
    });
  });
});
