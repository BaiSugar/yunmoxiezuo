import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tool } from '../entities/tool.entity';
import { UpdateToolDto } from '../dto/update-tool.dto';
import { UserMembershipsService } from '../../memberships/services/user-memberships.service';

@Injectable()
export class ToolsService {
  constructor(
    @InjectRepository(Tool)
    private readonly toolRepository: Repository<Tool>,
    @Inject(forwardRef(() => UserMembershipsService))
    private readonly membershipService: UserMembershipsService,
  ) {}

  /**
   * 获取所有工具列表
   */
  async findAll(): Promise<Tool[]> {
    return this.toolRepository.find({
      order: { orderNum: 'ASC', id: 'ASC' },
    });
  }

  /**
   * 获取启用的工具列表（用户端）
   * 注意：config字段包含敏感信息（API密钥、内部URL等），不返回给前端
   */
  async findEnabled(): Promise<Partial<Tool>[]> {
    const tools = await this.toolRepository.find({
      where: { isEnabled: true },
      order: { orderNum: 'ASC', id: 'ASC' },
    });
    
    // 配置脱敏：移除config字段
    return tools.map(tool => {
      const { config, ...safeToolData } = tool;
      return safeToolData;
    });
  }

  /**
   * 根据ID查找工具
   */
  async findOne(id: number): Promise<Tool> {
    const tool = await this.toolRepository.findOne({ where: { id } });
    if (!tool) {
      throw new NotFoundException('工具不存在');
    }
    return tool;
  }

  /**
   * 根据name查找工具
   */
  async findByName(name: string): Promise<Tool> {
    const tool = await this.toolRepository.findOne({ where: { name } });
    if (!tool) {
      throw new NotFoundException('工具不存在');
    }
    return tool;
  }

  /**
   * 更新工具配置
   */
  async update(id: number, updateToolDto: UpdateToolDto): Promise<Tool> {
    const tool = await this.findOne(id);
    Object.assign(tool, updateToolDto);
    return this.toolRepository.save(tool);
  }

  /**
   * 切换工具启用状态
   */
  async toggle(id: number): Promise<Tool> {
    const tool = await this.findOne(id);
    tool.isEnabled = !tool.isEnabled;
    return this.toolRepository.save(tool);
  }

  /**
   * 增加工具使用次数
   */
  async incrementUsageCount(id: number): Promise<void> {
    await this.toolRepository.increment({ id }, 'usageCount', 1);
  }

  /**
   * 获取工具统计信息
   */
  async getStats(id: number) {
    const tool = await this.findOne(id);
    
    // 这里可以添加更多统计查询
    return {
      totalUsage: tool.usageCount,
      // todayUsage: await this.getTodayUsage(id),
      // userCount: await this.getUserCount(id),
    };
  }

  /**
   * 检查用户是否有活跃会员
   */
  async checkUserMembershipAccess(userId: number) {
    return this.membershipService.findActiveByUser(userId);
  }
}
