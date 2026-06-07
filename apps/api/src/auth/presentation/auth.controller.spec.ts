import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../application/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService);
  });

  describe('register', () => {
    it('deve registrar um usuário', async () => {
      const registerDto = { nickname: 'Admin', name: 'Admin', email: 'admin@test.com', password: '123' };
      service.register.mockResolvedValue({ id: 'uuid', name: 'Admin', email: 'admin@test.com' } as any);

      const result = await controller.register(registerDto);
      expect(result).toHaveProperty('id');
      expect(service.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('deve logar e retornar token', async () => {
      const loginDto = { email: 'admin@test.com', password: '123' };
      service.login.mockResolvedValue({ access_token: 'token123' });

      const result = await controller.login(loginDto);
      expect(result).toEqual({ access_token: 'token123' });
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });
  });
});
