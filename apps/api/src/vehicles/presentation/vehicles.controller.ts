import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleResponseDto,
} from '@app/shared';
import { VehiclesService } from '../application/vehicles.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Vehicles')

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os veículos' })
  @ApiResponse({ status: 200, description: 'Lista de veículos', type: [VehicleResponseDto] })
  async findAll(): Promise<VehicleResponseDto[]> {
    return this.vehiclesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar veículo por ID' })
  @ApiResponse({ status: 200, description: 'Veículo encontrado', type: VehicleResponseDto })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<VehicleResponseDto> {
    return this.vehiclesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo veículo' })
  @ApiResponse({ status: 201, description: 'Veículo criado', type: VehicleResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Modelo não encontrado' })
  @ApiResponse({ status: 409, description: 'Placa, chassi ou RENAVAM já cadastrado' })
  async create(
    @Body() dto: CreateVehicleDto,
    @CurrentUser() user: any,
  ): Promise<VehicleResponseDto> {
    return this.vehiclesService.create({ ...dto, created_by: user.id });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar veículo' })
  @ApiResponse({ status: 200, description: 'Veículo atualizado', type: VehicleResponseDto })
  @ApiResponse({ status: 404, description: 'Veículo ou modelo não encontrado' })
  @ApiResponse({ status: 409, description: 'Placa, chassi ou RENAVAM já cadastrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
  ): Promise<VehicleResponseDto> {
    return this.vehiclesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover veículo' })
  @ApiResponse({ status: 204, description: 'Veículo removido' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.vehiclesService.remove(id);
  }
}
