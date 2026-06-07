import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomersService } from './customers.service';
import { CustomerOrmEntity } from '../infrastructure/entities/customer.orm-entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

const mockCustomerRepository = {
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

describe('CustomersService', () => {
  let service: CustomersService;
  let repository: Repository<CustomerOrmEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: getRepositoryToken(CustomerOrmEntity),
          useValue: mockCustomerRepository,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    repository = module.get<Repository<CustomerOrmEntity>>(
      getRepositoryToken(CustomerOrmEntity),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      const customers = [{ id: '1', name: 'Test' }];
      mockCustomerRepository.findAndCount.mockResolvedValue([customers, 1]);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data).toEqual(customers);
      expect(result.total).toBe(1);
      expect(mockCustomerRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { created_at: 'DESC' },
      });
    });
  });

  describe('findById', () => {
    it('should return customer if found', async () => {
      const customer = { id: '1', name: 'Test' };
      mockCustomerRepository.findOne.mockResolvedValue(customer);

      const result = await service.findById('1');
      expect(result).toEqual(customer);
    });

    it('should throw NotFoundException if not found', async () => {
      mockCustomerRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a customer successfully', async () => {
      mockCustomerRepository.findOne.mockResolvedValue(null);
      mockCustomerRepository.create.mockReturnValue({ name: 'Test' });
      mockCustomerRepository.save.mockResolvedValue({ id: '1', name: 'Test' });

      const result = await service.create({
        name: 'Test',
        email: 'test@test.com',
        cnh: '12345678900',
      });

      expect(result).toEqual({ id: '1', name: 'Test' });
      expect(mockCustomerRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      mockCustomerRepository.findOne.mockResolvedValueOnce({ id: '2' });

      await expect(
        service.create({
          name: 'Test',
          email: 'test@test.com',
          cnh: '12345678900',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update customer successfully', async () => {
      const existingCustomer = { id: '1', email: 'old@test.com', cnh: 'old' };
      mockCustomerRepository.findOne.mockResolvedValueOnce(existingCustomer);
      mockCustomerRepository.findOne.mockResolvedValueOnce(null); // email check
      mockCustomerRepository.findOne.mockResolvedValueOnce(null); // cnh check
      mockCustomerRepository.save.mockResolvedValue({ ...existingCustomer, name: 'New' });

      const result = await service.update('1', { name: 'New' });
      expect(mockCustomerRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove customer successfully', async () => {
      const customer = { id: '1' };
      jest.spyOn(service, 'findById').mockResolvedValue(customer as any);
      mockCustomerRepository.remove.mockResolvedValue(customer);

      await service.remove('1');
      expect(mockCustomerRepository.remove).toHaveBeenCalledWith(customer);
    });
  });
});
