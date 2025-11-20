import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { SystemSettingsService } from '../../system-settings/services/system-settings.service';
import {
  EmailVerification,
  VerificationType,
} from '../entities/email-verification.entity';
import { EmailTemplate, EmailTemplateType } from '../entities/email-template.entity';
import { EmailTemplateService } from './email-template.service';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectRepository(EmailVerification)
    private readonly verificationRepository: Repository<EmailVerification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly systemSettingsService: SystemSettingsService,
    private readonly emailTemplateService: EmailTemplateService,
  ) {}

  /**
   * 创建SMTP传输器
   */
  private async createTransporter() {
    const smtpHost = await this.systemSettingsService.getValue('email', 'smtp_host');
    const smtpPort = await this.systemSettingsService.getValue('email', 'smtp_port');
    const smtpSecure = await this.systemSettingsService.getValue('email', 'smtp_secure');
    const smtpUser = await this.systemSettingsService.getValue('email', 'smtp_user');
    const smtpPassword = await this.systemSettingsService.getValue('email', 'smtp_password');

    if (!smtpHost || !smtpUser || !smtpPassword) {
      throw new BadRequestException('SMTP配置不完整，请先在系统配置中设置邮件参数');
    }

    const port = Number(smtpPort) || 587;
    // 兼容多种配置形式：true/false、'true'/'false'、1/0，并在端口为465时强制secure
    const secureFromConfig =
      typeof smtpSecure === 'string' ? smtpSecure === 'true' : !!smtpSecure;
    const secure = port === 465 ? true : secureFromConfig;

    return nodemailer.createTransport({
      host: smtpHost,
      port,
      secure,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });
  }

  /**
   * 发送邮件（通用方法）
   */
  async sendMail(to: string, subject: string, html: string): Promise<void> {
    try {
      const transporter = await this.createTransporter();
      const fromName = await this.systemSettingsService.getValue('email', 'from_name');
      const fromEmail = await this.systemSettingsService.getValue('email', 'from_email');

      const from = `"${fromName || '写作平台'}" <${fromEmail || to}>`;

      await transporter.sendMail({
        from,
        to,
        subject,
        html,
      });

      this.logger.log(`邮件发送成功: ${to} - ${subject}`);
    } catch (error) {
      this.logger.error(`邮件发送失败: ${to} - ${error.message}`, error.stack);
      
      // 提供更详细的错误信息
      if (error.message?.includes('SMTP')) {
        throw new BadRequestException(`SMTP配置错误: ${error.message}`);
      }
      throw new BadRequestException(`邮件发送失败: ${error.message || '请检查SMTP配置或稍后重试'}`);
    }
  }

  /**
   * 生成6位数验证码
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 发送验证码邮件
   */
  async sendVerificationCode(
    email: string,
    type: VerificationType,
    userId?: number,
  ): Promise<void> {
    // 检查是否启用邮件验证
    const verificationEnabled = await this.systemSettingsService.getValue(
      'email',
      'verification_enabled',
    );
    if (!verificationEnabled) {
      throw new BadRequestException('邮件验证功能未启用');
    }

    // 检查重发间隔
    const resendInterval = await this.systemSettingsService.getValue(
      'email',
      'verification_resend_interval',
    );
    const recentRecord = await this.verificationRepository.findOne({
      where: {
        email,
        type,
        createdAt: MoreThan(
          new Date(Date.now() - (resendInterval || 60) * 1000),
        ),
      },
      order: { createdAt: 'DESC' },
    });

    if (recentRecord) {
      throw new BadRequestException(
        `请${resendInterval || 60}秒后再试`,
      );
    }

    // 生成验证码
    const code = this.generateCode();

    // 获取过期时间
    const codeExpire = await this.systemSettingsService.getValue(
      'email',
      'verification_code_expire',
    );
    const expiresAt = new Date(Date.now() + (codeExpire || 300) * 1000);

    // 保存验证码
    const verification = this.verificationRepository.create({
      email,
      code,
      type,
      userId,
      expiresAt,
      isUsed: false,
    });
    await this.verificationRepository.save(verification);

    // 发送邮件
    const { subject, html } = await this.prepareVerificationEmail(type, code, codeExpire || 300);
    await this.sendMail(email, subject, html);

    this.logger.log(`验证码已发送: ${email} - 类型: ${type}`);
  }

  /**
   * 验证验证码
   */
  async verifyCode(
    email: string,
    code: string,
    type: VerificationType,
  ): Promise<boolean> {
    const verification = await this.verificationRepository.findOne({
      where: {
        email,
        code,
        type,
        isUsed: false,
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });

    if (!verification) {
      return false;
    }

    // 标记为已使用
    verification.isUsed = true;
    verification.usedAt = new Date();
    await this.verificationRepository.save(verification);

    return true;
  }

  /**
   * 验证验证码并更新用户邮箱验证状态
   */
  async verifyAndUpdateEmail(
    email: string,
    code: string,
    type: VerificationType,
    userId: number,
  ): Promise<void> {
    // 验证验证码
    const isValid = await this.verifyCode(email, code, type);
    if (!isValid) {
      throw new BadRequestException('验证码无效或已过期');
    }

    // 如果是验证邮箱类型，更新用户的邮箱验证状态
    if (type === VerificationType.VERIFY_EMAIL) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user && user.email === email) {
        user.emailVerified = true;
        await this.userRepository.save(user);
        this.logger.log(`用户 ${userId} 邮箱验证成功: ${email}`);
      }
    }
  }

  /**
   * 清理过期验证码
   */
  async cleanupExpiredCodes(): Promise<void> {
    const result = await this.verificationRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    this.logger.log(`清理过期验证码: 删除 ${result.affected || 0} 条记录`);
  }

  /**
   * 准备验证邮件（从数据库获取模板）
   */
  private async prepareVerificationEmail(
    type: VerificationType,
    code: string,
    expireSeconds: number,
  ): Promise<{ subject: string; html: string }> {
    // 映射VerificationType到EmailTemplateType
    const templateTypeMap = {
      [VerificationType.REGISTER]: EmailTemplateType.REGISTER,
      [VerificationType.RESET_PASSWORD]: EmailTemplateType.RESET_PASSWORD,
      [VerificationType.CHANGE_EMAIL]: EmailTemplateType.CHANGE_EMAIL,
      [VerificationType.VERIFY_EMAIL]: EmailTemplateType.VERIFY_EMAIL,
    };

    const templateType = templateTypeMap[type];
    
    // 从数据库获取模板
    const template = await this.emailTemplateService.findByType(templateType);

    if (!template) {
      // 如果数据库没有模板，使用默认模板
      this.logger.warn(`未找到类型 ${type} 的邮件模板，使用默认模板`);
      return this.getDefaultTemplate(type, code, expireSeconds);
    }

    // 准备模板变量
    const expireText = expireSeconds >= 60 
      ? `${Math.floor(expireSeconds / 60)}分钟` 
      : `${expireSeconds}秒`;

    const variables = {
      code,
      expireText,
      year: new Date().getFullYear(),
    };

    // 渲染模板
    const html = this.emailTemplateService.renderTemplate(
      template.htmlTemplate,
      variables,
    );

    return {
      subject: template.subject,
      html,
    };
  }

  /**
   * 获取默认邮件模板（后备方案）
   */
  private getDefaultTemplate(
    type: VerificationType,
    code: string,
    expireSeconds: number,
  ): { subject: string; html: string } {
    const expireText = expireSeconds >= 60 
      ? `${Math.floor(expireSeconds / 60)}分钟` 
      : `${expireSeconds}秒`;

    const subjects = {
      [VerificationType.REGISTER]: '【写作平台】注册验证码',
      [VerificationType.RESET_PASSWORD]: '【写作平台】重置密码验证码',
      [VerificationType.CHANGE_EMAIL]: '【写作平台】更换邮箱验证码',
      [VerificationType.VERIFY_EMAIL]: '【写作平台】邮箱验证码',
    };

    const titles = {
      [VerificationType.REGISTER]: '欢迎注册写作平台',
      [VerificationType.RESET_PASSWORD]: '重置密码',
      [VerificationType.CHANGE_EMAIL]: '更换邮箱',
      [VerificationType.VERIFY_EMAIL]: '验证邮箱',
    };

    const contents = {
      [VerificationType.REGISTER]: '感谢您注册我们的平台，请使用以下验证码完成注册：',
      [VerificationType.RESET_PASSWORD]: '您正在重置密码，请使用以下验证码：',
      [VerificationType.CHANGE_EMAIL]: '您正在更换邮箱，请使用以下验证码：',
      [VerificationType.VERIFY_EMAIL]: '请使用以下验证码验证您的邮箱：',
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code-box { background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
          .warning { color: #e74c3c; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${titles[type] || '验证码'}</h1>
          </div>
          <div class="content">
            <p>您好，</p>
            <p>${contents[type] || '请使用以下验证码：'}</p>
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            <p>验证码有效期为 <strong>${expireText}</strong>，请尽快使用。</p>
            <p class="warning">如果这不是您本人的操作，请忽略此邮件。</p>
          </div>
          <div class="footer">
            <p>此邮件由系统自动发送，请勿直接回复。</p>
            <p>&copy; ${new Date().getFullYear()} 写作平台 版权所有</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return {
      subject: subjects[type] || '【写作平台】验证码',
      html,
    };
  }
}
