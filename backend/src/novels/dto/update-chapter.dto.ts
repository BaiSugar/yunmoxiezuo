import { PartialType } from '@nestjs/swagger';
import { CreateChapterDto } from './create-chapter.dto';

// 允许更新所有字段，包括volumeId（用于移动章节到其他分卷）
export class UpdateChapterDto extends PartialType(CreateChapterDto) {}
