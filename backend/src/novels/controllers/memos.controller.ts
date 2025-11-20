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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MemosService } from '../services/memos.service';
import { CreateMemoDto } from '../dto/create-memo.dto';
import { UpdateMemoDto } from '../dto/update-memo.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('备忘录管理')
@ApiBearerAuth()
@Controller('api/v1/memos')
export class MemosController {
  constructor(private readonly memosService: MemosService) {}

  @Post()
  @ApiOperation({ summary: '创建备忘录' })
  @ApiQuery({ name: 'novelId', description: '作品ID' })
  create(
    @Query('novelId', ParseIntPipe) novelId: number,
    @CurrentUser('id') userId: number,
    @Body() createMemoDto: CreateMemoDto,
  ) {
    return this.memosService.create(novelId, userId, createMemoDto);
  }

  @Get()
  @ApiOperation({ summary: '获取作品的备忘录列表' })
  @ApiQuery({ name: 'novelId', description: '作品ID' })
  findAll(
    @Query('novelId', ParseIntPipe) novelId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.memosService.findAllByNovel(novelId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取备忘录详情' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.memosService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新备忘录' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() updateMemoDto: UpdateMemoDto,
  ) {
    return this.memosService.update(id, userId, updateMemoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除备忘录' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.memosService.remove(id, userId);
  }
}
