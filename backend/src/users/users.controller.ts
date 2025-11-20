import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { BanUserDto, AssignRolesDto } from './dto/ban-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LogAction } from '../common/decorators/log.decorator';
import { User } from './entities/user.entity';
import { USER_PERMISSIONS } from '../common/constants/permissions.constant';

@ApiTags('用户')
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions(USER_PERMISSIONS.CREATE)
  @LogAction('创建用户')
  @ApiOperation({ summary: '创建用户（管理员）' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @RequirePermissions(USER_PERMISSIONS.LIST)
  @ApiOperation({ summary: '获取用户列表（分页）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findAll(@Query() queryDto: QueryUserDto) {
    return this.usersService.findAll(queryDto);
  }

  @Get('me')
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({ status: 200, description: '查询成功' })
  getProfile(@CurrentUser() user: User) {
    return this.usersService.findOne(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: '更新个人资料' })
  @ApiResponse({ status: 200, description: '更新成功' })
  updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '修改密码' })
  @ApiResponse({ status: 200, description: '修改成功' })
  changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.id, changePasswordDto);
  }

  @Get(':id')
  @RequirePermissions(USER_PERMISSIONS.VIEW)
  @ApiOperation({ summary: '获取用户详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @RequirePermissions(USER_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: '更新用户信息（管理员）' })
  @ApiResponse({ status: 200, description: '更新成功' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @RequirePermissions(USER_PERMISSIONS.DELETE)
  @LogAction('删除用户')
  @ApiOperation({ summary: '删除用户（软删除）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Post(':id/ban')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(USER_PERMISSIONS.BAN)
  @LogAction('封禁用户')
  @ApiOperation({ summary: '封禁用户' })
  @ApiResponse({ status: 200, description: '封禁成功' })
  banUser(@Param('id') id: string, @Body() banUserDto: BanUserDto) {
    return this.usersService.banUser(+id, banUserDto.reason);
  }

  @Post(':id/unban')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(USER_PERMISSIONS.BAN)
  @LogAction('解封用户')
  @ApiOperation({ summary: '解封用户' })
  @ApiResponse({ status: 200, description: '解封成功' })
  unbanUser(@Param('id') id: string) {
    return this.usersService.unbanUser(+id);
  }

  @Post(':id/roles')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(USER_PERMISSIONS.ASSIGN_ROLES)
  @LogAction('分配用户角色')
  @ApiOperation({ summary: '为用户分配角色' })
  @ApiResponse({ status: 200, description: '分配成功' })
  assignRoles(
    @Param('id') id: string,
    @Body() assignRolesDto: AssignRolesDto,
  ) {
    return this.usersService.assignRoles(+id, assignRolesDto.roleIds);
  }

  @Get(':id/permissions')
  @RequirePermissions(USER_PERMISSIONS.VIEW)
  @ApiOperation({ summary: '获取用户权限列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  getUserPermissions(@Param('id') id: string) {
    return this.usersService.getUserPermissions(+id);
  }
}
