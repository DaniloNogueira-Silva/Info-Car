import { Brand } from './brand.entity';

export class Model {
  id: string;
  name: string;
  brand_id: string;
  brand?: Brand;
  created_at: Date;
  updated_at: Date;
  created_by: string;

  constructor(partial?: Partial<Model>) {
    Object.assign(this, partial);
  }
}
