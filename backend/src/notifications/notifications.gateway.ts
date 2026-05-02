import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

const toUserRoom = (userId: string) => `user:${userId}`;

@Injectable()
@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit() {
    this.logger.log('Notifications gateway initialized');
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    const token = this.extractAccessToken(client);

    if (!token) {
      client.disconnect();
      return;
    }

    let payload: { sub: string; type?: string };

    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      client.disconnect();
      return;
    }

    if (payload.type !== 'access') {
      client.disconnect();
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      client.disconnect();
      return;
    }

    client.join(toUserRoom(user.id));
    client.data.user = { id: user.id, role: user.role as Role };
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    if (!this.server) return;
    this.server.to(toUserRoom(userId)).emit(event, payload);
  }

  private extractAccessToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const authorization = client.handshake.headers.authorization;
    if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
      return authorization.slice(7);
    }

    return null;
  }
}
