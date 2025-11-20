import request from '../utils/request';

export interface Tool {
  id: number;
  name: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  category: string;
  isEnabled: boolean;
  requiresMembership: boolean;
  allowedMembershipLevels: string[];
  orderNum: number;
  config: Record<string, any>;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateToolDto {
  title?: string;
  description?: string;
  icon?: string;
  isEnabled?: boolean;
  requiresMembership?: boolean;
  allowedMembershipLevels?: string[];
  orderNum?: number;
  config?: Record<string, any>;
}

/**
 * 获取工具列表
 */
export const getToolList = async () => {
  return request.get('/admin/tools');
};

/**
 * 获取工具详情
 */
export const getToolDetail = async (id: number) => {
  return request.get(`/admin/tools/${id}`);
};

/**
 * 更新工具配置
 */
export const updateTool = async (id: number, data: UpdateToolDto) => {
  return request.put(`/admin/tools/${id}`, data);
};

/**
 * 启用/禁用工具
 */
export const toggleTool = async (id: number) => {
  return request.patch(`/admin/tools/${id}/toggle`);
};

/**
 * 获取工具统计
 */
export const getToolStats = async (id: number) => {
  return request.get(`/admin/tools/${id}/stats`);
};
