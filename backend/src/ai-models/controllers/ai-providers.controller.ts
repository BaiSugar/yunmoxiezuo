import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
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
} from '@nestjs/swagger';
import { AI_MODEL_PERMISSIONS } from '../../common/constants/permissions.constant';
import { AiProvidersService } from '../services/ai-providers.service';
import { CreateProviderDto, UpdateProviderDto } from '../dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

/**
 * AI 提供商管理控制器
 */
@ApiTags('AI 提供商')
@ApiBearerAuth()
@Controller('api/v1/ai-providers')
export class AiProvidersController {
  constructor(private readonly providersService: AiProvidersService) {}

  @Post()
  @RequirePermissions(AI_MODEL_PERMISSIONS.PROVIDER_CREATE)
  @ApiOperation({ summary: '创建 AI 提供商' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '提供商名称已存在' })
  async create(
    @Body() createDto: CreateProviderDto,
    @CurrentUser('id') userId: number,
  ) {
    return await this.providersService.create(createDto, userId);
  }

  @Get()
  @RequirePermissions(AI_MODEL_PERMISSIONS.PROVIDER_READ)
  @ApiOperation({ summary: '获取所有 AI 提供商' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(@CurrentUser('id') userId: number) {
    return await this.providersService.findAll(userId);
  }

  @Get('active')
  @RequirePermissions(AI_MODEL_PERMISSIONS.PROVIDER_READ)
  @ApiOperation({ summary: '获取活跃的 AI 提供商' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findActive(@CurrentUser('id') userId: number) {
    return await this.providersService.findActive(userId);
  }

  @Get('default')
  @RequirePermissions(AI_MODEL_PERMISSIONS.PROVIDER_READ)
  @ApiOperation({ summary: '获取默认 AI 提供商' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '未找到默认提供商' })
  async findDefault(@CurrentUser('id') userId: number) {
    return await this.providersService.findDefault(userId);
  }

  @Get(':id')
  @RequirePermissions(AI_MODEL_PERMISSIONS.PROVIDER_READ)
  @ApiOperation({ summary: '根据ID获取 AI 提供商' })
  @ApiParam({ name: 'id', description: '提供商ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '提供商不存在' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return await this.providersService.findOne(id, userId);
  }

  @Put(':id')
  @RequirePermissions(AI_MODEL_PERMISSIONS.PROVIDER_UPDATE)
  @ApiOperation({ summary: '更新 AI 提供商' })
  @ApiParam({ name: 'id', description: '提供商ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '提供商不存在' })
  @ApiResponse({ status: 409, description: '提供商名称已存在' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateProviderDto,
    @CurrentUser('id') userId: number,
  ) {
    return await this.providersService.update(id, updateDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(AI_MODEL_PERMISSIONS.PROVIDER_DELETE)
  @ApiOperation({ summary: '删除 AI 提供商' })
  @ApiParam({ name: 'id', description: '提供商ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '提供商不存在' })
  @ApiResponse({
    status: 400,
    description: '该提供商下还有模型，无法删除',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    await this.providersService.remove(id, userId);
  }

  @Post(':id/test')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AI_MODEL_PERMISSIONS.PROVIDER_TEST)
  @ApiOperation({ summary: '测试 AI 提供商连接' })
  @ApiParam({ name: 'id', description: '提供商ID' })
  @ApiResponse({ status: 200, description: '测试成功' })
  @ApiResponse({ status: 404, description: '提供商不存在' })
  async testConnection(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    const isConnected = await this.providersService.testConnection(id, userId);
    return {
      success: isConnected,
      message: isConnected ? '连接成功' : '连接失败',
    };
  }

  @Get(':id/available-models')
  @RequirePermissions(AI_MODEL_PERMISSIONS.PROVIDER_READ)
  @ApiOperation({ summary: '获取提供商的可用模型列表' })
  @ApiParam({ name: 'id', description: '提供商ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '提供商不存在' })
  async getAvailableModels(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return await this.providersService.getAvailableModels(id, userId);
  }

  @Get('stats/count')
  @RequirePermissions('ai:provider:read')
  @ApiOperation({ summary: '统计提供商数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async count(@CurrentUser('id') userId: number) {
    const count = await this.providersService.count(userId);
    return { count };
  }
}
