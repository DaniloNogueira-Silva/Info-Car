import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BrandOrmEntity } from '../src/brands/infrastructure/entities/brand.orm-entity';
import { ModelOrmEntity } from '../src/models/infrastructure/entities/model.orm-entity';
import { VehicleOrmEntity } from '../src/vehicles/infrastructure/entities/vehicle.orm-entity';
import { UserOrmEntity } from '../src/users/infrastructure/entities/user.orm-entity';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mockRepo = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const mockAmqp = {
      publish: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(BrandOrmEntity)).useValue(mockRepo)
      .overrideProvider(getRepositoryToken(ModelOrmEntity)).useValue(mockRepo)
      .overrideProvider(getRepositoryToken(VehicleOrmEntity)).useValue(mockRepo)
      .overrideProvider(getRepositoryToken(UserOrmEntity)).useValue(mockRepo)
      .overrideProvider('REDIS_CLIENT').useValue(mockRedis)
      .overrideProvider('AMQP_CONNECTION').useValue(mockAmqp)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('deve retornar 401 Unauthorized ao acessar rota protegida sem token', () => {
    return request(app.getHttpServer())
      .get('/brands')
      .expect(401);
  });
});
