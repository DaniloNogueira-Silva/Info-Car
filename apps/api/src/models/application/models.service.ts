import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IModelRepository, IBrandRepository } from '@app/shared';
import { Model, MODEL_REPOSITORY, BRAND_REPOSITORY } from '@app/shared';

@Injectable()
export class ModelsService {
  constructor(
    @Inject(MODEL_REPOSITORY)
    private readonly modelRepository: IModelRepository,
    @Inject(BRAND_REPOSITORY)
    private readonly brandRepository: IBrandRepository,
  ) {}

  async findAll(): Promise<Model[]> {
    return this.modelRepository.findAll();
  }

  async findById(id: string): Promise<Model> {
    const model = await this.modelRepository.findById(id);
    if (!model) {
      throw new NotFoundException(`Model with id "${id}" not found`);
    }
    return model;
  }

  async findByBrandId(brandId: string): Promise<Model[]> {
    return this.modelRepository.findByBrandId(brandId);
  }

  async create(data: Partial<Model>): Promise<Model> {
    const brand = await this.brandRepository.findById(data.brand_id!);
    if (!brand) {
      throw new NotFoundException(`Brand with id "${data.brand_id}" not found`);
    }
    return this.modelRepository.create(data);
  }

  async update(id: string, data: Partial<Model>): Promise<Model> {
    await this.findById(id);
    if (data.brand_id) {
      const brand = await this.brandRepository.findById(data.brand_id);
      if (!brand) {
        throw new NotFoundException(`Brand with id "${data.brand_id}" not found`);
      }
    }
    return this.modelRepository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    return this.modelRepository.delete(id);
  }
}
