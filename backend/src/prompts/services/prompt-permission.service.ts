import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromptPermission, PermissionType } from '../entities/prompt-permission.entity';
import { Prompt } from '../entities/prompt.entity';
import { GrantPermissionDto } from '../dto/grant-permission.dto';

@Injectable()
export class PromptPermissionService {
  constructor(
    @InjectRepository(PromptPermission)
    private readonly permissionRepository: Repository<PromptPermission>,
    @InjectRepository(Prompt)
    private readonly promptRepository: Repository<Prompt>,
  ) {}

  async grantPermission(
    promptId: number,
    grantorId: number,
    grantPermissionDto: GrantPermissionDto,
  ): Promise<PromptPermission> {
    const prompt = await this.promptRepository.findOne({
      where: { id: promptId },
    });

    if (!prompt) {
      throw new NotFoundException('提示词不存在');
    }

    if (prompt.authorId !== grantorId) {
      throw new ForbiddenException('只有作者可以授权');
    }

    const existingPermission = await this.permissionRepository.findOne({
      where: {
        promptId,
        userId: grantPermissionDto.userId,
      },
    });

    if (existingPermission) {
      throw new ConflictException('该用户已有权限');
    }

    const permission = this.permissionRepository.create({
      promptId,
      userId: grantPermissionDto.userId,
      permission: grantPermissionDto.permission,
      grantedBy: grantorId,
    });

    return await this.permissionRepository.save(permission);
  }

  async revokePermission(promptId: number, userId: number, grantorId: number): Promise<void> {
    const prompt = await this.promptRepository.findOne({
      where: { id: promptId },
    });

    if (!prompt) {
      throw new NotFoundException('提示词不存在');
    }

    if (prompt.authorId !== grantorId) {
      throw new ForbiddenException('只有作者可以撤销权限');
    }

    const result = await this.permissionRepository.delete({
      promptId,
      userId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('权限记录不存在');
    }
  }

  async findPermissionsByPrompt(promptId: number): Promise<PromptPermission[]> {
    return await this.permissionRepository.find({
      where: { promptId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async checkPermission(promptId: number, userId: number, requiredPermission: PermissionType): Promise<boolean> {
    // 验证 ID
    const safePromptId = Number(promptId);
    if (isNaN(safePromptId) || !isFinite(safePromptId) || safePromptId <= 0) {
      return false;
    }
    
    const safeUserId = Number(userId);
    if (isNaN(safeUserId) || !isFinite(safeUserId) || safeUserId <= 0) {
      return false;
    }

    const prompt = await this.promptRepository.findOne({
      where: { id: safePromptId },
    });

    if (!prompt) {
      return false;
    }

    if (prompt.authorId === safeUserId) {
      return true;
    }

    if (prompt.isPublic && requiredPermission === PermissionType.VIEW) {
      return true;
    }

    const permission = await this.permissionRepository.findOne({
      where: { promptId: safePromptId, userId: safeUserId },
    });

    if (!permission) {
      return false;
    }

    const permissionLevels = {
      [PermissionType.VIEW]: 1,
      [PermissionType.USE]: 2,
      [PermissionType.EDIT]: 3,
    };

    return permissionLevels[permission.permission] >= permissionLevels[requiredPermission];
  }
}
