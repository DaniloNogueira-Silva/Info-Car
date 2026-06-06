import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IBrandRepository } from '@app/shared';
import { Brand, BRAND_REPOSITORY } from '@app/shared';

@Injectable()
export class BrandsService {
  constructor(
    @Inject(BRAND_REPOSITORY)
    private readonly brandRepository: IBrandRepository,
  ) {}

  async findAll(): Promise<Brand[]> {
    return this.brandRepository.findAll();
  }

  async findById(id: string): Promise<Brand> {
    const brand = await this.brandRepository.findById(id);
    if (!brand) {
      throw new NotFoundException(`Brand with id "${id}" not found`);
    }
    return brand;
  }

  async create(data: Partial<Brand>): Promise<Brand> {
    return this.brandRepository.create(data);
  }

  async update(id: string, data: Partial<Brand>): Promise<Brand> {
    await this.findById(id);
    return this.brandRepository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    return this.brandRepository.delete(id);
  }
}
