import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RentalOrmEntity } from '../infrastructure/entities/rental.orm-entity';
import { VehicleOrmEntity } from '../../vehicles/infrastructure/entities/vehicle.orm-entity';
import { CustomerOrmEntity } from '../../customers/infrastructure/entities/customer.orm-entity';
import {
  CreateRentalDto,
  UpdateRentalDto,
  RentalResponseDto,
  PaginationQueryDto,
  PaginatedResultDto,
} from '@app/shared';

@Injectable()
export class RentalsService {
  constructor(
    @InjectRepository(RentalOrmEntity)
    private readonly rentalRepository: Repository<RentalOrmEntity>,
    @InjectRepository(VehicleOrmEntity)
    private readonly vehicleRepository: Repository<VehicleOrmEntity>,
    @InjectRepository(CustomerOrmEntity)
    private readonly customerRepository: Repository<CustomerOrmEntity>,
  ) {}

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResultDto<RentalResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [items, total] = await this.rentalRepository.findAndCount({
      skip,
      take: limit,
      order: { created_at: 'DESC' },
      relations: { customer: true, vehicle: true },
    });

    return {
      data: items as unknown as RentalResponseDto[],
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<RentalResponseDto> {
    const rental = await this.rentalRepository.findOne({
      where: { id },
      relations: { customer: true, vehicle: true },
    });
    if (!rental) {
      throw new NotFoundException(`Locação com ID ${id} não encontrada`);
    }
    return rental as unknown as RentalResponseDto;
  }

  async create(dto: CreateRentalDto): Promise<RentalResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { id: dto.customer_id },
    });
    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const vehicle = await this.vehicleRepository.findOne({
      where: { id: dto.vehicle_id },
    });
    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado');
    }

    if (vehicle.status !== 'AVAILABLE') {
      throw new ConflictException('O veículo não está disponível para locação');
    }

    // Criar a locação
    const rental = this.rentalRepository.create({
      ...dto,
      start_date: new Date(dto.start_date),
      end_date: dto.end_date ? new Date(dto.end_date) : null,
      status: 'ACTIVE',
    });

    const savedRental = await this.rentalRepository.save(rental);

    // Mudar o estado do veículo
    vehicle.status = 'RENTED';
    await this.vehicleRepository.save(vehicle);

    return this.findById(savedRental.id);
  }

  async update(id: string, dto: UpdateRentalDto): Promise<RentalResponseDto> {
    const rental = await this.rentalRepository.findOne({
      where: { id },
      relations: { vehicle: true },
    });

    if (!rental) {
      throw new NotFoundException(`Locação com ID ${id} não encontrada`);
    }

    // Se o status da locação mudar para FINISHED ou CANCELLED, o veículo fica disponível (se antes estava RENTED)
    if (dto.status && dto.status !== rental.status) {
      if (dto.status === 'FINISHED' || dto.status === 'CANCELLED') {
        if (rental.vehicle.status === 'RENTED') {
          rental.vehicle.status = 'AVAILABLE';
          await this.vehicleRepository.save(rental.vehicle);
        }
      }
    }

    if (dto.start_date) rental.start_date = new Date(dto.start_date);
    if (dto.end_date) rental.end_date = new Date(dto.end_date);
    if (dto.status) rental.status = dto.status;

    await this.rentalRepository.save(rental);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    const rental = await this.rentalRepository.findOne({
      where: { id },
      relations: { vehicle: true },
    });
    
    if (!rental) {
      throw new NotFoundException(`Locação não encontrada`);
    }

    // Ao deletar uma locação ativa, liberar o veículo
    if (rental.status === 'ACTIVE' && rental.vehicle.status === 'RENTED') {
      rental.vehicle.status = 'AVAILABLE';
      await this.vehicleRepository.save(rental.vehicle);
    }

    await this.rentalRepository.remove(rental);
  }
}
