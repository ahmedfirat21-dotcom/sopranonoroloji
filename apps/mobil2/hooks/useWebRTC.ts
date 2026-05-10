import { useEffect, useRef, useState, useCallback } from 'react';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
  MediaStreamTrack,
} from '@livekit/react-native-webrtc';
import InCallManager from 'react-native-incall-manager';
import { Socket } from 'socket.io-client';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function useWebRTC(socket: Socket | null, roomId: string | null, userId: string | null) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);

  // Mikrofon kontrolü (Sessize alma / Açma)
  const toggleMic = useCallback((isMuted: boolean) => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track: MediaStreamTrack) => {
        track.enabled = !isMuted;
      });
    }
  }, []);

  // Yeni bir eş bağlantısı (PeerConnection) oluştur
  const createPeerConnection = useCallback((targetUserId: string) => {
    if (peerConnections.current[targetUserId]) {
      return peerConnections.current[targetUserId];
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current[targetUserId] = pc;

    // Kendi sesimizi karşıya ekleyelim
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => {
        pc.addTrack(track, localStreamRef.current as MediaStream);
      });
    }

    // ICE Candidate yakalama ve gönderme
    (pc as any).addEventListener('icecandidate', (event: any) => {
      if (event.candidate && socket && roomId) {
        socket.emit('webrtc:ice-candidate', {
          targetUserId,
          candidate: event.candidate,
          roomId,
        });
      }
    });

    // Karşıdan gelen stream'i yakalama
    (pc as any).addEventListener('track', (event: any) => {
      if (event.streams && event.streams[0]) {
        setRemoteStreams((prev) => ({
          ...prev,
          [targetUserId]: event.streams[0],
        }));
      }
    });

    return pc;
  }, [socket, roomId]);

  // Yeni sahne kullanıcısına Offer Gönder
  const connectToUser = useCallback(async (targetUserId: string) => {
    if (!socket || !roomId) return;
    try {
      const pc = createPeerConnection(targetUserId);
      const offer = await pc.createOffer({});
      await pc.setLocalDescription(offer);
      
      socket.emit('webrtc:offer', {
        targetUserId,
        offer,
        roomId,
      });
    } catch (error) {
      console.warn('WebRTC Offer Error:', error);
    }
  }, [socket, roomId, createPeerConnection]);

  // Sahneye (WebRTC Session) giriş
  const joinWebRTC = useCallback(async (currentStageUsers: any[]) => {
    try {
      // 1. Hoparlör yönetimini başlat
      InCallManager.start({ media: 'audio' });
      InCallManager.setForceSpeakerphoneOn(true);

      // 2. Kendi mikrofonumuzu alalım
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      
      setLocalStream(stream as MediaStream);
      localStreamRef.current = stream as MediaStream;

      // Kendi mikrofonumuzu başlangıçta sahne kapalı farz edip enabled flag'ini duruma göre ayarlayabiliriz
      // Ancak şu an bağlanıp beklemekte yarar var.

      // 3. Odadaki diğer "sahnedeki" kullanıcılara bağlan
      if (userId) {
        for (const user of currentStageUsers) {
          if (user.userId !== userId) {
            await connectToUser(user.userId);
          }
        }
      }
    } catch (error) {
      console.warn('WebRTC Join Error:', error);
    }
  }, [userId, connectToUser]);

  // Odadan / Sahneden çıkış
  const leaveWebRTC = useCallback(() => {
    try {
      Object.values(peerConnections.current).forEach((pc) => {
        pc.close();
      });
      peerConnections.current = {};
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
      localStreamRef.current = null;
      setLocalStream(null);
      setRemoteStreams({});

      InCallManager.stop();
    } catch (e) {
      console.warn('WebRTC cleanup error', e);
    }
  }, []);

  // WebRTC Signal Dinleyicileri
  useEffect(() => {
    if (!socket || !roomId) return;

    const handleOffer = async ({ senderId, offer }: any) => {
      try {
        const pc = createPeerConnection(senderId);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socket.emit('webrtc:answer', {
          targetUserId: senderId,
          answer,
          roomId,
        });
      } catch (e) {
        console.warn('WebRTC handleOffer Error', e);
      }
    };

    const handleAnswer = async ({ senderId, answer }: any) => {
      try {
        const pc = peerConnections.current[senderId];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (e) {
        console.warn('WebRTC handleAnswer Error', e);
      }
    };

    const handleIceCandidate = async ({ senderId, candidate }: any) => {
      try {
        const pc = peerConnections.current[senderId];
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (e) {
        console.warn('WebRTC addIceCandidate Error', e);
      }
    };

    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:ice-candidate', handleIceCandidate);

    return () => {
      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:ice-candidate', handleIceCandidate);
    };
  }, [socket, roomId, createPeerConnection]);

  // Sadece cleanup için component unmount
  useEffect(() => {
    return () => {
      leaveWebRTC();
    };
  }, [leaveWebRTC]);

  return {
    localStream,
    remoteStreams,
    toggleMic,
    joinWebRTC,
    leaveWebRTC,
    connectToUser,
  };
}
