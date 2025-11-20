import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Permission } from '../users/entities/permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionTreeNode } from './interfaces/permission-tree.interface';
import { PermissionSyncService } from '../common/services/permission-sync.service';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly permissionSyncService: PermissionSyncService,
  ) {}

  /**
   * 创建权限
   */
  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    // 检查权限代码是否已存在
    const existingPermission = await this.permissionRepository.findOne({
      where: { code: createPermissionDto.code },
    });

    if (existingPermission) {
      throw new ConflictException('权限代码已存在');
    }

    // 如果有父权限，检查父权限是否存在
    if (createPermissionDto.parentId) {
      const parentPermission = await this.permissionRepository.findOne({
        where: { id: createPermissionDto.parentId },
      });

      if (!parentPermission) {
        throw new BadRequestException('父权限不存在');
      }
    }

    const permission = this.permissionRepository.create(createPermissionDto);
    return await this.permissionRepository.save(permission);
  }

  /**
   * 获取所有权限（平铺列表）
   */
  async findAll(): Promise<Permission[]> {
    return await this.permissionRepository.find({
      order: { parentId: 'ASC', id: 'ASC' },
    });
  }

  /**
   * 获取权限树
   */
  async getTree(): Promise<PermissionTreeNode[]> {
    const allPermissions = await this.findAll();
    return this.buildTree(allPermissions);
  }

  /**
   * 构建权限树
   */
  private buildTree(
    permissions: Permission[],
    parentId: number | null = null,
  ): PermissionTreeNode[] {
    const tree: PermissionTreeNode[] = [];

    permissions
      .filter((permission) => permission.parentId === parentId)
      .forEach((permission) => {
        const node: PermissionTreeNode = {
          id: permission.id,
          parentId: permission.parentId,
          name: permission.name,
          code: permission.code,
          type: permission.type,
          resource: permission.resource,
          method: permission.method,
          description: permission.description,
          children: this.buildTree(permissions, permission.id),
        };

        tree.push(node);
      });

    return tree;
  }

  /**
   * 根据ID获取权限详情
   */
  async findOne(id: number): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });

    if (!permission) {
      throw new NotFoundException('权限不存在');
    }

    return permission;
  }

  /**
   * 更新权限
   */
  async update(
    id: number,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    const permission = await this.findOne(id);

    // 如果更新权限代码，检查是否重复
    if (
      updatePermissionDto.code &&
      updatePermissionDto.code !== permission.code
    ) {
      const existingPermission = await this.permissionRepository.findOne({
        where: { code: updatePermissionDto.code },
      });

      if (existingPermission) {
        throw new ConflictException('权限代码已存在');
      }
    }

    // 如果更新父权限，检查是否会形成循环引用
    if (
      updatePermissionDto.parentId &&
      updatePermissionDto.parentId !== permission.parentId
    ) {
      const isCircular = await this.checkCircularReference(
        id,
        updatePermissionDto.parentId,
      );

      if (isCircular) {
        throw new BadRequestException('不能将权限移动到自己的子权限下');
      }

      // 检查父权限是否存在
      const parentPermission = await this.permissionRepository.findOne({
        where: { id: updatePermissionDto.parentId },
      });

      if (!parentPermission) {
        throw new BadRequestException('父权限不存在');
      }
    }

    Object.assign(permission, updatePermissionDto);
    return await this.permissionRepository.save(permission);
  }

  /**
   * 删除权限
   */
  async remove(id: number): Promise<void> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: ['children', 'roles'],
    });

    if (!permission) {
      throw new NotFoundException('权限不存在');
    }

    // 检查是否有子权限
    if (permission.children && permission.children.length > 0) {
      throw new BadRequestException('该权限下还有子权限，无法删除');
    }

    // 检查是否有角色使用该权限
    if (permission.roles && permission.roles.length > 0) {
      throw new BadRequestException('该权限已被角色使用，无法删除');
    }

    await this.permissionRepository.remove(permission);
  }

  /**
   * 检查是否会形成循环引用
   */
  private async checkCircularReference(
    permissionId: number,
    targetParentId: number,
  ): Promise<boolean> {
    if (permissionId === targetParentId) {
      return true;
    }

    const parent = await this.permissionRepository.findOne({
      where: { id: targetParentId },
    });

    if (!parent || !parent.parentId) {
      return false;
    }

    return this.checkCircularReference(permissionId, parent.parentId);
  }

  /**
   * 根据角色获取权限
   */
  async getPermissionsByRole(roleId: number): Promise<Permission[]> {
    return await this.permissionRepository
      .createQueryBuilder('permission')
      .innerJoin('permission.roles', 'role')
      .where('role.id = :roleId', { roleId })
      .getMany();
  }

  /**
   * 手动同步权限到数据库并更新角色权限
   */
  async syncPermissions(): Promise<{ message: string; details: string }> {
    this.logger.log('🔄 手动触发权限同步...');
    
    try {
      // 调用权限同步服务的方法
      await this.permissionSyncService.syncPermissionsToDatabase();
      await this.permissionSyncService.assignPermissionsToSuperAdmin();
      await this.permissionSyncService.assignPermissionsToUserRole();
      
      this.logger.log('✅ 权限同步完成');
      
      return {
        message: '权限同步成功',
        details: '已同步权限到数据库，并更新了超级管理员和普通用户角色的权限',
      };
    } catch (error) {
      this.logger.error('❌ 权限同步失败:', error);
      throw new BadRequestException(`权限同步失败: ${error.message}`);
    }
  }
}

