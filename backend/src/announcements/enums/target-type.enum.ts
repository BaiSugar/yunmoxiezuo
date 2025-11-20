/**
 * 目标受众类型枚举
 */
export enum TargetType {
  /** 所有用户 */
  ALL = 'all',
  
  /** 特定角色 */
  ROLE = 'role',
  
  /** 特定用户 */
  USER = 'user',
  
  /** 特定会员等级 */
  MEMBERSHIP = 'membership',
}
