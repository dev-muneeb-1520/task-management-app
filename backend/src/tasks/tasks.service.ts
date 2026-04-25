import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { DeleteSelectedTasksDto } from './dto/delete-selected-tasks.dto';
import { GetTasksQueryDto } from './dto/get-tasks-query.dto';
import { ReorderChecklistItemDto } from './dto/reorder-checklist-item.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async createTask(authorization: string | undefined, createTaskDto: CreateTaskDto) {
    const userId = await this.getUserIdFromAuthorizationHeader(authorization);

    const task = await this.prisma.task.create({
      data: {
        title: createTaskDto.title.trim(),
        description: createTaskDto.description.trim(),
        priority: createTaskDto.priority as TaskPriority,
        status: (createTaskDto.status ?? 'TODO') as TaskStatus,
        dueDate: new Date(createTaskDto.dueDate),
        userId,
      },
    });

    return task;
  }

  async updateTask(
    authorization: string | undefined,
    taskId: string,
    updateTaskDto: UpdateTaskDto,
  ) {
    const userId = await this.getUserIdFromAuthorizationHeader(authorization);
    await this.ensureTaskOwnership(taskId, userId);

    const data: {
      title?: string;
      description?: string;
      priority?: TaskPriority;
      status?: TaskStatus;
      dueDate?: Date;
    } = {};

    if (updateTaskDto.title !== undefined) data.title = updateTaskDto.title.trim();
    if (updateTaskDto.description !== undefined) data.description = updateTaskDto.description.trim();
    if (updateTaskDto.priority !== undefined) data.priority = updateTaskDto.priority as TaskPriority;
    if (updateTaskDto.status !== undefined) data.status = updateTaskDto.status as TaskStatus;
    if (updateTaskDto.dueDate !== undefined) data.dueDate = new Date(updateTaskDto.dueDate);

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('At least one field is required to update the task.');
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data,
    });
  }

  async deleteTask(authorization: string | undefined, taskId: string) {
    const userId = await this.getUserIdFromAuthorizationHeader(authorization);
    await this.ensureTaskOwnership(taskId, userId);

    await this.prisma.task.delete({ where: { id: taskId } });

    return { message: 'Task deleted successfully.' };
  }

  async deleteAllTasks(authorization: string | undefined) {
    const userId = await this.getUserIdFromAuthorizationHeader(authorization);

    const result = await this.prisma.task.deleteMany({
      where: { userId },
    });

    return {
      message: 'All tasks deleted successfully.',
      deletedCount: result.count,
    };
  }

  async deleteSelectedTasks(
    authorization: string | undefined,
    deleteSelectedTasksDto: DeleteSelectedTasksDto,
  ) {
    const userId = await this.getUserIdFromAuthorizationHeader(authorization);

    const taskIds = [...new Set(deleteSelectedTasksDto.taskIds.map((id) => id.trim()))].filter(
      (id) => id.length > 0,
    );

    if (taskIds.length === 0) {
      throw new BadRequestException('At least one valid task ID is required.');
    }

    const result = await this.prisma.task.deleteMany({
      where: {
        userId,
        id: { in: taskIds },
      },
    });

    return {
      message: 'Selected tasks deleted successfully.',
      requestedCount: taskIds.length,
      deletedCount: result.count,
      notFoundCount: taskIds.length - result.count,
    };
  }

  async getAllTasks(authorization: string | undefined, query: GetTasksQueryDto) {
    const userId = await this.getUserIdFromAuthorizationHeader(authorization);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where = {
      userId,
      ...(query.search
        ? {
            title: {
              contains: query.search.trim(),
              mode: 'insensitive' as const,
            },
          }
        : {}),
      ...(query.priority ? { priority: query.priority as TaskPriority } : {}),
      ...(query.status ? { status: query.status as TaskStatus } : {}),
    };

    const [tasks, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items: tasks,
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

  async getTaskById(authorization: string | undefined, taskId: string) {
    const userId = await this.getUserIdFromAuthorizationHeader(authorization);

    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    return task;
  }

  async updateTaskStatus(
    authorization: string | undefined,
    taskId: string,
    updateTaskStatusDto: UpdateTaskStatusDto,
  ) {
    const userId = await this.getUserIdFromAuthorizationHeader(authorization);
    await this.ensureTaskOwnership(taskId, userId);

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: updateTaskStatusDto.status as TaskStatus,
      },
    });
  }

  async getChecklistItems(authorization: string | undefined, taskId: string) {
    const userId = await this.getUserIdFromAuthorizationHeader(authorization);
    await this.ensureTaskOwnership(taskId, userId);

    const items = await this.prisma.checklistItem.findMany({
      where: { taskId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });

    const progress = await this.getChecklistProgress(taskId);

    return { items, progress };
  }

  async createChecklistItem(
    authorization: string | undefined,
    taskId: string,
    createChecklistItemDto: CreateChecklistItemDto,
  ) {
    const userId = await this.getUserIdFromAuthorizationHeader(authorization);
    await this.ensureTaskOwnership(taskId, userId);

    const maxPosition = await this.prisma.checklistItem.aggregate({
      where: { taskId },
      _max: { position: true },
    });

    const item = await this.prisma.checklistItem.create({
      data: {
        title: createChecklistItemDto.title.trim(),
        taskId,
        position: (maxPosition._max.position ?? -1) + 1,
      },
    });

    const progress = await this.getChecklistProgress(taskId);
    return { item, progress };
  }

  async updateChecklistItem(
    authorization: string | undefined,
    taskId: string,
    itemId: string,
    updateChecklistItemDto: UpdateChecklistItemDto,
  ) {
    const userId = await this.getUserIdFromAuthorizationHeader(authorization);
    await this.ensureTaskOwnership(taskId, userId);
    await this.ensureChecklistItemOwnership(taskId, itemId);

    const data: { title?: string; isCompleted?: boolean } = {};

    if (updateChecklistItemDto.title !== undefined) {
      data.title = updateChecklistItemDto.title.trim();
    }

    if (updateChecklistItemDto.isCompleted !== undefined) {
      data.isCompleted = updateChecklistItemDto.isCompleted;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('At least one field is required to update checklist item.');
    }

    const item = await this.prisma.checklistItem.update({
      where: { id: itemId },
      data,
    });

    const progress = await this.getChecklistProgress(taskId);
    return { item, progress };
  }

  async reorderChecklistItem(
    authorization: string | undefined,
    taskId: string,
    itemId: string,
    reorderChecklistItemDto: ReorderChecklistItemDto,
  ) {
    const userId = await this.getUserIdFromAuthorizationHeader(authorization);
    await this.ensureTaskOwnership(taskId, userId);
    await this.ensureChecklistItemOwnership(taskId, itemId);

    const item = await this.prisma.checklistItem.update({
      where: { id: itemId },
      data: {
        position: reorderChecklistItemDto.position,
      },
    });

    const progress = await this.getChecklistProgress(taskId);
    return { item, progress };
  }

  async deleteChecklistItem(
    authorization: string | undefined,
    taskId: string,
    itemId: string,
  ) {
    const userId = await this.getUserIdFromAuthorizationHeader(authorization);
    await this.ensureTaskOwnership(taskId, userId);
    await this.ensureChecklistItemOwnership(taskId, itemId);

    await this.prisma.checklistItem.delete({ where: { id: itemId } });

    const progress = await this.getChecklistProgress(taskId);
    return { message: 'Checklist item deleted successfully.', progress };
  }

  async getDashboardStats(authorization: string | undefined) {
    const userId = await this.getUserIdFromAuthorizationHeader(authorization);

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Run all queries in a single transaction for efficiency
    const [
      totalTasks,
      completedTasks,
      inProgressTasks,
      highPriorityTasks,
      priorityCounts,
      statusCounts,
      recentTasks,
      attentionNeeded,
    ] = await this.prisma.$transaction([
      // Stats cards
      this.prisma.task.count({ where: { userId } }),
      this.prisma.task.count({ where: { userId, status: 'DONE' } }),
      this.prisma.task.count({ where: { userId, status: 'IN_PROGRESS' } }),
      this.prisma.task.count({ where: { userId, priority: 'HIGH' } }),

      // Priority breakdown counts
      this.prisma.task.groupBy({
        by: ['priority'],
        where: { userId },
        orderBy: { priority: 'asc' },
        _count: { _all: true },
      }),

      // Status breakdown counts
      this.prisma.task.groupBy({
        by: ['status'],
        where: { userId },
        orderBy: { status: 'asc' },
        _count: { _all: true },
      }),

      // Recent tasks (latest 5)
      this.prisma.task.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          priority: true,
          status: true,
          dueDate: true,
          createdAt: true,
        },
      }),

      // Attention needed: overdue OR due within next 7 days, excluding done
      this.prisma.task.findMany({
        where: {
          userId,
          status: { not: 'DONE' },
          dueDate: { lte: sevenDaysFromNow },
        },
        orderBy: { dueDate: 'asc' },
        select: {
          id: true,
          title: true,
          priority: true,
          status: true,
          dueDate: true,
        },
      }),
    ]);

    const completionRatePercentage =
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 1000) / 10;

    // Build priority breakdown map
    const priorityMap: Record<string, number> = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    for (const row of priorityCounts) {
      const count =
        typeof row._count === 'object' && row._count !== null && '_all' in row._count
          ? (row._count._all ?? 0)
          : 0;
      priorityMap[row.priority] = count;
    }

    const highPriorityPercentage =
      totalTasks === 0 ? 0 : Math.round((priorityMap.HIGH / totalTasks) * 1000) / 10;
    const mediumPriorityPercentage =
      totalTasks === 0 ? 0 : Math.round((priorityMap.MEDIUM / totalTasks) * 1000) / 10;
    const lowPriorityPercentage =
      totalTasks === 0 ? 0 : Math.round((priorityMap.LOW / totalTasks) * 1000) / 10;

    // Build status breakdown map
    const statusMap: Record<string, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0,
    };
    for (const row of statusCounts) {
      const count =
        typeof row._count === 'object' && row._count !== null && '_all' in row._count
          ? (row._count._all ?? 0)
          : 0;
      statusMap[row.status] = count;
    }

    return {
      stats: {
        totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        highPriority: highPriorityTasks,
      },
      completionRate: {
        percentage: completionRatePercentage,
        done: completedTasks,
        total: totalTasks,
      },
      priorityBreakdown: {
        high: {
          count: priorityMap.HIGH,
          percentage: highPriorityPercentage,
        },
        medium: {
          count: priorityMap.MEDIUM,
          percentage: mediumPriorityPercentage,
        },
        low: {
          count: priorityMap.LOW,
          percentage: lowPriorityPercentage,
        },
      },
      statusBreakdown: {
        todo: statusMap['TODO'],
        inProgress: statusMap['IN_PROGRESS'],
        done: statusMap['DONE'],
      },
      recentTasks,
      attentionNeeded,
    };
  }

  private async getUserIdFromAuthorizationHeader(authorization?: string) {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header.');
    }

    const accessToken = authorization.slice(7);
    const user = await this.authService.getProfileFromAccessToken(accessToken);
    return user.id;
  }

  private async ensureTaskOwnership(taskId: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
      select: { id: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }
  }

  private async ensureChecklistItemOwnership(taskId: string, itemId: string) {
    const item = await this.prisma.checklistItem.findFirst({
      where: { id: itemId, taskId },
      select: { id: true },
    });

    if (!item) {
      throw new NotFoundException('Checklist item not found.');
    }
  }

  private async getChecklistProgress(taskId: string) {
    const [totalItems, completedItems] = await this.prisma.$transaction([
      this.prisma.checklistItem.count({ where: { taskId } }),
      this.prisma.checklistItem.count({ where: { taskId, isCompleted: true } }),
    ]);

    const percentage = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 1000) / 10;

    return {
      totalItems,
      completedItems,
      percentage,
    };
  }
}
