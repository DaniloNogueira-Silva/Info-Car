import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MODEL_REPOSITORY } from '@app/shared';
import { ModelOrmEntity } from './infrastructure/entities/model.orm-entity';
import { ModelTypeOrmRepository } from './infrastructure/repositories/model-typeorm.repository';
import { ModelsService } from './application/models.service';
import { ModelsController } from './presentation/models.controller';
import { BrandsModule } from '../brands/brands.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ModelOrmEntity]),
    BrandsModule,
  ],
  controllers: [ModelsController],
  providers: [
    ModelsService,
    {
      provide: MODEL_REPOSITORY,
      useClass: ModelTypeOrmRepository,
    },
  ],
  exports: [MODEL_REPOSITORY],
})
export class ModelsModule {}
