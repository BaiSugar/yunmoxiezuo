import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Font } from './entities/font.entity';
import { FontsService } from './services/fonts.service';
import { FontsController } from './controllers/fonts.controller';

/**
 * 字体管理模块
 */
@Module({
  imports: [TypeOrmModule.forFeature([Font])],
  controllers: [FontsController],
  providers: [FontsService],
  exports: [FontsService],
})
export class FontsModule {}

