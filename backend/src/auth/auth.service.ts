import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationType, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { StringValue } from 'ms';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async register(registerDto: RegisterDto) {
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match.');
    }

    const email = registerDto.email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered.');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        fullName: registerDto.fullName.trim(),
        email,
        password: hashedPassword,
      },
    });

    await this.notificationsService.createForRole({
      role: Role.ADMIN,
      title: 'New user registered',
      message: `${user.fullName} joined the platform.`,
      type: NotificationType.USER_REGISTERED,
      entityType: 'USER',
      entityId: user.id,
      actionUrl: `/admin/users/${user.id}`,
      metadata: { email: user.email },
    });

    return this.buildAuthResponse(user);
  }

  async login(loginDto: LoginDto) {
    const email = loginDto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated. Please contact an administrator.');
    }

    return this.buildAuthResponse(user);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; type?: string };

    try {
      payload = await this.jwtService.verifyAsync(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token type.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Refresh token is not recognized.');
    }

    const matches = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!matches) {
      throw new UnauthorizedException('Refresh token is not recognized.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated. Please contact an administrator.');
    }

    return this.buildAuthResponse(user);
  }

  async getProfileFromAccessToken(accessToken: string) {
    let payload: { sub: string; type?: string };

    try {
      payload = await this.jwtService.verifyAsync(accessToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }

    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid access token type.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated.');
    }

    return user;
  }

  async logout(accessToken: string) {
    let payload: { sub: string; type?: string };

    try {
      payload = await this.jwtService.verifyAsync(accessToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }

    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid access token type.');
    }

    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { refreshToken: null },
    });

    return { message: 'Logged out successfully.' };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: { fullName?: string; email?: string } = {};

    if (dto.fullName !== undefined) data.fullName = dto.fullName.trim();

    if (dto.email !== undefined) {
      const email = dto.email.toLowerCase().trim();
      const existing = await this.prisma.user.findFirst({
        where: { email, NOT: { id: userId } },
      });
      if (existing) {
        throw new ConflictException('Email is already in use.');
      }
      data.email = email;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('At least one field is required.');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('New passwords do not match.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return { message: 'Password changed successfully.' };
  }

  async deleteAccount(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'Account deleted successfully.' };
  }

  private async buildAuthResponse(user: {
    id: string;
    fullName: string;
    email: string;
    role: import('@prisma/client').Role;
    password?: string;
    refreshToken?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const access_token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      type: 'access',
    });

    const refreshTokenExpiresIn =
      (process.env.REFRESH_TOKEN_EXPIRES_IN as StringValue | undefined) ?? '30d';

    const refresh_token = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        type: 'refresh',
      },
      {
        expiresIn: refreshTokenExpiresIn,
      },
    );

    const hashedRefreshToken = await bcrypt.hash(refresh_token, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}
