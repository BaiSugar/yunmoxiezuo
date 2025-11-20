import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ToolsService } from '../services/tools.service';

@ApiTags('工具箱（用户端）')
@Controller('api/v1/tools')
export class UserToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Get()
  @ApiOperation({ summary: '获取启用的工具列表' })
  @ApiResponse({ status: 200, description: '成功获取工具列表' })
  async getEnabledTools() {
    const tools = await this.toolsService.findEnabled();
    return {
      code: 'success',
      data: tools,
    };
  }
}
