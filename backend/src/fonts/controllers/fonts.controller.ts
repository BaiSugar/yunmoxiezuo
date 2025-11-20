import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { FontsService } from '../services/fonts.service';
import { UploadFontDto, UpdateFontDto } from '../dto/upload-font.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/config/permissions.config';
import { OptionalAuth } from '../../common/decorators/optional-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { Font } from '../entities/font.entity';
import type { Request } from 'express';

/**
 * 字体管理控制器
 */
@ApiTags('字体管理')
@Controller('api/v1/fonts')
export class FontsController {
  constructor(private readonly fontsService: FontsService) {}

  @Get('enabled')
  @UseGuards(JwtAuthGuard)
  @OptionalAuth()
  @ApiOperation({ summary: '获取所有启用的字体（公开接口，已登录用户会包含自己的字体）' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '成功获取字体列表（系统字体 + 用户自己的字体）',
    type: [Font],
  })
  async getEnabledFonts(@CurrentUser() user: User | null) {
    // 获取当前用户ID（如果已登录）
    const userId = user?.id;
    
    // 调试日志：记录当前用户信息
    if (userId) {
      console.log(`[字体API] 当前用户ID: ${userId}, 用户名: ${user?.username}`);
    } else {
      console.log('[字体API] 未登录用户');
    }
    
    const fonts = await this.fontsService.findAllEnabled(userId);
    
    // 调试日志：检查返回的字体
    const userFonts = fonts.filter(f => f.userId !== null);
    if (userFonts.length > 0 && userId) {
      const wrongFonts = userFonts.filter(f => f.userId !== userId);
      if (wrongFonts.length > 0) {
        console.error(`[字体API] ⚠️ 警告：返回了不属于当前用户(${userId})的字体:`, 
          wrongFonts.map(f => ({ id: f.id, name: f.name, userId: f.userId }))
        );
      }
    }
    
    return fonts.map(font => ({
      ...font,
      url: this.fontsService.getFontUrl(font),
    }));
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @RequirePermissions(PERMISSIONS.FONT.VIEW)
  @ApiOperation({ summary: '获取所有字体（管理员）' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '成功获取字体列表',
    type: [Font],
  })
  async getAllFonts(@Req() req: Request) {
    const fonts = await this.fontsService.findAll();
    
    return fonts.map(font => ({
      ...font,
      url: this.fontsService.getFontUrl(font),
    }));
  }

  @Post('upload')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @RequirePermissions(PERMISSIONS.FONT.UPLOAD)
  @ApiOperation({ summary: '上传字体文件（管理员）' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'name', 'displayName', 'category'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        name: { type: 'string' },
        displayName: { type: 'string' },
        category: { type: 'string', enum: ['推荐', '中文', '英文', '特殊'] },
        description: { type: 'string' },
        sortOrder: { type: 'number' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFont(
    @UploadedFile() file: any,
    @Body() dto: UploadFontDto,
  ): Promise<Font> {
    if (!file) {
      const { BadRequestException } = await import('@nestjs/common');
      throw new BadRequestException('请上传字体文件');
    }
    if (!dto.category) {
      const { BadRequestException } = await import('@nestjs/common');
      throw new BadRequestException('管理员上传字体时必须指定分类');
    }
    return await this.fontsService.uploadFont(file, dto); // 管理员上传，无userId
  }

  @Post('user/upload')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '用户上传字体文件（最多5个，每个最大10MB）' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'name', 'displayName'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '字体文件（woff2/woff/ttf/otf，最大10MB）',
        },
        name: { 
          type: 'string', 
          description: '字体名称（用于CSS font-family）',
          example: 'MyCustomFont'
        },
        displayName: { 
          type: 'string',
          description: '显示名称',
          example: '我的自定义字体'
        },
        description: { 
          type: 'string',
          description: '字体描述（可选）' 
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async userUploadFont(
    @UploadedFile() file: any,
    @Body() dto: UploadFontDto,
    @Req() req: Request,
  ): Promise<Font> {
    if (!file) {
      const { BadRequestException } = await import('@nestjs/common');
      throw new BadRequestException('请上传字体文件');
    }
    const userId = (req as any).user.id;
    return await this.fontsService.uploadFont(file, dto, userId);
  }

  @Get('user/my-fonts')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取用户自己上传的字体列表' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '成功获取用户字体列表',
    type: [Font],
  })
  async getMyFonts(@Req() req: Request) {
    const userId = (req as any).user.id;
    const fonts = await this.fontsService.findByUser(userId);
    
    return fonts.map(font => ({
      ...font,
      url: this.fontsService.getFontUrl(font),
    }));
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @RequirePermissions(PERMISSIONS.FONT.UPDATE)
  @ApiOperation({ summary: '更新字体信息（管理员）' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '成功更新字体',
    type: Font,
  })
  async updateFont(
    @Param('id') id: number,
    @Body() dto: UpdateFontDto,
  ): Promise<Font> {
    return await this.fontsService.update(id, dto);
  }

  @Post(':id/set-default')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @RequirePermissions(PERMISSIONS.FONT.UPDATE)
  @ApiOperation({ summary: '设置为默认字体（管理员）' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '成功设置默认字体',
    type: Font,
  })
  async setDefault(@Param('id') id: number): Promise<Font> {
    return await this.fontsService.setDefault(id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @RequirePermissions(PERMISSIONS.FONT.DELETE)
  @ApiOperation({ summary: '删除字体（管理员）' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '成功删除字体',
  })
  async deleteFont(@Param('id') id: number): Promise<{ message: string }> {
    await this.fontsService.remove(id);
    return { message: '字体已删除' };
  }

  @Delete('user/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '删除自己上传的字体' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '成功删除字体',
  })
  async deleteMyFont(
    @Param('id') id: number,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const userId = (req as any).user.id;
    await this.fontsService.remove(id, userId);
    return { message: '字体已删除' };
  }
}

