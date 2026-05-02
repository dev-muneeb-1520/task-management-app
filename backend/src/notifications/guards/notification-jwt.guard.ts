import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers['authorization'];

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header.');
    }

    const accessToken = authorization.slice(7);

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
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is not authorized.');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (request as any).user = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role as Role,
    };

    return true;
  }
}
