import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ToolsService } from '../services/tools.service';
import { UserMembershipsService } from '../../memberships/services/user-memberships.service';

@Injectable()
export class ToolAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly toolsService: ToolsService,
    private readonly membershipService: UserMembershipsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('请先登录');
    }

    // 从路由路径中提取工具名称
    // 例如: /api/v1/tools/novel-search/search -> novel-search
    const urlPath = request.url.split('?')[0];
    const pathMatch = urlPath.match(/\/tools\/([^\/]+)/);
    const toolName = pathMatch ? pathMatch[1] : null;
    
    if (!toolName) {
      throw new BadRequestException('无法从路由中获取工具名称');
    }

    // 获取工具配置
    const tool = await this.toolsService.findByName(toolName);

    // 检查工具是否启用
    if (!tool.isEnabled) {
      throw new ForbiddenException('该工具暂时不可用');
    }

    // 检查是否需要会员
    if (tool.requiresMembership) {
      const activeMembership = await this.membershipService.findActiveByUser(user.id);
      
      if (!activeMembership) {
        throw new ForbiddenException('此功能需要开通会员');
      }

      // 检查会员等级是否允许（如果配置了限制）
      if (tool.allowedMembershipLevels && tool.allowedMembershipLevels.length > 0) {
        // 从会员套餐获取类型标识（如 'basic', 'pro', 'premium'）
        const userMembershipType = activeMembership.plan?.type;
        
        if (!userMembershipType) {
          throw new ForbiddenException('无法获取会员类型信息');
        }
        
        // 过滤掉 null 值
        const validLevels = tool.allowedMembershipLevels.filter(level => level !== null);
        const hasAccess = validLevels.includes(userMembershipType);

        if (!hasAccess) {
          throw new ForbiddenException('您的会员等级不足以使用此功能');
        }
      }
    }

    // 将工具信息附加到请求对象，供后续使用
    request.tool = tool;

    return true;
  }
}
