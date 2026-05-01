import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RoleGuard } from '../common/guards/role.guard';
import { AdminService } from './admin.service';
import {
  AdminGetUsersQueryDto,
  AdminUserSortBy,
  AdminUserStatusFilter,
  SortOrder,
  UpdateUserStatusDto,
} from './dto/admin.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtGuard, RoleGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get platform-wide statistics' })
  @ApiResponse({ status: 200, description: 'Platform stats returned.' })
  getPlatformStats() {
    return this.adminService.getPlatformStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get paginated list of all users' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: AdminUserStatusFilter })
  @ApiQuery({ name: 'sortBy', required: false, enum: AdminUserSortBy })
  @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder })
  @ApiResponse({ status: 200, description: 'User list returned.' })
  getUsers(@Query() query: AdminGetUsersQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Get('users/all')
  @ApiOperation({ summary: 'Get all active users for task assignment (no pagination)' })
  @ApiResponse({ status: 200, description: 'User list for assignment returned.' })
  getAllUsersForAssignment() {
    return this.adminService.getAllUsersForAssignment();
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user detail by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User detail returned.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate or deactivate a user account' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User status updated.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(id, dto);
  }
}
