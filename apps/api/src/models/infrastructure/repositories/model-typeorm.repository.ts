import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IModelRepository } from '@app/shared';
import { Model } from '@app/shared';
import { ModelOrmEntity } from '../entities/model.orm-entity';

@Injectable()
export class ModelTypeOrmRepository implements IModelRepository {
  constructor(
    @InjectRepository(ModelOrmEntity)
    private readonly repo: Repository<ModelOrmEntity>,
  ) {}

  async findAll(): Promise<Model[]> {
    const entities = await this.repo.find({
      relations: { brand: true },
      order: { name: 'ASC' },
    });
    return entities.map((e) => new Model(e));
  }

  async findById(id: string): Promise<Model | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: { brand: true },
    });
    return entity ? new Model(entity) : null;
  }

  async findByBrandId(brandId: string): Promise<Model[]> {
    const entities = await this.repo.find({
      where: { brand_id: brandId },
      relations: { brand: true },
      order: { name: 'ASC' },
    });
    return entities.map((e) => new Model(e));
  }

  async create(model: Partial<Model>): Promise<Model> {
    const entity = this.repo.create(model);
    const saved = await this.repo.save(entity);
    return this.findById(saved.id) as Promise<Model>;
  }

  async update(id: string, model: Partial<Model>): Promise<Model> {
    await this.repo.update(id, model);
    return this.findById(id) as Promise<Model>;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
