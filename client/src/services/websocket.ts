import { Message, VoiceUser } from '../types';

export type WebSocketMessageType =
  | 'connection_established'
  | 'private_message'
  | 'new_message'
  | 'user_connected'
  | 'user_disconnected'
  | 'typing_start'
  | 'typing_stop'
  | 'message_read'
  | 'notification'
  | 'game_update'
  | 'balance_update'
  | 'friend_request'
  | 'friend_accepted'
  | 'gift_received'
  | 'system_message'
  | 'voice_room_message'
  | 'voice_room_update'
  | 'admin_action_update'
  | 'voice_activity'
  | 'webrtc_offer'
  | 'webrtc_answer'
  | 'webrtc_ice_candidate';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  data?: any;
  timestamp?: number;
}

export interface PrivateMessageData {
  messageData: {
    _id: string;
    sender: {
      _id: string;
      username: string;
      profileImage?: string;
    };
    recipient: {
      _id: string;
      username: string;
      profileImage?: string;
    };
    content: string;
    isRead: boolean;
    createdAt: string;
  };
  recipientId: string;
}

export interface WebSocketClient {
  send: (message: string) => void;
  close: () => void;
  readyState: number;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<WebSocketMessageType, ((data: any) => void)[]> = new Map();

  constructor(private url: string) {}

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${this.url}?token=${token}`);

        this.ws.onopen = () => {
          console.log('🔌 WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('🛑 WebSocket disconnected');
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(this.getTokenFromUrl())
          .catch(error => {
            console.error('Reconnection failed:', error);
          });
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  private getTokenFromUrl(): string {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token') || '';
  }

  private handleMessage(message: WebSocketMessage) {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message.data));
    }
  }

  sendMessage(type: WebSocketMessageType, data?: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        data,
        timestamp: Date.now()
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  sendPrivateMessage(messageData: any, recipientId: string) {
    this.sendMessage('private_message', {
      messageData,
      recipientId
    });
  }

  onMessage(type: WebSocketMessageType, handler: (data: any) => void) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  offMessage(type: WebSocketMessageType, handler: (data: any) => void) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // إضافة دوال للتوافق مع الكود الحالي
  addMessageListener(handler: (data: any) => void) {
    // إضافة listener لجميع أنواع الرسائل
    const messageTypes: WebSocketMessageType[] = [
      'voice_room_message',
      'voice_room_update',
      'admin_action_update',
      'webrtc_offer',
      'webrtc_answer',
      'webrtc_ice_candidate',
      'new_message',
      'private_message'
    ];

    messageTypes.forEach(type => {
      this.onMessage(type, handler);
    });
  }

  removeMessageListener(handler: (data: any) => void) {
    // إزالة listener من جميع أنواع الرسائل
    const messageTypes: WebSocketMessageType[] = [
      'voice_room_message',
      'voice_room_update',
      'webrtc_offer',
      'webrtc_answer',
      'webrtc_ice_candidate',
      'new_message',
      'private_message'
    ];

    messageTypes.forEach(type => {
      this.offMessage(type, handler);
    });
  }

  // دالة send للتوافق مع الكود الحالي
  send(message: { type: WebSocketMessageType; data?: any }) {
    this.sendMessage(message.type, message.data);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}