import { Brand } from '../../domain/entities/brand.entity';

export interface IBrandRepository {
  findAll(page?: number, limit?: number, filter?: string): Promise<{ data: Brand[]; total: number }>;
  findById(id: string): Promise<Brand | null>;
  create(brand: Partial<Brand>): Promise<Brand>;
  update(id: string, brand: Partial<Brand>): Promise<Brand>;
  delete(id: string): Promise<void>;
}

export const BRAND_REPOSITORY = Symbol('IBrandRepository');
