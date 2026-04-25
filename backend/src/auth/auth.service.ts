import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { StringValue } from 'ms';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
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

  private async buildAuthResponse(user: {
    id: string;
    fullName: string;
    email: string;
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
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}
