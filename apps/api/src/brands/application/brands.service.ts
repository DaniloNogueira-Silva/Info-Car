import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import type { IBrandRepository } from '@app/shared';
import { Brand, BRAND_REPOSITORY, PaginationQueryDto, PaginatedResultDto } from '@app/shared';

@Injectable()
export class BrandsService {
  private readonly logger = new Logger(BrandsService.name);

  constructor(
    @Inject(BRAND_REPOSITORY)
    private readonly brandRepository: IBrandRepository,
  ) {}

  async findAll(query: PaginationQueryDto): Promise<PaginatedResultDto<Brand>> {
    this.logger.debug('Fetching all brands...');
    const { page = 1, limit = 10, filter } = query;
    const { data, total } = await this.brandRepository.findAll(page, limit, filter);
    return new PaginatedResultDto<Brand>(data, total, page, limit);
  }

  async findById(id: string): Promise<Brand> {
    this.logger.debug(`Fetching brand by id: ${id}`);
    
    const brand = await this.brandRepository.findById(id);
    if (!brand) {
      this.logger.warn(`Brand with id "${id}" not found`);
      throw new NotFoundException(`Brand with id "${id}" not found`);
    }
    
    return brand;
  }

  async create(data: Partial<Brand>): Promise<Brand> {
    this.logger.log('Creating a new brand...');
    
    const brand = await this.brandRepository.create(data);
    this.logger.log(`Brand created successfully with id: ${brand.id}`);
    
    return brand;
  }

  async update(id: string, data: Partial<Brand>): Promise<Brand> {
    this.logger.log(`Updating brand with id: ${id}`);
    
    // O findById já lida com a verificação de existência e o log de warning (se não encontrar)
    await this.findById(id);
    
    const brand = await this.brandRepository.update(id, data);
    this.logger.log(`Brand updated successfully with id: ${id}`);
    
    return brand;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removing brand with id: ${id}`);
    
    // O findById já lida com a verificação de existência e o log de warning
    await this.findById(id);
    await this.brandRepository.delete(id);
    
    this.logger.log(`Brand removed successfully with id: ${id}`);
  }
}