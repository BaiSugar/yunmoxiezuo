import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Announcement,
  AnnouncementRead,
  AnnouncementLinkClick,
} from '../entities';
import { ClickLinkDto } from '../dto';

@Injectable()
export class AnnouncementReadsService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepository: Repository<Announcement>,
    @InjectRepository(AnnouncementRead)
    private readonly readRepository: Repository<AnnouncementRead>,
    @InjectRepository(AnnouncementLinkClick)
    private readonly clickRepository: Repository<AnnouncementLinkClick>,
  ) {}

  /**
   * 标记公告为已读
   */
  async markAsRead(announcementId: number, userId: number): Promise<void> {
    let record = await this.readRepository.findOne({
      where: { announcementId, userId },
    });

    let shouldIncrement = false;

    if (!record) {
      record = this.readRepository.create({
        announcementId,
        userId,
        isRead: true,
        readAt: new Date(),
      });
      shouldIncrement = true;
    } else if (!record.isRead) {
      record.isRead = true;
      record.readAt = new Date();
      shouldIncrement = true;
    }

    await this.readRepository.save(record);

    // 增加公告的已读人数
    if (shouldIncrement) {
      await this.announcementRepository.increment(
        { id: announcementId },
        'readCount',
        1,
      );
    }
  }

  /**
   * 记录链接点击
   */
  async recordClick(
    announcementId: number,
    userId: number,
    clickDto: ClickLinkDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<void> {
    // 更新阅读记录中的点击状态
    let readRecord = await this.readRepository.findOne({
      where: { announcementId, userId },
    });

    if (!readRecord) {
      readRecord = this.readRepository.create({
        announcementId,
        userId,
        isClicked: true,
        clickedAt: new Date(),
      });
    } else if (!readRecord.isClicked) {
      readRecord.isClicked = true;
      readRecord.clickedAt = new Date();
    }

    await this.readRepository.save(readRecord);

    // 创建详细点击记录
    const clickRecord = this.clickRepository.create({
      announcementId,
      userId,
      linkUrl: clickDto.linkUrl,
      referrer: clickDto.referrer,
      ipAddress,
      userAgent,
    });

    await this.clickRepository.save(clickRecord);

    // 增加公告的点击次数
    await this.announcementRepository.increment(
      { id: announcementId },
      'clickCount',
      1,
    );
  }

  /**
   * 获取公告统计信息
   */
  async getStats(announcementId: number) {
    const announcement = await this.announcementRepository.findOne({
      where: { id: announcementId },
    });

    if (!announcement) {
      return null;
    }

    const totalReads = await this.readRepository.count({
      where: { announcementId, isRead: true },
    });

    const totalClicks = await this.clickRepository.count({
      where: { announcementId },
    });

    return {
      viewCount: announcement.viewCount,
      readCount: totalReads,
      clickCount: totalClicks,
      clickRate:
        announcement.viewCount > 0
          ? (totalClicks / announcement.viewCount) * 100
          : 0,
      readRate:
        announcement.viewCount > 0
          ? (totalReads / announcement.viewCount) * 100
          : 0,
    };
  }
}
