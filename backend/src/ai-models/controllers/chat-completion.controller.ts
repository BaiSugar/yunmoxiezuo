import {
  Controller,
  Post,
  Body,
  Get,
  Res,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AI_MODEL_PERMISSIONS } from '../../common/constants/permissions.constant';
import { ChatCompletionService } from '../services/chat-completion.service';
import { ChatCompletionDto } from '../dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

/**
 * 聊天补全控制器
 */
@ApiTags('AI 聊天补全')
@ApiBearerAuth()
@Controller('api/v1/chat/completions')
export class ChatCompletionController {
  constructor(
    private readonly chatCompletionService: ChatCompletionService,
  ) {}

  @Post()
  @RequirePermissions(AI_MODEL_PERMISSIONS.CHAT_CREATE)
  @ApiOperation({ summary: '创建聊天补全' })
  @ApiResponse({ status: 200, description: '生成成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 500, description: 'AI 服务调用失败' })
  async create(
    @Body() dto: ChatCompletionDto,
    @CurrentUser('id') userId: number,
    @Res() res: Response,
  ) {
    // 检查是否为流式请求
    if (dto.stream) {
      return this.streamResponse(dto, userId, res);
    }

    // 普通请求
    const result = await this.chatCompletionService.complete(dto, userId);
    return res.status(HttpStatus.OK).json(result);
  }

  @Get('models')
  @RequirePermissions(AI_MODEL_PERMISSIONS.CHAT_READ)
  @ApiOperation({ summary: '获取可用模型列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getModels(@CurrentUser('id') userId: number) {
    return await this.chatCompletionService.getAvailableModels(userId);
  }

  @Get('models/default')
  @RequirePermissions(AI_MODEL_PERMISSIONS.CHAT_READ)
  @ApiOperation({ summary: '获取默认模型' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 400, description: '未设置默认模型' })
  async getDefaultModel(@CurrentUser('id') userId: number) {
    return await this.chatCompletionService.getDefaultModel(userId);
  }

  /**
   * 处理流式响应
   */
  private async streamResponse(
    dto: ChatCompletionDto,
    userId: number,
    res: Response,
  ) {
    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用 nginx 缓冲

    // 发送初始连接确认
    res.write(': connected\n\n');

    // 创建取消标志
    let isCancelled = false;

    // 监听客户端断开连接
    res.on('close', () => {
      isCancelled = true;
    });

    try {
      const stream = this.chatCompletionService.completeStream(dto, userId);

      for await (const chunk of stream) {
        // 检查是否已取消
        if (isCancelled) {
          break;
        }

        // 发送数据块
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        
        // 刷新缓冲区（Express response 的扩展方法）
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      }

      // 发送完成信号
      if (!isCancelled) {
        res.write('data: [DONE]\n\n');
      }
    } catch (error) {
      // 发送错误信息
      if (!isCancelled) {
        res.write(
          `data: ${JSON.stringify({
            error: {
              message: error.message,
              type: 'server_error',
            },
          })}\n\n`,
        );
      }
    } finally {
      // 确保连接关闭
      if (!res.writableEnded) {
        res.end();
      }
    }
  }
}
