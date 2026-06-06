import { DataSource, Repository } from 'typeorm';
import { BrandOrmEntity } from '../../../brands/infrastructure/entities/brand.orm-entity';
import { ModelOrmEntity } from '../../../models/infrastructure/entities/model.orm-entity';
import { VehicleOrmEntity } from '../entities/vehicle.orm-entity';
import { VehicleTypeOrmRepository } from './vehicle-typeorm.repository';
import { Vehicle } from '@app/shared';

describe('VehicleTypeOrmRepository (integration)', () => {
  let dataSource: DataSource;
  let brandRepo: Repository<BrandOrmEntity>;
  let modelOrmRepo: Repository<ModelOrmEntity>;
  let vehicleOrmRepo: Repository<VehicleOrmEntity>;
  let repository: VehicleTypeOrmRepository;

  let savedBrand: BrandOrmEntity;
  let savedModel: ModelOrmEntity;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [BrandOrmEntity, ModelOrmEntity, VehicleOrmEntity],
      synchronize: true,
    });
    await dataSource.initialize();

    brandRepo = dataSource.getRepository(BrandOrmEntity);
    modelOrmRepo = dataSource.getRepository(ModelOrmEntity);
    vehicleOrmRepo = dataSource.getRepository(VehicleOrmEntity);
    repository = new VehicleTypeOrmRepository(vehicleOrmRepo);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    // Seed: criar marca e modelo
    savedBrand = await brandRepo.save(
      brandRepo.create({ name: 'Toyota', created_by: 'system' }),
    );
    savedModel = await modelOrmRepo.save(
      modelOrmRepo.create({
        name: 'Corolla',
        brand_id: savedBrand.id,
        created_by: 'system',
      }),
    );
  });

  afterEach(async () => {
    await vehicleOrmRepo.clear();
    await modelOrmRepo.clear();
    await brandRepo.clear();
  });

  // helper para criar dados de veículo
  const vehicleData = (overrides?: Partial<Vehicle>): Partial<Vehicle> => ({
    license_plate: 'ABC-1D23',
    chassis: '9BWZZZ377VT004251',
    renavam: '00123456789',
    year: 2024,
    model_id: savedModel?.id,
    created_by: 'system',
    ...overrides,
  });

  // ── create ───────────────────────────────────────────────────

  describe('create', () => {
    it('deve persistir um veículo e retornar entidade de domínio', async () => {
      // Arrange
      const data = vehicleData();

      // Act
      const result = await repository.create(data);

      // Assert
      expect(result).toBeInstanceOf(Vehicle);
      expect(result.id).toBeDefined();
      expect(result.license_plate).toBe('ABC-1D23');
      expect(result.chassis).toBe('9BWZZZ377VT004251');
      expect(result.renavam).toBe('00123456789');
      expect(result.year).toBe(2024);
    });
  });

  // ── findAll ──────────────────────────────────────────────────

  describe('findAll', () => {
    it('deve retornar todos os veículos com relações', async () => {
      // Arrange
      await vehicleOrmRepo.save([
        vehicleOrmRepo.create(vehicleData({ license_plate: 'BBB-1111', chassis: 'CHASSIS_A_1234567', renavam: '11111111111' })),
        vehicleOrmRepo.create(vehicleData({ license_plate: 'AAA-2222', chassis: 'CHASSIS_B_1234567', renavam: '22222222222' })),
      ]);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].license_plate).toBe('AAA-2222'); // ordenado ASC
      expect(result[0].model).toBeDefined();
      expect(result[0].model!.brand).toBeDefined();
    });
  });

  // ── findById ─────────────────────────────────────────────────

  describe('findById', () => {
    it('deve retornar veículo por ID com relações', async () => {
      // Arrange
      const saved = await vehicleOrmRepo.save(
        vehicleOrmRepo.create(vehicleData()),
      );

      // Act
      const result = await repository.findById(saved.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.license_plate).toBe('ABC-1D23');
      expect(result!.model).toBeDefined();
      expect(result!.model!.brand).toBeDefined();
      expect(result!.model!.brand!.name).toBe('Toyota');
    });

    it('deve retornar null quando ID não existe', async () => {
      // Act
      const result = await repository.findById('uuid-inexistente');

      // Assert
      expect(result).toBeNull();
    });
  });

  // ── findByLicensePlate ───────────────────────────────────────

  describe('findByLicensePlate', () => {
    it('deve encontrar veículo pela placa', async () => {
      // Arrange
      await vehicleOrmRepo.save(vehicleOrmRepo.create(vehicleData()));

      // Act
      const result = await repository.findByLicensePlate('ABC-1D23');

      // Assert
      expect(result).not.toBeNull();
      expect(result!.license_plate).toBe('ABC-1D23');
    });

    it('deve retornar null quando placa não existe', async () => {
      // Act
      const result = await repository.findByLicensePlate('ZZZ-9999');

      // Assert
      expect(result).toBeNull();
    });
  });

  // ── findByChassis ────────────────────────────────────────────

  describe('findByChassis', () => {
    it('deve encontrar veículo pelo chassi', async () => {
      // Arrange
      await vehicleOrmRepo.save(vehicleOrmRepo.create(vehicleData()));

      // Act
      const result = await repository.findByChassis('9BWZZZ377VT004251');

      // Assert
      expect(result).not.toBeNull();
      expect(result!.chassis).toBe('9BWZZZ377VT004251');
    });
  });

  // ── findByRenavam ────────────────────────────────────────────

  describe('findByRenavam', () => {
    it('deve encontrar veículo pelo RENAVAM', async () => {
      // Arrange
      await vehicleOrmRepo.save(vehicleOrmRepo.create(vehicleData()));

      // Act
      const result = await repository.findByRenavam('00123456789');

      // Assert
      expect(result).not.toBeNull();
      expect(result!.renavam).toBe('00123456789');
    });
  });

  // ── update ───────────────────────────────────────────────────

  describe('update', () => {
    it('deve atualizar campos do veículo', async () => {
      // Arrange
      const saved = await vehicleOrmRepo.save(
        vehicleOrmRepo.create(vehicleData()),
      );

      // Act
      const result = await repository.update(saved.id, { year: 2026 });

      // Assert
      expect(result.year).toBe(2026);
      expect(result.license_plate).toBe('ABC-1D23');
    });
  });

  // ── delete ───────────────────────────────────────────────────

  describe('delete', () => {
    it('deve remover o veículo do banco', async () => {
      // Arrange
      const saved = await vehicleOrmRepo.save(
        vehicleOrmRepo.create(vehicleData()),
      );

      // Act
      await repository.delete(saved.id);

      // Assert
      const dbRecord = await vehicleOrmRepo.findOne({ where: { id: saved.id } });
      expect(dbRecord).toBeNull();
    });
  });
});
