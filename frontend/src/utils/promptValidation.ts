/**
 * 提示词参数验证工具
 */

export interface PromptParameter {
  name: string;
  required: boolean;
  description?: string;
}

export interface PromptContent {
  name: string;
  isEnabled: boolean;
  parameters?: PromptParameter[];
}

export interface ValidationError {
  parameterName: string;
  description?: string;
  contentName: string;
}

/**
 * 验证提示词必填参数
 * @param contents 提示词内容列表
 * @param providedParameters 用户提供的参数值
 * @returns 缺失的必填参数列表，如果全部填写则返回空数组
 */
export function validateRequiredParameters(
  contents: PromptContent[],
  providedParameters: Record<string, string>
): ValidationError[] {
  const missingParams: ValidationError[] = [];

  // 遍历所有启用的提示词内容
  for (const content of contents) {
    if (!content.isEnabled) {
      continue; // 跳过禁用的内容
    }

    // 检查是否有参数配置
    if (content.parameters && Array.isArray(content.parameters)) {
      for (const param of content.parameters) {
        // 只检查必填参数
        if (param.required) {
          const value = providedParameters[param.name];
          
          // 检查是否缺失或为空
          if (!value || value.trim() === '') {
            missingParams.push({
              parameterName: param.name,
              description: param.description,
              contentName: content.name,
            });
          }
        }
      }
    }
  }

  return missingParams;
}

/**
 * 格式化验证错误消息
 * @param errors 验证错误列表
 * @returns 格式化后的错误消息
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return '';
  }

  const lines = errors.map(error => {
    const desc = error.description ? `（${error.description}）` : '';
    return `  • ${error.parameterName}${desc}`;
  });

  return `请填写以下必填参数后再发送：\n${lines.join('\n')}`;
}

/**
 * 收集所有参数（包括必填和可选）
 * @param contents 提示词内容列表
 * @returns 所有参数列表
 */
export function collectAllParameters(contents: PromptContent[]): PromptParameter[] {
  const allParams: PromptParameter[] = [];
  const seenParams = new Set<string>();

  for (const content of contents) {
    if (!content.isEnabled) {
      continue;
    }

    if (content.parameters && Array.isArray(content.parameters)) {
      for (const param of content.parameters) {
        // 去重（同名参数只保留第一个）
        if (!seenParams.has(param.name)) {
          seenParams.add(param.name);
          allParams.push(param);
        }
      }
    }
  }

  return allParams;
}

