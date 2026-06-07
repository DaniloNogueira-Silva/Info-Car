import { DataSource, Repository } from 'typeorm';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { UserTypeOrmRepository } from './user-typeorm.repository';
import { User } from '@app/shared';

describe('UserTypeOrmRepository (integration)', () => {
  let dataSource: DataSource;
  let ormRepo: Repository<UserOrmEntity>;
  let repository: UserTypeOrmRepository;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [UserOrmEntity],
      synchronize: true,
    });
    await dataSource.initialize();
    ormRepo = dataSource.getRepository(UserOrmEntity);
    repository = new UserTypeOrmRepository(ormRepo);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  afterEach(async () => {
    await ormRepo.clear();
  });

  describe('create', () => {
    it('deve persistir um usuário e retornar entidade de domínio', async () => {
      const data: Partial<User> = { name: 'Admin', email: 'admin@infocar.com', password: '123', nickname: 'admin', created_by: 'sys' };
      const result = await repository.create(data);

      expect(result).toBeInstanceOf(User);
      expect(result.id).toBeDefined();
      expect(result.email).toBe('admin@infocar.com');

      const dbRecord = await ormRepo.findOne({ where: { id: result.id } });
      expect(dbRecord).not.toBeNull();
      expect(dbRecord!.email).toBe('admin@infocar.com');
    });
  });

  describe('findAll', () => {
    it('deve retornar paginação de usuários', async () => {
      await ormRepo.save([
        ormRepo.create({ name: 'Admin', email: '1@a.com', password: '1', nickname: '1', created_by: 'sys' }),
        ormRepo.create({ name: 'User', email: '2@a.com', password: '2', nickname: '2', created_by: 'sys' }),
      ]);

      const result = await repository.findAll(1, 10);
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.data[0]).toBeInstanceOf(User);
    });

    it('deve filtrar usuários por nome', async () => {
      await ormRepo.save([
        ormRepo.create({ name: 'Carlos', email: '1@a.com', password: '1', nickname: '1', created_by: 'sys' }),
        ormRepo.create({ name: 'Camila', email: '2@a.com', password: '2', nickname: '2', created_by: 'sys' }),
        ormRepo.create({ name: 'User', email: '3@a.com', password: '3', nickname: '3', created_by: 'sys' }),
      ]);

      const result = await repository.findAll(1, 10, 'Cam');
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].name).toBe('Camila');
    });
  });

  describe('findById', () => {
    it('deve retornar usuário por ID', async () => {
      const saved = await ormRepo.save(ormRepo.create({ name: 'User', email: '1@a.com', password: '1', nickname: '1', created_by: 'sys' }));
      const result = await repository.findById(saved.id);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(saved.id);
    });

    it('deve retornar null se não achar por ID', async () => {
      const result = await repository.findById('uuid');
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('deve retornar usuário por email', async () => {
      const saved = await ormRepo.save(ormRepo.create({ name: 'User', email: 'admin@a.com', password: '1', nickname: '1', created_by: 'sys' }));
      const result = await repository.findByEmail('admin@a.com');
      expect(result).not.toBeNull();
      expect(result!.email).toBe('admin@a.com');
    });

    it('deve retornar null se não achar por email', async () => {
      const result = await repository.findByEmail('admin@a.com');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('deve atualizar nome do usuário', async () => {
      const saved = await ormRepo.save(ormRepo.create({ name: 'User', email: 'admin@a.com', password: '1', nickname: '1', created_by: 'sys' }));
      const result = await repository.update(saved.id, { name: 'Admin 2' });
      expect(result.name).toBe('Admin 2');
    });
  });

  describe('delete', () => {
    it('deve remover usuário', async () => {
      const saved = await ormRepo.save(ormRepo.create({ name: 'User', email: 'admin@a.com', password: '1', nickname: '1', created_by: 'sys' }));
      await repository.delete(saved.id);
      const result = await ormRepo.findOne({ where: { id: saved.id } });
      expect(result).toBeNull();
    });
  });
});
