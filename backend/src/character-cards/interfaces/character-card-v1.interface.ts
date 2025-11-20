/**
 * V1 角色卡数据（向后兼容）
 * 简单的扁平结构
 */
export interface CharacterCardV1 {
  /** 角色名称 */
  name: string;
  
  /** 角色描述 */
  description: string;
  
  /** 性格描述 */
  personality: string;
  
  /** 场景描述 */
  scenario: string;
  
  /** 首条消息 */
  first_mes: string;
  
  /** 示例消息 */
  mes_example: string;
  
  /** 创建者评论 */
  creatorcomment?: string;
  
  /** 标签 */
  tags?: string[];
  
  /** 话痨度 */
  talkativeness?: number;
  
  /** 是否收藏 */
  fav?: boolean | string;
  
  /** 创建日期 */
  create_date?: string;
}
