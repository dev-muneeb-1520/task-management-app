import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassw0rd!' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'NewPassw0rd!' })
  @IsString()
  @Matches(PASSWORD_REGEX, {
    message:
      'New password must include at least one uppercase letter, one lowercase letter, one number, and one special character.',
  })
  newPassword: string;

  @ApiProperty({ example: 'NewPassw0rd!' })
  @IsString()
  confirmNewPassword: string;
}
