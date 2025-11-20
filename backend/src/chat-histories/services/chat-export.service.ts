import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatHistory, Message } from '../entities';
import { ExportFormat } from '../enums';
import { SwipeInfo } from '../interfaces';

/**
 * 聊天导出服务
 */
@Injectable()
export class ChatExportService {
  constructor(
    @InjectRepository(ChatHistory)
    private readonly chatRepository: Repository<ChatHistory>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  /**
   * 导出聊天为JSONL格式（原生格式）
   */
  async exportToJsonl(userId: number, chatId: number): Promise<string> {
    // 验证权限
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('聊天不存在');
    }

    if (chat.userId !== userId) {
      throw new ForbiddenException('无权导出此聊天');
    }

    // 获取所有消息
    const messages = await this.messageRepository.find({
      where: { chatId },
      relations: ['swipes'],
      order: { mesId: 'ASC' },
    });

    // 构建JSONL
    const lines: string[] = [];

    // 第一行：Header
    const header = {
      user_name: chat.userPersonaName || '用户',
      character_name: chat.characterName || '角色',
      create_date: chat.createdAt.toISOString(),
      chat_metadata: chat.chatMetadata || {},
    };
    lines.push(JSON.stringify(header));

    // 后续行：消息
    for (const message of messages) {
      const messageObj: any = {
        name: message.name,
        is_user: message.isUser,
        send_date: message.sendDate,
        mes: message.mes,
      };

      // 添加可选字段
      if (message.isSystem) {
        messageObj.is_system = true;
      }
      if (message.isName) {
        messageObj.is_name = true;
      }
      if (message.forceAvatar) {
        messageObj.force_avatar = message.forceAvatar;
      }

      // 添加Swipes信息
      if (message.swipes && message.swipes.length > 1) {
        messageObj.swipes = message.swipes.map((s) => s.content);
        messageObj.swipe_id = message.swipeId;
        messageObj.swipe_info = message.swipes.map((s) => ({
          send_date: s.sendDate,
          gen_started: s.genStarted,
          gen_finished: s.genFinished,
          gen_id: s.genId,
          extra: s.extra,
        }));
      }

      // 添加生成信息
      if (message.genStarted) {
        messageObj.gen_started = message.genStarted;
      }
      if (message.genFinished) {
        messageObj.gen_finished = message.genFinished;
      }
      if (message.genId) {
        messageObj.gen_id = message.genId;
      }
      if (message.api) {
        messageObj.api = message.api;
      }
      if (message.model) {
        messageObj.model = message.model;
      }

      // 添加扩展信息
      if (message.extra && Object.keys(message.extra).length > 0) {
        messageObj.extra = message.extra;
      }

      lines.push(JSON.stringify(messageObj));
    }

    return lines.join('\n');
  }

  /**
   * 导出聊天为纯文本格式
   */
  async exportToText(userId: number, chatId: number): Promise<string> {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('聊天不存在');
    }

    if (chat.userId !== userId) {
      throw new ForbiddenException('无权导出此聊天');
    }

    const messages = await this.messageRepository.find({
      where: { chatId },
      order: { mesId: 'ASC' },
    });

    const lines: string[] = [];

    // 标题
    lines.push(`聊天记录：${chat.chatName || '未命名'}`);
    lines.push(`角色：${chat.characterName || '未知'}`);
    lines.push(`创建时间：${chat.createdAt.toLocaleString('zh-CN')}`);
    lines.push('=' .repeat(50));
    lines.push('');

    // 消息
    for (const message of messages) {
      if (message.isSystem) {
        lines.push(`[系统] ${message.mes}`);
      } else {
        const time = new Date(message.sendDate).toLocaleString('zh-CN');
        lines.push(`[${time}] ${message.name}:`);
        lines.push(message.mes);
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * 导出聊天为HTML格式
   */
  async exportToHtml(userId: number, chatId: number): Promise<string> {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('聊天不存在');
    }

    if (chat.userId !== userId) {
      throw new ForbiddenException('无权导出此聊天');
    }

    const messages = await this.messageRepository.find({
      where: { chatId },
      order: { mesId: 'ASC' },
    });

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${chat.chatName || '聊天记录'}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .message {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .message.user {
            background: #e3f2fd;
        }
        .message.system {
            background: #f5f5f5;
            font-style: italic;
        }
        .message-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 0.9em;
            color: #666;
        }
        .message-name {
            font-weight: bold;
        }
        .message-time {
            color: #999;
        }
        .message-content {
            line-height: 1.6;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${chat.chatName || '聊天记录'}</h1>
        <p>角色：${chat.characterName || '未知'}</p>
        <p>创建时间：${chat.createdAt.toLocaleString('zh-CN')}</p>
    </div>
    ${messages
      .map((msg) => {
        const time = new Date(msg.sendDate).toLocaleString('zh-CN');
        const cssClass = msg.isSystem ? 'system' : msg.isUser ? 'user' : '';
        return `
    <div class="message ${cssClass}">
        <div class="message-header">
            <span class="message-name">${msg.name}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-content">${this.escapeHtml(msg.mes)}</div>
    </div>`;
      })
      .join('\n')}
</body>
</html>`;

    return html;
  }

  /**
   * 导出聊天为Markdown格式
   */
  async exportToMarkdown(userId: number, chatId: number): Promise<string> {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('聊天不存在');
    }

    if (chat.userId !== userId) {
      throw new ForbiddenException('无权导出此聊天');
    }

    const messages = await this.messageRepository.find({
      where: { chatId },
      order: { mesId: 'ASC' },
    });

    const lines: string[] = [];

    // 标题
    lines.push(`# ${chat.chatName || '聊天记录'}`);
    lines.push('');
    lines.push(`**角色**：${chat.characterName || '未知'}`);
    lines.push(`**创建时间**：${chat.createdAt.toLocaleString('zh-CN')}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    // 消息
    for (const message of messages) {
      const time = new Date(message.sendDate).toLocaleString('zh-CN');

      if (message.isSystem) {
        lines.push(`> *${message.mes}*`);
      } else {
        lines.push(`## ${message.name}`);
        lines.push(`*${time}*`);
        lines.push('');
        lines.push(message.mes);
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * 根据格式导出聊天
   */
  async export(
    userId: number,
    chatId: number,
    format: ExportFormat,
  ): Promise<{ data: string; filename: string; mimeType: string }> {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('聊天不存在');
    }

    let data: string;
    let filename: string;
    let mimeType: string;

    const baseName = `chat_${chat.characterName || 'unknown'}_${Date.now()}`;

    switch (format) {
      case ExportFormat.JSONL:
        data = await this.exportToJsonl(userId, chatId);
        filename = `${baseName}.jsonl`;
        mimeType = 'application/jsonl';
        break;

      case ExportFormat.TXT:
        data = await this.exportToText(userId, chatId);
        filename = `${baseName}.txt`;
        mimeType = 'text/plain';
        break;

      case ExportFormat.HTML:
        data = await this.exportToHtml(userId, chatId);
        filename = `${baseName}.html`;
        mimeType = 'text/html';
        break;

      case ExportFormat.MARKDOWN:
        data = await this.exportToMarkdown(userId, chatId);
        filename = `${baseName}.md`;
        mimeType = 'text/markdown';
        break;

      default:
        throw new Error(`不支持的导出格式: ${format}`);
    }

    return { data, filename, mimeType };
  }

  /**
   * HTML转义
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
