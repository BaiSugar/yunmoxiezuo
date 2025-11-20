import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  PromptGroup,
  PromptGroupItem,
  PromptGroupPermission,
  PromptGroupApplication,
  PromptGroupLike,
} from './entities';
import { Prompt } from '../prompts/entities/prompt.entity';
import { PromptPermission } from '../prompts/entities/prompt-permission.entity';
import { PromptGroupService } from './services/prompt-group.service';
import { PromptGroupController } from './controllers/prompt-group.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PromptGroup,
      PromptGroupItem,
      PromptGroupPermission,
      PromptGroupApplication,
      PromptGroupLike,
      Prompt,
      PromptPermission,
    ]),
  ],
  controllers: [PromptGroupController],
  providers: [PromptGroupService],
  exports: [PromptGroupService],
})
export class PromptGroupsModule {}

