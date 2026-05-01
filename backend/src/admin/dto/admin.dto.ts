import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';

export enum AdminUserStatusFilter {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum AdminUserSortBy {
  CREATED_AT = 'createdAt',
  FULL_NAME = 'fullName',
  TASKS_ASSIGNED = 'tasksAssigned',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class UpdateUserStatusDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  isActive: boolean;
}

export class AdminGetUsersQueryDto {
  @ApiPropertyOptional({ example: 'john' })
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ enum: AdminUserStatusFilter, example: AdminUserStatusFilter.ACTIVE })
  @IsOptional()
  @IsEnum(AdminUserStatusFilter)
  status?: AdminUserStatusFilter;

  @ApiPropertyOptional({ enum: AdminUserSortBy, example: AdminUserSortBy.CREATED_AT })
  @IsOptional()
  @IsEnum(AdminUserSortBy)
  sortBy?: AdminUserSortBy;

  @ApiPropertyOptional({ enum: SortOrder, example: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
