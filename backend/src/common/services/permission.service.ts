import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../users/entities/role.entity';
import { Permission } from '../../users/entities/permission.entity';

@Injectable()
export class PermissionService {
  // 超级管理员角色代码
  private readonly SUPER_ADMIN_ROLE = 'super_admin';

  // 缓存过期时间：1小时
  private readonly CACHE_TTL = 3600;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  /**
   * 判断用户是否为超级管理员
   */
  isSuperAdmin(user: User): boolean {
    if (!user.roles || user.roles.length === 0) {
      return false;
    }
    return user.roles.some((role) => role.code === this.SUPER_ADMIN_ROLE);
  }

  /**
   * 获取用户的所有权限代码
   * 优先从缓存读取，缓存不存在则从数据库查询并缓存
   */
  async getUserPermissions(userId: number): Promise<string[]> {
    const cacheKey = `user:permissions:${userId}`;

    // 尝试从缓存获取
    const cached = await this.cacheManager.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // 从数据库查询
    const permissions = await this.fetchUserPermissionsFromDB(userId);

    // 存入缓存
    await this.cacheManager.set(cacheKey, permissions, this.CACHE_TTL);

    return permissions;
  }

  /**
   * 从数据库获取用户权限
   */
  private async fetchUserPermissionsFromDB(
    userId: number,
  ): Promise<string[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      return [];
    }

    // 收集所有权限代码
    const permissionCodes = new Set<string>();
    user.roles?.forEach((role) => {
      role.permissions?.forEach((permission) => {
        permissionCodes.add(permission.code);
      });
    });

    return Array.from(permissionCodes);
  }

  /**
   * 获取角色的所有权限代码
   */
  async getRolePermissions(roleId: number): Promise<string[]> {
    const cacheKey = `role:permissions:${roleId}`;

    // 尝试从缓存获取
    const cached = await this.cacheManager.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // 从数据库查询
    const permissions = await this.fetchRolePermissionsFromDB(roleId);

    // 存入缓存
    await this.cacheManager.set(cacheKey, permissions, this.CACHE_TTL);

    return permissions;
  }

  /**
   * 从数据库获取角色权限
   */
  private async fetchRolePermissionsFromDB(
    roleId: number,
  ): Promise<string[]> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      return [];
    }

    return role.permissions?.map((permission) => permission.code) || [];
  }

  /**
   * 清除用户权限缓存
   * 当用户角色变更时调用
   */
  async clearUserPermissionsCache(userId: number): Promise<void> {
    const cacheKey = `user:permissions:${userId}`;
    await this.cacheManager.del(cacheKey);
  }

  /**
   * 清除角色权限缓存
   * 当角色权限变更时调用
   */
  async clearRolePermissionsCache(roleId: number): Promise<void> {
    const cacheKey = `role:permissions:${roleId}`;
    await this.cacheManager.del(cacheKey);
  }

  /**
   * 清除所有权限相关缓存
   * 当权限系统配置大量变更时调用
   */
  async clearAllPermissionsCache(): Promise<void> {
    // TODO: 实现清除所有权限相关缓存的逻辑
    // 可以使用 Redis 的 SCAN 命令查找所有匹配的 key
  }

  /**
   * 检查用户是否拥有指定权限
   */
  async hasPermission(userId: number, permission: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return userPermissions.includes(permission);
  }

  /**
   * 检查用户是否拥有任一权限
   */
  async hasAnyPermission(
    userId: number,
    permissions: string[],
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return permissions.some((permission) =>
      userPermissions.includes(permission),
    );
  }

  /**
   * 检查用户是否拥有所有权限
   */
  async hasAllPermissions(
    userId: number,
    permissions: string[],
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return permissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }
}

