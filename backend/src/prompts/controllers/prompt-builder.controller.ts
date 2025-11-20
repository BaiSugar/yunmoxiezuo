import {
  Controller,
  Post,
  Body,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PromptBuilderService } from '../builders/prompt-builder.service';
import { BuildPromptDto, BuildSimpleDto } from '../dto/build-prompt.dto';

/**
 * 提示词构建控制器
 * 提供提示词构建相关的API端点
 */
@ApiTags('提示词构建')
@Controller('api/v1/prompts/build')
@ApiBearerAuth()
export class PromptBuilderController {
  private readonly logger = new Logger(PromptBuilderController.name);

  constructor(private readonly builderService: PromptBuilderService) {}

  /**
   * 构建提示词（完整版）
   * 支持对话历史、世界书激活等高级功能
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('prompt:build')
  @ApiOperation({
    summary: '构建提示词',
    description:
      '基于提示词ID和对话历史，构建完整的提示词消息数组。支持Token控制、世界书激活、多种API格式转换等功能。',
  })
  @ApiResponse({
    status: 200,
    description: '构建成功',
    schema: {
      example: {
        result: {
          messages: [
            { role: 'system', content: '你是一个有帮助的AI助手' },
            { role: 'user', content: '你好' },
          ],
        },
        stats: {
          total: 150,
          systemPrompts: 50,
          characterDef: 0,
          examples: 0,
          worldBook: 0,
          history: 0,
          authorNote: 0,
          userInput: 100,
          overBudget: false,
          trimmedComponents: 0,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '提示词不存在',
  })
  @ApiResponse({
    status: 403,
    description: '无权限访问',
  })
  async build(@Body() dto: BuildPromptDto) {
    this.logger.log(`构建提示词: promptId=${dto.promptId}`);

    const result = await this.builderService.build(
      dto.promptId,
      dto.options || {},
      dto.userInput,
      dto.history,
    );

    return result;
  }

  /**
   * 简化构建提示词
   * 仅基于提示词内容构建，支持参数替换
   */
  @Post('simple')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('prompt:build')
  @ApiOperation({
    summary: '简化构建提示词',
    description:
      '基于提示词ID和参数替换，构建简化版的提示词。适用于不需要对话历史和世界书的场景。',
  })
  @ApiResponse({
    status: 200,
    description: '构建成功',
    schema: {
      example: {
        result: {
          messages: [
            {
              role: 'system',
              content: '你是一个专业的{{职业}}，擅长{{技能}}',
            },
          ],
        },
        stats: {
          total: 50,
          systemPrompts: 50,
          characterDef: 0,
          examples: 0,
          worldBook: 0,
          history: 0,
          authorNote: 0,
          userInput: 0,
          overBudget: false,
          trimmedComponents: 0,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '提示词不存在',
  })
  @ApiResponse({
    status: 403,
    description: '无权限访问',
  })
  async buildSimple(@Body() dto: BuildSimpleDto) {
    this.logger.log(`简化构建提示词: promptId=${dto.promptId}`);

    const result = await this.builderService.buildSimple(
      dto.promptId,
      dto.parameters,
      dto.options,
    );

    return result;
  }
}
