import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserModelPreferencesService } from './user-model-preferences.service';
import {
  CreateUserModelPreferenceDto,
  UpdateUserModelPreferenceDto,
} from './dto/user-model-preference.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('用户模型偏好设置')
@Controller('api/v1/user-model-preferences')
@ApiBearerAuth()
export class UserModelPreferencesController {
  constructor(
    private readonly preferencesService: UserModelPreferencesService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建或更新模型偏好设置' })
  async createOrUpdate(
    @CurrentUser('id') userId: number,
    @Body() createDto: CreateUserModelPreferenceDto,
  ) {
    return this.preferencesService.createOrUpdate(userId, createDto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有模型偏好设置' })
  async findAll(@CurrentUser('id') userId: number) {
    return this.preferencesService.findAll(userId);
  }

  @Get('model/:modelId')
  @ApiOperation({ summary: '获取指定模型的偏好设置（新用户自动创建默认配置）' })
  async findByModel(
    @CurrentUser('id') userId: number,
    @Param('modelId', ParseIntPipe) modelId: number,
  ) {
    // 新用户会自动创建默认配置（选择非免费且启用的模型）
    return this.preferencesService.findByModel(userId, modelId);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新模型偏好设置' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() updateDto: UpdateUserModelPreferenceDto,
  ) {
    return this.preferencesService.update(id, userId, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除模型偏好设置' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    await this.preferencesService.delete(id, userId);
    return { success: true };
  }
}
