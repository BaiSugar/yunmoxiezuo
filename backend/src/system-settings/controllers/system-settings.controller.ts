import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SystemSettingsService } from '../services/system-settings.service';
import { SystemSetting } from '../entities/system-setting.entity';
import { UpdateSettingDto, BatchUpdateDto } from '../dto/update-setting.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { SYSTEM_SETTINGS_PERMISSIONS } from '../../common/config/permissions.config';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('系统配置')
@Controller('api/v1/system-settings')
export class SystemSettingsController {
  constructor(
    private readonly systemSettingsService: SystemSettingsService,
  ) {}

  @Get()
  @RequirePermissions(SYSTEM_SETTINGS_PERMISSIONS.READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取所有系统配置（管理员）' })
  @ApiQuery({
    name: 'includeEncrypted',
    required: false,
    type: Boolean,
    description: '是否包含加密字段的明文值',
  })
  @ApiResponse({
    status: 200,
    description: '成功获取配置列表',
    type: [SystemSetting],
  })
  async findAll(
    @Query('includeEncrypted') includeEncrypted?: string,
  ): Promise<SystemSetting[]> {
    const include = includeEncrypted === 'true';
    return this.systemSettingsService.findAll(include);
  }

  @Get('public')
  @Public()
  @ApiOperation({ summary: '获取公开配置（前端可访问）' })
  @ApiResponse({
    status: 200,
    description: '成功获取公开配置',
    schema: {
      type: 'object',
      example: {
        email: {
          verification_enabled: true,
          verification_code_expire: 300,
        },
        system: {
          site_name: '写作平台',
          register_enabled: true,
        },
      },
    },
  })
  async findPublicSettings(): Promise<Record<string, any>> {
    return this.systemSettingsService.findPublicSettings();
  }

  @Get('category/:category')
  @RequirePermissions(SYSTEM_SETTINGS_PERMISSIONS.READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: '按分类获取配置' })
  @ApiParam({ name: 'category', description: '配置分类' })
  @ApiResponse({
    status: 200,
    description: '成功获取配置列表',
    type: [SystemSetting],
  })
  async findByCategory(
    @Param('category') category: string,
  ): Promise<SystemSetting[]> {
    return this.systemSettingsService.findByCategory(category);
  }

  @Get(':id')
  @RequirePermissions(SYSTEM_SETTINGS_PERMISSIONS.READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取单个配置详情' })
  @ApiParam({ name: 'id', description: '配置ID' })
  @ApiResponse({
    status: 200,
    description: '成功获取配置详情',
    type: SystemSetting,
  })
  @ApiResponse({ status: 404, description: '配置不存在' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<SystemSetting> {
    return this.systemSettingsService.findOne(id);
  }

  @Put('batch')
  @RequirePermissions(SYSTEM_SETTINGS_PERMISSIONS.UPDATE_BATCH)
  @ApiBearerAuth()
  @ApiOperation({ summary: '批量更新配置' })
  @ApiResponse({
    status: 200,
    description: '批量更新成功',
    type: [SystemSetting],
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async batchUpdate(@Body() batchDto: BatchUpdateDto): Promise<SystemSetting[]> {
    return this.systemSettingsService.batchUpdate(batchDto);
  }

  @Put(':id')
  @RequirePermissions(SYSTEM_SETTINGS_PERMISSIONS.UPDATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新单个配置' })
  @ApiParam({ name: 'id', description: '配置ID' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: SystemSetting,
  })
  @ApiResponse({ status: 404, description: '配置不存在' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateSettingDto,
  ): Promise<SystemSetting> {
    return this.systemSettingsService.update(id, updateDto);
  }
}
