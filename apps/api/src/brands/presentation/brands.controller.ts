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
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateBrandDto, UpdateBrandDto, BrandResponseDto, PaginationQueryDto, PaginatedResultDto } from '@app/shared';
import { BrandsService } from '../application/brands.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Brands')

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as marcas (Paginado)' })
  @ApiResponse({ status: 200, description: 'Lista de marcas', type: PaginatedResultDto<BrandResponseDto> })
  async findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResultDto<BrandResponseDto>> {
    return this.brandsService.findAll(query) as unknown as PaginatedResultDto<BrandResponseDto>;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar marca por ID' })
  @ApiResponse({ status: 200, description: 'Marca encontrada', type: BrandResponseDto })
  @ApiResponse({ status: 404, description: 'Marca não encontrada' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<BrandResponseDto> {
    return this.brandsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar nova marca' })
  @ApiResponse({ status: 201, description: 'Marca criada', type: BrandResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(
    @Body() dto: CreateBrandDto,
    @CurrentUser() user: any,
  ): Promise<BrandResponseDto> {
    return this.brandsService.create({ ...dto, created_by: user.id });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar marca' })
  @ApiResponse({ status: 200, description: 'Marca atualizada', type: BrandResponseDto })
  @ApiResponse({ status: 404, description: 'Marca não encontrada' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBrandDto,
  ): Promise<BrandResponseDto> {
    return this.brandsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover marca' })
  @ApiResponse({ status: 204, description: 'Marca removida' })
  @ApiResponse({ status: 404, description: 'Marca não encontrada' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.brandsService.remove(id);
  }
}
