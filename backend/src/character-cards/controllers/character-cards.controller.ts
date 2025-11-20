import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { CharacterCardsService } from '../services/character-cards.service';
import { CharacterCardImportService } from '../services/character-card-import.service';
import { CharacterCardExportService } from '../services/character-card-export.service';
import {
  CreateCharacterCardDto,
  UpdateCharacterCardDto,
  QueryCharacterCardDto,
  ImportCharacterCardDto,
  ExportCharacterCardDto,
} from '../dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OptionalAuth } from '../../common/decorators/optional-auth.decorator';

/**
 * 角色卡控制器
 */
@ApiTags('角色卡管理')
@Controller('api/v1/character-cards')
export class CharacterCardsController {
  constructor(
    private readonly characterCardsService: CharacterCardsService,
    private readonly importService: CharacterCardImportService,
    private readonly exportService: CharacterCardExportService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建角色卡' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async create(
    @Body() createDto: CreateCharacterCardDto,
    @CurrentUser('id') userId: number,
  ) {
    return await this.characterCardsService.create(createDto, userId);
  }

  @Get()
  @OptionalAuth()
  @ApiOperation({ summary: '查询角色卡列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(
    @Query() queryDto: QueryCharacterCardDto,
    @CurrentUser('id') userId?: number,
  ) {
    return await this.characterCardsService.findAll(queryDto, userId);
  }

  @Get(':id')
  @OptionalAuth()
  @ApiOperation({ summary: '获取角色卡详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '角色卡不存在' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId?: number,
  ) {
    return await this.characterCardsService.findOne(id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新角色卡' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权操作' })
  @ApiResponse({ status: 404, description: '角色卡不存在' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCharacterCardDto,
    @CurrentUser('id') userId: number,
  ) {
    return await this.characterCardsService.update(id, updateDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除角色卡' })
  @ApiBearerAuth()
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权操作' })
  @ApiResponse({ status: 404, description: '角色卡不存在' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    await this.characterCardsService.remove(id, userId);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: '发布角色卡' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '发布成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权操作' })
  @ApiResponse({ status: 404, description: '角色卡不存在' })
  async publish(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return await this.characterCardsService.publish(id, userId);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: '归档角色卡' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '归档成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权操作' })
  @ApiResponse({ status: 404, description: '角色卡不存在' })
  async archive(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return await this.characterCardsService.archive(id, userId);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '点赞角色卡' })
  @ApiBearerAuth()
  @ApiResponse({ status: 204, description: '点赞成功' })
  @ApiResponse({ status: 400, description: '已经点赞过了' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '角色卡不存在' })
  async like(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    await this.characterCardsService.like(id, userId);
  }

  @Delete(':id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '取消点赞' })
  @ApiBearerAuth()
  @ApiResponse({ status: 204, description: '取消成功' })
  @ApiResponse({ status: 400, description: '尚未点赞' })
  @ApiResponse({ status: 401, description: '未授权' })
  async unlike(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    await this.characterCardsService.unlike(id, userId);
  }

  @Post(':id/favorite')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '收藏角色卡' })
  @ApiBearerAuth()
  @ApiResponse({ status: 204, description: '收藏成功' })
  @ApiResponse({ status: 400, description: '已经收藏过了' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '角色卡不存在' })
  async favorite(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    await this.characterCardsService.favorite(id, userId);
  }

  @Delete(':id/favorite')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '取消收藏' })
  @ApiBearerAuth()
  @ApiResponse({ status: 204, description: '取消成功' })
  @ApiResponse({ status: 400, description: '尚未收藏' })
  @ApiResponse({ status: 401, description: '未授权' })
  async unfavorite(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    await this.characterCardsService.unfavorite(id, userId);
  }

  @Post('import')
  @ApiOperation({ summary: '导入角色卡' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: '导入成功' })
  @ApiResponse({ status: 400, description: '导入失败' })
  @ApiResponse({ status: 401, description: '未授权' })
  async import(
    @Body() importDto: ImportCharacterCardDto,
    @CurrentUser('id') userId: number,
  ) {
    return await this.importService.import(importDto, userId);
  }

  @Get(':id/export')
  @OptionalAuth()
  @ApiOperation({ summary: '导出角色卡' })
  @ApiResponse({ status: 200, description: '导出成功' })
  @ApiResponse({ status: 404, description: '角色卡不存在' })
  async export(
    @Param('id', ParseIntPipe) id: number,
    @Query() exportDto: ExportCharacterCardDto,
    @CurrentUser('id') userId: number,
    @Res() res: Response,
  ) {
    const result = await this.exportService.export(id, exportDto, userId);

    // 增加下载计数
    await this.characterCardsService.incrementDownloadCount(id);

    // 设置响应头
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

    if (result.mimeType === 'image/png') {
      // PNG 格式，返回 Base64 数据
      const buffer = Buffer.from(result.data.replace(/^data:image\/png;base64,/, ''), 'base64');
      res.send(buffer);
    } else {
      // JSON 格式
      res.send(result.data);
    }
  }

  @Post(':id/use')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '记录角色卡使用' })
  @ApiBearerAuth()
  @ApiResponse({ status: 204, description: '记录成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async use(
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.characterCardsService.incrementUseCount(id);
  }
}
