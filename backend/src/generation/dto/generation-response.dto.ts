import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 生成响应DTO
 */
export class GenerationResponseDto {
  @ApiProperty({
    description: '生成的内容',
    example: '在一个繁华的都市中，年轻的程序员李明...',
  })
  content: string;

  @ApiPropertyOptional({
    description: '生成ID（用于追踪）',
    example: 'gen_abc123',
  })
  generationId?: string;

  @ApiPropertyOptional({
    description: '使用的模型',
    example: 'gpt-4-turbo',
  })
  model?: string;

  @ApiPropertyOptional({
    description: '使用的Token数统计',
    example: {
      promptTokens: 512,
      completionTokens: 256,
      totalTokens: 768,
    },
  })
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  @ApiPropertyOptional({
    description: '完成原因',
    example: 'stop',
  })
  finishReason?: string;

  @ApiPropertyOptional({
    description: '生成耗时（毫秒）',
    example: 3500,
  })
  duration?: number;

  @ApiPropertyOptional({
    description: '字数消耗信息',
    example: {
      totalCost: 150,
      inputCost: 125,
      outputCost: 50,
      usedDailyFree: 100,
      usedPaid: 50,
      memberBenefitApplied: false,
    },
  })
  consumption?: {
    totalCost: number;
    inputCost: number;
    outputCost: number;
    usedDailyFree: number;
    usedPaid: number;
    memberBenefitApplied: boolean;
  };
}
