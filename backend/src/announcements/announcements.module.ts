import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Announcement,
  AnnouncementRead,
  AnnouncementLinkClick,
} from './entities';
import { AnnouncementsService, AnnouncementReadsService } from './services';
import { AnnouncementsController } from './controllers';
import { WebSocketModule } from '../websocket/websocket.module';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Announcement,
      AnnouncementRead,
      AnnouncementLinkClick,
    ]),
    WebSocketModule,
    UsersModule,
    RolesModule,
    MembershipsModule,
    NotificationsModule,
  ],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService, AnnouncementReadsService],
  exports: [AnnouncementsService, AnnouncementReadsService],
})
export class AnnouncementsModule {}
