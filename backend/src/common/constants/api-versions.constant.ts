/**
 * API 版本常量
 * 统一管理 API 版本号，避免硬编码
 */
export const API_VERSIONS = {
  V1: 'api/v1',
  V2: 'api/v2',
  V3: 'api/v3',
} as const;

/**
 * 构建 API 路径
 * @param version API 版本
 * @param module 模块名称
 * @returns 完整的 API 路径
 * @example
 * buildApiPath(API_VERSIONS.V1, 'auth') // 'api/v1/auth'
 */
export function buildApiPath(version: string, module: string): string {
  return `${version}/${module}`;
}

/**
 * API 版本类型
 */
export type ApiVersion = (typeof API_VERSIONS)[keyof typeof API_VERSIONS];

