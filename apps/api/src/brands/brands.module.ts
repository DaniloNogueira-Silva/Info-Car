import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BRAND_REPOSITORY } from '@app/shared';
import { BrandOrmEntity } from './infrastructure/entities/brand.orm-entity';
import { BrandTypeOrmRepository } from './infrastructure/repositories/brand-typeorm.repository';
import { BrandsService } from './application/brands.service';
import { BrandsController } from './presentation/brands.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BrandOrmEntity])],
  controllers: [BrandsController],
  providers: [
    BrandsService,
    {
      provide: BRAND_REPOSITORY,
      useClass: BrandTypeOrmRepository,
    },
  ],
  exports: [BRAND_REPOSITORY],
})
export class BrandsModule {}
