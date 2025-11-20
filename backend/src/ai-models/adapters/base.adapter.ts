import { IChatCompletionRequest, IMessage } from '../types';

/**
 * 基础适配器抽象类
 */
export abstract class BaseAdapter {
  /**
   * 适配请求参数
   */
  abstract adaptRequest(request: IChatCompletionRequest): any;

  /**
   * 适配响应数据
   */
  abstract adaptResponse(response: any): any;

  /**
   * 适配流式响应
   */
  abstract adaptStreamChunk(chunk: any): any;

  /**
   * 获取支持的参数列表
   */
  abstract getSupportedParameters(): string[];

  /**
   * 过滤不支持的参数
   */
  protected filterUnsupportedParams(
    params: any,
    supportedParams: string[],
  ): any {
    const filtered: any = {};
    for (const key of Object.keys(params)) {
      if (supportedParams.includes(key)) {
        filtered[key] = params[key];
      }
    }
    return filtered;
  }

  /**
   * 清理空值参数
   */
  protected cleanEmptyParams(params: any): any {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  /**
   * 转换消息格式
   */
  protected convertMessages(messages: IMessage[]): any[] {
    return messages;
  }

  /**
   * 处理停止序列
   */
  protected handleStopSequences(
    stop: string | string[] | undefined,
    maxCount?: number,
  ): string[] | undefined {
    if (!stop) return undefined;

    const stopArray = Array.isArray(stop) ? stop : [stop];
    return maxCount ? stopArray.slice(0, maxCount) : stopArray;
  }

  /**
   * 限制数值范围
   */
  protected clampValue(
    value: number | undefined,
    min: number,
    max: number,
  ): number | undefined {
    if (value === undefined) return undefined;
    return Math.min(Math.max(value, min), max);
  }
}
