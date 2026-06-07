import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import Redis from 'ioredis';
import { Logger } from '@nestjs/common';

describe('RedisService', () => {
  let service: RedisService;
  let redisClient: jest.Mocked<Redis>;

  beforeEach(async () => {
    const mockRedisClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    redisClient = module.get('REDIS_CLIENT');
  });

  describe('get', () => {
    it('deve retornar null se a chave não existir', async () => {
      redisClient.get.mockResolvedValue(null);
      const result = await service.get('test_key');
      expect(result).toBeNull();
    });

    it('deve retornar os dados parseados se a chave existir', async () => {
      redisClient.get.mockResolvedValue(JSON.stringify({ id: 1 }));
      const result = await service.get('test_key');
      expect(result).toEqual({ id: 1 });
    });

    it('deve lidar com erros silenciosamente e retornar null', async () => {
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      redisClient.get.mockRejectedValue(new Error('Redis error'));
      const result = await service.get('test_key');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('deve salvar valor no cache com ttl', async () => {
      await service.set('test_key', { id: 1 }, 1000);
      expect(redisClient.set).toHaveBeenCalledWith('test_key', '{"id":1}', 'PX', 1000);
    });

    it('deve salvar valor no cache sem ttl', async () => {
      await service.set('test_key', { id: 1 });
      expect(redisClient.set).toHaveBeenCalledWith('test_key', '{"id":1}');
    });

    it('deve lidar com erros silenciosamente', async () => {
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      redisClient.set.mockRejectedValue(new Error('Redis error'));
      await expect(service.set('test_key', { id: 1 })).resolves.not.toThrow();
    });
  });

  describe('del', () => {
    it('deve deletar valor do cache', async () => {
      await service.del('test_key');
      expect(redisClient.del).toHaveBeenCalledWith('test_key');
    });

    it('deve lidar com erros silenciosamente', async () => {
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      redisClient.del.mockRejectedValue(new Error('Redis error'));
      await expect(service.del('test_key')).resolves.not.toThrow();
    });
  });
});
