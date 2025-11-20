import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ROLE_PERMISSIONS } from '../common/constants/permissions.constant';

@ApiTags('角色')
@Controller('api/v1/roles')
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequirePermissions(ROLE_PERMISSIONS.CREATE)
  @ApiOperation({ summary: '创建角色' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @RequirePermissions(ROLE_PERMISSIONS.LIST)
  @ApiOperation({ summary: '获取角色列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermissions(ROLE_PERMISSIONS.LIST)
  @ApiOperation({ summary: '获取角色详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(+id);
  }

  @Patch(':id')
  @RequirePermissions(ROLE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: '更新角色' })
  @ApiResponse({ status: 200, description: '更新成功' })
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(+id, updateRoleDto);
  }

  @Delete(':id')
  @RequirePermissions(ROLE_PERMISSIONS.DELETE)
  @ApiOperation({ summary: '删除角色' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(+id);
  }

  @Put(':id/permissions')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(ROLE_PERMISSIONS.ASSIGN)
  @ApiOperation({ summary: '为角色分配权限' })
  @ApiResponse({ status: 200, description: '分配成功' })
  assignPermissions(
    @Param('id') id: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(
      +id,
      assignPermissionsDto.permissionIds,
    );
  }

  @Get(':id/permissions')
  @RequirePermissions(ROLE_PERMISSIONS.LIST)
  @ApiOperation({ summary: '获取角色的权限列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  getRolePermissions(@Param('id') id: string) {
    return this.rolesService.getRolePermissions(+id);
  }
}

