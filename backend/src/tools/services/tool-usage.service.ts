import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ToolUsageLog } from '../entities/tool-usage-log.entity';
import { SearchType } from '../enums/search-type.enum';

@Injectable()
export class ToolUsageService {
  constructor(
    @InjectRepository(ToolUsageLog)
    private readonly usageLogRepository: Repository<ToolUsageLog>,
  ) {}

  /**
   * 记录工具使用
   */
  async log(data: {
    toolId: number;
    userId: number;
    membershipLevel?: string;
    searchType?: SearchType;
    searchQuery?: string;
    resultCount?: number;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ToolUsageLog> {
    const log = this.usageLogRepository.create(data);
    return this.usageLogRepository.save(log);
  }

  /**
   * 获取用户的搜索历史
   */
  async getUserHistory(userId: number, limit = 50): Promise<ToolUsageLog[]> {
    return this.usageLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * 获取工具的使用统计
   */
  async getToolStats(toolId: number) {
    const totalCount = await this.usageLogRepository.count({ where: { toolId } });
    
    // 今日使用次数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await this.usageLogRepository.count({
      where: {
        toolId,
        createdAt: today as any, // TypeORM会自动处理
      },
    });

    return {
      totalCount,
      todayCount,
    };
  }
}
