import { Model } from './model.entity.js';

export class Vehicle {
  id: string;
  license_plate: string;
  chassis: string;
  renavam: string;
  year: number;
  model_id: string;
  model?: Model;
  created_at: Date;
  updated_at: Date;
  created_by: string;

  constructor(partial?: Partial<Vehicle>) {
    Object.assign(this, partial);
  }
}
