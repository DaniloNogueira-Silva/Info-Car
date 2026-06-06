import { Model } from '../../domain/entities/model.entity';

export interface IModelRepository {
  findAll(): Promise<Model[]>;
  findById(id: string): Promise<Model | null>;
  findByBrandId(brandId: string): Promise<Model[]>;
  create(model: Partial<Model>): Promise<Model>;
  update(id: string, model: Partial<Model>): Promise<Model>;
  delete(id: string): Promise<void>;
}

export const MODEL_REPOSITORY = Symbol('IModelRepository');
