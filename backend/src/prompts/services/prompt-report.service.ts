import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PromptReport, ReportStatus } from '../entities/prompt-report.entity';
import { Prompt, PromptStatus } from '../entities/prompt.entity';
import { CreateReportDto } from '../dto/create-report.dto';
import { ReviewReportDto } from '../dto/review-report.dto';
import { QueryReportsDto } from '../dto/query-reports.dto';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class PromptReportService {
  private readonly logger = new Logger(PromptReportService.name);

  constructor(
    @InjectRepository(PromptReport)
    private readonly reportRepository: Repository<PromptReport>,
    @InjectRepository(Prompt)
    private readonly promptRepository: Repository<Prompt>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * 创建举报
   */
  async create(promptId: number, userId: number, createReportDto: CreateReportDto): Promise<PromptReport> {
    console.log(`[PromptReportService] 创建举报: promptId=${promptId}, userId=${userId}`, createReportDto);
    
    // 检查提示词是否存在
    const prompt = await this.promptRepository.findOne({ where: { id: promptId } });
    if (!prompt) {
      console.warn(`[PromptReportService] 提示词不存在: promptId=${promptId}`);
      throw new NotFoundException('提示词不存在');
    }

    // 不能举报自己的提示词
    if (prompt.authorId === userId) {
      console.warn(`[PromptReportService] 不能举报自己的提示词: promptId=${promptId}, authorId=${prompt.authorId}, userId=${userId}`);
      throw new BadRequestException('不能举报自己的提示词');
    }

    // 检查是否已经举报过（同一个用户对同一个提示词只能有一个待处理的举报）
    const existingReport = await this.reportRepository.findOne({
      where: {
        promptId,
        reporterId: userId,
        status: ReportStatus.PENDING,
      },
    });

    if (existingReport) {
      console.warn(`[PromptReportService] 用户已举报过该提示词: promptId=${promptId}, userId=${userId}, reportId=${existingReport.id}`);
      throw new BadRequestException('您已经举报过该提示词，请等待审核');
    }

    // 创建举报
    const report = this.reportRepository.create({
      promptId,
      reporterId: userId,
      ...createReportDto,
    });

    const savedReport = await this.reportRepository.save(report);
    console.log(`[PromptReportService] 举报创建成功: reportId=${savedReport.id}`);
    return savedReport;
  }

  /**
   * 查询举报列表（管理员）
   */
  async findAll(queryReportsDto: QueryReportsDto): Promise<{
    data: PromptReport[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, pageSize = 20, status, promptId } = queryReportsDto;

    const skip = (page - 1) * pageSize;
    const queryBuilder = this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.prompt', 'prompt')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .leftJoinAndSelect('report.reviewer', 'reviewer')
      .select([
        'report',
        'prompt.id',
        'prompt.name',
        'prompt.authorId',
        'prompt.isBanned',
        'reporter.id',
        'reporter.username',
        'reporter.nickname',
        'reviewer.id',
        'reviewer.username',
        'reviewer.nickname',
      ]);

    if (status) {
      queryBuilder.andWhere('report.status = :status', { status });
    }

    if (promptId) {
      queryBuilder.andWhere('report.promptId = :promptId', { promptId });
    }

    queryBuilder.orderBy('report.createdAt', 'DESC');

    const [data, total] = await queryBuilder.skip(skip).take(pageSize).getManyAndCount();

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 查询用户的举报记录
   */
  async findMyReports(userId: number, page: number = 1, pageSize: number = 20): Promise<{
    data: PromptReport[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const skip = (page - 1) * pageSize;
    const queryBuilder = this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.prompt', 'prompt')
      .select([
        'report',
        'prompt.id',
        'prompt.name',
      ])
      .where('report.reporterId = :userId', { userId })
      .orderBy('report.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 审核举报（管理员）
   */
  async review(reportId: number, reviewerId: number, reviewReportDto: ReviewReportDto): Promise<PromptReport> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
      relations: ['prompt', 'reporter'],
    });

    if (!report) {
      throw new NotFoundException('举报记录不存在');
    }

    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException('该举报已经被处理');
    }

    // 更新举报状态
    report.status = reviewReportDto.status;
    report.reviewerId = reviewerId;
    report.reviewNote = reviewReportDto.reviewNote || null;
    report.reviewedAt = new Date();

    const savedReport = await this.reportRepository.save(report);

    // 🔔 发送WebSocket通知 + 处理提示词状态
    if (reviewReportDto.status === ReportStatus.APPROVED) {
      // 审核通过：自动下架提示词并标记需要审核
      await this.handleApprovedReport(report);
      
      // 通知举报者和提示词作者
      await this.notifyReporterApproved(report);
      await this.notifyAuthorReportApproved(report);
    } else if (reviewReportDto.status === ReportStatus.REJECTED) {
      // 审核拒绝：通知举报者
      await this.notifyReporterRejected(report);
    }

    return savedReport;
  }

  /**
   * 删除举报记录（管理员）
   */
  async remove(reportId: number): Promise<void> {
    const report = await this.reportRepository.findOne({ where: { id: reportId } });
    if (!report) {
      throw new NotFoundException('举报记录不存在');
    }

    await this.reportRepository.remove(report);
  }

  /**
   * 获取提示词的举报统计
   */
  async getReportStats(promptId: number): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    const [total, pending, approved, rejected] = await Promise.all([
      this.reportRepository.count({ where: { promptId } }),
      this.reportRepository.count({ where: { promptId, status: ReportStatus.PENDING } }),
      this.reportRepository.count({ where: { promptId, status: ReportStatus.APPROVED } }),
      this.reportRepository.count({ where: { promptId, status: ReportStatus.REJECTED } }),
    ]);

    return { total, pending, approved, rejected };
  }

  /**
   * 处理举报审核通过：自动下架提示词并标记需要审核
   */
  private async handleApprovedReport(report: PromptReport): Promise<void> {
    try {
      const prompt = await this.promptRepository.findOne({ 
        where: { id: report.promptId },
        relations: ['contents'],
      });
      if (!prompt) {
        this.logger.warn(`提示词不存在，无法下架: promptId=${report.promptId}`);
        return;
      }

      // 📸 保存违规内容快照（用于后续管理员审核对比）
      // 这样管理员可以看到作者修改前（违规版本）vs 修改后（提交审核版本）的对比
      prompt.reviewSnapshot = {
        name: prompt.name,
        description: prompt.description,
        contents: prompt.contents || [],
        snapshotAt: new Date(),
      };

      // 下架提示词：改为草稿状态，设置为不公开，标记需要审核
      prompt.status = PromptStatus.DRAFT;
      prompt.isPublic = false;
      prompt.needsReview = true;
      prompt.reviewSubmittedAt = null; // 作者还未提交审核

      await this.promptRepository.save(prompt);

      this.logger.log(`✅ 举报通过，提示词已下架并保存违规快照: promptId=${report.promptId}, reportId=${report.id}`);
      this.logger.log(`⏳ 等待作者修改并提交审核后，才会通知管理员`);
    } catch (error) {
      this.logger.error(`下架提示词失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 通知举报者：举报已通过审核
   */
  private async notifyReporterApproved(report: PromptReport): Promise<void> {
    try {
      await this.notificationsService.createAndPush({
        userId: report.reporterId,
        title: '举报已通过审核',
        content: `您举报的提示词「${report.prompt.name}」已通过审核，感谢您的反馈`,
        category: 'report-approved',
        level: 'success',
        action: {
          text: '查看详情',
          url: `/dashboard/reports/${report.id}`,
        },
        extra: {
          reportId: report.id,
          promptId: report.promptId,
          promptName: report.prompt.name,
          reviewNote: report.reviewNote,
        },
      });

      this.logger.log(`✅ 通知举报者 ${report.reporterId}: 举报 ${report.id} 已通过`);
    } catch (error) {
      this.logger.error(`发送举报通过通知失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 通知举报者：举报已被拒绝
   */
  private async notifyReporterRejected(report: PromptReport): Promise<void> {
    try {
      await this.notificationsService.createAndPush({
        userId: report.reporterId,
        title: '举报未通过审核',
        content: `您举报的提示词「${report.prompt.name}」未通过审核`,
        category: 'report-rejected',
        level: 'info',
        action: undefined,
        extra: {
          reportId: report.id,
          promptId: report.promptId,
          promptName: report.prompt.name,
          reviewNote: report.reviewNote || '管理员未提供拒绝原因',
        },
      });

      this.logger.log(`✅ 通知举报者 ${report.reporterId}: 举报 ${report.id} 已拒绝`);
    } catch (error) {
      this.logger.error(`发送举报拒绝通知失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 通知提示词作者：您的提示词因举报被审核通过
   */
  private async notifyAuthorReportApproved(report: PromptReport): Promise<void> {
    try {
      await this.notificationsService.createAndPush({
        userId: report.prompt.authorId,
        title: '您的提示词因违规已下架',
        content: `您的提示词「${report.prompt.name}」因被举报并审核通过已自动下架。如需重新发布，请修改后提交管理员审核。`,
        category: 'prompt-reported',
        level: 'warning',
        extra: {
          reportId: report.id,
          promptId: report.promptId,
          promptName: report.prompt.name,
          reason: report.reason,
          reviewNote: report.reviewNote,
        },
      });

      this.logger.log(`✅ 通知作者 ${report.prompt.authorId}: 提示词 ${report.promptId} 被举报并审核通过`);
    } catch (error) {
      this.logger.error(`发送作者被举报通知失败: ${error.message}`, error.stack);
    }
  }
}

