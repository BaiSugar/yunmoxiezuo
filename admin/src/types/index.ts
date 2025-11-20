// 统一导出所有类型定义

// API 相关
export type {
  ApiResponse,
  ApiErrorResponse,
  PaginationMeta,
  PaginatedResponse,
} from './api';

// 用户相关
export {
  UserStatus,
} from './user';

export type {
  UserStatusType,
  User,
  LoginUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  QueryUserDto,
  CreateUserDto,
  UpdateUserDto,
  UpdateProfileDto,
  ChangePasswordDto,
  AssignRolesDto,
} from './user';

// 角色相关
export type {
  Role,
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionsDto,
} from './role';

// 权限相关
export type {
  Permission,
  PermissionTreeNode,
  CreatePermissionDto,
  UpdatePermissionDto,
} from './permission';

// AI 模型相关
export {
  ChatCompletionSource,
  ProviderStatus,
  ModelStatus,
  ApiKeyStatus,
  RotationStrategy,
} from './ai-model';

export type {
  AiProvider,
  AiModel,
  ApiKey,
  ProviderConfig,
  ProviderCapabilities,
  ModelPricing,
  ModelLimits,
  CreateProviderDto,
  UpdateProviderDto,
  CreateModelDto,
  UpdateModelDto,
  CreateApiKeyDto,
  UpdateApiKeyDto,
  BulkCreateApiKeyDto,
  TestConnectionResponse,
} from './ai-model';

// 公告相关
export {
  AnnouncementType,
  AnnouncementLevel,
  LinkTarget,
  LinkPosition,
  TargetType,
} from './announcement';

export type {
  Announcement,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  QueryAnnouncementDto,
  AnnouncementStats,
  AnnouncementListResponse,
} from './announcement';

// 会员相关
export type {
  MembershipPlan,
  CreateMembershipPlanDto,
  UpdateMembershipPlanDto,
  QueryMembershipPlanDto,
  MembershipPlanListResponse,
  UserMembership,
} from './membership';

// 字数包相关
export type {
  TokenPackage,
  CreateTokenPackageDto,
  UpdateTokenPackageDto,
  QueryTokenPackageDto,
  TokenPackageListResponse,
} from './token-package';

// 卡密相关
export { CodeType } from './redemption-code';
export type {
  RedemptionCode,
  CreateRedemptionCodeDto,
  BatchGenerateCodesDto,
  UpdateRedemptionCodeDto,
  QueryRedemptionCodeDto,
  RedemptionCodeListResponse,
  RedemptionRecord,
  CodeStatistics,
} from './redemption-code';

// 提示词相关
export type {
  Prompt,
  PromptReport,
} from './prompt';