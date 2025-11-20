import { Controller, Get, Put, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ToolsService } from '../services/tools.service';
import { UpdateToolDto } from '../dto/update-tool.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { TOOL_PERMISSIONS } from '../../common/config/permissions.config';

@ApiTags('工具箱管理')
@Controller('api/v1/admin/tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Get()
  @RequirePermissions(TOOL_PERMISSIONS.VIEW)
  @ApiOperation({ summary: '获取工具列表' })
  @ApiResponse({ status: 200, description: '成功获取工具列表' })
  async findAll() {
    const tools = await this.toolsService.findAll();
    return {
      code: 'success',
      data: tools,
    };
  }

  @Get(':id')
  @RequirePermissions(TOOL_PERMISSIONS.VIEW)
  @ApiOperation({ summary: '获取工具详情' })
  @ApiResponse({ status: 200, description: '成功获取工具详情' })
  async findOne(@Param('id') id: number) {
    const tool = await this.toolsService.findOne(id);
    return {
      code: 'success',
      data: tool,
    };
  }

  @Put(':id')
  @RequirePermissions(TOOL_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: '更新工具配置' })
  @ApiResponse({ status: 200, description: '成功更新工具' })
  async update(@Param('id') id: number, @Body() updateToolDto: UpdateToolDto) {
    const tool = await this.toolsService.update(id, updateToolDto);
    return {
      code: 'success',
      data: tool,
      message: '更新成功',
    };
  }

  @Patch(':id/toggle')
  @RequirePermissions(TOOL_PERMISSIONS.MANAGE)
  @ApiOperation({ summary: '启用/禁用工具' })
  @ApiResponse({ status: 200, description: '成功切换工具状态' })
  async toggle(@Param('id') id: number) {
    const tool = await this.toolsService.toggle(id);
    return {
      code: 'success',
      data: tool,
      message: tool.isEnabled ? '已启用' : '已禁用',
    };
  }

  @Get(':id/stats')
  @RequirePermissions(TOOL_PERMISSIONS.VIEW)
  @ApiOperation({ summary: '获取工具使用统计' })
  @ApiResponse({ status: 200, description: '成功获取统计信息' })
  async getStats(@Param('id') id: number) {
    const stats = await this.toolsService.getStats(id);
    return {
      code: 'success',
      data: stats,
    };
  }
}
