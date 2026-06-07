import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RentalsModule } from '../src/rentals/rentals.module';
import { RentalOrmEntity } from '../src/rentals/infrastructure/entities/rental.orm-entity';
import { VehicleOrmEntity } from '../src/vehicles/infrastructure/entities/vehicle.orm-entity';
import { CustomerOrmEntity } from '../src/customers/infrastructure/entities/customer.orm-entity';

describe('RentalsController (e2e)', () => {
  let app: INestApplication;

  const mockRental = {
    id: 'f8f9e68b-592d-45db-b27a-7208d13b2d18',
    vehicle_id: 'v1',
    customer_id: 'c1',
    start_date: new Date().toISOString(),
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockRentalRepository = {
    findAndCount: jest.fn().mockResolvedValue([[mockRental], 1]),
    findOne: jest.fn().mockResolvedValue(mockRental),
    create: jest.fn().mockReturnValue(mockRental),
    save: jest.fn().mockResolvedValue(mockRental),
    remove: jest.fn().mockResolvedValue(mockRental),
  };

  const mockVehicleRepository = {
    findOne: jest.fn().mockResolvedValue({ id: 'v1', status: 'AVAILABLE' }),
    save: jest.fn(),
  };

  const mockCustomerRepository = {
    findOne: jest.fn().mockResolvedValue({ id: 'c1' }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [RentalsModule],
    })
      .overrideProvider(getRepositoryToken(RentalOrmEntity))
      .useValue(mockRentalRepository)
      .overrideProvider(getRepositoryToken(VehicleOrmEntity))
      .useValue(mockVehicleRepository)
      .overrideProvider(getRepositoryToken(CustomerOrmEntity))
      .useValue(mockCustomerRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/rentals (GET)', () => {
    return request(app.getHttpServer())
      .get('/rentals')
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toBeDefined();
        expect(res.body.total).toBe(1);
      });
  });

  it('/rentals (POST) - should create rental', () => {
    return request(app.getHttpServer())
      .post('/rentals')
      .send({
        vehicle_id: '123e4567-e89b-12d3-a456-426614174000',
        customer_id: '123e4567-e89b-12d3-a456-426614174000',
        start_date: '2026-01-01T00:00:00Z',
      })
      .expect(201);
  });
});
