import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModelPreference } from './entities/user-model-preference.entity';
import { AiModel } from '../ai-models/entities/ai-model.entity';
import { UserModelPreferencesService } from './user-model-preferences.service';
import { UserModelPreferencesController } from './user-model-preferences.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserModelPreference, AiModel])],
  controllers: [UserModelPreferencesController],
  providers: [UserModelPreferencesService],
  exports: [UserModelPreferencesService],
})
export class UserModelPreferencesModule {}
