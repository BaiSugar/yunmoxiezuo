/**
 * 权限配置文件
 * 统一管理所有权限定义、权限常量和默认权限分配
 */

// ============================================
// 1. 权限常量（供代码中使用）
// ============================================

export const DASHBOARD_PERMISSIONS = {
  VIEW: 'dashboard:view',
} as const;

export const USER_PERMISSIONS = {
  LIST: 'user:list',
  VIEW: 'user:view',
  CREATE: 'user:create',
  UPDATE: 'user:update',
  DELETE: 'user:delete',
  BAN: 'user:ban',
  ASSIGN_ROLES: 'user:assign_roles',
} as const;

export const ROLE_PERMISSIONS = {
  VIEW: 'permission:role:view',
  LIST: 'permission:role:list',
  CREATE: 'permission:role:create',
  UPDATE: 'permission:role:update',
  DELETE: 'permission:role:delete',
  ASSIGN: 'permission:role:assign',
} as const;

export const PERMISSION_PERMISSIONS = {
  VIEW: 'permission:view',
  LIST: 'permission:list',
  CREATE: 'permission:create',
  UPDATE: 'permission:update',
  DELETE: 'permission:delete',
} as const;

export const NOVEL_PERMISSIONS = {
  LIST: 'novel:list',
  VIEW: 'novel:view',
  CREATE: 'novel:create',
  UPDATE: 'novel:update',
  DELETE: 'novel:delete',
  PUBLISH: 'novel:publish',
  EXPORT: 'novel:export',
} as const;

export const ANNOUNCEMENT_PERMISSIONS = {
  CREATE: 'announcement:create',
  READ: 'announcement:read',
  UPDATE: 'announcement:update',
  DELETE: 'announcement:delete',
  PUBLISH: 'announcement:publish',
  PUSH: 'announcement:push',
  STATS: 'announcement:stats',
  VIEW: 'announcement:view',
  CLICK: 'announcement:click',
} as const;

export const PROMPT_PERMISSIONS = {
  LIST: 'prompt:list',
  VIEW: 'prompt:view',
  CREATE: 'prompt:create',
  UPDATE: 'prompt:update',
  DELETE: 'prompt:delete',
  USE: 'prompt:use',
  PUBLISH: 'prompt:publish',
  STATS: 'prompt:stats',
  BATCH_IMPORT: 'prompt:batch_import',
  EXPORT: 'prompt:export',
  // 批量管理
  BATCH_UPDATE: 'prompt:batch_update',
  // 举报相关
  REPORT: 'prompt:report',
  REPORT_VIEW: 'prompt:report:view',
  REPORT_REVIEW: 'prompt:report:review',
  // 分类管理
  CATEGORY_VIEW: 'prompt:category:view',
  CATEGORY_CREATE: 'prompt:category:create',
  CATEGORY_UPDATE: 'prompt:category:update',
  CATEGORY_DELETE: 'prompt:category:delete',
  // 管理员权限
  MANAGE_ALL: 'prompt:manage:all',
  REVIEW: 'prompt:review',
  BAN: 'prompt:ban',
  UNBAN: 'prompt:unban',
  FORCE_DELETE: 'prompt:force_delete',
} as const;

export const AI_MODEL_PERMISSIONS = {
  // 提供商管理
  PROVIDER_CREATE: 'ai:provider:create',
  PROVIDER_READ: 'ai:provider:read',
  PROVIDER_UPDATE: 'ai:provider:update',
  PROVIDER_DELETE: 'ai:provider:delete',
  PROVIDER_TEST: 'ai:provider:test',
  // 模型管理
  MODEL_CREATE: 'ai:model:create',
  MODEL_READ: 'ai:model:read',
  MODEL_UPDATE: 'ai:model:update',
  MODEL_DELETE: 'ai:model:delete',
  // 聊天补全
  CHAT_CREATE: 'ai:chat:create',
  CHAT_READ: 'ai:chat:read',
} as const;

export const GENERATION_PERMISSIONS = {
  // AI写作生成
  WRITING_GENERATE: 'generation:writing:generate',
  // 角色扮演生成
  ROLEPLAY_GENERATE: 'generation:roleplay:generate',
} as const;

