import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PERMISSION_PERMISSIONS } from '../common/constants/permissions.constant';

@ApiTags('权限')
@Controller('api/v1/permissions')
@ApiBearerAuth()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @RequirePermissions(PERMISSION_PERMISSIONS.CREATE)
  @ApiOperation({ summary: '创建权限' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @RequirePermissions(PERMISSION_PERMISSIONS.LIST)
  @ApiOperation({ summary: '获取权限列表（平铺）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get('tree')
  @RequirePermissions(PERMISSION_PERMISSIONS.LIST)
  @ApiOperation({ summary: '获取权限树' })
  @ApiResponse({ status: 200, description: '查询成功' })
  getTree() {
    return this.permissionsService.getTree();
  }

  @Get(':id')
  @RequirePermissions(PERMISSION_PERMISSIONS.LIST)
  @ApiOperation({ summary: '获取权限详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(+id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSION_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: '更新权限' })
  @ApiResponse({ status: 200, description: '更新成功' })
  update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(+id, updatePermissionDto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSION_PERMISSIONS.DELETE)
  @ApiOperation({ summary: '删除权限' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(+id);
  }

  @Post('sync')
  @RequirePermissions(PERMISSION_PERMISSIONS.CREATE)
  @ApiOperation({ summary: '手动同步权限（管理员）' })
  @ApiResponse({ status: 200, description: '同步成功' })
  syncPermissions() {
    return this.permissionsService.syncPermissions();
  }
}

