import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AI_MODEL_PERMISSIONS } from '../../common/constants/permissions.constant';
import { AiModelsService } from '../services/ai-models.service';
import { CreateModelDto, UpdateModelDto, TestModelConnectionDto } from '../dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

/**
 * AI 模型管理控制器
 */
@ApiTags('AI 模型')
@ApiBearerAuth()
@Controller('api/v1/ai-models')
export class AiModelsController {
  constructor(private readonly modelsService: AiModelsService) {}

  @Post()
  @RequirePermissions(AI_MODEL_PERMISSIONS.MODEL_CREATE)
  @ApiOperation({ summary: '创建 AI 模型' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '模型标识符已存在' })
  async create(
    @Body() createDto: CreateModelDto,
    @CurrentUser('id') userId: number,
  ) {
    return await this.modelsService.create(createDto, userId);
  }

  @Get()
  @RequirePermissions(AI_MODEL_PERMISSIONS.MODEL_READ)
  @ApiOperation({ summary: '获取所有 AI 模型' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(@CurrentUser('id') userId: number) {
    return await this.modelsService.findAll(userId);
  }

  @Get('active')
  @RequirePermissions(AI_MODEL_PERMISSIONS.MODEL_READ)
  @ApiOperation({ summary: '获取活跃的 AI 模型' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findActive(@CurrentUser('id') userId: number) {
    return await this.modelsService.findActive(userId);
  }

  @Post('test-connection')
  @RequirePermissions(AI_MODEL_PERMISSIONS.MODEL_UPDATE)
  @ApiOperation({ summary: '测试模型连接（使用当前配置）' })
  @ApiResponse({ status: 200, description: '测试结果' })
  async testConnection(
    @Body() testDto: TestModelConnectionDto,
    @CurrentUser('id') userId: number,
  ) {
    await this.modelsService.testConnection(testDto, userId);
    return { success: true, message: '连接成功' };
  }

  @Get('active/basic')
  @RequirePermissions(AI_MODEL_PERMISSIONS.MODEL_READ)
  @ApiOperation({ summary: '获取活跃模型的基本信息（不包含敏感信息）' })
  @ApiResponse({ 
    status: 200, 
    description: '获取成功，仅返回模型选择器需要的基本字段',
    type: 'ModelBasicDto',
    isArray: true,
  })
  async findActiveBasic(@CurrentUser('id') userId: number) {
    return await this.modelsService.findActiveBasic(userId);
  }

  @Get('default')
  @RequirePermissions(AI_MODEL_PERMISSIONS.MODEL_READ)
  @ApiOperation({ summary: '获取默认 AI 模型' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '未找到默认模型' })
  async findDefault(@CurrentUser('id') userId: number) {
    return await this.modelsService.findDefault(userId);
  }

  @Get('provider/:providerId')
  @RequirePermissions(AI_MODEL_PERMISSIONS.MODEL_READ)
  @ApiOperation({ summary: '根据提供商ID获取模型列表' })
  @ApiParam({ name: 'providerId', description: '提供商ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findByProvider(
    @Param('providerId', ParseIntPipe) providerId: number,
    @CurrentUser('id') userId: number,
  ) {
    return await this.modelsService.findByProvider(providerId, userId);
  }

  @Get('category/:categoryId')
  @RequirePermissions(AI_MODEL_PERMISSIONS.MODEL_READ)
  @ApiOperation({ summary: '根据分类ID获取模型列表' })
  @ApiParam({ name: 'categoryId', description: '分类ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findByCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @CurrentUser('id') userId: number,
  ) {
    return await this.modelsService.findByCategory(categoryId, userId);
  }

  @Get('features')
  @RequirePermissions(AI_MODEL_PERMISSIONS.MODEL_READ)
  @ApiOperation({ summary: '根据特性查询模型' })
  @ApiQuery({
    name: 'features',
    description: '特性列表（逗号分隔）',
    example: 'chat,vision',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findByFeatures(
    @Query('features') featuresStr: string,
    @CurrentUser('id') userId: number,
  ) {
    const features = featuresStr.split(',').map((f) => f.trim());
    return await this.modelsService.findByFeatures(features, userId);
  }

  @Get(':id')
  @RequirePermissions(AI_MODEL_PERMISSIONS.MODEL_READ)
  @ApiOperation({ summary: '根据ID获取 AI 模型' })
  @ApiParam({ name: 'id', description: '模型ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '模型不存在' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return await this.modelsService.findOne(id, userId);
  }

  @Put(':id')
  @RequirePermissions(AI_MODEL_PERMISSIONS.MODEL_UPDATE)
  @ApiOperation({ summary: '更新 AI 模型' })
  @ApiParam({ name: 'id', description: '模型ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '模型不存在' })
  @ApiResponse({ status: 409, description: '模型标识符已存在' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateModelDto,
    @CurrentUser('id') userId: number,
  ) {
    return await this.modelsService.update(id, updateDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(AI_MODEL_PERMISSIONS.MODEL_DELETE)
  @ApiOperation({ summary: '删除 AI 模型' })
  @ApiParam({ name: 'id', description: '模型ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '模型不存在' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    await this.modelsService.remove(id, userId);
  }

  @Post('provider/:providerId/bulk-import')
  @RequirePermissions(AI_MODEL_PERMISSIONS.MODEL_CREATE)
  @ApiOperation({ summary: '批量导入模型' })
  @ApiParam({ name: 'providerId', description: '提供商ID' })
  @ApiResponse({ status: 201, description: '导入成功' })
  @ApiResponse({ status: 404, description: '提供商不存在' })
  async bulkImport(
    @Param('providerId', ParseIntPipe) providerId: number,
    @Body() models: Partial<CreateModelDto>[],
    @CurrentUser('id') userId: number,
  ) {
    return await this.modelsService.bulkImport(providerId, models, userId);
  }

  @Get('stats/count')
  @RequirePermissions(AI_MODEL_PERMISSIONS.MODEL_READ)
  @ApiOperation({ summary: '统计模型数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async count(@CurrentUser('id') userId: number) {
    const count = await this.modelsService.count(userId);
    return { count };
  }
}