export const MEMBERSHIP_PERMISSIONS = {
  // 会员套餐管理（管理员）
  PLAN_CREATE: 'membership:plan:create',
  PLAN_UPDATE: 'membership:plan:update',
  PLAN_DELETE: 'membership:plan:delete',
  // 用户会员管理（管理员）
  USER_VIEW: 'membership:user:view',        // 查看用户会员信息
  USER_ACTIVATE: 'membership:user:activate', // 为用户开通会员
  // 会员功能入口（前端菜单，根据会员等级显示）
  ACCESS_ADVANCED_MODELS: 'membership:feature:advanced_models',  // 高级模型入口
  ACCESS_API: 'membership:feature:api',                          // API 功能入口
  ACCESS_ANALYTICS: 'membership:feature:analytics',              // 高级分析入口
  ACCESS_TEAM: 'membership:feature:team',                        // 团队协作入口
} as const;

export const TOKEN_PERMISSIONS = {
  // 字数包管理（管理员）
  PACKAGE_CREATE: 'token:package:create',
  PACKAGE_UPDATE: 'token:package:update',
  PACKAGE_DELETE: 'token:package:delete',
} as const;

export const REDEMPTION_PERMISSIONS = {
  // 卡密管理（管理员）
  CODE_CREATE: 'redemption:code:create',
  CODE_VIEW: 'redemption:code:view',
  CODE_UPDATE: 'redemption:code:update',
} as const;

export const TOKEN_CONSUMPTION_PERMISSIONS = {
  // 字数消耗权限
  VIEW_RECORDS: 'token-consumption:view-records',
  VIEW_STATISTICS: 'token-consumption:view-statistics',
  ADMIN_MANAGE: 'token-consumption:admin-manage',
  RESET_QUOTA: 'token-consumption:reset-quota',
} as const;

export const TOOL_PERMISSIONS = {
  // 工具箱管理权限
  VIEW: 'tool:view',
  MANAGE: 'tool:manage',
  UPDATE: 'tool:update',
  USE: 'tool:use',
} as const;

export const SYSTEM_SETTINGS_PERMISSIONS = {
  // 系统配置管理权限
  VIEW: 'system-settings:view',
  READ: 'system-settings:read',
  UPDATE: 'system-settings:update',
  UPDATE_BATCH: 'system-settings:update-batch',
} as const;

export const EMAIL_TEMPLATE_PERMISSIONS = {
  VIEW: 'email:template:view',
  CREATE: 'email:template:create',
  UPDATE: 'email:template:update',
  DELETE: 'email:template:delete',
} as const;

export const EDITOR_SETTINGS_PERMISSIONS = {
  VIEW: 'editor-settings:view',
  UPDATE: 'editor-settings:update',
  RESET: 'editor-settings:reset',
} as const;

export const FONT_PERMISSIONS = {
  VIEW: 'font:view',
  UPLOAD: 'font:upload',
  UPDATE: 'font:update',
  DELETE: 'font:delete',
} as const;

export const BOOK_CREATION_PERMISSIONS = {
  CREATE_TASK: 'book_creation:task:create',
  EXECUTE_STAGE: 'book_creation:stage:execute',
  OPTIMIZE_STAGE: 'book_creation:stage:optimize',
  VIEW_TASK: 'book_creation:task:view',
  CANCEL_TASK: 'book_creation:task:cancel',
  VIEW_ALL_TASKS: 'book_creation:admin:view_all',
} as const;

// 导出所有权限常量
export const PERMISSIONS = {
  DASHBOARD: DASHBOARD_PERMISSIONS,
  USER: USER_PERMISSIONS,
  ROLE: ROLE_PERMISSIONS,
  PERMISSION: PERMISSION_PERMISSIONS,
  NOVEL: NOVEL_PERMISSIONS,
  PROMPT: PROMPT_PERMISSIONS,
  AI_MODEL: AI_MODEL_PERMISSIONS,
  GENERATION: GENERATION_PERMISSIONS,
  MEMBERSHIP: MEMBERSHIP_PERMISSIONS,
  TOKEN: TOKEN_PERMISSIONS,
  REDEMPTION: REDEMPTION_PERMISSIONS,
  TOKEN_CONSUMPTION: TOKEN_CONSUMPTION_PERMISSIONS,
  TOOL: TOOL_PERMISSIONS,
  SYSTEM_SETTINGS: SYSTEM_SETTINGS_PERMISSIONS,
  EMAIL_TEMPLATE: EMAIL_TEMPLATE_PERMISSIONS,
  EDITOR_SETTINGS: EDITOR_SETTINGS_PERMISSIONS,
  FONT: FONT_PERMISSIONS,
  BOOK_CREATION: BOOK_CREATION_PERMISSIONS,
} as const;

