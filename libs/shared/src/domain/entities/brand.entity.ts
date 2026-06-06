export class Brand {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;

  constructor(partial?: Partial<Brand>) {
    Object.assign(this, partial);
  }
}
