import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsString } from 'class-validator';

export class DeleteSelectedTasksDto {
  @ApiProperty({
    type: [String],
    example: ['cmoxxx1', 'cmoxxx2'],
    description: 'Array of task IDs to delete',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  taskIds: string[];
}
