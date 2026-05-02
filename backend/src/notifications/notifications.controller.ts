import {
  Controller,
  Get,
  Param,
  Patch,
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
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
import { NotificationJwtGuard } from './guards/notification-jwt.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(NotificationJwtGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['ALL', 'READ', 'UNREAD'] })
  @ApiResponse({ status: 200, description: 'Notifications returned successfully.' })
  getAll(
    @CurrentUser() user: { id: string; role: import('@prisma/client').Role },
    @Query() query: GetNotificationsQueryDto,
  ) {
    return this.notificationsService.getAll(user, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({ status: 200, description: 'Unread count returned successfully.' })
  getUnreadCount(
    @CurrentUser() user: { id: string; role: import('@prisma/client').Role },
  ) {
    return this.notificationsService.getUnreadCount(user);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification marked as read.' })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  markAsRead(
    @CurrentUser() user: { id: string; role: import('@prisma/client').Role },
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(user, id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read.' })
  markAllAsRead(
    @CurrentUser() user: { id: string; role: import('@prisma/client').Role },
  ) {
    return this.notificationsService.markAllAsRead(user);
  }
}
