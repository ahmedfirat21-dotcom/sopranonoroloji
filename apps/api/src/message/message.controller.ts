import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { MessageService } from './message.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get('conversations')
  async getConversations(@Request() req) {
    const user = req.user;
    return this.messageService.getConversations(user.tenantId, user.sub);
  }

  @Get(':targetId')
  async getDirectMessages(
    @Request() req,
    @Param('targetId') targetId: string,
    @Query('limit') limitStr?: string,
  ) {
    const user = req.user;
    const limit = limitStr ? parseInt(limitStr, 10) : 50;
    return this.messageService.getDirectMessages(user.tenantId, user.sub, targetId, limit);
  }

  @Post('/')
  async sendMessage(
    @Request() req,
    @Body() body: { receiverId: string; content: string }
  ) {
    const user = req.user;
    return this.messageService.sendDirectMessage(
      user.tenantId,
      user.sub,
      body.receiverId,
      body.content
    );
  }
}
