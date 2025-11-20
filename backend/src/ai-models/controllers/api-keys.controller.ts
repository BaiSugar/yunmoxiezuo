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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ApiKeysService } from '../services/api-keys.service';
import { KeyRotationService } from '../services/key-rotation.service';
import { CreateApiKeyDto, UpdateApiKeyDto, BulkCreateApiKeysDto } from '../dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AI_MODEL_PERMISSIONS } from '../../common/constants/permissions.constant';

/**
 * API Keys 管理控制器
 */
@ApiTags('AI Models - API Keys')
@Controller('api/v1/ai-keys')
export class ApiKeysController {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly keyRotationService: KeyRotationService,
  ) {}

  /**
   * 创建 API Key
   */
  @Post()
  @RequirePermissions(AI_MODEL_PERMISSIONS.PROVIDER_CREATE)
  @ApiOperation({ summary: '创建 API Key' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(@Body() dto: CreateApiKeyDto) {
    return await this.apiKeysService.create(dto);
  }

  /**
   * 批量创建 API Keys
   */
  @Post('bulk')
  @RequirePermissions(AI_MODEL_PERMISSIONS.PROVIDER_CREATE)
  @ApiOperation({ summary: '批量创建 API Keys' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async bulkCreate(@Body() dto: BulkCreateApiKeysDto) {
    return await this.apiKeysService.bulkCreate(dto.providerId, dto.keys);
  }

  /**
   * 查询所有 API Keys
   */
  @Get()
  @RequirePermissions(AI_MODEL_PERMISSIONS.PROVIDER_READ)
  @ApiOperation({ summary: '查询所有 API Keys' })
  @ApiQuery({
    name: 'providerId',
    required: false,
    description: '提供商ID（可选筛选）',
  })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(@Query('providerId', ParseIntPipe) providerId?: number) {
    return await this.apiKeysService.findAll(providerId);
  }

  /**
   * 根据ID查询 API Key
   */
  @Get(':id')
  @RequirePermissions(AI_MODEL_PERMISSIONS.PROVIDER_READ)
  @ApiOperation({ summary: '根据ID查询 API Key' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: 'API Key 不存在' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.apiKeysService.findOne(id);
  }

  /**
   * 根据提供商ID查询 API Keys
   */
  @Get('provider/:providerId')
  @RequirePermissions(AI_MODEL_PERMISSIONS.PROVIDER_READ)
  @ApiOperation({ summary: '根据提供商ID查询 API Keys' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findByProvider(@Param('providerId', ParseIntPipe) providerId: number) {
    return await this.apiKeysService.findByProvider(providerId);
  }

  /**
   * 更新 API Key
   */
  @Put(':id')
  @RequirePermissions(AI_MODEL_PERMISSIONS.PROVIDER_UPDATE)
  @ApiOperation({ summary: '更新 API Key' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: 'API Key 不存在' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateApiKeyDto,
  ) {
    return await this.apiKeysService.update(id, dto);
  }

  /**
   * 删除 API Key
   */
  @Delete(':id')
  @RequirePermissions(AI_MODEL_PERMISSIONS.PROVIDER_DELETE)
  @ApiOperation({ summary: '删除 API Key' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: 'API Key 不存在' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.apiKeysService.remove(id);
    return { message: '删除成功' };
  }

  /**
   * 启用/禁用 API Key
   */
  @Post(':id/toggle')
  @RequirePermissions(AI_MODEL_PERMISSIONS.PROVIDER_UPDATE)
  @ApiOperation({ summary: '启用/禁用 API Key' })
  @ApiResponse({ status: 200, description: '切换成功' })
  @ApiResponse({ status: 404, description: 'API Key 不存在' })
  async toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return await this.apiKeysService.toggleStatus(id);
  }

  /**
   * 获取 Keys 健康状态
   */
  @Get('health/status')
  @RequirePermissions(AI_MODEL_PERMISSIONS.PROVIDER_READ)
  @ApiOperation({ summary: '获取所有 Keys 健康状态' })
  @ApiQuery({
    name: 'providerId',
    required: false,
    description: '提供商ID（可选筛选）',
  })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getHealth(@Query('providerId', ParseIntPipe) providerId?: number) {
    return await this.keyRotationService.getKeysHealth(providerId);
  }

  /**
   * 手动恢复错误状态的 Key
   */
  @Post(':id/recover')
  @RequirePermissions(AI_MODEL_PERMISSIONS.PROVIDER_UPDATE)
  @ApiOperation({ summary: '手动恢复错误状态的 Key' })
  @ApiResponse({ status: 200, description: '恢复成功' })
  @ApiResponse({ status: 404, description: 'Key 不存在' })
  async recoverKey(@Param('id', ParseIntPipe) id: number) {
    await this.keyRotationService.recoverKey(id);
    return { message: '恢复成功' };
  }

  /**
   * 清理冷却期已过的 Keys
   */
  @Post('cleanup/cooldowns')
  @RequirePermissions(AI_MODEL_PERMISSIONS.PROVIDER_UPDATE)
  @ApiOperation({ summary: '清理冷却期已过的 Keys' })
  @ApiResponse({ status: 200, description: '清理成功' })
  async cleanupCooldowns() {
    await this.keyRotationService.cleanupCooldowns();
    return { message: '清理成功' };
  }

  /**
   * 重置使用统计
   */
  @Post('stats/reset')
  @RequirePermissions(AI_MODEL_PERMISSIONS.PROVIDER_UPDATE)
  @ApiOperation({ summary: '重置使用统计' })
  @ApiQuery({
    name: 'keyId',
    required: false,
    description: 'Key ID（可选，不提供则重置所有）',
  })
  @ApiResponse({ status: 200, description: '重置成功' })
  async resetStatistics(@Query('keyId', ParseIntPipe) keyId?: number) {
    await this.keyRotationService.resetStatistics(keyId);
    return { message: '重置成功' };
  }
}
