import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tool } from './entities/tool.entity';
import { ToolUsageLog } from './entities/tool-usage-log.entity';
import { ToolsService } from './services/tools.service';
import { ToolUsageService } from './services/tool-usage.service';
import { NovelSearchService } from './services/novel-search.service';
import { ToolsController } from './controllers/tools.controller';
import { NovelSearchController } from './controllers/novel-search.controller';
import { UserToolsController } from './controllers/user-tools.controller';
import { ToolAccessGuard } from './guards/tool-access.guard';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tool, ToolUsageLog]),
    MembershipsModule,
  ],
  controllers: [ToolsController, NovelSearchController, UserToolsController],
  providers: [
    ToolsService,
    ToolUsageService,
    NovelSearchService,
    ToolAccessGuard,
  ],
  exports: [ToolsService, ToolUsageService],
})
export class ToolsModule {}
