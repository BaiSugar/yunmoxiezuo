import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission, PermissionStatus, PermissionType } from '../../users/entities/permission.entity';
import { Role } from '../../users/entities/role.entity';
import { User } from '../../users/entities/user.entity';
import { PERMISSIONS_CONFIG, DEFAULT_USER_PERMISSIONS } from '../config/permissions.config';

/**
 * 权限自动同步服务
 * 1. 应用启动时自动同步权限到数据库
 * 2. 为用户自动分配新增的权限
 */
@Injectable()
export class PermissionSyncService implements OnModuleInit {
  private readonly logger = new Logger(PermissionSyncService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 应用启动时执行
   */
  async onModuleInit() {
    this.logger.log('🔄 开始同步权限系统...');
    try {
      await this.syncPermissionsToDatabase();
      await this.assignPermissionsToSuperAdmin();
      await this.assignPermissionsToUserRole();
      this.logger.log('✅ 权限系统同步完成');
    } catch (error) {
      this.logger.error('❌ 权限同步失败:', error);
    }
  }

  /**
   * 同步权限到数据库
   */
  async syncPermissionsToDatabase(): Promise<void> {
    let newCount = 0;
    let updateCount = 0;

    for (const [moduleName, moduleData] of Object.entries(PERMISSIONS_CONFIG)) {
      const { parent, children } = moduleData;

      // 处理父权限
      let parentPermission = await this.permissionRepository.findOne({
        where: { code: parent.code },
      });

      if (!parentPermission) {
        parentPermission = this.permissionRepository.create({
          name: parent.name,
          code: parent.code,
          type: parent.type as PermissionType,
          description: `${parent.name}模块`,
          status: PermissionStatus.ACTIVE,
        });
        await this.permissionRepository.save(parentPermission);
        newCount++;
        this.logger.log(`  ✅ 新增父权限: ${parent.code}`);
      }

      // 处理子权限
      for (const child of children) {
        let childPermission = await this.permissionRepository.findOne({
          where: { code: child.code },
        });

        if (!childPermission) {
          childPermission = this.permissionRepository.create({
            parent: parentPermission,
            name: child.name,
            code: child.code,
            type: child.type as PermissionType,
            resource: child.resource || undefined,
            method: child.method || undefined,
            description: child.name,
            status: PermissionStatus.ACTIVE,
          });
          await this.permissionRepository.save(childPermission);
          newCount++;
          this.logger.log(`    ✅ 新增子权限: ${child.code}`);
        } else {
          // 更新已存在的权限信息
          childPermission.name = child.name;
          childPermission.type = child.type as PermissionType;
          if (child.resource !== null) {
            childPermission.resource = child.resource;
          }
          if (child.method !== null) {
            childPermission.method = child.method;
          }
          childPermission.description = child.name;
          await this.permissionRepository.save(childPermission);
          updateCount++;
        }
      }
    }

    this.logger.log(`📊 新增 ${newCount} 个权限，更新 ${updateCount} 个权限`);
  }

  /**
   * 为超级管理员分配所有权限
   */
  async assignPermissionsToSuperAdmin(): Promise<void> {
    const superAdminRole = await this.roleRepository.findOne({
      where: { code: 'super_admin' },
      relations: ['permissions'],
    });

    if (!superAdminRole) {
      this.logger.warn('⚠️  未找到超级管理员角色');
      return;
    }

    const allPermissions = await this.permissionRepository.find();
    const currentPermissionIds = new Set(
      superAdminRole.permissions?.map((p) => p.id) || [],
    );

    const newPermissions = allPermissions.filter(
      (p) => !currentPermissionIds.has(p.id),
    );

    if (newPermissions.length > 0) {
      superAdminRole.permissions = allPermissions;
      await this.roleRepository.save(superAdminRole);
      this.logger.log(
        `👑 为超级管理员分配了 ${newPermissions.length} 个新权限`,
      );
    }
  }

  /**
   * 为普通用户角色分配默认权限
   */
  async assignPermissionsToUserRole(): Promise<void> {
    const userRole = await this.roleRepository.findOne({
      where: { code: 'user' },
      relations: ['permissions'],
    });

    if (!userRole) {
      this.logger.warn('⚠️  未找到普通用户角色');
      return;
    }

    // 获取默认权限列表
    const defaultPermissions = await this.permissionRepository.find({
      where: DEFAULT_USER_PERMISSIONS.map((code) => ({ code })),
    });

    const currentPermissionIds = new Set(
      userRole.permissions?.map((p) => p.id) || [],
    );

    const newPermissions = defaultPermissions.filter(
      (p) => !currentPermissionIds.has(p.id),
    );

    if (newPermissions.length > 0) {
      userRole.permissions = [
        ...(userRole.permissions || []),
        ...newPermissions,
      ];
      await this.roleRepository.save(userRole);
      this.logger.log(
        `👤 为普通用户角色分配了 ${newPermissions.length} 个新权限`,
      );
    } else {
      this.logger.log(
        `✅ 普通用户角色已拥有所有默认权限 (${defaultPermissions.length} 个)`,
      );
    }
  }

  /**
   * 为用户分配新增的默认权限
   * @param user 用户对象
   */
  async assignNewPermissionsToUser(user: User): Promise<void> {
    // 获取普通用户应该拥有的权限代码列表
    const shouldHavePermissions = DEFAULT_USER_PERMISSIONS;

    // 查询这些权限的ID
    const permissions = await this.permissionRepository.find({
      where: shouldHavePermissions.map((code) => ({ code })),
    });

    // 获取用户角色
    const userWithRoles = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['roles', 'roles.permissions'],
    });

