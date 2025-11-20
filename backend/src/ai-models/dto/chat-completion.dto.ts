import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsInt,
  IsObject,
  ValidateNested,
  IsNotEmpty,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MessageRole, IMessage, ITool } from '../types';

/**
 * 消息 DTO
 */
export class MessageDto implements IMessage {
  @ApiProperty({ description: '消息角色', enum: MessageRole })
  @IsEnum(MessageRole)
  role: MessageRole;

  @ApiProperty({ description: '消息内容' })
  @IsNotEmpty()
  content: string | any[];

  @ApiPropertyOptional({ description: '消息名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '工具调用ID' })
  @IsString()
  @IsOptional()
  tool_call_id?: string;

  @ApiPropertyOptional({ description: '工具调用列表' })
  @IsArray()
  @IsOptional()
  tool_calls?: any[];
}

/**
 * 聊天补全请求 DTO
 */
export class ChatCompletionDto {
  @ApiProperty({ description: '模型ID或模型标识符', example: 'gpt-4-turbo' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({ description: '消息列表', type: [MessageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[];

  @ApiPropertyOptional({ description: '是否流式输出', default: false })
  @IsBoolean()
  @IsOptional()
  stream?: boolean;

  @ApiPropertyOptional({
    description: '温度 (0-2)',
    minimum: 0,
    maximum: 2,
    default: 1.0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({ description: '最大生成tokens', default: 300 })
  @IsInt()
  @IsOptional()
  @Min(1)
  max_tokens?: number;

  @ApiPropertyOptional({
    description: 'Top-P 核采样 (0-1)',
    minimum: 0,
    maximum: 1,
    default: 1.0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  top_p?: number;

  @ApiPropertyOptional({ description: 'Top-K 采样', minimum: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  top_k?: number;

  @ApiPropertyOptional({ description: 'Top-A 采样', minimum: 0, maximum: 1 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  top_a?: number;

  @ApiPropertyOptional({ description: '最小概率', minimum: 0, maximum: 1 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  min_p?: number;

  @ApiPropertyOptional({
    description: '频率惩罚 (-2 到 2)',
    minimum: -2,
    maximum: 2,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(-2)
  @Max(2)
  frequency_penalty?: number;

  @ApiPropertyOptional({
    description: '存在惩罚 (-2 到 2)',
    minimum: -2,
    maximum: 2,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(-2)
  @Max(2)
  presence_penalty?: number;

  @ApiPropertyOptional({ description: '重复惩罚', minimum: 0.1, maximum: 2 })
  @IsNumber()
  @IsOptional()
  @Min(0.1)
  @Max(2)
  repetition_penalty?: number;

  @ApiPropertyOptional({
    description: '停止序列',
    example: ['User:', 'Assistant:'],
  })
  @IsOptional()
  stop?: string | string[];

  @ApiPropertyOptional({ description: '随机种子' })
  @IsInt()
  @IsOptional()
  seed?: number;

  @ApiPropertyOptional({ description: '生成多个回复数量', minimum: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  n?: number;

  @ApiPropertyOptional({ description: 'Logit偏置' })
  @IsObject()
  @IsOptional()
  logit_bias?: Record<string, number>;

  @ApiPropertyOptional({ description: '返回概率信息' })
  @IsBoolean()
  @IsOptional()
  logprobs?: boolean;

  @ApiPropertyOptional({ description: '返回前N个概率', minimum: 0, maximum: 20 })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(20)
  top_logprobs?: number;

  @ApiPropertyOptional({ description: '工具列表' })
  @IsArray()
  @IsOptional()
  tools?: ITool[];

  @ApiPropertyOptional({
    description: '工具选择策略',
    example: 'auto',
  })
  @IsOptional()
  tool_choice?: 'auto' | 'none' | { type: 'function'; name: string };

  @ApiPropertyOptional({
    description: '响应格式',
    example: { type: 'json_object' },
  })
  @IsObject()
  @IsOptional()
  response_format?: {
    type: 'json_object' | 'json_schema' | 'text';
    json_schema?: {
      name: string;
      strict?: boolean;
      schema: Record<string, any>;
    };
  };

  @ApiPropertyOptional({ description: '推理强度（o1系列）', example: 'medium' })
  @IsString()
  @IsOptional()
  reasoning_effort?: 'low' | 'medium' | 'high';

  @ApiPropertyOptional({ description: '启用网络搜索（xAI）' })
  @IsBoolean()
  @IsOptional()
  enable_web_search?: boolean;

  @ApiPropertyOptional({
    description: '思维模式配置（Claude）',
    example: { type: 'enabled', budget_tokens: 2048 },
  })
  @IsObject()
  @IsOptional()
  thinking?: {
    type: 'enabled' | 'disabled';
    budget_tokens?: number;
  };
}
