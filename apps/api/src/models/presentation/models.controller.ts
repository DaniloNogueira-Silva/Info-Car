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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateModelDto, UpdateModelDto, ModelResponseDto } from '@app/shared';
import { ModelsService } from '../application/models.service';

@ApiTags('Models')

@Controller('models')
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os modelos' })
  @ApiResponse({ status: 200, description: 'Lista de modelos', type: [ModelResponseDto] })
  @ApiQuery({ name: 'brand_id', required: false, description: 'Filtrar por marca' })
  async findAll(@Query('brand_id') brandId?: string): Promise<ModelResponseDto[]> {
    if (brandId) {
      return this.modelsService.findByBrandId(brandId);
    }
    return this.modelsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar modelo por ID' })
  @ApiResponse({ status: 200, description: 'Modelo encontrado', type: ModelResponseDto })
  @ApiResponse({ status: 404, description: 'Modelo não encontrado' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<ModelResponseDto> {
    return this.modelsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo modelo' })
  @ApiResponse({ status: 201, description: 'Modelo criado', type: ModelResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Marca não encontrada' })
  async create(@Body() dto: CreateModelDto): Promise<ModelResponseDto> {
    return this.modelsService.create({ ...dto, created_by: 'system' });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar modelo' })
  @ApiResponse({ status: 200, description: 'Modelo atualizado', type: ModelResponseDto })
  @ApiResponse({ status: 404, description: 'Modelo ou marca não encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateModelDto,
  ): Promise<ModelResponseDto> {
    return this.modelsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover modelo' })
  @ApiResponse({ status: 204, description: 'Modelo removido' })
  @ApiResponse({ status: 404, description: 'Modelo não encontrado' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.modelsService.remove(id);
  }
}
