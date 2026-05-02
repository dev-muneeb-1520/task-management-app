import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Role } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdminGetUsersQueryDto,
  AdminUserSortBy,
  AdminUserStatusFilter,
  SortOrder,
  UpdateUserStatusDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getPlatformStats() {
    const now = new Date();
    const nonAdminWhere = { role: { not: Role.ADMIN } };

    const [
      totalUsers,
      activeUsers,
      totalTasks,
      completedTasks,
      inProgressTasks,
      newUsersToday,
      tasksCreatedToday,
    ] = await this.prisma.$transaction([
      this.prisma.user.count({ where: nonAdminWhere }),
      this.prisma.user.count({ where: { ...nonAdminWhere, isActive: true } }),
      this.prisma.task.count(),
      this.prisma.task.count({ where: { status: 'DONE' } }),
      this.prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.user.count({
        where: {
          ...nonAdminWhere,
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          },
        },
      }),
      this.prisma.task.count({
        where: {
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          },
        },
      }),
    ]);

    const completionRate =
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 1000) / 10;

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        newToday: newUsersToday,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        todo: totalTasks - completedTasks - inProgressTasks,
        createdToday: tasksCreatedToday,
        completionRate,
      },
    };
  }

  async getUsers(query: AdminGetUsersQueryDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);

    const baseWhere: {
      role: { not: Role };
      isActive?: boolean;
    } = { role: { not: Role.ADMIN } };

    if (query.status === AdminUserStatusFilter.ACTIVE) {
      baseWhere.isActive = true;
    }

    if (query.status === AdminUserStatusFilter.INACTIVE) {
      baseWhere.isActive = false;
    }

    const where = query.search
      ? {
          ...baseWhere,
          OR: [
            { fullName: { contains: query.search.trim(), mode: 'insensitive' as const } },
            { email: { contains: query.search.trim(), mode: 'insensitive' as const } },
          ],
        }
      : baseWhere;

    const sortBy = query.sortBy ?? AdminUserSortBy.CREATED_AT;
    const sortOrder = query.sortOrder ?? SortOrder.DESC;
    const orderBy =
      sortBy === AdminUserSortBy.TASKS_ASSIGNED
        ? { assignedTasks: { _count: sortOrder } }
        : { [sortBy]: sortOrder };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              assignedTasks: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items: users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        tasksAssigned: u._count.assignedTasks,
      })),
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

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            assignedTasks: true,
            createdTasks: true,
          },
        },
        assignedTasks: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            title: true,
            priority: true,
            status: true,
            dueDate: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      stats: {
        tasksAssigned: user._count.assignedTasks,
        tasksCreated: user._count.createdTasks,
      },
      recentTasks: user.assignedTasks,
    };
  }

  async updateUserStatus(userId: string, dto: UpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: dto.isActive },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await this.notificationsService.createForUser({
      recipientUserId: updated.id,
      title: dto.isActive ? 'Account activated' : 'Account deactivated',
      message: dto.isActive
        ? 'Your account has been activated by an administrator.'
        : 'Your account has been deactivated by an administrator.',
      type: NotificationType.ACCOUNT_STATUS_CHANGED,
      entityType: 'USER',
      entityId: updated.id,
      actionUrl: dto.isActive ? '/dashboard' : '/login',
      metadata: { isActive: dto.isActive },
    });

    await this.notificationsService.createForRole({
      role: Role.ADMIN,
      title: 'User status changed',
      message: `${updated.fullName} was ${dto.isActive ? 'activated' : 'deactivated'}.`,
      type: NotificationType.USER_STATUS_CHANGED,
      entityType: 'USER',
      entityId: updated.id,
      actionUrl: `/admin/users/${updated.id}`,
      metadata: { isActive: dto.isActive },
    });

    return updated;
  }

  async getAllUsersForAssignment() {
    return this.prisma.user.findMany({
      where: { isActive: true, role: Role.USER },
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
    });
  }
}
