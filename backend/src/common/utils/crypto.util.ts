import * as crypto from 'crypto';

/**
 * 加密工具类
 */
export class CryptoUtil {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 
    '12345678901234567890123456789012'; // 32字节密钥，生产环境必须从环境变量读取
  private static readonly IV_LENGTH = 16;

  /**
   * 加密文本
   */
  static encrypt(text: string): string {
    if (!text) return text;
    
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(
      this.ALGORITHM,
      Buffer.from(this.ENCRYPTION_KEY),
      iv,
    );
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // 返回 iv:encrypted 格式
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * 解密文本
   */
  static decrypt(text: string): string {
    if (!text) return text;
    
    try {
      const parts = text.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedText = parts[1];
      
      const decipher = crypto.createDecipheriv(
        this.ALGORITHM,
        Buffer.from(this.ENCRYPTION_KEY),
        iv,
      );
      
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      // 如果解密失败，可能是未加密的旧数据，直接返回
      return text;
    }
  }

  /**
   * 脱敏显示敏感信息
   * @param text 原始文本
   * @param prefixLen 显示前几位
   * @param suffixLen 显示后几位
   */
  static mask(text: string, prefixLen: number = 7, suffixLen: number = 4): string {
    if (!text || text.length <= prefixLen + suffixLen) {
      return text;
    }
    
    const prefix = text.substring(0, prefixLen);
    const suffix = text.substring(text.length - suffixLen);
    
    return `${prefix}****...****${suffix}`;
  }
}
