import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TokenPackagesService } from '../services/token-packages.service';
import { CreateTokenPackageDto } from '../dto/create-token-package.dto';
import { UpdateTokenPackageDto } from '../dto/update-token-package.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('字数包管理')
@Controller('/api/v1/token-packages')
export class TokenPackagesController {
  constructor(private readonly packagesService: TokenPackagesService) {}

  @Post()
  @ApiOperation({ summary: '创建字数包' })
  @ApiBearerAuth()
  @RequirePermissions('token:package:create')
  create(@Body() createDto: CreateTokenPackageDto) {
    return this.packagesService.create(createDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: '查询字数包列表' })
  findAll(@Query('isActive') isActive?: boolean) {
    return this.packagesService.findAll(isActive);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '获取字数包详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.packagesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新字数包' })
  @ApiBearerAuth()
  @RequirePermissions('token:package:update')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateTokenPackageDto) {
    return this.packagesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除字数包' })
  @ApiBearerAuth()
  @RequirePermissions('token:package:delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.packagesService.remove(id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: '上架字数包' })
  @ApiBearerAuth()
  @RequirePermissions('token:package:update')
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.packagesService.activate(id);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: '下架字数包' })
  @ApiBearerAuth()
  @RequirePermissions('token:package:update')
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.packagesService.deactivate(id);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: '切换字数包状态' })
  @ApiBearerAuth()
  @RequirePermissions('token:package:update')
  async toggleStatus(@Param('id', ParseIntPipe) id: number) {
    const tokenPackage = await this.packagesService.findOne(id);
    if (tokenPackage.isActive) {
      return this.packagesService.deactivate(id);
    } else {
      return this.packagesService.activate(id);
    }
  }
}
