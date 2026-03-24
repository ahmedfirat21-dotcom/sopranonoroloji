import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    private prisma: PrismaService,
    private chatGateway: ChatGateway, // Anlık push bildirimleri / socket eventleri için
  ) {}

  // 1. Dm Gönder (REST üzerinden)
  async sendDirectMessage(tenantId: string, senderId: string, receiverId: string, content: string) {
    if (senderId === receiverId) {
      throw new Error("Kendinize mesaj gönderemezsiniz.");
    }

    // Alıcı var mı kontrol et
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, displayName: true, expoPushToken: true }
    });
    if (!receiver) {
      throw new NotFoundException("Alıcı bulunamadı.");
    }

    // Sender bilgisi
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { id: true, displayName: true, avatarUrl: true, profilePicture: true }
    });

    const msg = await this.prisma.directMessage.create({
      data: {
        tenantId,
        senderId,
        receiverId,
        content,
        isRead: false,
      },
    });

    // Anında Socket üzerinden karşı tarafa mesaj düştüyse haber ver
    // ChatGateway üzerinden tüm aktif bağlantılarda bu hedef user'a event atabiliriz
    // Ama ChatGateway participant listesi "room" bazlı.
    // Şimdilik global namespace üzerinden alıcı socket'leri tespit edip odaya/kişiye atmak mümkün:
    // (Aşağıdaki event, eğer P2P namespace veya global events kullanılıyorsa dinlenebilir)
    
    // Basit bildirim yayını (Global bir yayın, veya odadakilere özel)
    // Şimdilik Gateway'deki broadcastleri yormamak için doğrudan P2P payloadı hazırlıyoruz
    const payload = {
      message: msg,
      senderInfo: {
        id: sender.id,
        displayName: sender.displayName,
        avatar: sender.avatarUrl || sender.profilePicture || sender.displayName[0],
      }
    };
    
    // Sockets map'inden alıcının tüm bağlı socket'lerini bulup DM gönderebiliriz (ChatGateway methodu ile eklenebilir)
    // chatGateway.sendDmToUser(receiverId, payload)
    // Ancak henüz API ile Gateway ayrık çalışabiliyor, o yüzden Client Polling + Push ön planda olacak.

    return payload;
  }

  // 2. Özel Sohbet Geçmişini Getir
  async getDirectMessages(tenantId: string, userId: string, targetId: string, limit = 50) {
    const messages = await this.prisma.directMessage.findMany({
      where: {
        tenantId,
        OR: [
          { senderId: userId, receiverId: targetId },
          { senderId: targetId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true, profilePicture: true } }
      }
    });

    // Gösterilen (çekilen) DMs içindeki hedef kişiden gelenleri isRead=true yap async
    const unreadIds = messages
      .filter(m => m.receiverId === userId && !m.isRead)
      .map(m => m.id);

    if (unreadIds.length > 0) {
      this.prisma.directMessage.updateMany({
        where: { id: { in: unreadIds } },
        data: { isRead: true }
      }).catch(e => this.logger.error('Failed to mark DMs as read', e));
    }

    // En eskiden yeniye doğru sıraya diz
    return messages.reverse();
  }

  // 3. Konuşmalar Listesi (Son mesajlar ve Unread Count)
  async getConversations(tenantId: string, userId: string) {
    // 1. Tüm mesajları (bu kullanıcının dahil olduğu) çekelim (optimize edilebilir ama mobil için makul)
    const allDms = await this.prisma.directMessage.findMany({
      where: {
        tenantId,
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true, profilePicture: true, isOnline: true } },
        receiver: { select: { id: true, displayName: true, avatarUrl: true, profilePicture: true, isOnline: true } }
      }
    });

    // 2. Grubu oluştur (partnerId mapping)
    const convoMap = new Map<string, any>();

    for (const dm of allDms) {
      const isMeSender = dm.senderId === userId;
      const partnerId = isMeSender ? dm.receiverId : dm.senderId;
      const partnerUser = isMeSender ? dm.receiver : dm.sender;

      if (!convoMap.has(partnerId)) {
        convoMap.set(partnerId, {
          id: partnerId, // conversation id olarak partnerin ID'si
          name: partnerUser.displayName,
          avatar: partnerUser.avatarUrl || partnerUser.profilePicture || partnerUser.displayName[0],
          lastMessage: dm.content,
          time: dm.createdAt,
          unread: 0,
          isOnline: partnerUser.isOnline,
          isAlliance: false, // Default
        });
      }

      // Sadece bana gelen ve okunmamış mesajları say
      if (!isMeSender && !dm.isRead) {
        convoMap.get(partnerId).unread += 1;
      }
    }

    return Array.from(convoMap.values());
  }
}
