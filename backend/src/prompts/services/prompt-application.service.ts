import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromptApplication, ApplicationStatus } from '../entities/prompt-application.entity';
import { Prompt } from '../entities/prompt.entity';
import { PermissionType } from '../entities/prompt-permission.entity';
import { ApplyPromptDto } from '../dto/apply-prompt.dto';
import { ReviewApplicationDto } from '../dto/review-application.dto';
import { PromptPermissionService } from './prompt-permission.service';
import { WebSocketGateway } from '../../websocket/websocket.gateway';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class PromptApplicationService implements OnModuleInit {
  private readonly logger = new Logger(PromptApplicationService.name);

  constructor(
    @InjectRepository(PromptApplication)
    private readonly applicationRepository: Repository<PromptApplication>,
    @InjectRepository(Prompt)
    private readonly promptRepository: Repository<Prompt>,
    private readonly permissionService: PromptPermissionService,
    private readonly wsGateway: WebSocketGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * 模块初始化时，将自己注入到WebSocketGateway
   */
  onModuleInit() {
    this.wsGateway.setPromptApplicationService(this);
    this.logger.log('✅ PromptApplicationService已注入到WebSocketGateway');
  }

  async applyForPrompt(promptId: number, userId: number, applyPromptDto: ApplyPromptDto): Promise<PromptApplication> {
    const prompt = await this.promptRepository.findOne({
      where: { id: promptId },
    });

    if (!prompt) {
      throw new NotFoundException('提示词不存在');
    }

    // 检查是否需要申请（基于 requireApplication 字段）
    if (!prompt.requireApplication) {
      throw new BadRequestException('该提示词无需申请即可使用');
    }

    // 作者不能申请自己的提示词
    if (prompt.authorId === userId) {
      throw new BadRequestException('不能申请自己的提示词');
    }

    const existingApplication = await this.applicationRepository.findOne({
      where: {
        promptId,
        userId,
        status: ApplicationStatus.PENDING,
      },
    });

    if (existingApplication) {
      throw new BadRequestException('已有待审核的申请');
    }

    const application = this.applicationRepository.create({
      promptId,
      userId,
      reason: applyPromptDto.reason,
      status: ApplicationStatus.PENDING,
    });

    const savedApplication = await this.applicationRepository.save(application);

    // 🔔 通知提示词作者：有新的申请
    await this.notifyAuthorNewApplication(prompt, savedApplication);

    return savedApplication;
  }

  async reviewApplication(
    applicationId: number,
    reviewerId: number,
    reviewApplicationDto: ReviewApplicationDto,
  ): Promise<PromptApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['prompt'],
    });

    if (!application) {
      throw new NotFoundException('申请不存在');
    }

    if (application.prompt.authorId !== reviewerId) {
      throw new ForbiddenException('只有作者可以审核申请');
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException('该申请已被审核');
    }

    // 更新申请状态
    application.status = reviewApplicationDto.status;
    application.reviewedBy = reviewerId;
    application.reviewedAt = new Date();
    application.reviewNote = reviewApplicationDto.reviewNote;

    const savedApplication = await this.applicationRepository.save(application);

    // 如果审核通过，自动授予使用权限
    if (reviewApplicationDto.status === ApplicationStatus.APPROVED) {
      try {
        await this.permissionService.grantPermission(
          application.promptId,
          reviewerId,
          {
            userId: application.userId,
            permission: PermissionType.USE,
          },
        );
      } catch (error) {
        // 忽略"用户已有权限"的错误
        // 其他错误继续抛出
        if (error.message !== '该用户已有权限') {
          throw error;
        }
      }

      // 🔔 通知申请者：申请已通过
      await this.notifyApplicantApproved(application.prompt, savedApplication);
    } else if (reviewApplicationDto.status === ApplicationStatus.REJECTED) {
      // 🔔 通知申请者：申请已拒绝
      await this.notifyApplicantRejected(application.prompt, savedApplication);
    }

    return savedApplication;
  }

  async findApplicationsByPrompt(promptId: number, authorId: number): Promise<PromptApplication[]> {
    const prompt = await this.promptRepository.findOne({
      where: { id: promptId },
    });

    if (!prompt) {
      throw new NotFoundException('提示词不存在');
    }

    if (prompt.authorId !== authorId) {
      throw new ForbiddenException('只有作者可以查看申请列表');
    }

    return await this.applicationRepository.find({
      where: { promptId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findApplicationsByUser(userId: number): Promise<PromptApplication[]> {
    return await this.applicationRepository.find({
      where: { userId },
      relations: ['prompt', 'reviewer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPendingApplications(authorId: number): Promise<PromptApplication[]> {
    return await this.applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.prompt', 'prompt')
      .leftJoinAndSelect('application.user', 'user')
      .where('prompt.authorId = :authorId', { authorId })
      .andWhere('application.status = :status', { status: ApplicationStatus.PENDING })
      .orderBy('application.createdAt', 'DESC')
      .getMany();
  }

  /**
   * 通知提示词作者：有新的申请
   */
  private async notifyAuthorNewApplication(
    prompt: Prompt,
    application: PromptApplication,
  ): Promise<void> {
    try {
      await this.notificationsService.createAndPush({
        userId: prompt.authorId,
        title: '收到新的提示词申请',
        content: `有用户申请使用您的提示词「${prompt.name}」`,
        category: 'prompt-application',
        level: 'info',
        action: {
          text: '查看申请',
          url: `/dashboard/prompts/${prompt.id}/permissions`,
        },
        extra: {
          applicationId: application.id,
          promptId: prompt.id,
          promptName: prompt.name,
          applicantId: application.userId,
        },
      });

      this.logger.log(`✅ 通知作者 ${prompt.authorId}: 新申请 ${application.id}`);
    } catch (error) {
      this.logger.error(`发送新申请通知失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 通知申请者：申请已通过
   */
  private async notifyApplicantApproved(
    prompt: Prompt,
    application: PromptApplication,
  ): Promise<void> {
    try {
      await this.notificationsService.createAndPush({
        userId: application.userId,
        title: '提示词申请已通过',
        content: `您申请的提示词「${prompt.name}」已通过审核，现在可以使用了！`,
        category: 'prompt-approval',
        level: 'success',
        action: {
          text: '立即使用',
          url: `/dashboard/prompts/${prompt.id}`,
        },
        extra: {
          reviewNote: application.reviewNote,
          promptId: prompt.id,
          promptName: prompt.name,
          applicationId: application.id,
        },
      });

      this.logger.log(`✅ 通知申请者 ${application.userId}: 申请 ${application.id} 已通过`);
    } catch (error) {
      this.logger.error(`发送审核通过通知失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 通知申请者：申请已拒绝
   */
  private async notifyApplicantRejected(
    prompt: Prompt,
    application: PromptApplication,
  ): Promise<void> {
    try {
      await this.notificationsService.createAndPush({
        userId: application.userId,
        title: '提示词申请已拒绝',
        content: `很抱歉，您申请的提示词「${prompt.name}」未通过审核`,
        category: 'prompt-rejection',
        level: 'warning',
        action: undefined,
        extra: {
          reviewNote: application.reviewNote || '作者未提供拒绝原因',
          promptId: prompt.id,
          promptName: prompt.name,
          applicationId: application.id,
        },
      });

      this.logger.log(`✅ 通知申请者 ${application.userId}: 申请 ${application.id} 已拒绝`);
    } catch (error) {
      this.logger.error(`发送审核拒绝通知失败: ${error.message}`, error.stack);
    }
  }
}
