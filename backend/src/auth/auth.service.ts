import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, DeepPartial } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';
import { UserInvitation } from '../users/entities/user-invitation.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  AuthResponse,
  RefreshResponse,
} from './interfaces/auth-response.interface';
import { JwtPayload, JwtRefreshPayload } from './interfaces/jwt-payload.interface';
import { LogsService } from '../logs/logs.service';
import { PermissionSyncService } from '../common/services/permission-sync.service';
import { TokenBalancesService } from '../token-balances/services/token-balances.service';
import { EmailService } from '../email/services/email.service';
import { VerificationType } from '../email/entities/email-verification.entity';
import { SystemSettingsService } from '../system-settings/services/system-settings.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserInvitation)
    private readonly userInvitationRepository: Repository<UserInvitation>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logsService: LogsService,
    private readonly permissionSyncService: PermissionSyncService,
    private readonly tokenBalancesService: TokenBalancesService,
    private readonly emailService: EmailService,
    private readonly systemSettingsService: SystemSettingsService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 验证邮箱域名是否在白名单中
   */
  public async isAllowedEmailDomain(email: string): Promise<boolean> {
    try {
      // 从系统设置读取允许的邮箱域名白名单
      const allowedDomainsConfig = await this.systemSettingsService.getValue(
        'registration',
        'allowed_domains',
      );

      // 如果配置不存在或为空，使用默认白名单
      let allowedDomains: string[] = [];
      
      if (allowedDomainsConfig && Array.isArray(allowedDomainsConfig)) {
        // 从配置中提取domain字段
        allowedDomains = allowedDomainsConfig.map(item => item.domain?.toLowerCase());
      } else {
        // 默认白名单（备用方案）
        this.logger.warn('未找到邮箱域名白名单配置，使用默认值');
        allowedDomains = [
          'gmail.com',
          'outlook.com',
          'hotmail.com',
          'live.com',
          'yahoo.com',
          'qq.com',
          '163.com',
          '126.com',
          'sina.com',
          'sina.cn',
          'sohu.com',
          'foxmail.com',
          'yeah.net',
          'aliyun.com',
          '139.com',
          '189.cn',
          'icloud.com',
          'me.com',
          'protonmail.com',
          'aol.com',
          'mail.com',
          'zoho.com',
          'yandex.com',
          'gmx.com',
        ];
      }

      const domain = email.split('@')[1]?.toLowerCase();
      return allowedDomains.includes(domain);
    } catch (error) {
      this.logger.error(`验证邮箱域名时出错: ${error.message}`);
      // 出错时返回false，拒绝注册
      return false;
    }
  }

  /**
   * 用户注册
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { username, email, password, confirmPassword, nickname, inviteCode, verificationCode } = registerDto;

    // 验证密码一致性
    if (password !== confirmPassword) {
      throw new BadRequestException('两次输入的密码不一致');
    }

    // 验证邮箱域名是否在白名单中
    const isAllowed = await this.isAllowedEmailDomain(email);
    if (!isAllowed) {
      throw new BadRequestException('请使用常用邮箱（如Gmail、QQ邮箱、163邮箱等）进行注册');
    }

    // 检查是否启用邮件验证
    const verificationEnabled = await this.systemSettingsService.getValue(
      'email',
      'verification_enabled',
    );

    // 验证邮箱验证码
    if (verificationEnabled) {
      const isValid = await this.emailService.verifyCode(
        email,
        verificationCode,
        VerificationType.REGISTER,
      );
      if (!isValid) {
        throw new BadRequestException('验证码无效或已过期');
      }
    }

    // 检查用户名是否已存在
    const existingUsername = await this.userRepository.findOne({
      where: { username },
    });
    if (existingUsername) {
      throw new ConflictException('用户名已被使用');
    }

    // 检查邮箱是否已存在
    const existingEmail = await this.userRepository.findOne({
      where: { email },
    });
    if (existingEmail) {
      throw new ConflictException('邮箱已被注册');
    }

    // 验证邀请码（如果提供）
    if (inviteCode) {
      const inviter = await this.userRepository.findOne({
        where: { inviteCode },
      });
      if (!inviter) {
        throw new BadRequestException('邀请码无效');
      }
    }

    // 加密密码
    const hashedPassword = await this.hashPassword(password);

    // 获取默认角色（普通用户）
    const defaultRole = await this.roleRepository.findOne({
      where: { code: 'user' },
    });

    if (!defaultRole) {
      throw new BadRequestException('系统角色配置错误');
    }

    // 生成用户自己的邀请码（8位随机大写+数字）
    const userInviteCode = await this.generateInviteCode();

    // 创建用户
    const userData: DeepPartial<User> = {
      username,
      email,
      password: hashedPassword,
      nickname: nickname || username, // 昵称默认使用用户名
      inviteCode: userInviteCode, // 直接在创建时设置邀请码
      roles: [defaultRole],
      balance: 0, // 初始字数余额
      status: UserStatus.ACTIVE,
      emailVerified: verificationEnabled ? true : false, // 如果启用邮箱验证且验证通过，则标记为已验证
    };

    // 如果提供了邀请码，设置 invitedByCode
    if (inviteCode) {
      userData.invitedByCode = inviteCode;
    }

    const user = this.userRepository.create(userData);
    const savedUser = await this.userRepository.save(user);

    // 🎁 新用户注册奖励
    try {
      // 创建字数余额记录
      await this.tokenBalancesService.getOrCreateBalance(savedUser.id);
      
      // 注册赠送50万字数
      await this.tokenBalancesService.recharge(
        savedUser.id,
        500000, // 50万字数
        true,   // 标记为赠送
        'register_gift',
        undefined,
        '新用户注册奖励'
      );
      
      // 设置每日免费1万字数（自动刷新）
      await this.tokenBalancesService.setDailyQuota(savedUser.id, 10000);
    } catch (error) {
      // 注册奖励失败不影响注册流程，但记录错误
      console.error('新用户注册奖励发放失败:', error);
    }

    // 🎉 处理邀请奖励
    if (inviteCode) {
      try {
        await this.handleInviteReward(savedUser.id, inviteCode);
      } catch (error) {
        // 邀请奖励失败不影响注册流程，但记录错误
        console.error('邀请奖励发放失败:', error);
      }
    }

    // 生成 Token
    return this.generateTokens(savedUser);
  }

  /**
   * 重置密码（通过邮箱验证码）
   */
  async resetPassword(
    email: string,
    verificationCode: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // 验证邮箱验证码
    const isValid = await this.emailService.verifyCode(
      email,
      verificationCode,
      VerificationType.RESET_PASSWORD,
    );
    if (!isValid) {
      throw new BadRequestException('验证码无效或已过期');
    }

    // 查找用户
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('该邮箱未注册');
    }

    // 更新密码
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    this.logger.log(`用户 ${user.username} 通过邮箱重置密码成功`);

    return { message: '密码重置成功，请使用新密码登录' };
  }

  /**
   * 用户登录（前端用户端）
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { credential, password } = loginDto;

    // 查找用户（支持邮箱或用户名登录）
    const user = await this.userRepository.findOne({
      where: [{ email: credential }, { username: credential }],
      relations: ['roles'],
    });

    if (!user) {
      throw new UnauthorizedException('邮箱/用户名或密码错误');
    }

    // 检查账号状态
    if (user.status === UserStatus.BANNED) {
      throw new UnauthorizedException('账号已被封禁，请联系管理员');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('账号未激活，请先激活账号');
    }

    // 验证密码
    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱/用户名或密码错误');
    }

    // 更新最后登录时间
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // 🔄 自动为用户分配新增的权限
    try {
      await this.permissionSyncService.assignNewPermissionsToUser(user);
    } catch (error) {
      // 权限分配失败不影响登录
      console.error('自动分配权限失败:', error);
    }

    // 生成 Token
    return this.generateTokens(user);
  }

  /**
   * 管理后台登录
   */
  async adminLogin(loginDto: LoginDto): Promise<AuthResponse> {
    const { credential, password } = loginDto;

    // 查找用户（支持邮箱或用户名登录）
    const user = await this.userRepository.findOne({
      where: [{ email: credential }, { username: credential }],
      relations: ['roles'],
    });

    if (!user) {
      throw new UnauthorizedException('邮箱/用户名或密码错误');
    }

    // 检查账号状态
    if (user.status === UserStatus.BANNED) {
      throw new UnauthorizedException('账号已被封禁，请联系管理员');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('账号未激活，请先激活账号');
    }

    // 验证密码
    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱/用户名或密码错误');
    }

    // 验证是否有管理员权限（不能是普通用户）
    const hasAdminRole = user.roles.some(
      (role) => role.code !== 'user' && role.level >= 50
    );

    if (!hasAdminRole) {
      throw new UnauthorizedException('无管理后台访问权限');
    }

    // 更新最后登录时间
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // 记录管理后台登录日志
    await this.logsService.logAuth('管理后台登录', user.id, user.username, undefined, true);

    // 生成 Token
    return this.generateTokens(user);
  }

  /**
   * 刷新访问令牌
   */
  async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    try {
      // 验证刷新令牌
      const payload = await this.jwtService.verifyAsync<JwtRefreshPayload>(
        refreshToken,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      );

      // 查找用户并验证刷新令牌
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ['roles'],
      });

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('刷新令牌无效');
      }

      // 检查账号状态
      if (user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('账号状态异常');
      }

      // 生成新的访问令牌
      const accessToken = await this.generateAccessToken(user);
      const expiresIn = this.getExpiresIn();

      return {
        accessToken,
        expiresIn,
      };
    } catch (error) {
      throw new UnauthorizedException('刷新令牌无效或已过期');
    }
  }

  /**
   * 登出
   */
  async logout(userId: number): Promise<void> {
    // 获取用户信息用于日志
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    // 清除用户的刷新令牌
    await this.userRepository.update(userId, { refreshToken: null });

    // 记录登出日志
    if (user) {
      await this.logsService.logAuth('用户登出', user.id, user.username, undefined, true);
    }
  }

  /**
   * 生成访问令牌和刷新令牌
   */
  private async generateTokens(user: User): Promise<AuthResponse> {
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    // 保存刷新令牌到数据库
    user.refreshToken = refreshToken;
    await this.userRepository.save(user);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getExpiresIn(),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        roles: user.roles.map((role) => role.code),
      },
    };
  }

  /**
   * 生成访问令牌
   */
  private async generateAccessToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles.map((role) => role.code),
    };

    // 使用默认配置，过期时间在module中配置
    return this.jwtService.signAsync(payload);
  }

  /**
   * 生成刷新令牌
   */
  private async generateRefreshToken(user: User): Promise<string> {
    const payload: JwtRefreshPayload = {
      sub: user.id,
      email: user.email,
    };

    // 刷新令牌使用较长的过期时间
    return this.jwtService.signAsync(payload, {
      expiresIn: 604800, // 7天（秒）
    });
  }

  /**
   * 获取 Token 过期时间（秒）
   */
  private getExpiresIn(): number {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '1h';
    // 将 1h, 7d 等格式转换为秒数
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // 默认1小时

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 3600;
    }
  }

  /**
   * 加密密码
   */
  private async hashPassword(password: string): Promise<string> {
    const rounds = this.configService.get<number>('BCRYPT_ROUNDS') || 10;
    return bcrypt.hash(password, rounds);
  }

  /**
   * 验证密码
   */
  private async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * 验证用户（用于 Passport 策略）
   */
  async validateUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('用户不存在或账号状态异常');
    }

    return user;
  }

  /**
   * 生成唯一邀请码
   * 格式：8位随机大写字母+数字
   * 规则：至少3个字母，至少2个数字，不能纯数字
   */
  private async generateInviteCode(): Promise<string> {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let code = '';
    
    // 确保至少3个字母
    for (let i = 0; i < 3; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // 确保至少2个数字
    for (let i = 0; i < 2; i++) {
      code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    // 剩余3位从字母和数字中随机选择
    const allChars = letters + numbers;
    for (let i = 0; i < 3; i++) {
      code += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // 打乱顺序
    code = code.split('').sort(() => Math.random() - 0.5).join('');
    
    // 检查是否重复，如果重复则重新生成
    const existing = await this.userRepository.findOne({
      where: { inviteCode: code },
    });
    
    if (existing) {
      // 递归重新生成
      return this.generateInviteCode();
    }
    
    return code;
  }

  /**
   * 处理邀请奖励
   * @param inviteeId 被邀请人ID
   * @param inviteCode 使用的邀请码
   */
  private async handleInviteReward(inviteeId: number, inviteCode: string): Promise<void> {
    // 查找邀请人
    const inviter = await this.userRepository.findOne({
      where: { inviteCode },
    });

    if (!inviter) {
      throw new BadRequestException('邀请码无效');
    }

    // 检查是否自己邀请自己
    if (inviter.id === inviteeId) {
      throw new BadRequestException('不能使用自己的邀请码');
    }

    // 检查是否已经被邀请过
    const existingInvitation = await this.userInvitationRepository.findOne({
      where: { inviteeId },
    });

    if (existingInvitation) {
      throw new BadRequestException('该账户已使用过邀请码');
    }

    // 创建邀请记录
    let invitationId: number = 0;
    
    await this.dataSource.transaction(async (manager) => {
      // 创建邀请记录
      const invitation = manager.create(UserInvitation, {
        inviterId: inviter.id,
        inviteeId,
        inviteCode,
        inviterReward: 8000,  // 邀请人奖励8000字
        inviteeReward: 80000, // 被邀请人奖励80000字
        inviterRewarded: false,
        inviteeRewarded: false,
      });
      const savedInvitation = await manager.save(invitation);
      invitationId = savedInvitation.id;
    });
    
    if (!invitationId) {
      throw new BadRequestException('创建邀请记录失败');
    }

    // 注意：invitedByCode 已经在用户注册时设置，这里不需要再更新

    // 在事务外发放奖励（避免事务嵌套）
    // 发放奖励给被邀请人（80000字）
    try {
      await this.tokenBalancesService.recharge(
        inviteeId,
        80000,
        true, // 标记为赠送
        'invite_reward',
        invitationId,
        '通过邀请码注册奖励'
      );

      // 更新奖励发放状态
      await this.userInvitationRepository.update(invitationId, {
        inviteeRewarded: true,
      });
    } catch (error) {
      console.error('被邀请人奖励发放失败:', error);
      throw error; // 抛出错误以便外层捕获
    }

    // 发放奖励给邀请人（8000字）
    try {
      await this.tokenBalancesService.recharge(
        inviter.id,
        8000,
        true, // 标记为赠送
        'invite_reward',
        invitationId,
        `成功邀请用户注册奖励`
      );

      // 更新奖励发放状态
      await this.userInvitationRepository.update(invitationId, {
        inviterRewarded: true,
      });
    } catch (error) {
      console.error('邀请人奖励发放失败:', error);
      // 邀请人奖励失败不影响被邀请人，不抛出错误
    }
  }
}
