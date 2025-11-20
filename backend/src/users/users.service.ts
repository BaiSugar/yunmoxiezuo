import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PaginatedUsers } from './interfaces/user-list.interface';
import { EmailService } from '../email/services/email.service';
import { VerificationType } from '../email/entities/email-verification.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly emailService: EmailService,
  ) {}

  /**
   * 创建用户（管理员用）
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // 检查邮箱是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('邮箱已被注册');
    }

    // 检查用户名是否已存在
    if (createUserDto.username) {
      const existingUsername = await this.userRepository.findOne({
        where: { username: createUserDto.username },
      });

      if (existingUsername) {
        throw new ConflictException('用户名已被使用');
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // 创建用户
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    // 分配默认角色（普通用户）
    const defaultRole = await this.roleRepository.findOne({
      where: { code: 'user' },
    });

    if (defaultRole) {
      user.roles = [defaultRole];
    }

    return await this.userRepository.save(user);
  }

  /**
   * 分页查询用户列表
   */
  async findAll(queryDto: QueryUserDto): Promise<PaginatedUsers> {
    const { page = 1, pageSize = 10, search, status, roleCode } = queryDto;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role');

    // 搜索条件
    if (search) {
      queryBuilder.andWhere(
        '(user.username LIKE :search OR user.email LIKE :search OR user.nickname LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 状态筛选
    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    // 角色筛选
    if (roleCode) {
      queryBuilder.andWhere('role.code = :roleCode', { roleCode });
    }

    // 排序
    queryBuilder.orderBy('user.createdAt', 'DESC');

    // 分页
    const skip = (page - 1) * pageSize;
    queryBuilder.skip(skip).take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 根据ID查询用户详情
   */
  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  /**
   * 根据邮箱查询用户
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
      relations: ['roles', 'roles.permissions'],
    });
  }

  /**
   * 更新用户信息（管理员用）
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // 如果更新邮箱，检查是否重复
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('邮箱已被使用');
      }
    }

    // 如果更新用户名，检查是否重复
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUsername = await this.userRepository.findOne({
        where: { username: updateUserDto.username },
      });

      if (existingUsername) {
        throw new ConflictException('用户名已被使用');
      }
    }

    // 如果更新密码，需要加密
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  /**
   * 更新个人资料（用户自己用）
   */
  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    const user = await this.findOne(userId);

    // 如果更新邮箱，检查是否重复
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      // 验证邮箱验证码
      if (!updateProfileDto.emailVerificationCode) {
        throw new BadRequestException('修改邮箱需要验证码');
      }

      const isValid = await this.emailService.verifyCode(
        updateProfileDto.email,
        updateProfileDto.emailVerificationCode,
        VerificationType.CHANGE_EMAIL,
      );

      if (!isValid) {
        throw new BadRequestException('验证码无效或已过期');
      }

      const existingEmail = await this.userRepository.findOne({
        where: { email: updateProfileDto.email },
      });

      if (existingEmail && existingEmail.id !== userId) {
        throw new ConflictException('该邮箱已被其他用户使用');
      }
      
      // 修改邮箱后标记为已验证（因为已经验证过验证码）
      user.email = updateProfileDto.email;
      user.emailVerified = true;
    }

    // 更新其他字段
    if (updateProfileDto.nickname !== undefined) {
      user.nickname = updateProfileDto.nickname;
    }
    if (updateProfileDto.avatar !== undefined) {
      user.avatar = updateProfileDto.avatar;
    }
    if (updateProfileDto.bio !== undefined) {
      user.bio = updateProfileDto.bio;
    }

    return await this.userRepository.save(user);
  }

  /**
   * 修改密码
   */
  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 验证旧密码
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('当前密码错误');
    }

    // 更新密码
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await this.userRepository.update(userId, { password: hashedPassword });
  }

  /**
   * 软删除用户
   */
  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);

    // 不允许删除超级管理员
    const isSuperAdmin = user.roles.some((role) => role.code === 'super_admin');
    if (isSuperAdmin) {
      throw new BadRequestException('不允许删除超级管理员');
    }

    await this.userRepository.softDelete(id);
  }

  /**
   * 封禁用户
   */
  async banUser(id: number, reason?: string): Promise<User> {
    const user = await this.findOne(id);

    // 不允许封禁超级管理员
    const isSuperAdmin = user.roles.some((role) => role.code === 'super_admin');
    if (isSuperAdmin) {
      throw new BadRequestException('不允许封禁超级管理员');
    }

    user.status = UserStatus.BANNED;
    return await this.userRepository.save(user);
  }

  /**
   * 解封用户
   */
  async unbanUser(id: number): Promise<User> {
    const user = await this.findOne(id);

    user.status = UserStatus.ACTIVE;
    return await this.userRepository.save(user);
  }

  /**
   * 为用户分配角色
   */
  async assignRoles(userId: number, roleIds: number[]): Promise<User> {
    const user = await this.findOne(userId);

    // 检查角色是否存在
    const roles = await this.roleRepository.findBy({ id: In(roleIds) });

    if (roles.length !== roleIds.length) {
      throw new BadRequestException('部分角色不存在');
    }

    user.roles = roles;
    return await this.userRepository.save(user);
  }

  /**
   * 获取用户的权限列表（完整对象）
   */
  async getUserPermissions(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      return [];
    }

    const permissionsMap = new Map();

    user.roles.forEach((role) => {
      role.permissions.forEach((permission) => {
        // 使用 Map 去重（同一个权限可能来自多个角色）
        if (!permissionsMap.has(permission.id)) {
          permissionsMap.set(permission.id, permission);
        }
      });
    });

    return Array.from(permissionsMap.values());
  }

  /**
   * 获取拥有指定权限的所有用户ID列表
   */
  async getUsersWithPermission(permissionCode: string): Promise<number[]> {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.roles', 'role')
      .leftJoin('role.permissions', 'permission')
      .where('permission.code = :permissionCode', { permissionCode })
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
      .select(['user.id'])
      .getMany();

    return users.map(user => user.id);
  }
}
