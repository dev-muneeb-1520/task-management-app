import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TaskStatus } from '../enums/task-status.enum';

export class UpdateTaskStatusDto {
  @ApiProperty({ enum: TaskStatus, example: TaskStatus.DONE })
  @IsEnum(TaskStatus)
  status: TaskStatus;
}
