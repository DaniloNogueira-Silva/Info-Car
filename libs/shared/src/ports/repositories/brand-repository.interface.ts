import { Brand } from '../../domain/entities/brand.entity.js';

export interface IBrandRepository {
  findAll(): Promise<Brand[]>;
  findById(id: string): Promise<Brand | null>;
  create(brand: Partial<Brand>): Promise<Brand>;
  update(id: string, brand: Partial<Brand>): Promise<Brand>;
  delete(id: string): Promise<void>;
}

export const BRAND_REPOSITORY = Symbol('IBrandRepository');
