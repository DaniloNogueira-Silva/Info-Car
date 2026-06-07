import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CustomersModule } from '../src/customers/customers.module';
import { CustomerOrmEntity } from '../src/customers/infrastructure/entities/customer.orm-entity';

describe('CustomersController (e2e)', () => {
  let app: INestApplication;

  const mockCustomer = {
    id: 'f8f9e68b-592d-45db-b27a-7208d13b2d18',
    name: 'Test Customer',
    email: 'test@example.com',
    cnh: '12345678900',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockCustomerRepository = {
    findAndCount: jest.fn().mockResolvedValue([[mockCustomer], 1]),
    findOne: jest.fn().mockResolvedValue(mockCustomer),
    create: jest.fn().mockReturnValue(mockCustomer),
    save: jest.fn().mockResolvedValue(mockCustomer),
    remove: jest.fn().mockResolvedValue(mockCustomer),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CustomersModule],
    })
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

  it('/customers (GET)', () => {
    return request(app.getHttpServer())
      .get('/customers')
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toBeDefined();
        expect(res.body.total).toBe(1);
      });
  });

  it('/customers/:id (GET)', () => {
    return request(app.getHttpServer())
      .get('/customers/f8f9e68b-592d-45db-b27a-7208d13b2d18')
      .expect(200)
      .expect((res) => {
        expect(res.body.name).toBe('Test Customer');
      });
  });

  it('/customers (POST) - should create customer', () => {
    mockCustomerRepository.findOne.mockResolvedValueOnce(null); // email check
    mockCustomerRepository.findOne.mockResolvedValueOnce(null); // cnh check

    return request(app.getHttpServer())
      .post('/customers')
      .send({
        name: 'Test Customer',
        email: 'new@example.com',
        cnh: '12345678900',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.name).toBe('Test Customer');
      });
  });

  it('/customers (POST) - validation error', () => {
    return request(app.getHttpServer())
      .post('/customers')
      .send({
        name: 'Test',
      })
      .expect(400); // Bad Request (class-validator)
  });
});
