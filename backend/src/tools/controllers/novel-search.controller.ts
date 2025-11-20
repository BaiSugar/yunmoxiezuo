import { Controller, Post, Get, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { NovelSearchDto } from '../dto/novel-search.dto';
import { GetBookDetailDto } from '../dto/get-book-detail.dto';
import { NovelSearchService } from '../services/novel-search.service';
import { ToolsService } from '../services/tools.service';
import { ToolUsageService } from '../services/tool-usage.service';
import { ToolAccessGuard } from '../guards/tool-access.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('短文搜索工具')
@Controller('api/v1/tools/novel-search')
export class NovelSearchController {
  constructor(
    private readonly novelSearchService: NovelSearchService,
    private readonly toolsService: ToolsService,
    private readonly usageService: ToolUsageService,
  ) {}

  @Get('check')
  @ApiOperation({ summary: '检查工具可用性' })
  @ApiResponse({ status: 200, description: '返回工具状态' })
  async checkAccess(@CurrentUser('id') userId: number) {
    try {
      
      const tool = await this.toolsService.findByName('novel-search');
      
      // 检查用户是否有访问权限
      let hasAccess = true;
      if (tool.requiresMembership) {
        const activeMembership = await this.toolsService.checkUserMembershipAccess(userId);
        
        if (!activeMembership) {
          hasAccess = false;
        } else {
          // 检查会员等级是否允许（如果配置了限制）
          if (tool.allowedMembershipLevels && tool.allowedMembershipLevels.length > 0) {
            // 从会员套餐获取类型标识（如 'basic', 'pro', 'premium'）
            const userMembershipType = activeMembership.plan?.type;
            
            if (!userMembershipType) {
              hasAccess = false;
            } else {
              // 过滤掉 null 值
              const validLevels = tool.allowedMembershipLevels.filter(level => level !== null);
              hasAccess = validLevels.includes(userMembershipType);
            }
          }
        }
      }

      return {
        code: 'success',
        data: {
          hasAccess,
          isEnabled: tool.isEnabled,
          requiresMembership: tool.requiresMembership,
          title: tool.title,
          description: tool.description,
        },
      };
    } catch (error) {
      return {
        code: 'error',
        message: error.message,
      };
    }
  }

  @Post('search')
  @UseGuards(ToolAccessGuard)
  @ApiOperation({ summary: '执行短文搜索' })
  @ApiResponse({ status: 200, description: '返回搜索结果' })
  async search(
    @Body() searchDto: NovelSearchDto,
    @CurrentUser('id') userId: number,
    @Req() req: Request & { tool: any; user: any },
  ) {
    const tool = req.tool;
    const user = req.user;

    // 执行搜索
    const result = await this.novelSearchService.search(searchDto, tool.config);

    // 记录使用日志
    await this.usageService.log({
      toolId: tool.id,
      userId: user.id,
      membershipLevel: user.currentMembershipLevel || 'none',
      searchType: searchDto.searchType,
      searchQuery: searchDto.query,
      resultCount: Array.isArray(result.data) ? result.data.length : 0,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // 增加使用次数
    await this.toolsService.incrementUsageCount(tool.id);

    return {
      code: 'success',
      data: result.data,
      message: result.message,
    };
  }

  @Get('history')
  @ApiOperation({ summary: '获取我的搜索历史' })
  @ApiResponse({ status: 200, description: '返回搜索历史' })
  async getHistory(@CurrentUser('id') userId: number) {
    const history = await this.usageService.getUserHistory(userId, 50);
    return {
      code: 'success',
      data: history,
    };
  }

  @Get('detail')
  @UseGuards(ToolAccessGuard)
  @ApiOperation({ summary: '获取书籍详情' })
  @ApiResponse({ status: 200, description: '返回书籍详情（解析后的HTML内容）' })
  async getDetail(
    @Query() detailDto: GetBookDetailDto,
    @CurrentUser('id') userId: number,
    @Req() req: Request & { tool: any },
  ) {
    const tool = req.tool;

    // 获取书籍详情
    const result = await this.novelSearchService.getBookDetail(detailDto, tool.config);

    // 记录使用日志
    await this.usageService.log({
      toolId: tool.id,
      userId,
      searchType: 'detail' as any,
      searchQuery: `bookId:${detailDto.bookId}`,
      resultCount: result.data ? 1 : 0,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // 直接返回Service的响应，包括code字段
    return result;
  }
}
