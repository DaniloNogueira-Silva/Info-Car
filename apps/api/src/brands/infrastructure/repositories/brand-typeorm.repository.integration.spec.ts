import { DataSource, Repository } from 'typeorm';
import { BrandOrmEntity } from '../entities/brand.orm-entity';
import { BrandTypeOrmRepository } from './brand-typeorm.repository';
import { Brand } from '@app/shared';

describe('BrandTypeOrmRepository (integration)', () => {
  let dataSource: DataSource;
  let ormRepo: Repository<BrandOrmEntity>;
  let repository: BrandTypeOrmRepository;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [BrandOrmEntity],
      synchronize: true,
    });
    await dataSource.initialize();
    ormRepo = dataSource.getRepository(BrandOrmEntity);
    repository = new BrandTypeOrmRepository(ormRepo);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  afterEach(async () => {
    await ormRepo.clear();
  });

  // ── create ───────────────────────────────────────────────────

  describe('create', () => {
    it('deve persistir uma marca e retornar entidade de domínio', async () => {
      // Arrange
      const data: Partial<Brand> = { name: 'Toyota', created_by: 'system' };

      // Act
      const result = await repository.create(data);

      // Assert
      expect(result).toBeInstanceOf(Brand);
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Toyota');
      expect(result.created_by).toBe('system');

      const dbRecord = await ormRepo.findOne({ where: { id: result.id } });
      expect(dbRecord).not.toBeNull();
      expect(dbRecord!.name).toBe('Toyota');
    });
  });

  // ── findAll ──────────────────────────────────────────────────

  describe('findAll', () => {
    it('deve retornar todas as marcas ordenadas por nome', async () => {
      // Arrange
      await ormRepo.save([
        ormRepo.create({ name: 'Honda', created_by: 'system' }),
        ormRepo.create({ name: 'Audi', created_by: 'system' }),
        ormRepo.create({ name: 'Toyota', created_by: 'system' }),
      ]);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.data[0].name).toBe('Audi');
      expect(result.data[1].name).toBe('Honda');
      expect(result.data[2].name).toBe('Toyota');
      expect(result.data[0]).toBeInstanceOf(Brand);
    });
  });

  // ── findById ─────────────────────────────────────────────────

  describe('findById', () => {
    it('deve retornar marca por ID', async () => {
      // Arrange
      const saved = await ormRepo.save(
        ormRepo.create({ name: 'BMW', created_by: 'system' }),
      );

      // Act
      const result = await repository.findById(saved.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.id).toBe(saved.id);
      expect(result!.name).toBe('BMW');
    });

    it('deve retornar null quando ID não existe', async () => {
      // Arrange — banco vazio

      // Act
      const result = await repository.findById('uuid-inexistente');

      // Assert
      expect(result).toBeNull();
    });
  });

  // ── update ───────────────────────────────────────────────────

  describe('update', () => {
    it('deve atualizar nome da marca', async () => {
      // Arrange
      const saved = await ormRepo.save(
        ormRepo.create({ name: 'Toyot', created_by: 'system' }),
      );

      // Act
      const result = await repository.update(saved.id, { name: 'Toyota' });

      // Assert
      expect(result.name).toBe('Toyota');
      const dbRecord = await ormRepo.findOne({ where: { id: saved.id } });
      expect(dbRecord!.name).toBe('Toyota');
    });
  });

  // ── delete ───────────────────────────────────────────────────

  describe('delete', () => {
    it('deve remover a marca do banco', async () => {
      // Arrange
      const saved = await ormRepo.save(
        ormRepo.create({ name: 'Ford', created_by: 'system' }),
      );

      // Act
      await repository.delete(saved.id);

      // Assert
      const dbRecord = await ormRepo.findOne({ where: { id: saved.id } });
      expect(dbRecord).toBeNull();
    });
  });
});
