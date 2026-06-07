import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

import { UserOrmEntity } from './apps/api/src/users/infrastructure/entities/user.orm-entity';
import { BrandOrmEntity } from './apps/api/src/brands/infrastructure/entities/brand.orm-entity';
import { ModelOrmEntity } from './apps/api/src/models/infrastructure/entities/model.orm-entity';
import { VehicleOrmEntity } from './apps/api/src/vehicles/infrastructure/entities/vehicle.orm-entity';
import { CustomerOrmEntity } from './apps/api/src/rentals/infrastructure/entities/customer.orm-entity';
import { RentalOrmEntity } from './apps/api/src/rentals/infrastructure/entities/rental.orm-entity';
import { FineOrmEntity } from './apps/api/src/fines/infrastructure/entities/fine.orm-entity';

export const AppDataSource = new DataSource({
  type: 'mssql',
  host: 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '1433', 10),
  username: process.env.DB_USERNAME || 'sa',
  password: process.env.DB_PASSWORD || 'YourStrong!Passw0rd',
  database: process.env.DB_DATABASE || 'info-car',
  synchronize: false,
  logging: false,
  entities: [UserOrmEntity, BrandOrmEntity, ModelOrmEntity, VehicleOrmEntity, CustomerOrmEntity, RentalOrmEntity, FineOrmEntity],
  migrations: ['./apps/api/src/migrations/*.ts'],
  subscribers: [],
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
});
