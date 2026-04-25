import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const PASSWORD_RULES_MESSAGE =
  'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', minLength: 2, maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Passw0rd!',
    description: 'Min 8 chars — must include uppercase, lowercase, number, and special character.',
  })
  @IsString()
  @Matches(PASSWORD_REGEX, {
    message: PASSWORD_RULES_MESSAGE,
  })
  password: string;

  @ApiProperty({ example: 'Passw0rd!', description: 'Must match password' })
  @IsString()
  @Matches(PASSWORD_REGEX, {
    message: PASSWORD_RULES_MESSAGE,
  })
  confirmPassword: string;
}
