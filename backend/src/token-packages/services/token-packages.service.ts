import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenPackage } from '../entities/token-package.entity';
import { CreateTokenPackageDto } from '../dto/create-token-package.dto';
import { UpdateTokenPackageDto } from '../dto/update-token-package.dto';

@Injectable()
export class TokenPackagesService {
  constructor(
    @InjectRepository(TokenPackage)
    private readonly packageRepository: Repository<TokenPackage>,
  ) {}

  async create(createDto: CreateTokenPackageDto): Promise<TokenPackage> {
    const pkg = this.packageRepository.create(createDto);
    return await this.packageRepository.save(pkg);
  }

  async findAll(isActive?: boolean, minLevel?: number) {
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (minLevel !== undefined) where.minMemberLevel = minLevel;

    return await this.packageRepository.find({
      where,
      order: { sort: 'ASC', tokenAmount: 'ASC' },
    });
  }

  async findOne(id: number): Promise<TokenPackage> {
    const pkg = await this.packageRepository.findOne({ where: { id } });
    if (!pkg) throw new NotFoundException(`字数包 #${id} 不存在`);
    return pkg;
  }

  async update(id: number, updateDto: UpdateTokenPackageDto): Promise<TokenPackage> {
    const pkg = await this.findOne(id);
    Object.assign(pkg, updateDto);
    return await this.packageRepository.save(pkg);
  }

  async remove(id: number): Promise<void> {
    const pkg = await this.findOne(id);
    await this.packageRepository.remove(pkg);
  }

  async activate(id: number): Promise<TokenPackage> {
    const pkg = await this.findOne(id);
    pkg.isActive = true;
    return await this.packageRepository.save(pkg);
  }

  async deactivate(id: number): Promise<TokenPackage> {
    const pkg = await this.findOne(id);
    pkg.isActive = false;
    return await this.packageRepository.save(pkg);
  }
}
