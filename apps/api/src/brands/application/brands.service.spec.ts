import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { Brand, BRAND_REPOSITORY } from '@app/shared';
import type { IBrandRepository } from '@app/shared';

describe('BrandsService', () => {
  let service: BrandsService;
  let repository: jest.Mocked<IBrandRepository>;

  const mockBrand = new Brand({
    id: 'uuid-brand-1',
    name: 'Toyota',
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    created_by: 'system',
  });

  beforeEach(async () => {
    const mockRepo: jest.Mocked<IBrandRepository> = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        { provide: BRAND_REPOSITORY, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
    repository = module.get(BRAND_REPOSITORY);
  });

  // ── findAll ──────────────────────────────────────────────────

  describe('findAll', () => {
    it('deve retornar todas as marcas', async () => {
      // Arrange
      const brands = [mockBrand];
      repository.findAll.mockResolvedValue(brands);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(brands);
      expect(repository.findAll).toHaveBeenCalledTimes(1);
    });

    it('deve retornar lista vazia quando não há marcas', async () => {
      // Arrange
      repository.findAll.mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([]);
    });
  });

  // ── findById ─────────────────────────────────────────────────

  describe('findById', () => {
    it('deve retornar a marca quando encontrada', async () => {
      // Arrange
      repository.findById.mockResolvedValue(mockBrand);

      // Act
      const result = await service.findById('uuid-brand-1');

      // Assert
      expect(result).toEqual(mockBrand);
      expect(repository.findById).toHaveBeenCalledWith('uuid-brand-1');
    });

    it('deve lançar NotFoundException quando marca não existe', async () => {
      // Arrange
      repository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById('uuid-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── create ───────────────────────────────────────────────────

  describe('create', () => {
    it('deve criar e retornar a marca', async () => {
      // Arrange
      const createData: Partial<Brand> = { name: 'Honda', created_by: 'system' };
      const created = new Brand({ ...createData, id: 'uuid-brand-2' });
      repository.create.mockResolvedValue(created);

      // Act
      const result = await service.create(createData);

      // Assert
      expect(result).toEqual(created);
      expect(repository.create).toHaveBeenCalledWith(createData);
    });
  });

  // ── update ───────────────────────────────────────────────────

  describe('update', () => {
    it('deve atualizar e retornar a marca', async () => {
      // Arrange
      const updateData: Partial<Brand> = { name: 'Toyota Atualizada' };
      const updated = new Brand({ ...mockBrand, ...updateData });
      repository.findById.mockResolvedValue(mockBrand);
      repository.update.mockResolvedValue(updated);

      // Act
      const result = await service.update('uuid-brand-1', updateData);

      // Assert
      expect(result).toEqual(updated);
      expect(repository.findById).toHaveBeenCalledWith('uuid-brand-1');
      expect(repository.update).toHaveBeenCalledWith('uuid-brand-1', updateData);
    });

    it('deve lançar NotFoundException quando marca não existe', async () => {
      // Arrange
      repository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.update('uuid-inexistente', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  // ── remove ───────────────────────────────────────────────────

  describe('remove', () => {
    it('deve remover a marca com sucesso', async () => {
      // Arrange
      repository.findById.mockResolvedValue(mockBrand);
      repository.delete.mockResolvedValue(undefined);

      // Act
      await service.remove('uuid-brand-1');

      // Assert
      expect(repository.findById).toHaveBeenCalledWith('uuid-brand-1');
      expect(repository.delete).toHaveBeenCalledWith('uuid-brand-1');
    });

    it('deve lançar NotFoundException quando marca não existe', async () => {
      // Arrange
      repository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove('uuid-inexistente')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
