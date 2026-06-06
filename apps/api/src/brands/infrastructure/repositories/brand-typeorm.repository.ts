import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '@app/shared';
import type { IBrandRepository } from '@app/shared';
import { BrandOrmEntity } from '../entities/brand.orm-entity';

@Injectable()
export class BrandTypeOrmRepository implements IBrandRepository {
  constructor(
    @InjectRepository(BrandOrmEntity)
    private readonly repo: Repository<BrandOrmEntity>,
  ) {}

  async findAll(): Promise<Brand[]> {
    const entities = await this.repo.find({ order: { name: 'ASC' } });
    return entities.map((e) => new Brand(e));
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
