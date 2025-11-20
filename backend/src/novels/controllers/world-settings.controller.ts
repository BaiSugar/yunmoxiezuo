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
import { WorldSettingsService } from '../services/world-settings.service';
import { CreateWorldSettingDto } from '../dto/create-world-setting.dto';
import { UpdateWorldSettingDto } from '../dto/update-world-setting.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('世界观管理')
@ApiBearerAuth()
@Controller('api/v1/world-settings')
export class WorldSettingsController {
  constructor(private readonly worldSettingsService: WorldSettingsService) {}

  @Post()
  @ApiOperation({ summary: '创建世界观设定' })
  @ApiQuery({ name: 'novelId', description: '作品ID' })
  create(
    @Query('novelId', ParseIntPipe) novelId: number,
    @CurrentUser('id') userId: number,
    @Body() createWorldSettingDto: CreateWorldSettingDto,
  ) {
    return this.worldSettingsService.create(novelId, userId, createWorldSettingDto);
  }

  @Get()
  @ApiOperation({ summary: '获取作品的世界观设定列表' })
  @ApiQuery({ name: 'novelId', description: '作品ID' })
  findAll(
    @Query('novelId', ParseIntPipe) novelId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.worldSettingsService.findAllByNovel(novelId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取世界观设定详情' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.worldSettingsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新世界观设定' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() updateWorldSettingDto: UpdateWorldSettingDto,
  ) {
    return this.worldSettingsService.update(id, userId, updateWorldSettingDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除世界观设定' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.worldSettingsService.remove(id, userId);
  }
}
