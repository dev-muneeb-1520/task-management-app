import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { TaskPriority } from '../enums/task-priority.enum';
import { TaskStatus } from '../enums/task-status.enum';

export class CreateTaskDto {
  @ApiProperty({ example: 'Finish API integration', minLength: 2, maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  title: string;

  @ApiProperty({ example: 'Integrate all task endpoints with frontend.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(2000)
  description: string;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.MEDIUM })
  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.TODO, required: false })
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiProperty({
    example: '2026-12-31T23:59:59.000Z',
    description: 'ISO-8601 due date string',
  })
  @IsDateString()
  dueDate: string;
}
