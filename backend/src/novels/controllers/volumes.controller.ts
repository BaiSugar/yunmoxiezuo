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
import { VolumesService } from '../services/volumes.service';
import { CreateVolumeDto } from '../dto/create-volume.dto';
import { UpdateVolumeDto } from '../dto/update-volume.dto';
import { BatchUpdateVolumesDto } from '../dto/batch-update-volumes.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('分卷管理')
@ApiBearerAuth()
@Controller('api/v1/volumes')
export class VolumesController {
  constructor(private readonly volumesService: VolumesService) {}

  @Post()
  @ApiOperation({ summary: '创建分卷' })
  @ApiQuery({ name: 'novelId', description: '作品ID' })
  create(
    @Query('novelId', ParseIntPipe) novelId: number,
    @CurrentUser('id') userId: number,
    @Body() createVolumeDto: CreateVolumeDto,
  ) {
    return this.volumesService.create(novelId, userId, createVolumeDto);
  }

  @Get()
  @ApiOperation({ summary: '获取作品的分卷列表' })
  @ApiQuery({ name: 'novelId', description: '作品ID' })
  findAll(
    @Query('novelId', ParseIntPipe) novelId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.volumesService.findAllByNovel(novelId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取分卷详情' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.volumesService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新分卷' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() updateVolumeDto: UpdateVolumeDto,
  ) {
    return this.volumesService.update(id, userId, updateVolumeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除分卷' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.volumesService.remove(id, userId);
  }

  @Post('batch-update')
  @ApiOperation({ summary: '批量更新分卷顺序' })
  batchUpdate(
    @Body() batchUpdateVolumesDto: BatchUpdateVolumesDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.volumesService.batchUpdate(batchUpdateVolumesDto.volumes, userId);
  }
}
