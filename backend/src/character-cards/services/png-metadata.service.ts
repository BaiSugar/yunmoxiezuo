import { Injectable, BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import axios from 'axios';

/**
 * PNG 元数据处理服务
 * 负责 PNG 图片 tEXt 块的读写操作
 */
@Injectable()
export class PngMetadataService {
  /**
   * 将角色卡数据嵌入 PNG 图片的 tEXt 元数据中
   * @param imageSource - 图片来源（URL 或 Base64）
   * @param cardData - 角色卡数据对象
   * @param keyword - 元数据关键字（chara 或 ccv3）
   * @returns Base64 编码的 PNG 数据
   */
  async embedDataIntoPng(
    imageSource: string,
    cardData: any,
    keyword: 'chara' | 'ccv3' = 'chara',
  ): Promise<string> {
    try {
      // 1. 获取图片数据
      let imageBuffer: Buffer;

      if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
        // 从 URL 下载图片
        imageBuffer = await this.downloadImage(imageSource);
      } else if (imageSource.startsWith('data:image/png;base64,')) {
        // 从 Base64 解码
        imageBuffer = Buffer.from(imageSource.replace(/^data:image\/png;base64,/, ''), 'base64');
      } else {
        // 假定为纯 Base64
        imageBuffer = Buffer.from(imageSource, 'base64');
      }

      // 2. 验证是否为 PNG 图片
      const metadata = await sharp(imageBuffer).metadata();
      if (metadata.format !== 'png') {
        throw new BadRequestException('图片格式必须为 PNG');
      }

      // 3. 准备元数据
      const jsonString = JSON.stringify(cardData);
      const base64Data = Buffer.from(jsonString, 'utf8').toString('base64');

      // 4. 使用手动方式插入 tEXt 块（因为 sharp 不直接支持自定义 tEXt）
      const pngWithMetadata = await this.insertTextChunk(imageBuffer, keyword, base64Data);

      // 5. 返回 Base64 编码的结果
      return `data:image/png;base64,${pngWithMetadata.toString('base64')}`;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('嵌入元数据失败: ' + error.message);
    }
  }

  /**
   * 从 PNG 中提取 tEXt 元数据
   * @param pngBuffer - PNG 图片 Buffer
   * @param keyword - 要提取的关键字
   * @returns Base64 编码的数据，未找到返回 null
   */
  extractTextChunk(pngBuffer: Buffer, keyword: string): string | null {
    let offset = 8; // 跳过 PNG 签名

    while (offset < pngBuffer.length) {
      // 读取块长度（4 字节，大端序）
      if (offset + 12 > pngBuffer.length) break;

      const chunkLength = pngBuffer.readUInt32BE(offset);
      offset += 4;

      // 读取块类型（4 字节）
      const chunkType = pngBuffer.toString('ascii', offset, offset + 4);
      offset += 4;

      // 如果是 tEXt 块
      if (chunkType === 'tEXt') {
        const chunkData = pngBuffer.slice(offset, offset + chunkLength);

        // 查找关键字（以 null 结尾）
        const nullIndex = chunkData.indexOf(0);
        if (nullIndex === -1) {
          offset += chunkLength + 4;
          continue;
        }

        const chunkKeyword = chunkData.toString('latin1', 0, nullIndex);

        if (chunkKeyword === keyword) {
          // 提取数据（关键字后的部分）
          const text = chunkData.toString('utf8', nullIndex + 1);
          return text;
        }
      }

      // 跳到下一个块（数据 + 4 字节 CRC）
      offset += chunkLength + 4;
    }

    return null;
  }

  /**
   * 插入 tEXt 块到 PNG 图片
   * @param pngBuffer - PNG 图片 Buffer
   * @param keyword - 关键字
   * @param text - 文本数据
   * @returns 新的 PNG Buffer
   */
  private insertTextChunk(pngBuffer: Buffer, keyword: string, text: string): Buffer {
    // PNG 签名（8 字节）
    const pngSignature = pngBuffer.slice(0, 8);

    // 构建 tEXt 块
    const keywordBuffer = Buffer.from(keyword, 'latin1');
    const nullByte = Buffer.from([0]);
    const textBuffer = Buffer.from(text, 'latin1');

    const chunkData = Buffer.concat([keywordBuffer, nullByte, textBuffer]);
    const chunkType = Buffer.from('tEXt', 'ascii');

    // 计算 CRC
    const crc = this.calculateCRC(Buffer.concat([chunkType, chunkData]));

    // 构建完整的 tEXt 块
    const chunkLength = Buffer.alloc(4);
    chunkLength.writeUInt32BE(chunkData.length, 0);

    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc, 0);

    const textChunk = Buffer.concat([chunkLength, chunkType, chunkData, crcBuffer]);

    // 插入 tEXt 块到 IHDR 之后
    // 找到第一个 IHDR 块的结束位置
    let insertPosition = 8; // PNG 签名之后
    const ihdrLength = pngBuffer.readUInt32BE(8);
    insertPosition += 4 + 4 + ihdrLength + 4; // length + type + data + crc

    // 构建新的 PNG
    const beforeChunk = pngBuffer.slice(0, insertPosition);
    const afterChunk = pngBuffer.slice(insertPosition);

    return Buffer.concat([beforeChunk, textChunk, afterChunk]);
  }

  /**
   * 计算 CRC32 校验和
   * @param buffer - 要计算的 Buffer
   * @returns CRC32 值
   */
  private calculateCRC(buffer: Buffer): number {
    let crc = 0xffffffff;

    for (let i = 0; i < buffer.length; i++) {
      const byte = buffer[i];
      crc ^= byte;

      for (let j = 0; j < 8; j++) {
        if (crc & 1) {
          crc = (crc >>> 1) ^ 0xedb88320;
        } else {
          crc = crc >>> 1;
        }
      }
    }

    return (crc ^ 0xffffffff) >>> 0;
  }

  /**
   * 从 URL 下载图片
   * @param url - 图片 URL
   * @returns 图片 Buffer
   */
  private async downloadImage(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 10000,
        maxContentLength: 10 * 1024 * 1024, // 最大 10MB
      });

      return Buffer.from(response.data);
    } catch (error) {
      throw new BadRequestException('下载图片失败: ' + error.message);
    }
  }

  /**
   * 验证 PNG 图片
   * @param buffer - 图片 Buffer
   * @returns 是否为有效的 PNG
   */
  async validatePng(buffer: Buffer): Promise<boolean> {
    try {
      const metadata = await sharp(buffer).metadata();
      return metadata.format === 'png';
    } catch {
      return false;
    }
  }

  /**
   * 压缩 PNG 图片（可选）
   * @param buffer - 原始 PNG Buffer
   * @param quality - 压缩质量（1-100）
   * @returns 压缩后的 Buffer
   */
  async compressPng(buffer: Buffer, quality: number = 80): Promise<Buffer> {
    return await sharp(buffer)
      .png({
        quality,
        compressionLevel: 9,
      })
      .toBuffer();
  }
}
