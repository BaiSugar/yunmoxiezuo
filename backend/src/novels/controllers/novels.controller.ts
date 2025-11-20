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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NovelsService } from '../services/novels.service';
import { VolumesService } from '../services/volumes.service';
import { ChaptersService } from '../services/chapters.service';
import { CreateNovelDto } from '../dto/create-novel.dto';
import { UpdateNovelDto } from '../dto/update-novel.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('作品管理')
@Controller('api/v1/novels')
export class NovelsController {
  constructor(
    private readonly novelsService: NovelsService,
    private readonly volumesService: VolumesService,
    private readonly chaptersService: ChaptersService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建作品' })
  create(
    @CurrentUser('id') userId: number,
    @Body() createNovelDto: CreateNovelDto,
  ) {
    return this.novelsService.create(userId, createNovelDto);
  }

  @Get()
  @ApiOperation({ summary: '获取我的作品列表（支持分页）' })
  findAll(
    @CurrentUser('id') userId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.novelsService.findAllByUser(userId, paginationDto);
  }

  @Get('stats/dashboard')
  @ApiOperation({ summary: '获取Dashboard统计数据' })
  @ApiBearerAuth()
  getDashboardStats(@CurrentUser('id') userId: number) {
    return this.novelsService.getDashboardStats(userId);
  }

  // 注意：特定路由必须在动态路由 :id 之前，否则会被 :id 拦截
  @Get(':id/volumes')
  @ApiOperation({ summary: '获取作品的分卷列表' })
  getVolumes(
    @Param('id', ParseIntPipe) novelId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.volumesService.findAllByNovel(novelId, userId);
  }

  @Get(':id/chapters')
  @ApiOperation({ summary: '获取作品的所有章节（包括独立章节）' })
  getChapters(
    @Param('id', ParseIntPipe) novelId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.chaptersService.findAllByNovel(novelId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取作品详情' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.novelsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新作品信息' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() updateNovelDto: UpdateNovelDto,
  ) {
    return this.novelsService.update(id, userId, updateNovelDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除作品' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.novelsService.remove(id, userId);
  }
}