// 权限代码类型
export type PermissionCode =
  | typeof DASHBOARD_PERMISSIONS[keyof typeof DASHBOARD_PERMISSIONS]
  | typeof USER_PERMISSIONS[keyof typeof USER_PERMISSIONS]
  | typeof ROLE_PERMISSIONS[keyof typeof ROLE_PERMISSIONS]
  | typeof PERMISSION_PERMISSIONS[keyof typeof PERMISSION_PERMISSIONS]
  | typeof NOVEL_PERMISSIONS[keyof typeof NOVEL_PERMISSIONS]
  | typeof PROMPT_PERMISSIONS[keyof typeof PROMPT_PERMISSIONS]
  | typeof AI_MODEL_PERMISSIONS[keyof typeof AI_MODEL_PERMISSIONS]
  | typeof GENERATION_PERMISSIONS[keyof typeof GENERATION_PERMISSIONS]
  | typeof MEMBERSHIP_PERMISSIONS[keyof typeof MEMBERSHIP_PERMISSIONS]
  | typeof TOKEN_PERMISSIONS[keyof typeof TOKEN_PERMISSIONS]
  | typeof REDEMPTION_PERMISSIONS[keyof typeof REDEMPTION_PERMISSIONS]
  | typeof TOKEN_CONSUMPTION_PERMISSIONS[keyof typeof TOKEN_CONSUMPTION_PERMISSIONS]
  | typeof TOOL_PERMISSIONS[keyof typeof TOOL_PERMISSIONS]
  | typeof SYSTEM_SETTINGS_PERMISSIONS[keyof typeof SYSTEM_SETTINGS_PERMISSIONS]
  | typeof EMAIL_TEMPLATE_PERMISSIONS[keyof typeof EMAIL_TEMPLATE_PERMISSIONS]
  | typeof EDITOR_SETTINGS_PERMISSIONS[keyof typeof EDITOR_SETTINGS_PERMISSIONS]
  | typeof FONT_PERMISSIONS[keyof typeof FONT_PERMISSIONS]
  | typeof BOOK_CREATION_PERMISSIONS[keyof typeof BOOK_CREATION_PERMISSIONS];

// ============================================
// 2. 权限详细配置（用于自动同步到数据库）
// ============================================

/**
 * 系统所有权限配置
 * 用于启动时自动同步到数据库
 */
