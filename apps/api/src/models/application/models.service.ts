import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import type { IModelRepository, IBrandRepository } from '@app/shared';
import { Model, MODEL_REPOSITORY, BRAND_REPOSITORY, PaginationQueryDto, PaginatedResultDto } from '@app/shared';

@Injectable()
export class ModelsService {
  private readonly logger = new Logger(ModelsService.name);

  constructor(
    @Inject(MODEL_REPOSITORY)
    private readonly modelRepository: IModelRepository,
    @Inject(BRAND_REPOSITORY)
    private readonly brandRepository: IBrandRepository,
  ) {}

  async findAll(query: PaginationQueryDto): Promise<PaginatedResultDto<Model>> {
    this.logger.debug('Fetching all models...');
    const { page = 1, limit = 10, filter } = query;
    const { data, total } = await this.modelRepository.findAll(page, limit, filter);
    return new PaginatedResultDto<Model>(data, total, page, limit);
  }

  async findById(id: string): Promise<Model> {
    this.logger.debug(`Fetching model by id: ${id}`);
    
    const model = await this.modelRepository.findById(id);
    if (!model) {
      this.logger.warn(`Model with id "${id}" not found`);
      throw new NotFoundException(`Model with id "${id}" not found`);
    }
    
    return model;
  }

  async findByBrandId(brandId: string): Promise<Model[]> {
    this.logger.debug(`Fetching models by brand id: ${brandId}`);
    return this.modelRepository.findByBrandId(brandId);
  }

  async create(data: Partial<Model>): Promise<Model> {
    this.logger.log('Creating a new model...');
    
    const brand = await this.brandRepository.findById(data.brand_id!);
    if (!brand) {
      this.logger.warn(`Creation failed: Brand with id "${data.brand_id}" not found`);
      throw new NotFoundException(`Brand with id "${data.brand_id}" not found`);
    }
    
    const model = await this.modelRepository.create(data);
    this.logger.log(`Model created successfully with id: ${model.id}`);
    
    return model;
  }

  async update(id: string, data: Partial<Model>): Promise<Model> {
    this.logger.log(`Updating model with id: ${id}`);
    
    // O findById já lida com a verificação de existência e o log de warning
    await this.findById(id);
    
    if (data.brand_id) {
      const brand = await this.brandRepository.findById(data.brand_id);
      if (!brand) {
        this.logger.warn(`Update failed: Brand with id "${data.brand_id}" not found`);
        throw new NotFoundException(`Brand with id "${data.brand_id}" not found`);
      }
    }
    
    const model = await this.modelRepository.update(id, data);
    this.logger.log(`Model updated successfully with id: ${id}`);
    
    return model;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removing model with id: ${id}`);
    
    // O findById já lida com a verificação de existência e o log de warning
    await this.findById(id);
    await this.modelRepository.delete(id);
    
    this.logger.log(`Model removed successfully with id: ${id}`);
  }
}