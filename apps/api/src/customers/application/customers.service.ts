import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerOrmEntity } from '../infrastructure/entities/customer.orm-entity';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerResponseDto,
  PaginationQueryDto,
  PaginatedResultDto,
} from '@app/shared';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(CustomerOrmEntity)
    private readonly customerRepository: Repository<CustomerOrmEntity>,
  ) {}

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResultDto<CustomerResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [items, total] = await this.customerRepository.findAndCount({
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      data: items,
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Cliente com ID ${id} não encontrado`);
    }
    return customer;
  }

  async create(dto: CreateCustomerDto): Promise<CustomerResponseDto> {
    const existingEmail = await this.customerRepository.findOne({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email já está em uso');
    }

    const existingCnh = await this.customerRepository.findOne({
      where: { cnh: dto.cnh },
    });
    if (existingCnh) {
      throw new ConflictException('CNH já está em uso');
    }

    const customer = this.customerRepository.create(dto);
    return this.customerRepository.save(customer);
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<CustomerResponseDto> {
    const customer = await this.findById(id);

    if (dto.email && dto.email !== customer.email) {
      const existingEmail = await this.customerRepository.findOne({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email já está em uso');
      }
    }

    if (dto.cnh && dto.cnh !== customer.cnh) {
      const existingCnh = await this.customerRepository.findOne({
        where: { cnh: dto.cnh },
      });
      if (existingCnh) {
        throw new ConflictException('CNH já está em uso');
      }
    }

    Object.assign(customer, dto);
    return this.customerRepository.save(customer);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findById(id);
    await this.customerRepository.remove(customer);
  }
}
