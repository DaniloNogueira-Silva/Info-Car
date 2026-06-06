import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from 'libs/infrastructure/redis/redis.service';
import { CacheService } from './cache.service';
import { VehicleMutatedEventDto } from '@app/shared';

describe('CacheService', () => {
  let service: CacheService;
  let cache: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const mockCache: jest.Mocked<RedisService> = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: RedisService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    cache = module.get(RedisService);
  });

  // ── invalidateVehicleCache ───────────────────────────────────

  describe('invalidateVehicleCache', () => {
    it('deve invalidar cache geral e cache específico do veículo', async () => {
      // Arrange
      const event: VehicleMutatedEventDto = {
        action: 'updated',
        vehicleId: 'uuid-vehicle-1',
        timestamp: new Date(),
        payload: { year: 2026 },
      };

      // Act
      await service.invalidateVehicleCache(event);

      // Assert
      expect(cache.del).toHaveBeenCalledWith('vehicles:all');
      expect(cache.del).toHaveBeenCalledWith('vehicles:uuid-vehicle-1');
      expect(cache.del).toHaveBeenCalledTimes(2);
    });

    it('deve invalidar somente cache geral quando vehicleId está vazio', async () => {
      // Arrange
      const event: VehicleMutatedEventDto = {
        action: 'created',
        vehicleId: '',
        timestamp: new Date(),
      };

      // Act
      await service.invalidateVehicleCache(event);

      // Assert
      expect(cache.del).toHaveBeenCalledWith('vehicles:all');
      expect(cache.del).toHaveBeenCalledTimes(1);
    });

    it('deve invalidar cache para evento de delete', async () => {
      // Arrange
      const event: VehicleMutatedEventDto = {
        action: 'deleted',
        vehicleId: 'uuid-vehicle-99',
        timestamp: new Date(),
      };

      // Act
      await service.invalidateVehicleCache(event);

      // Assert
      expect(cache.del).toHaveBeenCalledWith('vehicles:all');
      expect(cache.del).toHaveBeenCalledWith('vehicles:uuid-vehicle-99');
    });
  });
});
