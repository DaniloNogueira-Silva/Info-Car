import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RentalsService } from './rentals.service';
import { RentalOrmEntity } from '../infrastructure/entities/rental.orm-entity';
import { VehicleOrmEntity } from '../../vehicles/infrastructure/entities/vehicle.orm-entity';
import { CustomerOrmEntity } from '../../customers/infrastructure/entities/customer.orm-entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

const mockRentalRepository = {
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

const mockVehicleRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
};

const mockCustomerRepository = {
  findOne: jest.fn(),
};

describe('RentalsService', () => {
  let service: RentalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RentalsService,
        {
          provide: getRepositoryToken(RentalOrmEntity),
          useValue: mockRentalRepository,
        },
        {
          provide: getRepositoryToken(VehicleOrmEntity),
          useValue: mockVehicleRepository,
        },
        {
          provide: getRepositoryToken(CustomerOrmEntity),
          useValue: mockCustomerRepository,
        },
      ],
    }).compile();

    service = module.get<RentalsService>(RentalsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create rental and update vehicle status', async () => {
      mockCustomerRepository.findOne.mockResolvedValue({ id: '1' });
      mockVehicleRepository.findOne.mockResolvedValue({ id: '1', status: 'AVAILABLE' });
      mockRentalRepository.create.mockReturnValue({ id: 'r1' });
      mockRentalRepository.save.mockResolvedValue({ id: 'r1' });
      mockRentalRepository.findOne.mockResolvedValue({ id: 'r1', status: 'ACTIVE' });

      const result = await service.create({
        customer_id: '1',
        vehicle_id: '1',
        start_date: '2026-01-01T00:00:00Z',
      });

      expect(mockVehicleRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'RENTED' }),
      );
      expect(result).toBeDefined();
    });

    it('should throw ConflictException if vehicle not available', async () => {
      mockCustomerRepository.findOne.mockResolvedValue({ id: '1' });
      mockVehicleRepository.findOne.mockResolvedValue({ id: '1', status: 'RENTED' });

      await expect(
        service.create({
          customer_id: '1',
          vehicle_id: '1',
          start_date: '2026-01-01T00:00:00Z',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should release vehicle if rental is finished', async () => {
      const rental = { id: 'r1', status: 'ACTIVE', vehicle: { id: 'v1', status: 'RENTED' } };
      mockRentalRepository.findOne.mockResolvedValueOnce(rental);
      mockRentalRepository.save.mockResolvedValue(true);
      mockRentalRepository.findOne.mockResolvedValueOnce({ ...rental, status: 'FINISHED' });

      await service.update('r1', { status: 'FINISHED' });

      expect(mockVehicleRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'AVAILABLE' }),
      );
    });
  });

  describe('remove', () => {
    it('should release vehicle if active rental is deleted', async () => {
      const rental = { id: 'r1', status: 'ACTIVE', vehicle: { id: 'v1', status: 'RENTED' } };
      mockRentalRepository.findOne.mockResolvedValue(rental);

      await service.remove('r1');

      expect(mockVehicleRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'AVAILABLE' }),
      );
      expect(mockRentalRepository.remove).toHaveBeenCalledWith(rental);
    });
  });
});
