import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemSetting } from './entities/system-setting.entity';
import { SystemSettingsService } from './services/system-settings.service';
import { SystemSettingsController } from './controllers/system-settings.controller';
import { SystemSettingsUploadController } from './controllers/upload.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SystemSetting])],
  controllers: [SystemSettingsController, SystemSettingsUploadController],
  providers: [SystemSettingsService],
  exports: [SystemSettingsService], // 导出服务供其他模块使用
})
export class SystemSettingsModule {}
