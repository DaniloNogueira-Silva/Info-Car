import { Inject, Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'libs/infrastructure/redis/redis.service';
import { VehicleMutatedEventDto } from '@app/shared';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  private readonly CACHE_KEY_ALL = 'vehicles:all';
  private readonly CACHE_KEY_PREFIX = 'vehicles:';

  constructor(
    private readonly cache: RedisService,
  ) {}

  async invalidateVehicleCache(event: VehicleMutatedEventDto): Promise<void> {
    await this.cache.delByPattern(`${this.CACHE_KEY_ALL}*`);

    if (event.vehicleId) {
      await this.cache.del(`${this.CACHE_KEY_PREFIX}${event.vehicleId}`);
    }

    this.logger.log(
      `Cache invalidated: [${event.action}] vehicle ${event.vehicleId}`,
    );
  }
}
