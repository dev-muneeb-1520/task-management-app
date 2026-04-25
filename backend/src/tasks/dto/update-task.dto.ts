import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { TaskPriority } from '../enums/task-priority.enum';
import { TaskStatus } from '../enums/task-status.enum';

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Finish API integration', minLength: 2, maxLength: 150 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({ example: 'Integrate all task endpoints with frontend.' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: TaskPriority, example: TaskPriority.HIGH })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.IN_PROGRESS })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59.000Z',
    description: 'ISO-8601 due date string',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
