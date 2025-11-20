import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { GroupChat, GroupMember } from '../entities';
import {
  CreateGroupChatDto,
  UpdateGroupChatDto,
  QueryGroupChatsDto,
  AddGroupMemberDto,
} from '../dto';

/**
 * 群聊管理服务
 */
@Injectable()
export class GroupChatsService {
  constructor(
    @InjectRepository(GroupChat)
    private readonly groupChatRepository: Repository<GroupChat>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
  ) {}

  /**
   * 创建群聊
   */
  async create(userId: number, dto: CreateGroupChatDto): Promise<GroupChat> {
    // 验证至少有一个成员
    if (!dto.members || dto.members.length === 0) {
      throw new BadRequestException('群聊至少需要一个成员');
    }

    // 创建群聊
    const groupChat = this.groupChatRepository.create({
      userId,
      groupName: dto.groupName,
      description: dto.description,
      avatarUrl: dto.avatarUrl,
      groupMetadata: dto.groupMetadata || {},
      messageCount: 0,
    });

    const savedGroup = await this.groupChatRepository.save(groupChat);

    // 添加成员
    const members = dto.members.map((member, index) =>
      this.groupMemberRepository.create({
        groupId: savedGroup.id,
        characterCardId: member.characterCardId,
        characterName: member.characterName,
        avatarUrl: member.avatarUrl,
        displayOrder: member.displayOrder ?? index,
      }),
    );

    await this.groupMemberRepository.save(members);

    // 返回带成员的群聊
    return await this.findOne(userId, savedGroup.id);
  }

  /**
   * 查询用户的群聊列表
   */
  async findAll(
    userId: number,
    query: QueryGroupChatsDto,
  ): Promise<{ data: GroupChat[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, search, includeArchived = false } = query;

    const queryBuilder = this.groupChatRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.members', 'members')
      .where('group.userId = :userId', { userId });

    // 是否包含归档
    if (!includeArchived) {
      queryBuilder.andWhere('group.isArchived = :isArchived', { isArchived: false });
    }

    // 搜索
    if (search) {
      queryBuilder.andWhere(
        '(group.groupName LIKE :search OR group.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 排序（最后消息时间降序）
    queryBuilder.orderBy('group.lastMessageAt', 'DESC', 'NULLS LAST');
    queryBuilder.addOrderBy('members.displayOrder', 'ASC');

    // 分页
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * 获取群聊详情
   */
  async findOne(userId: number, groupId: number): Promise<GroupChat> {
    const group = await this.groupChatRepository.findOne({
      where: { id: groupId },
      relations: ['members'],
      order: {
        members: {
          displayOrder: 'ASC',
        },
      },
    });

    if (!group) {
      throw new NotFoundException('群聊不存在');
    }

    if (group.userId !== userId) {
      throw new ForbiddenException('无权访问此群聊');
    }

    return group;
  }

  /**
   * 更新群聊
   */
  async update(userId: number, groupId: number, dto: UpdateGroupChatDto): Promise<GroupChat> {
    const group = await this.findOne(userId, groupId);

    Object.assign(group, dto);

    await this.groupChatRepository.save(group);

    return await this.findOne(userId, groupId);
  }

  /**
   * 删除群聊
   */
  async delete(userId: number, groupId: number): Promise<void> {
    const group = await this.findOne(userId, groupId);
    await this.groupChatRepository.remove(group);
  }

  /**
   * 归档/取消归档群聊
   */
  async archive(userId: number, groupId: number, isArchived: boolean): Promise<GroupChat> {
    const group = await this.findOne(userId, groupId);
    group.isArchived = isArchived;
    await this.groupChatRepository.save(group);
    return group;
  }

  /**
   * 添加群聊成员
   */
  async addMember(userId: number, groupId: number, dto: AddGroupMemberDto): Promise<GroupMember> {
    // 验证群聊所有权
    await this.findOne(userId, groupId);

    // 检查成员是否已存在
    const existingMember = await this.groupMemberRepository.findOne({
      where: {
        groupId,
        characterCardId: dto.characterCardId,
      },
    });

    if (existingMember) {
      throw new BadRequestException('该角色已在群聊中');
    }

    // 添加成员
    const member = this.groupMemberRepository.create({
      groupId,
      characterCardId: dto.characterCardId,
      characterName: dto.characterName,
      avatarUrl: dto.avatarUrl,
      displayOrder: dto.displayOrder ?? 0,
    });

    return await this.groupMemberRepository.save(member);
  }

  /**
   * 移除群聊成员
   */
  async removeMember(userId: number, groupId: number, memberId: number): Promise<void> {
    // 验证群聊所有权
    await this.findOne(userId, groupId);

    const member = await this.groupMemberRepository.findOne({
      where: { id: memberId, groupId },
    });

    if (!member) {
      throw new NotFoundException('成员不存在');
    }

    await this.groupMemberRepository.remove(member);
  }

  /**
   * 更新成员启用状态
   */
  async toggleMember(userId: number, groupId: number, memberId: number, isEnabled: boolean): Promise<GroupMember> {
    // 验证群聊所有权
    await this.findOne(userId, groupId);

    const member = await this.groupMemberRepository.findOne({
      where: { id: memberId, groupId },
    });

    if (!member) {
      throw new NotFoundException('成员不存在');
    }

    member.isEnabled = isEnabled;
    return await this.groupMemberRepository.save(member);
  }

  /**
   * 更新成员显示顺序
   */
  async updateMemberOrder(
    userId: number,
    groupId: number,
    memberOrders: { memberId: number; displayOrder: number }[],
  ): Promise<void> {
    // 验证群聊所有权
    await this.findOne(userId, groupId);

    // 批量更新
    const memberIds = memberOrders.map((o) => o.memberId);
    const members = await this.groupMemberRepository.find({
      where: {
        id: In(memberIds),
        groupId,
      },
    });

    if (members.length !== memberIds.length) {
      throw new BadRequestException('部分成员不存在');
    }

    // 更新顺序
    for (const order of memberOrders) {
      const member = members.find((m) => m.id === order.memberId);
      if (member) {
        member.displayOrder = order.displayOrder;
      }
    }

    await this.groupMemberRepository.save(members);
  }
}
