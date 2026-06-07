import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { WorkerModule } from './../src/worker.module';
import { getModelToken } from '@nestjs/mongoose';
import { AuditLog } from '../src/schemas/audit-log.schema';

describe('WorkerApp (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mockMongooseModel = {
      create: jest.fn(),
      find: jest.fn(),
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
      imports: [WorkerModule],
    })
      .overrideProvider(getModelToken(AuditLog.name)).useValue(mockMongooseModel)
      .overrideProvider('REDIS_CLIENT').useValue(mockRedis)
      .overrideProvider('AMQP_CONNECTION').useValue(mockAmqp)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('deve inicializar a aplicação worker', () => {
    expect(app).toBeDefined();
  });
});

