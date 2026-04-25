import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { DeleteSelectedTasksDto } from './dto/delete-selected-tasks.dto';
import { GetTasksQueryDto } from './dto/get-tasks-query.dto';
import { ReorderChecklistItemDto } from './dto/reorder-checklist-item.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task for the authenticated user' })
  @ApiResponse({ status: 201, description: 'Task created successfully.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token.' })
  createTask(
    @Headers('authorization') authorization: string | undefined,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.tasksService.createTask(authorization, createTaskDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task details by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task updated successfully.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  updateTask(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.updateTask(authorization, id, updateTaskDto);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete all tasks for the authenticated user' })
  @ApiResponse({ status: 200, description: 'All tasks deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token.' })
  deleteAllTasks(@Headers('authorization') authorization: string | undefined) {
    return this.tasksService.deleteAllTasks(authorization);
  }

  @Delete('bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete selected tasks by IDs for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Selected tasks deleted successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid task IDs payload.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token.' })
  deleteSelectedTasks(
    @Headers('authorization') authorization: string | undefined,
    @Body() deleteSelectedTasksDto: DeleteSelectedTasksDto,
  ) {
    return this.tasksService.deleteSelectedTasks(authorization, deleteSelectedTasksDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  deleteTask(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    return this.tasksService.deleteTask(authorization, id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks with filter and pagination' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by title' })
  @ApiQuery({ name: 'priority', required: false, enum: ['LOW', 'MEDIUM', 'HIGH'] })
  @ApiQuery({ name: 'status', required: false, enum: ['TODO', 'IN_PROGRESS', 'DONE'] })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Tasks returned successfully.' })
  getAllTasks(
    @Headers('authorization') authorization: string | undefined,
    @Query() query: GetTasksQueryDto,
  ) {
    return this.tasksService.getAllTasks(authorization, query);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Dashboard stats returned successfully.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token.' })
  getDashboardStats(
    @Headers('authorization') authorization: string | undefined,
  ) {
    return this.tasksService.getDashboardStats(authorization);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update task status by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task status updated successfully.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  updateTaskStatus(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
  ) {
    return this.tasksService.updateTaskStatus(authorization, id, updateTaskStatusDto);
  }

  @Get(':id/checklist')
  @ApiOperation({ summary: 'Get all checklist items for a task with progress' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Checklist items returned successfully.' })
  getChecklistItems(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    return this.tasksService.getChecklistItems(authorization, id);
  }

  @Post(':id/checklist')
  @ApiOperation({ summary: 'Create a checklist item under a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 201, description: 'Checklist item created successfully.' })
  createChecklistItem(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() createChecklistItemDto: CreateChecklistItemDto,
  ) {
    return this.tasksService.createChecklistItem(authorization, id, createChecklistItemDto);
  }

  @Patch(':id/checklist/:itemId')
  @ApiOperation({ summary: 'Update checklist item title/completion state' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiParam({ name: 'itemId', description: 'Checklist item ID' })
  @ApiResponse({ status: 200, description: 'Checklist item updated successfully.' })
  updateChecklistItem(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() updateChecklistItemDto: UpdateChecklistItemDto,
  ) {
    return this.tasksService.updateChecklistItem(
      authorization,
      id,
      itemId,
      updateChecklistItemDto,
    );
  }

  @Patch(':id/checklist/:itemId/reorder')
  @ApiOperation({ summary: 'Reorder checklist item by assigning position' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiParam({ name: 'itemId', description: 'Checklist item ID' })
  @ApiResponse({ status: 200, description: 'Checklist item reordered successfully.' })
  reorderChecklistItem(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() reorderChecklistItemDto: ReorderChecklistItemDto,
  ) {
    return this.tasksService.reorderChecklistItem(
      authorization,
      id,
      itemId,
      reorderChecklistItemDto,
    );
  }

  @Delete(':id/checklist/:itemId')
  @ApiOperation({ summary: 'Delete checklist item by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiParam({ name: 'itemId', description: 'Checklist item ID' })
  @ApiResponse({ status: 200, description: 'Checklist item deleted successfully.' })
  deleteChecklistItem(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    return this.tasksService.deleteChecklistItem(authorization, id, itemId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task returned successfully.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  getTaskById(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    return this.tasksService.getTaskById(authorization, id);
  }
}
