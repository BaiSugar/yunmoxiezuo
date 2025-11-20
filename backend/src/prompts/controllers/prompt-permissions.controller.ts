import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PromptPermissionService } from '../services/prompt-permission.service';
import { GrantPermissionDto } from '../dto/grant-permission.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('提示词权限管理')
@ApiBearerAuth()
@Controller('api/v1/prompts/:promptId/permissions')
export class PromptPermissionsController {
  constructor(private readonly permissionService: PromptPermissionService) {}

  @Post()
  @ApiOperation({ summary: '授予权限（仅作者）' })
  @ApiResponse({ status: 201, description: '授权成功' })
  @ApiResponse({ status: 403, description: '只有作者可以授权' })
  @ApiResponse({ status: 404, description: '提示词不存在' })
  @ApiResponse({ status: 409, description: '该用户已有权限' })
  grantPermission(
    @Param('promptId', ParseIntPipe) promptId: number,
    @CurrentUser('id') grantorId: number,
    @Body() grantPermissionDto: GrantPermissionDto,
  ) {
    return this.permissionService.grantPermission(promptId, grantorId, grantPermissionDto);
  }

  @Get()
  @ApiOperation({ summary: '获取提示词的权限列表（仅作者）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll(@Param('promptId', ParseIntPipe) promptId: number) {
    return this.permissionService.findPermissionsByPrompt(promptId);
  }

  @Delete(':userId')
  @ApiOperation({ summary: '撤销权限（仅作者）' })
  @ApiResponse({ status: 200, description: '撤销成功' })
  @ApiResponse({ status: 403, description: '只有作者可以撤销权限' })
  @ApiResponse({ status: 404, description: '权限记录不存在' })
  revokePermission(
    @Param('promptId', ParseIntPipe) promptId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser('id') grantorId: number,
  ) {
    return this.permissionService.revokePermission(promptId, userId, grantorId);
  }
}
