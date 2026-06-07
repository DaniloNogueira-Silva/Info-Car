import { DataSource, Repository } from 'typeorm';
import { BrandOrmEntity } from '../../../brands/infrastructure/entities/brand.orm-entity';
import { ModelOrmEntity } from '../entities/model.orm-entity';
import { ModelTypeOrmRepository } from './model-typeorm.repository';
import { Model } from '@app/shared';

describe('ModelTypeOrmRepository (integration)', () => {
  let dataSource: DataSource;
  let brandRepo: Repository<BrandOrmEntity>;
  let modelOrmRepo: Repository<ModelOrmEntity>;
  let repository: ModelTypeOrmRepository;

  let savedBrand: BrandOrmEntity;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [BrandOrmEntity, ModelOrmEntity],
      synchronize: true,
    });
    await dataSource.initialize();

    brandRepo = dataSource.getRepository(BrandOrmEntity);
    modelOrmRepo = dataSource.getRepository(ModelOrmEntity);
    repository = new ModelTypeOrmRepository(modelOrmRepo);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    // Seed: criar uma marca para os modelos referenciarem
    savedBrand = await brandRepo.save(
      brandRepo.create({ name: 'Toyota', created_by: 'system' }),
    );
  });

  afterEach(async () => {
    await modelOrmRepo.clear();
    await brandRepo.clear();
  });

  // ── create ───────────────────────────────────────────────────

  describe('create', () => {
    it('deve persistir um modelo e retornar entidade de domínio', async () => {
      // Arrange
      const data: Partial<Model> = {
        name: 'Corolla',
        brand_id: savedBrand.id,
        created_by: 'system',
      };

      // Act
      const result = await repository.create(data);

      // Assert
      expect(result).toBeInstanceOf(Model);
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Corolla');
      expect(result.brand_id).toBe(savedBrand.id);
    });
  });

  // ── findAll ──────────────────────────────────────────────────

  describe('findAll', () => {
    it('deve retornar todos os modelos com relação de marca', async () => {
      // Arrange
      await modelOrmRepo.save([
        modelOrmRepo.create({ name: 'Hilux', brand_id: savedBrand.id, created_by: 'system' }),
        modelOrmRepo.create({ name: 'Corolla', brand_id: savedBrand.id, created_by: 'system' }),
      ]);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.data[0].name).toBe('Corolla'); // ordenado por nome ASC
      expect(result.data[1].name).toBe('Hilux');
      expect(result.data[0].brand).toBeDefined();
      expect(result.data[0].brand!.name).toBe('Toyota');
    });
  });

  // ── findById ─────────────────────────────────────────────────

  describe('findById', () => {
    it('deve retornar modelo por ID com marca', async () => {
      // Arrange
      const saved = await modelOrmRepo.save(
        modelOrmRepo.create({ name: 'Yaris', brand_id: savedBrand.id, created_by: 'system' }),
      );

      // Act
      const result = await repository.findById(saved.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Yaris');
      expect(result!.brand).toBeDefined();
    });

    it('deve retornar null quando ID não existe', async () => {
      // Act
      const result = await repository.findById('uuid-inexistente');

      // Assert
      expect(result).toBeNull();
    });
  });

  // ── findByBrandId ────────────────────────────────────────────

  describe('findByBrandId', () => {
    it('deve retornar apenas modelos da marca informada', async () => {
      // Arrange
      const otherBrand = await brandRepo.save(
        brandRepo.create({ name: 'Honda', created_by: 'system' }),
      );
      await modelOrmRepo.save([
        modelOrmRepo.create({ name: 'Corolla', brand_id: savedBrand.id, created_by: 'system' }),
        modelOrmRepo.create({ name: 'Civic', brand_id: otherBrand.id, created_by: 'system' }),
      ]);

      // Act
      const result = await repository.findByBrandId(savedBrand.id);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Corolla');
    });
  });

  // ── update ───────────────────────────────────────────────────

  describe('update', () => {
    it('deve atualizar nome do modelo', async () => {
      // Arrange
      const saved = await modelOrmRepo.save(
        modelOrmRepo.create({ name: 'Coroll', brand_id: savedBrand.id, created_by: 'system' }),
      );

      // Act
      const result = await repository.update(saved.id, { name: 'Corolla' });

      // Assert
      expect(result.name).toBe('Corolla');
    });
  });

  // ── delete ───────────────────────────────────────────────────

  describe('delete', () => {
    it('deve remover o modelo do banco', async () => {
      // Arrange
      const saved = await modelOrmRepo.save(
        modelOrmRepo.create({ name: 'SW4', brand_id: savedBrand.id, created_by: 'system' }),
      );

      // Act
      await repository.delete(saved.id);

      // Assert
      const dbRecord = await modelOrmRepo.findOne({ where: { id: saved.id } });
      expect(dbRecord).toBeNull();
    });
  });
});
