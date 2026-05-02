import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RoleGuard } from '../common/guards/role.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const accessTokenExpiresIn =
  (process.env.ACCESS_TOKEN_EXPIRES_IN as StringValue | undefined) ?? '15m';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-only-secret-change-me',
      signOptions: {
        expiresIn: accessTokenExpiresIn,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtGuard, RoleGuard],
  exports: [AuthService, JwtGuard, RoleGuard],
})
export class AuthModule {}
