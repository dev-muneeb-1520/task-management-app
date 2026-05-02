import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  GetNotificationsQueryDto,
  NotificationReadStatus,
} from './dto/get-notifications-query.dto';
import { NotificationsGateway } from './notifications.gateway';

type AuthenticatedUser = { id: string; role: Role };

export interface CreateNotificationInput {
  title: string;
  message: string;
  type: NotificationType;
  recipientUserId: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface CreateRoleNotificationInput {
  title: string;
  message: string;
  type: NotificationType;
  role: Role;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async createForUser(input: CreateNotificationInput) {
    const notification = await this.prisma.notification.create({
      data: {
        title: input.title,
        message: input.message,
        type: input.type,
        recipientUserId: input.recipientUserId,
        entityType: input.entityType,
        entityId: input.entityId,
        actionUrl: input.actionUrl,
        metadata: input.metadata,
      },
    });

    this.gateway.emitToUser(input.recipientUserId, 'notification:new', notification);

    const unreadCount = await this.getUnreadCountForUser(input.recipientUserId);
    this.gateway.emitToUser(input.recipientUserId, 'notifications:unread-count', {
      unreadCount,
    });

    return notification;
  }

  async createForRole(input: CreateRoleNotificationInput) {
    const recipients = await this.prisma.user.findMany({
      where: { role: input.role, isActive: true },
      select: { id: true },
    });

    await Promise.all(
      recipients.map((recipient) =>
        this.createForUser({
          title: input.title,
          message: input.message,
          type: input.type,
          recipientUserId: recipient.id,
          entityType: input.entityType,
          entityId: input.entityId,
          actionUrl: input.actionUrl,
          metadata: input.metadata,
        }),
      ),
    );
  }

  async getAll(user: AuthenticatedUser, query: GetNotificationsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.NotificationWhereInput = {
      recipientUserId: user.id,
      ...(query.type ? { type: query.type } : {}),
      ...(query.status === NotificationReadStatus.READ ? { isRead: true } : {}),
      ...(query.status === NotificationReadStatus.UNREAD ? { isRead: false } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getUnreadCount(user: AuthenticatedUser) {
    return { unreadCount: await this.getUnreadCountForUser(user.id) };
  }

  async markAsRead(user: AuthenticatedUser, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, recipientUserId: user.id },
      select: { id: true, isRead: true },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    if (notification.isRead) {
      const unreadCount = await this.getUnreadCountForUser(user.id);
      return { id: notificationId, isRead: true, unreadCount };
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    const unreadCount = await this.getUnreadCountForUser(user.id);

    this.gateway.emitToUser(user.id, 'notification:updated', {
      id: updated.id,
      isRead: updated.isRead,
      readAt: updated.readAt,
    });
    this.gateway.emitToUser(user.id, 'notifications:unread-count', { unreadCount });

    return {
      id: updated.id,
      isRead: updated.isRead,
      readAt: updated.readAt,
      unreadCount,
    };
  }

  async markAllAsRead(user: AuthenticatedUser) {
    const result = await this.prisma.notification.updateMany({
      where: { recipientUserId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    this.gateway.emitToUser(user.id, 'notifications:read-all', {
      affectedCount: result.count,
      at: new Date().toISOString(),
    });
    this.gateway.emitToUser(user.id, 'notifications:unread-count', { unreadCount: 0 });

    return { affectedCount: result.count, unreadCount: 0 };
  }

  private async getUnreadCountForUser(userId: string) {
    return this.prisma.notification.count({
      where: { recipientUserId: userId, isRead: false },
    });
  }
}
