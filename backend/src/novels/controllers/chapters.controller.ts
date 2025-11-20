import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ChaptersService } from '../services/chapters.service';
import { CreateChapterDto } from '../dto/create-chapter.dto';
import { UpdateChapterDto } from '../dto/update-chapter.dto';
import { BatchUpdateChaptersDto } from '../dto/batch-update-chapters.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('章节管理')
@ApiBearerAuth()
@Controller('api/v1/chapters')
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Post()
  @ApiOperation({ summary: '创建章节' })
  create(
    @CurrentUser('id') userId: number,
    @Body() createChapterDto: CreateChapterDto,
  ) {
    return this.chaptersService.create(userId, createChapterDto);
  }

  @Get()
  @ApiOperation({ summary: '获取分卷的章节列表' })
  @ApiQuery({ name: 'volumeId', description: '分卷ID' })
  findAll(
    @Query('volumeId', ParseIntPipe) volumeId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.chaptersService.findAllByVolume(volumeId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取章节详情' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.chaptersService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新章节' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() updateChapterDto: UpdateChapterDto,
  ) {
    return this.chaptersService.update(id, userId, updateChapterDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除章节' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.chaptersService.remove(id, userId);
  }

  // === 历史版本相关API ===

  @Get(':id/versions')
  @ApiOperation({ summary: '获取章节的所有历史版本' })
  @ApiParam({ name: 'id', description: '章节ID' })
  getVersions(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.chaptersService.getVersions(id, userId);
  }

  @Get(':id/versions/:versionNumber')
  @ApiOperation({ summary: '获取章节的特定历史版本' })
  @ApiParam({ name: 'id', description: '章节ID' })
  @ApiParam({ name: 'versionNumber', description: '版本号' })
  getVersion(
    @Param('id', ParseIntPipe) id: number,
    @Param('versionNumber', ParseIntPipe) versionNumber: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.chaptersService.getVersion(id, versionNumber, userId);
  }

  @Post(':id/versions/:versionNumber/restore')
  @ApiOperation({ summary: '恢复到指定历史版本' })
  @ApiParam({ name: 'id', description: '章节ID' })
  @ApiParam({ name: 'versionNumber', description: '版本号' })
  restoreVersion(
    @Param('id', ParseIntPipe) id: number,
    @Param('versionNumber', ParseIntPipe) versionNumber: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.chaptersService.restoreVersion(id, versionNumber, userId);
  }

  @Post('batch-update')
  @ApiOperation({ summary: '批量更新章节顺序' })
  batchUpdate(
    @Body() batchUpdateChaptersDto: BatchUpdateChaptersDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.chaptersService.batchUpdate(batchUpdateChaptersDto.chapters, userId);
  }
}