export const PERMISSIONS_CONFIG = {
  // 仪表盘
  DASHBOARD: {
    parent: { name: '仪表盘', code: 'dashboard', type: 'menu' },
    children: [
      {
        name: '查看仪表盘',
        code: 'dashboard:view',
        type: 'menu',
        resource: null,
        method: null,
      },
    ],
  },

  // 用户管理
  USER: {
    parent: { name: '用户管理', code: 'user', type: 'menu' },
    children: [
      {
        name: '查看用户列表',
        code: 'user:list',
        type: 'api',
        resource: '/api/v1/users',
        method: 'GET',
      },
      {
        name: '查看用户详情',
        code: 'user:view',
        type: 'api',
        resource: '/api/v1/users/:id',
        method: 'GET',
      },
      {
        name: '更新用户信息',
        code: 'user:update',
        type: 'api',
        resource: '/api/v1/users/:id',
        method: 'PATCH',
      },
      {
        name: '创建用户',
        code: 'user:create',
        type: 'api',
        resource: '/api/v1/users',
        method: 'POST',
      },
      {
        name: '删除用户',
        code: 'user:delete',
        type: 'api',
        resource: '/api/v1/users/:id',
        method: 'DELETE',
      },
      {
        name: '封禁用户',
        code: 'user:ban',
        type: 'button',
        resource: null,
        method: null,
      },
      {
        name: '解封用户',
        code: 'user:unban',
        type: 'button',
        resource: null,
        method: null,
      },
      {
        name: '分配角色',
        code: 'user:assign_roles',
        type: 'button',
        resource: null,
        method: null,
      },
    ],
  },

  // 角色管理
  ROLE: {
    parent: { name: '角色管理', code: 'permission:role', type: 'menu' },
    children: [
      {
        name: '查看角色页面',
        code: 'permission:role:view',
        type: 'menu',
        resource: null,
        method: null,
      },
      {
        name: '查看角色列表',
        code: 'permission:role:list',
        type: 'api',
        resource: '/api/v1/roles',
        method: 'GET',
      },
      {
        name: '创建角色',
        code: 'permission:role:create',
        type: 'api',
        resource: '/api/v1/roles',
        method: 'POST',
      },
      {
        name: '更新角色',
        code: 'permission:role:update',
        type: 'api',
        resource: '/api/v1/roles/:id',
        method: 'PATCH',
      },
      {
        name: '删除角色',
        code: 'permission:role:delete',
        type: 'api',
        resource: '/api/v1/roles/:id',
        method: 'DELETE',
      },
      {
        name: '分配权限',
        code: 'permission:role:assign',
        type: 'button',
        resource: null,
        method: null,
      },
    ],
  },

  // 权限管理
  PERMISSION: {
    parent: { name: '权限管理', code: 'permission', type: 'menu' },
    children: [
      {
        name: '查看权限页面',
        code: 'permission:view',
        type: 'menu',
        resource: null,
        method: null,
      },
      {
        name: '查看权限列表',
        code: 'permission:list',
        type: 'api',
        resource: '/api/v1/permissions',
        method: 'GET',
      },
      {
        name: '创建权限',
        code: 'permission:create',
        type: 'api',
        resource: '/api/v1/permissions',
        method: 'POST',
      },
      {
        name: '更新权限',
        code: 'permission:update',
        type: 'api',
        resource: '/api/v1/permissions/:id',
        method: 'PATCH',
      },
      {
        name: '删除权限',
        code: 'permission:delete',
        type: 'api',
        resource: '/api/v1/permissions/:id',
        method: 'DELETE',
      },
    ],
  },

  // 小说管理
  NOVEL: {
    parent: { name: '小说管理', code: 'novel', type: 'menu' },
    children: [
      {
        name: '查看小说列表',
        code: 'novel:list',
        type: 'api',
        resource: '/api/v1/novels',
        method: 'GET',
      },
      {
        name: '查看小说详情',
        code: 'novel:view',
        type: 'api',
        resource: '/api/v1/novels/:id',
        method: 'GET',
      },
      {
        name: '创建小说',
        code: 'novel:create',
        type: 'api',
        resource: '/api/v1/novels',
        method: 'POST',
      },
      {
        name: '更新小说',
        code: 'novel:update',
        type: 'api',
        resource: '/api/v1/novels/:id',
        method: 'PATCH',
      },
      {
        name: '删除小说',
        code: 'novel:delete',
        type: 'api',
        resource: '/api/v1/novels/:id',
        method: 'DELETE',
      },
      {
        name: '发布小说',
        code: 'novel:publish',
        type: 'button',
        resource: null,
        method: null,
      },
      {
        name: '导出小说',
        code: 'novel:export',
        type: 'button',
        resource: null,
        method: null,
      },
    ],
  },

  // 提示词管理
  PROMPT: {
    parent: { name: '提示词管理', code: 'prompt', type: 'menu' },
    children: [
      // 基础权限（所有用户）
      {
        name: '查看提示词列表',
        code: 'prompt:list',
        type: 'api',
        resource: '/api/v1/prompts',
        method: 'GET',
      },
      {
        name: '查看提示词详情',
        code: 'prompt:view',
        type: 'api',
        resource: '/api/v1/prompts/:id',
        method: 'GET',
      },
      {
        name: '使用提示词',
        code: 'prompt:use',
        type: 'button',
        resource: null,
        method: null,
      },

      // 创作权限（普通用户可创建）
      {
        name: '创建提示词',
        code: 'prompt:create',
        type: 'api',
        resource: '/api/v1/prompts',
        method: 'POST',
      },
      {
        name: '更新提示词',
        code: 'prompt:update',
        type: 'api',
        resource: '/api/v1/prompts/:id',
        method: 'PATCH',
      },
      {
        name: '删除提示词',
        code: 'prompt:delete',
        type: 'api',
        resource: '/api/v1/prompts/:id',
        method: 'DELETE',
      },
      {
        name: '发布提示词',
        code: 'prompt:publish',
        type: 'button',
        resource: null,
        method: null,
      },
      {
        name: '查看统计数据',
        code: 'prompt:stats',
        type: 'api',
        resource: '/api/v1/prompts/:id/stats',
        method: 'GET',
      },
      {
        name: '批量更新提示词',
        code: 'prompt:batch_update',
        type: 'api',
        resource: '/api/v1/prompts/batch-update',
        method: 'POST',
      },

      // 举报相关（普通用户可举报）
      {
        name: '举报提示词',
        code: 'prompt:report',
        type: 'api',
        resource: '/api/v1/prompts/reports/:promptId',
        method: 'POST',
      },
      {
        name: '查看举报记录',
        code: 'prompt:report:view',
        type: 'api',
        resource: '/api/v1/prompts/reports/my',
        method: 'GET',
      },

      // 分类管理（管理员）
      {
        name: '查看提示词分类',
        code: 'prompt:category:view',
        type: 'menu',
        resource: '/api/v1/prompt-categories',
        method: 'GET',
      },
      {
        name: '创建提示词分类',
        code: 'prompt:category:create',
        type: 'api',
        resource: '/api/v1/prompt-categories',
        method: 'POST',
      },
      {
        name: '更新提示词分类',
        code: 'prompt:category:update',
        type: 'api',
        resource: '/api/v1/prompt-categories/:id',
        method: 'PATCH',
      },
      {
        name: '删除提示词分类',
        code: 'prompt:category:delete',
        type: 'api',
        resource: '/api/v1/prompt-categories/:id',
        method: 'DELETE',
      },

      // 管理员权限
      {
        name: '管理所有提示词',
        code: 'prompt:manage:all',
        type: 'api',
        resource: null,
        method: null,
      },
      {
        name: '审核举报',
        code: 'prompt:report:review',
        type: 'api',
        resource: '/api/v1/prompts/reports/:reportId/review',
        method: 'PATCH',
      },
      {
        name: '审核提示词',
        code: 'prompt:review',
        type: 'button',
        resource: null,
        method: null,
      },
      {
        name: '封禁提示词',
        code: 'prompt:ban',
        type: 'api',
        resource: '/api/v1/prompts/:id/ban',
        method: 'POST',
      },
      {
        name: '解封提示词',
        code: 'prompt:unban',
        type: 'api',
        resource: '/api/v1/prompts/:id/unban',
        method: 'POST',
      },
      {
        name: '强制删除提示词',
        code: 'prompt:force_delete',
        type: 'button',
        resource: null,
        method: null,
      },
    ],
  },

  // AI 模型管理
  AI_MODEL: {
    parent: { name: 'AI 模型管理', code: 'ai', type: 'menu' },
    children: [
      // 提供商管理（管理员）
      {
        name: '创建 AI 提供商',
        code: 'ai:provider:create',
        type: 'api',
        resource: '/api/v1/ai-providers',
        method: 'POST',
      },
      {
        name: '查看 AI 提供商',
        code: 'ai:provider:read',
        type: 'api',
        resource: '/api/v1/ai-providers',
        method: 'GET',
      },
      {
        name: '更新 AI 提供商',
        code: 'ai:provider:update',
        type: 'api',
        resource: '/api/v1/ai-providers/:id',
        method: 'PUT',
      },
      {
        name: '删除 AI 提供商',
        code: 'ai:provider:delete',
        type: 'api',
        resource: '/api/v1/ai-providers/:id',
        method: 'DELETE',
      },
      {
        name: '测试 AI 提供商连接',
        code: 'ai:provider:test',
        type: 'button',
        resource: null,
        method: null,
      },

      // 模型管理（管理员）
      {
        name: '创建 AI 模型',
        code: 'ai:model:create',
        type: 'api',
        resource: '/api/v1/ai-models',
        method: 'POST',
      },
      {
        name: '查看 AI 模型',
        code: 'ai:model:read',
        type: 'api',
        resource: '/api/v1/ai-models',
        method: 'GET',
      },
      {
        name: '更新 AI 模型',
        code: 'ai:model:update',
        type: 'api',
        resource: '/api/v1/ai-models/:id',
        method: 'PUT',
      },
      {
        name: '删除 AI 模型',
        code: 'ai:model:delete',
        type: 'api',
        resource: '/api/v1/ai-models/:id',
        method: 'DELETE',
      },

      // 聊天补全（普通用户）
      {
        name: '创建聊天补全',
        code: 'ai:chat:create',
        type: 'api',
        resource: '/api/v1/chat/completions',
        method: 'POST',
      },
      {
        name: '查看聊天信息',
        code: 'ai:chat:read',
        type: 'api',
        resource: '/api/v1/chat/completions/models',
        method: 'GET',
      },
    ],
  },

  // AI 生成系统
  GENERATION: {
    parent: { name: 'AI 生成', code: 'generation', type: 'menu' },
    children: [
      {
        name: 'AI写作生成',
        code: 'generation:writing:generate',
        type: 'api',
        resource: '/api/v1/generation/writing',
        method: 'POST',
      },
      {
        name: '角色扮演生成',
        code: 'generation:roleplay:generate',
        type: 'api',
        resource: '/api/v1/generation/roleplay',
        method: 'POST',
      },
    ],
  },

  // 会员系统
  MEMBERSHIP: {
    parent: { name: '会员系统', code: 'membership', type: 'menu' },
    children: [
      // 管理员权限
      {
        name: '创建会员套餐',
        code: 'membership:plan:create',
        type: 'api',
        resource: '/api/v1/membership-plans',
        method: 'POST',
      },
      {
        name: '更新会员套餐',
        code: 'membership:plan:update',
        type: 'api',
        resource: '/api/v1/membership-plans/:id',
        method: 'PUT',
      },
      {
        name: '删除会员套餐',
        code: 'membership:plan:delete',
        type: 'api',
        resource: '/api/v1/membership-plans/:id',
        method: 'DELETE',
      },
    ],
  },

  // 字数包系统
  TOKEN_PACKAGE: {
    parent: { name: '字数包管理', code: 'token', type: 'menu' },
    children: [
      {
        name: '创建字数包',
        code: 'token:package:create',
        type: 'api',
        resource: '/api/v1/token-packages',
        method: 'POST',
      },
      {
        name: '更新字数包',
        code: 'token:package:update',
        type: 'api',
        resource: '/api/v1/token-packages/:id',
        method: 'PUT',
      },
      {
        name: '删除字数包',
        code: 'token:package:delete',
        type: 'api',
        resource: '/api/v1/token-packages/:id',
        method: 'DELETE',
      },
    ],
  },

  // 卡密系统
  REDEMPTION: {
    parent: { name: '卡密管理', code: 'redemption', type: 'menu' },
    children: [
      {
        name: '创建卡密',
        code: 'redemption:code:create',
        type: 'api',
        resource: '/api/v1/redemption-codes',
        method: 'POST',
      },
      {
        name: '查看卡密记录',
        code: 'redemption:code:view',
        type: 'api',
        resource: '/api/v1/redemption-codes/:id/records',
        method: 'GET',
      },
      {
        name: '管理卡密',
        code: 'redemption:code:update',
        type: 'api',
        resource: '/api/v1/redemption-codes/:id/deactivate',
        method: 'POST',
      },
    ],
  },

  // 公告系统
  ANNOUNCEMENT: {
    parent: { name: '公告系统', code: 'announcement', type: 'menu' },
    children: [
      {
        name: '创建公告',
        code: 'announcement:create',
        type: 'api',
        resource: '/api/v1/announcements',
        method: 'POST',
      },
      {
        name: '查看公告列表',
        code: 'announcement:read',
        type: 'api',
        resource: '/api/v1/announcements',
        method: 'GET',
      },
      {
        name: '更新公告',
        code: 'announcement:update',
        type: 'api',
        resource: '/api/v1/announcements/:id',
        method: 'PUT',
      },
      {
        name: '删除公告',
        code: 'announcement:delete',
        type: 'api',
        resource: '/api/v1/announcements/:id',
        method: 'DELETE',
      },
      {
        name: '发布公告',
        code: 'announcement:publish',
        type: 'api',
        resource: '/api/v1/announcements/:id/publish',
        method: 'POST',
      },
      {
        name: '推送公告',
        code: 'announcement:push',
        type: 'api',
        resource: '/api/v1/announcements/:id/push',
        method: 'POST',
      },
      {
        name: '查看公告统计',
        code: 'announcement:stats',
        type: 'api',
        resource: '/api/v1/announcements/:id/stats',
        method: 'GET',
      },
      {
        name: '查看有效公告',
        code: 'announcement:view',
        type: 'api',
        resource: '/api/v1/announcements/active',
        method: 'GET',
      },
      {
        name: '点击公告链接',
        code: 'announcement:click',
        type: 'button',
        resource: null,
        method: null,
      },
    ],
  },

  // 字数消耗系统
  TOKEN_CONSUMPTION: {
    parent: { name: '字数消耗系统', code: 'token-consumption', type: 'menu' },
    children: [
      {
        name: '查看消耗记录',
        code: 'token-consumption:view-records',
        type: 'api',
        resource: '/api/v1/token-balances/consumptions',
        method: 'GET',
      },
      {
        name: '查看消耗统计',
        code: 'token-consumption:view-statistics',
        type: 'api',
        resource: '/api/v1/token-balances/statistics',
        method: 'GET',
      },
      {
        name: '管理用户额度',
        code: 'token-consumption:admin-manage',
        type: 'api',
        resource: '/api/v1/token-balances/:userId/daily-quota',
        method: 'POST',
      },
      {
        name: '重置每日额度',
        code: 'token-consumption:reset-quota',
        type: 'api',
        resource: '/api/v1/token-balances/admin/reset-daily-quotas',
        method: 'POST',
      },
    ],
  },

  // 工具箱系统
  TOOL: {
    parent: { name: '工具箱', code: 'tool', type: 'menu' },
    children: [
      {
        name: '查看工具列表',
        code: 'tool:view',
        type: 'api',
        resource: '/api/v1/admin/tools',
        method: 'GET',
      },
      {
        name: '管理工具',
        code: 'tool:manage',
        type: 'button',
        resource: null,
        method: null,
      },
      {
        name: '更新工具配置',
        code: 'tool:update',
        type: 'api',
        resource: '/api/v1/admin/tools/:id',
        method: 'PUT',
      },
      {
        name: '使用工具',
        code: 'tool:use',
        type: 'api',
        resource: '/api/v1/tools/novel-search/search',
        method: 'POST',
      },
    ],
  },

  // 系统配置
  SYSTEM_SETTINGS: {
    parent: { name: '系统配置', code: 'system-settings', type: 'menu' },
    children: [
      {
        name: '查看系统配置页面',
        code: 'system-settings:view',
        type: 'menu',
        resource: null,
        method: null,
      },
      {
        name: '读取系统配置',
        code: 'system-settings:read',
        type: 'api',
        resource: '/api/v1/system-settings',
        method: 'GET',
      },
      {
        name: '更新系统配置',
        code: 'system-settings:update',
        type: 'api',
        resource: '/api/v1/system-settings/:id',
        method: 'PUT',
      },
      {
        name: '批量更新系统配置',
        code: 'system-settings:update-batch',
        type: 'api',
        resource: '/api/v1/system-settings/batch',
        method: 'PUT',
      },
    ],
  },

  EMAIL_TEMPLATE: {
    parent: { name: '邮件模板', code: 'email-template', type: 'menu' },
    children: [
      {
        name: '查看邮件模板',
        code: 'email:template:view',
        type: 'menu',
        resource: '/api/v1/email-templates',
        method: 'GET',
      },
      {
        name: '创建邮件模板',
        code: 'email:template:create',
        type: 'api',
        resource: '/api/v1/email-templates',
        method: 'POST',
      },
      {
        name: '更新邮件模板',
        code: 'email:template:update',
        type: 'api',
        resource: '/api/v1/email-templates/:id',
        method: 'PUT',
      },
      {
        name: '删除邮件模板',
        code: 'email:template:delete',
        type: 'api',
        resource: '/api/v1/email-templates/:id',
        method: 'DELETE',
      },
    ],
  },

  // 编辑器设置
  EDITOR_SETTINGS: {
    parent: { name: '编辑器设置', code: 'editor-settings', type: 'menu' },
    children: [
      {
        name: '查看编辑器设置',
        code: 'editor-settings:view',
        type: 'api',
        resource: '/api/v1/editor-settings',
        method: 'GET',
      },
      {
        name: '更新编辑器设置',
        code: 'editor-settings:update',
        type: 'api',
        resource: '/api/v1/editor-settings',
        method: 'PUT',
      },
      {
        name: '重置编辑器设置',
        code: 'editor-settings:reset',
        type: 'api',
        resource: '/api/v1/editor-settings/reset',
        method: 'POST',
      },
    ],
  },

  // 字体管理
  FONT: {
    parent: { name: '字体管理', code: 'font', type: 'menu' },
    children: [
      {
        name: '查看字体列表',
        code: 'font:view',
        type: 'api',
        resource: '/api/v1/fonts',
        method: 'GET',
      },
      {
        name: '上传字体',
        code: 'font:upload',
        type: 'api',
        resource: '/api/v1/fonts/upload',
        method: 'POST',
      },
      {
        name: '更新字体信息',
        code: 'font:update',
        type: 'api',
        resource: '/api/v1/fonts/:id',
        method: 'PUT',
      },
      {
        name: '删除字体',
        code: 'font:delete',
        type: 'api',
        resource: '/api/v1/fonts/:id',
        method: 'DELETE',
      },
    ],
  },

  // 一键成书系统
  BOOK_CREATION: {
    parent: { name: '一键成书', code: 'book_creation', type: 'menu' },
    children: [
      {
        name: '创建成书任务',
        code: 'book_creation:task:create',
        type: 'api',
        resource: '/api/v1/book-creation/tasks',
        method: 'POST',
      },
      {
        name: '查看任务详情',
        code: 'book_creation:task:view',
        type: 'api',
        resource: '/api/v1/book-creation/tasks/:id',
        method: 'GET',
      },
      {
        name: '执行阶段',
        code: 'book_creation:stage:execute',
        type: 'api',
        resource: '/api/v1/book-creation/tasks/:id/execute-stage',
        method: 'POST',
      },
      {
        name: '优化阶段',
        code: 'book_creation:stage:optimize',
        type: 'api',
        resource: '/api/v1/book-creation/tasks/:id/stages/:stageType/optimize',
        method: 'POST',
      },
      {
        name: '取消任务',
        code: 'book_creation:task:cancel',
        type: 'api',
        resource: '/api/v1/book-creation/tasks/:id',
        method: 'DELETE',
      },
      {
        name: '查看所有任务（管理员）',
        code: 'book_creation:admin:view_all',
        type: 'api',
        resource: '/api/v1/book-creation/admin/tasks',
        method: 'GET',
      },
    ],
  },
};

