import {
  Controller,
  Post,
  Body,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EmailService } from '../services/email.service';
import { SendVerificationCodeDto } from '../dto/send-verification-code.dto';
import { VerifyEmailCodeDto } from '../dto/verify-email-code.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { VerificationType } from '../entities/email-verification.entity';
import { AuthService } from '../../auth/auth.service';

@ApiTags('邮件服务')
@Controller('api/v1/email')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly authService: AuthService,
  ) {}

  @Post('send-code')
  @Public()
  @ApiOperation({ summary: '发送验证码邮件（公开接口）' })
  @ApiResponse({ status: 200, description: '发送成功' })
  async sendVerificationCode(@Body() dto: SendVerificationCodeDto) {
    // 对于注册和更改邮箱类型，验证邮箱域名是否在白名单中
    if (dto.type === VerificationType.REGISTER || dto.type === VerificationType.CHANGE_EMAIL) {
      const isAllowed = await this.authService.isAllowedEmailDomain(dto.email);
      if (!isAllowed) {
        throw new BadRequestException('请使用常用邮箱（如Gmail、QQ邮箱、163邮箱等）进行注册');
      }
    }
    
    await this.emailService.sendVerificationCode(dto.email, dto.type);
    return {
      message: '验证码已发送，请查收邮件',
    };
  }

  @Post('verify-code')
  @ApiBearerAuth()
  @ApiOperation({ summary: '验证邮箱验证码' })
  @ApiResponse({ status: 200, description: '验证成功' })
  async verifyCode(
    @Body() dto: VerifyEmailCodeDto,
    @CurrentUser() user: any,
  ) {
    await this.emailService.verifyAndUpdateEmail(
      dto.email,
      dto.code,
      dto.type,
      user.id,
    );
    return {
      message: '验证成功',
    };
  }
}

