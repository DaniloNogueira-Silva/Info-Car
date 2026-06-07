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
  CreateRentalDto,
  UpdateRentalDto,
  RentalResponseDto,
  PaginationQueryDto,
  PaginatedResultDto,
} from '@app/shared';
import { RentalsService } from '../application/rentals.service';

@ApiTags('Rentals')
@ApiBearerAuth()
@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as locações (Paginado)' })
  @ApiResponse({ status: 200, description: 'Lista de locações', type: PaginatedResultDto<RentalResponseDto> })
  async findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResultDto<RentalResponseDto>> {
    return this.rentalsService.findAll(query) as unknown as PaginatedResultDto<RentalResponseDto>;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar locação por ID' })
  @ApiResponse({ status: 200, description: 'Locação encontrada', type: RentalResponseDto })
  @ApiResponse({ status: 404, description: 'Locação não encontrada' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<RentalResponseDto> {
    return this.rentalsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar nova locação' })
  @ApiResponse({ status: 201, description: 'Locação criada', type: RentalResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Cliente ou Veículo não encontrados' })
  @ApiResponse({ status: 409, description: 'Veículo não está disponível' })
  async create(@Body() dto: CreateRentalDto): Promise<RentalResponseDto> {
    return this.rentalsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar locação' })
  @ApiResponse({ status: 200, description: 'Locação atualizada', type: RentalResponseDto })
  @ApiResponse({ status: 404, description: 'Locação não encontrada' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRentalDto,
  ): Promise<RentalResponseDto> {
    return this.rentalsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover locação' })
  @ApiResponse({ status: 204, description: 'Locação removida' })
  @ApiResponse({ status: 404, description: 'Locação não encontrada' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.rentalsService.remove(id);
  }
}
