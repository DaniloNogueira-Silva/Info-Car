import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Brand } from '@app/shared';
import type { IBrandRepository } from '@app/shared';
import { BrandOrmEntity } from '../entities/brand.orm-entity';

@Injectable()
export class BrandTypeOrmRepository implements IBrandRepository {
  constructor(
    @InjectRepository(BrandOrmEntity)
    private readonly repo: Repository<BrandOrmEntity>,
  ) {}

  async findAll(page: number = 1, limit: number = 10, filter?: string): Promise<{ data: Brand[]; total: number }> {
    const skip = (page - 1) * limit;
    const where = filter ? { name: Like(`%${filter}%`) } : {};
    
    const [entities, total] = await this.repo.findAndCount({
      where,
      order: { name: 'ASC' },
      skip,
      take: limit,
    });
    
    return {
      data: entities.map((e) => new Brand(e)),
      total,
    };
  }

  async findById(id: string): Promise<Brand | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? new Brand(entity) : null;
  }

  async create(brand: Partial<Brand>): Promise<Brand> {
    const entity = this.repo.create(brand);
    const saved = await this.repo.save(entity);
    return new Brand(saved);
  }

  async update(id: string, brand: Partial<Brand>): Promise<Brand> {
    await this.repo.update(id, brand);
    return this.findById(id) as Promise<Brand>;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
