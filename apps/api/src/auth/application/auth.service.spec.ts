import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../../users/application/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '@app/shared';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockUsersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  describe('register', () => {
    const registerDto = { name: 'Admin', nickname: 'admin', email: 'test@test.com', password: '123' };

    it('deve registrar um novo usuário e retornar token', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      usersService.create.mockResolvedValue(new User({ id: 'uuid', email: 'test@test.com' }));
      jwtService.sign.mockReturnValue('token123');

      const result = await service.register(registerDto);

      expect(result).toEqual({ access_token: 'token123' });
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@test.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('123', 10);
      expect(usersService.create).toHaveBeenCalledWith({
        nickname: 'admin',
        name: 'Admin',
        email: 'test@test.com',
        password: 'hashed_password',
        created_by: 'system',
      });
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'uuid', email: 'test@test.com' });
    });

    it('deve lançar ConflictException se email já existir', async () => {
      usersService.findByEmail.mockResolvedValue(new User({ id: 'uuid' }));

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@test.com', password: '123' };

    it('deve fazer login e retornar token', async () => {
      usersService.findByEmail.mockResolvedValue(new User({ id: 'uuid', email: 'test@test.com', password: 'hashed_password' }));
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('token123');

      const result = await service.login(loginDto);

      expect(result).toEqual({ access_token: 'token123' });
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@test.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('123', 'hashed_password');
    });

    it('deve lançar UnauthorizedException se usuário não existir', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException se a senha não bater', async () => {
      usersService.findByEmail.mockResolvedValue(new User({ id: 'uuid', email: 'test@test.com', password: 'hashed_password' }));
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
