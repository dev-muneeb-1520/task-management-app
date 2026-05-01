import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtGuard } from '../common/guards/jwt.guard';
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
@UseGuards(JwtGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token.' })
  createTask(@CurrentUser() user: any, @Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.createTask(user, createTaskDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task details by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task updated successfully.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  updateTask(@CurrentUser() user: any, @Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.updateTask(user, id, updateTaskDto);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete all tasks' })
  @ApiResponse({ status: 200, description: 'All tasks deleted successfully.' })
  deleteAllTasks(@CurrentUser() user: any) {
    return this.tasksService.deleteAllTasks(user);
  }

  @Delete('bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete selected tasks by IDs' })
  @ApiResponse({ status: 200, description: 'Selected tasks deleted successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid task IDs payload.' })
  deleteSelectedTasks(@CurrentUser() user: any, @Body() deleteSelectedTasksDto: DeleteSelectedTasksDto) {
    return this.tasksService.deleteSelectedTasks(user, deleteSelectedTasksDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  deleteTask(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tasksService.deleteTask(user, id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks with filter and pagination' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'priority', required: false, enum: ['LOW', 'MEDIUM', 'HIGH'] })
  @ApiQuery({ name: 'status', required: false, enum: ['TODO', 'IN_PROGRESS', 'DONE'] })
  @ApiQuery({ name: 'assignedToId', required: false, description: 'Filter by assigned user (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Tasks returned successfully.' })
  getAllTasks(@CurrentUser() user: any, @Query() query: GetTasksQueryDto) {
    return this.tasksService.getAllTasks(user, query);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats returned successfully.' })
  getDashboardStats(@CurrentUser() user: any) {
    return this.tasksService.getDashboardStats(user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update task status by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task status updated successfully.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  updateTaskStatus(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateTaskStatusDto) {
    return this.tasksService.updateTaskStatus(user, id, dto);
  }

  @Get(':id/checklist')
  @ApiOperation({ summary: 'Get all checklist items for a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Checklist items returned successfully.' })
  getChecklistItems(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tasksService.getChecklistItems(user, id);
  }

  @Post(':id/checklist')
  @ApiOperation({ summary: 'Create a checklist item under a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 201, description: 'Checklist item created successfully.' })
  createChecklistItem(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: CreateChecklistItemDto) {
    return this.tasksService.createChecklistItem(user, id, dto);
  }

  @Patch(':id/checklist/:itemId')
  @ApiOperation({ summary: 'Update checklist item title/completion state' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiParam({ name: 'itemId', description: 'Checklist item ID' })
  @ApiResponse({ status: 200, description: 'Checklist item updated successfully.' })
  updateChecklistItem(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateChecklistItemDto,
  ) {
    return this.tasksService.updateChecklistItem(user, id, itemId, dto);
  }

  @Patch(':id/checklist/:itemId/reorder')
  @ApiOperation({ summary: 'Reorder checklist item by assigning position' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiParam({ name: 'itemId', description: 'Checklist item ID' })
  @ApiResponse({ status: 200, description: 'Checklist item reordered successfully.' })
  reorderChecklistItem(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: ReorderChecklistItemDto,
  ) {
    return this.tasksService.reorderChecklistItem(user, id, itemId, dto);
  }

  @Delete(':id/checklist/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete checklist item by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiParam({ name: 'itemId', description: 'Checklist item ID' })
  @ApiResponse({ status: 200, description: 'Checklist item deleted successfully.' })
  deleteChecklistItem(@CurrentUser() user: any, @Param('id') id: string, @Param('itemId') itemId: string) {
    return this.tasksService.deleteChecklistItem(user, id, itemId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task returned successfully.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  getTaskById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tasksService.getTaskById(user, id);
  }
}

