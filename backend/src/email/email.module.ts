import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailVerification } from './entities/email-verification.entity';
import { EmailTemplate } from './entities/email-template.entity';
import { User } from '../users/entities/user.entity';
import { EmailService } from './services/email.service';
import { EmailTemplateService } from './services/email-template.service';
import { EmailController } from './controllers/email.controller';
import { EmailTemplateController } from './controllers/email-template.controller';
import { SystemSettingsModule } from '../system-settings/system-settings.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailVerification, EmailTemplate, User]),
    SystemSettingsModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [EmailController, EmailTemplateController],
  providers: [EmailService, EmailTemplateService],
  exports: [EmailService, EmailTemplateService],
})
export class EmailModule {}
