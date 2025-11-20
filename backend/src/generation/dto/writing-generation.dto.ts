import { IsInt, IsOptional, IsString, IsNumber, IsBoolean, IsObject, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * AI写作生成请求DTO
 */
export class WritingGenerationDto {
  @ApiPropertyOptional({
    description: '作品ID（用于加载作品相关的人物卡、世界观等，支持参数中的@引用）',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  novelId?: number;

  @ApiPropertyOptional({
    description: '提示词ID（可选，不提供时为纯对话模式）',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  promptId?: number;

  @ApiPropertyOptional({
    description: '参数替换映射（用于替换提示词中的 {{参数名}} 占位符，支持@引用如 @人物卡:张三）',
    example: { '主角名字': '李明', '故事背景': '现代都市' },
  })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, string>;

  @ApiPropertyOptional({
    description: '用户输入内容',
    example: '请帮我写一个科幻小说的开头',
  })
  @IsOptional()
  @IsString()
  userInput?: string;

  @ApiPropertyOptional({
    description: 'AI模型ID',
    example: 'gpt-4-turbo',
  })
  @IsOptional()
  @IsString()
  modelId?: string;

  @ApiPropertyOptional({
    description: '温度参数（0-2），控制随机性',
    example: 0.7,
    minimum: 0,
    maximum: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({
    description: '历史消息数量限制（保留最近N条消息，0表示不限制）',
    example: 10,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  historyMessageLimit?: number;

  @ApiPropertyOptional({
    description: '最大生成Token数',
    example: 2048,
    minimum: 1,
    maximum: 16000,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(16000)
  maxTokens?: number;

  @ApiPropertyOptional({
    description: '是否使用流式输出',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  stream?: boolean;

  @ApiPropertyOptional({
    description: '对话历史（用于多轮对话）',
    example: [
      { 
        role: 'user', 
        content: '生成', 
        promptId: 1,
        parameters: { '数量': '1' },
        characterIds: [1, 2],
        worldSettingIds: [1]
      },
      { role: 'assistant', content: '好的，这是...' },
    ],
  })
  @IsOptional()
  history?: Array<{ 
    role: 'user' | 'assistant'; 
    content: string;
    promptId?: number;  // 该消息使用的提示词ID（用于重建完整历史）
    parameters?: Record<string, string>;  // 该消息使用的参数（用于重建）
    characterIds?: number[];  // 该消息使用的人物卡ID（用于重建）
    worldSettingIds?: number[];  // 该消息使用的世界观ID（用于重建）
  }>;

  @ApiPropertyOptional({
    description: '用户选择的人物卡ID列表',
    example: [1, 2],
  })
  @IsOptional()
  @IsInt({ each: true })
  @Type(() => Number)
  characterIds?: number[];

  @ApiPropertyOptional({
    description: '用户选择的世界观ID列表',
    example: [1],
  })
  @IsOptional()
  @IsInt({ each: true })
  @Type(() => Number)
  worldSettingIds?: number[];

  @ApiPropertyOptional({
    description: '用户通过@符号引用的人物卡ID列表',
    example: [2, 3],
  })
  @IsOptional()
  @IsInt({ each: true })
  @Type(() => Number)
  mentionedCharacterIds?: number[];

  @ApiPropertyOptional({
    description: '用户通过@符号引用的世界观ID列表',
    example: [2],
  })
  @IsOptional()
  @IsInt({ each: true })
  @Type(() => Number)
  mentionedWorldSettingIds?: number[];

  @ApiPropertyOptional({
    description: '用户通过@符号引用的备忘录ID列表',
    example: [1, 2],
  })
  @IsOptional()
  @IsInt({ each: true })
  @Type(() => Number)
  mentionedMemoIds?: number[];

  @ApiPropertyOptional({
    description: '用户通过@符号引用的章节列表（包含ID和类型）',
    example: [
      { chapterId: 1, type: 'full' },
      { chapterId: 2, type: 'summary' }
    ],
  })
  @IsOptional()
  mentionedChapters?: Array<{
    chapterId: number;
    type: 'full' | 'summary';  // full: 全文, summary: 梗概
  }>;
}
