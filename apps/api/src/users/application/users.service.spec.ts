import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { USER_REPOSITORY, User } from '@app/shared';

describe('UsersService', () => {
  let service: UsersService;
  let repository: any;

  beforeEach(async () => {
    const mockRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: USER_REPOSITORY,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(USER_REPOSITORY);
  });

  describe('findByEmail', () => {
    it('deve retornar o usuário se o email existir', async () => {
      const user = new User({ email: 'test@test.com' });
      repository.findByEmail.mockResolvedValue(user);

      const result = await service.findByEmail('test@test.com');
      expect(result).toEqual(user);
      expect(repository.findByEmail).toHaveBeenCalledWith('test@test.com');
    });

    it('deve retornar null se o email não existir', async () => {
      repository.findByEmail.mockResolvedValue(null);
      const result = await service.findByEmail('test@test.com');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('deve retornar o usuário se o id existir', async () => {
      const user = new User({ id: 'uuid' });
      repository.findById.mockResolvedValue(user);

      const result = await service.findById('uuid');
      expect(result).toEqual(user);
      expect(repository.findById).toHaveBeenCalledWith('uuid');
    });
  });

  describe('create', () => {
    it('deve criar um novo usuário', async () => {
      const userData = { email: 'test@test.com', name: 'Test' };
      const createdUser = new User({ id: 'uuid', ...userData });
      repository.create.mockResolvedValue(createdUser);

      const result = await service.create(userData);
      expect(result).toEqual(createdUser);
      expect(repository.create).toHaveBeenCalledWith(userData);
    });
  });
});
