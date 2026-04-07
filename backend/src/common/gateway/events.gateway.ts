import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  data: {
    user: {
      id: string;
      orgId: string;
      username: string;
    };
  };
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/ws',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userRooms: Map<string, Set<string>> = new Map();
  private orgRooms: Map<string, Set<string>> = new Map();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.data.user = {
        id: payload.sub,
        orgId: payload.orgId,
        username: payload.username,
      };

      const userId = client.data.user.id;
      const orgId = client.data.user.orgId;

      client.join(`user:${userId}`);
      client.join(`org:${orgId}`);

      if (!this.userRooms.has(userId)) {
        this.userRooms.set(userId, new Set());
      }
      this.userRooms.get(userId)!.add(client.id);

      if (!this.orgRooms.has(orgId)) {
        this.orgRooms.set(orgId, new Set());
      }
      this.orgRooms.get(orgId)!.add(client.id);

      client.emit('connected', { userId, orgId });
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.data.user?.id;
    const orgId = client.data.user?.orgId;

    if (userId && this.userRooms.has(userId)) {
      this.userRooms.get(userId)!.delete(client.id);
      if (this.userRooms.get(userId)!.size === 0) {
        this.userRooms.delete(userId);
      }
    }

    if (orgId && this.orgRooms.has(orgId)) {
      this.orgRooms.get(orgId)!.delete(client.id);
      if (this.orgRooms.get(orgId)!.size === 0) {
        this.orgRooms.delete(orgId);
      }
    }
  }

  @SubscribeMessage('subscribe:conversation')
  handleSubscribeConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() conversationId: string,
  ) {
    client.join(`conversation:${conversationId}`);
    return { success: true, conversationId };
  }

  @SubscribeMessage('unsubscribe:conversation')
  handleUnsubscribeConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() conversationId: string,
  ) {
    client.leave(`conversation:${conversationId}`);
    return { success: true, conversationId };
  }

  @SubscribeMessage('subscribe:ticket')
  handleSubscribeTicket(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() ticketId: string,
  ) {
    client.join(`ticket:${ticketId}`);
    return { success: true, ticketId };
  }

  @SubscribeMessage('unsubscribe:ticket')
  handleUnsubscribeTicket(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() ticketId: string,
  ) {
    client.leave(`ticket:${ticketId}`);
    return { success: true, ticketId };
  }

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToOrg(orgId: string, event: string, data: any) {
    this.server.to(`org:${orgId}`).emit(event, data);
  }

  emitToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }

  emitToTicket(ticketId: string, event: string, data: any) {
    this.server.to(`ticket:${ticketId}`).emit(event, data);
  }

  emitConversationMessage(conversationId: string, message: any) {
    this.emitToConversation(conversationId, 'conversation.message.created', message);
  }

  emitConversationStatus(conversationId: string, status: any) {
    this.emitToConversation(conversationId, 'conversation.status.changed', status);
  }

  emitTicketCreated(orgId: string, ticket: any) {
    this.emitToOrg(orgId, 'ticket.created', ticket);
  }

  emitTicketStatus(ticketId: string, status: any) {
    this.emitToTicket(ticketId, 'ticket.status.changed', status);
  }

  emitNotification(userId: string, notification: any) {
    this.emitToUser(userId, 'notification.created', notification);
  }

  emitAiTaskStatus(userId: string, task: any) {
    this.emitToUser(userId, 'ai.task.status.changed', task);
  }
}