/**
 * 普通用户的默认权限
 * 所有注册用户都会自动获得这些权限
 */
export const DEFAULT_USER_PERMISSIONS = [
  // ==================== 仪表盘权限 ====================
  'dashboard:view',              // 查看仪表盘页面

  // ==================== 用户基础权限 ====================
  'user:view',                   // 查看用户信息（仅自己）
  'user:update',                 // 更新用户信息（仅自己）

  // ==================== 小说管理权限 ====================
  'novel:list',                  // 查看小说列表（仅自己的）
  'novel:view',                  // 查看小说详情（仅自己的）
  'novel:create',                // 创建小说
  'novel:update',                // 更新小说（仅自己的）
  'novel:delete',                // 删除小说（仅自己的）
  'novel:publish',               // 发布小说（仅自己的）
  'novel:export',                // 导出小说（仅自己的）

  // ==================== 提示词管理权限 ====================
  'prompt:list',                 // 查看提示词列表（公开+自己的）
  'prompt:view',                 // 查看提示词详情
  'prompt:use',                  // 使用提示词
  'prompt:create',               // 创建提示词
  'prompt:update',               // 更新提示词（仅自己的）
  'prompt:delete',               // 删除提示词（仅自己的）
  'prompt:publish',              // 发布提示词（仅自己的）
  'prompt:stats',                // 查看提示词统计数据
  'prompt:batch_update',         // 批量更新提示词（仅自己的）
  'prompt:report',               // 举报提示词
  'prompt:report:view',          // 查看自己的举报记录

  // ==================== AI 模型管理权限 ====================
  'ai:model:read',               // 查看 AI 模型列表（查看可用模型）
  'ai:chat:create',              // 创建聊天补全（使用 AI 对话）
  'ai:chat:read',                // 查看聊天信息

  // ==================== AI 生成权限 ====================
  'generation:writing:generate', // AI写作生成
  'generation:roleplay:generate', // 角色扮演生成

  // ==================== 公告系统权限 ====================
  'announcement:view',           // 查看有效公告
  'announcement:read',           // 标记公告已读
  'announcement:click',          // 点击公告链接

  // ==================== 字数消耗系统权限 ====================
  'token-consumption:view-records',    // 查看消耗记录
  'token-consumption:view-statistics', // 查看消耗统计

  // ==================== 编辑器设置权限 ====================
  'editor-settings:view',              // 查看编辑器设置
  'editor-settings:update',            // 更新编辑器设置
  'editor-settings:reset',             // 重置编辑器设置

  // ==================== 一键成书权限 ====================
  'book_creation:task:create',         // 创建成书任务
  'book_creation:task:view',           // 查看任务详情
  'book_creation:stage:execute',       // 执行阶段
  'book_creation:stage:optimize',      // 优化阶段
  'book_creation:task:cancel',         // 取消任务
];
