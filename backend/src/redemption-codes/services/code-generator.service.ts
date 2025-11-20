import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

/**
 * 卡密生成服务
 */
@Injectable()
export class CodeGeneratorService {
  /**
   * 生成随机卡密
   * 格式：XXXX-XXXX-XXXX-XXXX（16位，4段）
   */
  generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去除易混淆字符：0O1I
    let code = '';

    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) {
        code += '-';
      }
      const randomIndex = randomBytes(1)[0] % chars.length;
      code += chars[randomIndex];
    }

    return code;
  }

  /**
   * 批量生成唯一卡密
   */
  generateBatch(count: number): string[] {
    const codes = new Set<string>();

    while (codes.size < count) {
      codes.add(this.generateCode());
    }

    return Array.from(codes);
  }

  /**
   * 生成批次号
   */
  generateBatchId(): string {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(4).toString('hex');
    return `BATCH-${timestamp}-${random}`.toUpperCase();
  }
}
