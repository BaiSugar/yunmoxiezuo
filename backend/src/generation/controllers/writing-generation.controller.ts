import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WritingGenerationService } from '../services/writing-generation.service';
import { WritingGenerationDto, GenerationResponseDto } from '../dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GENERATION_PERMISSIONS } from '../../common/config/permissions.config';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

/**
 * AI写作生成控制器
 */
@ApiTags('AI Generation - Writing')
@Controller('api/v1/generation/writing')
@ApiBearerAuth()
export class WritingGenerationController {
  constructor(
    private readonly writingGenerationService: WritingGenerationService,
  ) {}

  /**
   * AI写作生成（非流式）
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(GENERATION_PERMISSIONS.WRITING_GENERATE)
  @ApiOperation({
    summary: 'AI写作生成',
    description: '基于提示词生成AI内容（非流式）',
  })
  @ApiResponse({
    status: 200,
    description: '生成成功',
    type: GenerationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  @ApiResponse({
    status: 404,
    description: '提示词不存在',
  })
  async generate(
    @Body() dto: WritingGenerationDto,
    @CurrentUser('id') userId: number,
  ): Promise<GenerationResponseDto> {
    return this.writingGenerationService.generate(dto, userId);
  }

  /**
   * AI写作生成（流式）
   */
  @Post('stream')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(GENERATION_PERMISSIONS.WRITING_GENERATE)
  @ApiOperation({
    summary: 'AI写作生成（流式）',
    description: '基于提示词生成AI内容（SSE流式输出）',
  })
  @ApiResponse({
    status: 200,
    description: '流式生成成功',
    content: {
      'text/event-stream': {
        schema: {
          type: 'string',
          example: 'data: {"content":"生成的文本..."}\n\n',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  async generateStream(
    @Body() dto: WritingGenerationDto,
    @CurrentUser('id') userId: number,
    @Res() res: Response,
  ): Promise<void> {
    return this.writingGenerationService.generateStream(dto, userId, res);
  }
}
