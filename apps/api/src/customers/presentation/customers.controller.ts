import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerResponseDto,
  PaginationQueryDto,
  PaginatedResultDto,
} from '@app/shared';
import { CustomersService } from '../application/customers.service';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os clientes (Paginado)' })
  @ApiResponse({ status: 200, description: 'Lista de clientes', type: PaginatedResultDto<CustomerResponseDto> })
  async findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResultDto<CustomerResponseDto>> {
    return this.customersService.findAll(query) as unknown as PaginatedResultDto<CustomerResponseDto>;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado', type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<CustomerResponseDto> {
    return this.customersService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente criado', type: CustomerResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Email ou CNH já em uso' })
  async create(@Body() dto: CreateCustomerDto): Promise<CustomerResponseDto> {
    return this.customersService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar cliente' })
  @ApiResponse({ status: 200, description: 'Cliente atualizado', type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  @ApiResponse({ status: 409, description: 'Email ou CNH já em uso' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover cliente' })
  @ApiResponse({ status: 204, description: 'Cliente removido' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.customersService.remove(id);
  }
}