    if (!userWithRoles || !userWithRoles.roles) {
      return;
    }

    // 获取用户当前拥有的所有权限ID（通过角色）
    const currentPermissionIds = new Set<number>();
    for (const role of userWithRoles.roles) {
      if (role.permissions) {
        role.permissions.forEach((p) => currentPermissionIds.add(p.id));
      }
    }

    // 找出用户应该有但还没有的权限
    const missingPermissions = permissions.filter(
      (p) => !currentPermissionIds.has(p.id),
    );

    if (missingPermissions.length > 0) {
      // 为用户分配缺失的权限（通过普通用户角色）
      let userRole: Role | undefined = userWithRoles.roles.find((r) => r.code === 'user');
      
      if (!userRole) {
        // 如果用户没有"普通用户"角色，获取或创建它
        const foundRole = await this.roleRepository.findOne({
          where: { code: 'user' },
          relations: ['permissions'],
        });

        if (foundRole) {
          userWithRoles.roles.push(foundRole);
          userRole = foundRole;
        }
      } else {
        // 重新加载角色的权限
        const reloadedRole = await this.roleRepository.findOne({
          where: { id: userRole.id },
          relations: ['permissions'],
        });
        if (reloadedRole) {
          userRole = reloadedRole;
        }
      }

      if (userRole) {
        // 为角色添加新权限
        const existingPermissionIds = new Set(
          userRole.permissions?.map((p) => p.id) || [],
        );
        
        const newPermissionsForRole = missingPermissions.filter(
          (p) => !existingPermissionIds.has(p.id),
        );

        if (newPermissionsForRole.length > 0) {
          userRole.permissions = [
            ...(userRole.permissions || []),
            ...newPermissionsForRole,
          ];
          await this.roleRepository.save(userRole);
          
          this.logger.log(
            `✅ 为用户 ${user.username} 分配了 ${newPermissionsForRole.length} 个新权限`,
          );
        }
      }
    }
  }

  /**
   * 批量为所有用户分配默认权限
   */
  async syncAllUsersPermissions(): Promise<void> {
    const users = await this.userRepository.find();
    let count = 0;

    for (const user of users) {
      try {
        await this.assignNewPermissionsToUser(user);
        count++;
      } catch (error) {
        this.logger.error(`为用户 ${user.username} 分配权限失败:`, error);
      }
    }

    this.logger.log(`✅ 已为 ${count} 个用户同步权限`);
  }
}
