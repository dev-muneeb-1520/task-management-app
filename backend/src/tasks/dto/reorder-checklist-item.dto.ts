import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class ReorderChecklistItemDto {
  @ApiProperty({ example: 0, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  position: number;
}
