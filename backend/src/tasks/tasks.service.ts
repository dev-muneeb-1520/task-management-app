import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, TaskPriority, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { DeleteSelectedTasksDto } from './dto/delete-selected-tasks.dto';
import { GetTasksQueryDto } from './dto/get-tasks-query.dto';
import { ReorderChecklistItemDto } from './dto/reorder-checklist-item.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

type AuthenticatedUser = { id: string; role: Role };

const TASK_WITH_USERS_SELECT = {
  id: true,
  title: true,
  description: true,
  priority: true,
  status: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  assignedToId: true,
  createdById: true,
  assignedTo: { select: { id: true, fullName: true, email: true } },
  createdBy:  { select: { id: true, fullName: true, email: true } },
};

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async createTask(user: AuthenticatedUser, createTaskDto: CreateTaskDto) {
    const assignedToId =
      user.role === Role.ADMIN && createTaskDto.assignedToId
        ? createTaskDto.assignedToId
        : user.id;

    if (user.role === Role.ADMIN && createTaskDto.assignedToId) {
      const target = await this.prisma.user.findUnique({
        where: { id: assignedToId },
        select: { id: true },
      });
      if (!target) throw new NotFoundException('Assigned user not found.');
    }

    return this.prisma.task.create({
      data: {
        title: createTaskDto.title.trim(),
        description: createTaskDto.description.trim(),
        priority: createTaskDto.priority as TaskPriority,
        status: (createTaskDto.status ?? 'TODO') as TaskStatus,
        dueDate: new Date(createTaskDto.dueDate),
        assignedToId,
        createdById: user.id,
      },
      select: TASK_WITH_USERS_SELECT,
    });
  }

  async updateTask(user: AuthenticatedUser, taskId: string, updateTaskDto: UpdateTaskDto) {
    await this.ensureTaskAccess(taskId, user);

    const data: {
      title?: string;
      description?: string;
      priority?: TaskPriority;
      status?: TaskStatus;
      dueDate?: Date;
    } = {};

    if (updateTaskDto.title !== undefined)       data.title       = updateTaskDto.title.trim();
    if (updateTaskDto.description !== undefined) data.description = updateTaskDto.description.trim();
    if (updateTaskDto.priority !== undefined)    data.priority    = updateTaskDto.priority as TaskPriority;
    if (updateTaskDto.status !== undefined)      data.status      = updateTaskDto.status as TaskStatus;
    if (updateTaskDto.dueDate !== undefined)     data.dueDate     = new Date(updateTaskDto.dueDate);

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('At least one field is required to update the task.');
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data,
      select: TASK_WITH_USERS_SELECT,
    });
  }

  async deleteTask(user: AuthenticatedUser, taskId: string) {
    await this.ensureTaskAccess(taskId, user);
    await this.prisma.task.delete({ where: { id: taskId } });
    return { message: 'Task deleted successfully.' };
  }

  async deleteAllTasks(user: AuthenticatedUser) {
    const where = user.role === Role.ADMIN ? {} : { assignedToId: user.id };
    const result = await this.prisma.task.deleteMany({ where });
    return { message: 'All tasks deleted successfully.', deletedCount: result.count };
  }

  async deleteSelectedTasks(user: AuthenticatedUser, dto: DeleteSelectedTasksDto) {
    const taskIds = [...new Set(dto.taskIds.map((id) => id.trim()))].filter((id) => id.length > 0);
    if (taskIds.length === 0) throw new BadRequestException('At least one valid task ID is required.');

    const where =
      user.role === Role.ADMIN
        ? { id: { in: taskIds } }
        : { id: { in: taskIds }, assignedToId: user.id };

    const result = await this.prisma.task.deleteMany({ where });

    return {
      message: 'Selected tasks deleted successfully.',
      requestedCount: taskIds.length,
      deletedCount: result.count,
      notFoundCount: taskIds.length - result.count,
    };
  }

  async getAllTasks(user: AuthenticatedUser, query: GetTasksQueryDto) {
    const page  = query.page  ?? 1;
    const limit = query.limit ?? 10;

    const assignedToFilter =
      user.role === Role.ADMIN
        ? query.assignedToId ? { assignedToId: query.assignedToId } : {}
        : { assignedToId: user.id };

    const where = {
      ...assignedToFilter,
      ...(query.search   ? { title:    { contains: query.search.trim(), mode: 'insensitive' as const } } : {}),
      ...(query.priority ? { priority: query.priority as TaskPriority } : {}),
      ...(query.status   ? { status:   query.status   as TaskStatus   } : {}),
    };

    const [tasks, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: TASK_WITH_USERS_SELECT,
      }),
      this.prisma.task.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items: tasks,
      pagination: { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async getTaskById(user: AuthenticatedUser, taskId: string) {
    const where =
      user.role === Role.ADMIN ? { id: taskId } : { id: taskId, assignedToId: user.id };

    const task = await this.prisma.task.findFirst({ where, select: TASK_WITH_USERS_SELECT });

    if (!task) throw new NotFoundException('Task not found.');
    return task;
  }

  async updateTaskStatus(user: AuthenticatedUser, taskId: string, dto: UpdateTaskStatusDto) {
    await this.ensureTaskAccess(taskId, user);

    return this.prisma.task.update({
      where: { id: taskId },
      data: { status: dto.status as TaskStatus },
      select: TASK_WITH_USERS_SELECT,
    });
  }

  async getDashboardStats(user: AuthenticatedUser) {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const userFilter = user.role === Role.ADMIN ? {} : { assignedToId: user.id };

    const [
      totalTasks, completedTasks, inProgressTasks, highPriorityTasks,
      priorityCounts, statusCounts, recentTasks, attentionNeeded,
    ] = await this.prisma.$transaction([
      this.prisma.task.count({ where: userFilter }),
      this.prisma.task.count({ where: { ...userFilter, status: 'DONE' } }),
      this.prisma.task.count({ where: { ...userFilter, status: 'IN_PROGRESS' } }),
      this.prisma.task.count({ where: { ...userFilter, priority: 'HIGH' } }),
      this.prisma.task.groupBy({ by: ['priority'], where: userFilter, orderBy: { priority: 'asc' }, _count: { _all: true } }),
      this.prisma.task.groupBy({ by: ['status'],   where: userFilter, orderBy: { status:   'asc' }, _count: { _all: true } }),
      this.prisma.task.findMany({ where: userFilter, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, title: true, priority: true, status: true, dueDate: true, createdAt: true } }),
      this.prisma.task.findMany({ where: { ...userFilter, status: { not: 'DONE' }, dueDate: { lte: sevenDaysFromNow } }, orderBy: { dueDate: 'asc' }, select: { id: true, title: true, priority: true, status: true, dueDate: true } }),
    ]);

    const completionRatePercentage =
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 1000) / 10;

    const countOf = (rows: { _count: unknown }[]) =>
      rows.map((r) => (typeof r._count === 'object' && r._count !== null && '_all' in r._count ? (r._count as { _all: number })._all ?? 0 : 0));

    const priorityMap: Record<string, number> = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    priorityCounts.forEach((r, i) => { priorityMap[r.priority] = countOf(priorityCounts)[i]; });

    const statusMap: Record<string, number> = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    statusCounts.forEach((r, i) => { statusMap[r.status] = countOf(statusCounts)[i]; });

    const pct = (n: number) => totalTasks === 0 ? 0 : Math.round((n / totalTasks) * 1000) / 10;

    return {
      stats: { totalTasks, completed: completedTasks, inProgress: inProgressTasks, highPriority: highPriorityTasks },
      completionRate: { percentage: completionRatePercentage, done: completedTasks, total: totalTasks },
      priorityBreakdown: {
        high:   { count: priorityMap.HIGH,   percentage: pct(priorityMap.HIGH)   },
        medium: { count: priorityMap.MEDIUM, percentage: pct(priorityMap.MEDIUM) },
        low:    { count: priorityMap.LOW,    percentage: pct(priorityMap.LOW)    },
      },
      statusBreakdown: { todo: statusMap['TODO'], inProgress: statusMap['IN_PROGRESS'], done: statusMap['DONE'] },
      recentTasks,
      attentionNeeded,
    };
  }

  // ── Checklist ──────────────────────────────────────────────────────────────

  async getChecklistItems(user: AuthenticatedUser, taskId: string) {
    await this.ensureTaskAccess(taskId, user);
    const items = await this.prisma.checklistItem.findMany({
      where: { taskId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
    const progress = await this.getChecklistProgress(taskId);
    const taskStatus = await this.syncTaskStatusWithChecklist(taskId, progress);
    return { items, progress, taskStatus };
  }

  async createChecklistItem(user: AuthenticatedUser, taskId: string, dto: CreateChecklistItemDto) {
    await this.ensureTaskAccess(taskId, user);

    const maxPos = await this.prisma.checklistItem.aggregate({ where: { taskId }, _max: { position: true } });
    const item = await this.prisma.checklistItem.create({
      data: { title: dto.title.trim(), taskId, position: (maxPos._max.position ?? -1) + 1 },
    });

    const progress = await this.getChecklistProgress(taskId);
    const taskStatus = await this.syncTaskStatusWithChecklist(taskId, progress);
    return { item, progress, taskStatus };
  }

  async updateChecklistItem(user: AuthenticatedUser, taskId: string, itemId: string, dto: UpdateChecklistItemDto) {
    await this.ensureTaskAccess(taskId, user);
    await this.ensureChecklistItemOwnership(taskId, itemId);

    const data: { title?: string; isCompleted?: boolean } = {};
    if (dto.title       !== undefined) data.title       = dto.title.trim();
    if (dto.isCompleted !== undefined) data.isCompleted = dto.isCompleted;

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('At least one field is required to update checklist item.');
    }

    const item = await this.prisma.checklistItem.update({ where: { id: itemId }, data });
    const progress = await this.getChecklistProgress(taskId);
    const taskStatus = await this.syncTaskStatusWithChecklist(taskId, progress);
    return { item, progress, taskStatus };
  }

  async reorderChecklistItem(user: AuthenticatedUser, taskId: string, itemId: string, dto: ReorderChecklistItemDto) {
    await this.ensureTaskAccess(taskId, user);
    await this.ensureChecklistItemOwnership(taskId, itemId);

    const item = await this.prisma.checklistItem.update({ where: { id: itemId }, data: { position: dto.position } });
    return { item, progress: await this.getChecklistProgress(taskId) };
  }

  async deleteChecklistItem(user: AuthenticatedUser, taskId: string, itemId: string) {
    await this.ensureTaskAccess(taskId, user);
    await this.ensureChecklistItemOwnership(taskId, itemId);

    await this.prisma.checklistItem.delete({ where: { id: itemId } });
    const progress = await this.getChecklistProgress(taskId);
    const taskStatus = await this.syncTaskStatusWithChecklist(taskId, progress);
    return { message: 'Checklist item deleted successfully.', progress, taskStatus };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async ensureTaskAccess(taskId: string, user: AuthenticatedUser) {
    const where =
      user.role === Role.ADMIN ? { id: taskId } : { id: taskId, assignedToId: user.id };

    const task = await this.prisma.task.findFirst({ where, select: { id: true } });
    if (!task) throw new NotFoundException('Task not found.');
  }

  private async ensureChecklistItemOwnership(taskId: string, itemId: string) {
    const item = await this.prisma.checklistItem.findFirst({
      where: { id: itemId, taskId },
      select: { id: true },
    });
    if (!item) throw new NotFoundException('Checklist item not found.');
  }

  private async getChecklistProgress(taskId: string) {
    const [totalItems, completedItems] = await this.prisma.$transaction([
      this.prisma.checklistItem.count({ where: { taskId } }),
      this.prisma.checklistItem.count({ where: { taskId, isCompleted: true } }),
    ]);
    const percentage = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 1000) / 10;
    return { totalItems, completedItems, percentage };
  }

  private async syncTaskStatusWithChecklist(
    taskId: string,
    progress: { totalItems: number; completedItems: number }
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { status: true },
    });

    if (!task) throw new NotFoundException('Task not found.');

    if (progress.totalItems > 0 && progress.completedItems === progress.totalItems) {
      if (task.status !== TaskStatus.DONE) {
        await this.prisma.task.update({
          where: { id: taskId },
          data: { status: TaskStatus.DONE },
        });
      }
      return TaskStatus.DONE;
    }

    // If checklist work has started, move TODO tasks into IN_PROGRESS automatically.
    if (
      progress.totalItems > 0 &&
      progress.completedItems > 0 &&
      progress.completedItems < progress.totalItems &&
      task.status === TaskStatus.TODO
    ) {
      await this.prisma.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.IN_PROGRESS },
      });
      return TaskStatus.IN_PROGRESS;
    }

    // If a completed task is no longer fully checked, move it back to IN_PROGRESS.
    if (progress.completedItems < progress.totalItems && task.status === TaskStatus.DONE) {
      await this.prisma.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.IN_PROGRESS },
      });
      return TaskStatus.IN_PROGRESS;
    }

    return task.status;
  }
}
