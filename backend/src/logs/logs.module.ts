import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogsService } from './logs.service';
import { LogsController } from './logs.controller';
import { Log } from './entities/log.entity';
import { LoggingInterceptor } from '../common/interceptors/logging.interceptor';

@Global() // 全局模块，所有模块都可以使用
@Module({
  imports: [TypeOrmModule.forFeature([Log])],
  controllers: [LogsController],
  providers: [LogsService, LoggingInterceptor],
  exports: [LogsService, LoggingInterceptor], // 导出服务供其他模块使用
})
export class LogsModule {}

