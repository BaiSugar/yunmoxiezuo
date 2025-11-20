import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { EditorSettingsService } from '../services/editor-settings.service';
import { CreateEditorSettingDto } from '../dto/create-editor-setting.dto';
import { UpdateEditorSettingDto } from '../dto/update-editor-setting.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { EditorSetting } from '../entities/editor-setting.entity';

/**
 * 编辑器设置控制器
 */
@ApiTags('编辑器设置')
@ApiBearerAuth()
@Controller('api/v1/editor-settings')
@UseGuards(JwtAuthGuard)
export class EditorSettingsController {
  constructor(private readonly editorSettingsService: EditorSettingsService) {}

  @Get()
  @ApiOperation({ summary: '获取当前用户的编辑器设置' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '成功获取编辑器设置',
    type: EditorSetting,
  })
  async getUserSettings(@CurrentUser() user: User): Promise<EditorSetting> {
    return await this.editorSettingsService.getUserSettings(user.id);
  }

  @Post()
  @ApiOperation({ summary: '创建或保存编辑器设置' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '成功保存编辑器设置',
    type: EditorSetting,
  })
  async saveSettings(
    @CurrentUser() user: User,
    @Body() dto: CreateEditorSettingDto,
  ): Promise<EditorSetting> {
    return await this.editorSettingsService.saveUserSettings(user.id, dto);
  }

  @Put()
  @ApiOperation({ summary: '更新编辑器设置' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '成功更新编辑器设置',
    type: EditorSetting,
  })
  async updateSettings(
    @CurrentUser() user: User,
    @Body() dto: UpdateEditorSettingDto,
  ): Promise<EditorSetting> {
    return await this.editorSettingsService.updateUserSettings(user.id, dto);
  }

  @Post('reset')
  @ApiOperation({ summary: '重置为默认设置' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '成功重置为默认设置',
    type: EditorSetting,
  })
  async resetToDefault(@CurrentUser() user: User): Promise<EditorSetting> {
    return await this.editorSettingsService.resetToDefault(user.id);
  }

  @Delete()
  @ApiOperation({ summary: '删除编辑器设置' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '成功删除编辑器设置',
  })
  async deleteSettings(@CurrentUser() user: User): Promise<{ message: string }> {
    await this.editorSettingsService.deleteUserSettings(user.id);
    return { message: '编辑器设置已删除' };
  }

  @Post('upload-background')
  @ApiOperation({ summary: '上传编辑器背景图（最大5MB）' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '背景图片文件（jpg/png/webp，最大5MB）',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '成功上传背景图',
    schema: {
      type: 'object',
      properties: {
        backgroundImage: { type: 'string', description: '背景图路径' },
        url: { type: 'string', description: '完整URL' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadBackground(
    @CurrentUser() user: User,
    @UploadedFile() file: any,
  ): Promise<{ backgroundImage: string; url: string }> {
    const backgroundImage = await this.editorSettingsService.uploadBackgroundImage(
      user.id,
      file,
    );
    return {
      backgroundImage,
      url: `/uploads/${backgroundImage}`,
    };
  }

  @Delete('background')
  @ApiOperation({ summary: '删除编辑器背景图' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '成功删除背景图',
  })
  async deleteBackground(@CurrentUser() user: User): Promise<{ message: string }> {
    await this.editorSettingsService.deleteBackgroundImage(user.id);
    return { message: '背景图已删除' };
  }
}

