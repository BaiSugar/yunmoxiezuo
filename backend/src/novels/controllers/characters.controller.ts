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
import { CharactersService } from '../services/characters.service';
import { CreateCharacterDto } from '../dto/create-character.dto';
import { UpdateCharacterDto } from '../dto/update-character.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('人物卡管理')
@ApiBearerAuth()
@Controller('api/v1/characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Post()
  @ApiOperation({ summary: '创建人物卡' })
  @ApiQuery({ name: 'novelId', description: '作品ID' })
  create(
    @Query('novelId', ParseIntPipe) novelId: number,
    @CurrentUser('id') userId: number,
    @Body() createCharacterDto: CreateCharacterDto,
  ) {
    return this.charactersService.create(novelId, userId, createCharacterDto);
  }

  @Get()
  @ApiOperation({ summary: '获取作品的人物卡列表' })
  @ApiQuery({ name: 'novelId', description: '作品ID' })
  findAll(
    @Query('novelId', ParseIntPipe) novelId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.charactersService.findAllByNovel(novelId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取人物卡详情' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.charactersService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新人物卡' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() updateCharacterDto: UpdateCharacterDto,
  ) {
    return this.charactersService.update(id, userId, updateCharacterDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除人物卡' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.charactersService.remove(id, userId);
  }
}
