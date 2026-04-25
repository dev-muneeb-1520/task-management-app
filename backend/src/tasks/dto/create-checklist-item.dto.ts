import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateChecklistItemDto {
  @ApiProperty({ example: 'Write integration tests', minLength: 1, maxLength: 300 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(300)
  title: string;
}
