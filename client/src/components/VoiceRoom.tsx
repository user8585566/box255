import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { WebSocketService } from '../services/websocket';
import { WebRTCVoiceService, VoiceUser, VoiceActivityData } from '../services/webrtc-voice';
import VoiceSeats from './VoiceSeats';
import VoiceChatBox from './VoiceChatBox';
import { User } from '../types';
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Users,
  MessageCircle,
  Settings,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';

interface VoiceRoomProps {
  user: User;
  wsService: WebSocketService;
}

interface VoiceSeat {
  seatNumber: number;
  user: {
    _id: string;
    username: string;
    profileImage?: string;
    playerId: string;
  } | null;
  userPlayerId: string | null;
  isSpeaking: boolean;
  isMuted: boolean;
  joinedAt: string | null;
}

interface VoiceRoomData {
  id: string;
  name: string;
  description: string;
  maxSeats: number;
  seats: VoiceSeat[];
  waitingQueue: Array<{
    user: {
      _id: string;
      username: string;
      profileImage?: string;
      playerId: string;
    };
    userPlayerId: string;
    requestedAt: string;
  }>;
  settings: {
    allowTextChat: boolean;
    autoKickInactive: boolean;
    inactiveTimeoutMinutes: number;
  };
  isActive: boolean;
}

interface VoiceMessage {
  _id: string;
  sender: {
    _id: string;
    username: string;
    profileImage?: string;
    playerId: string;
  };
  content: string;
  timestamp: string;
  messageType: 'text' | 'system' | 'mic_request';
}

const VoiceRoom: React.FC<VoiceRoomProps> = ({ user, wsService }) => {
  const [roomData, setRoomData] = useState<VoiceRoomData | null>(null);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInSeat, setIsInSeat] = useState(false);
  const [currentSeatNumber, setCurrentSeatNumber] = useState<number | null>(null);
  // إزالة isInWaitingQueue - تبسيط النظام
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // WebRTC Voice Chat states
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<VoiceUser[]>([]);
  const [voiceActivity, setVoiceActivity] = useState<Map<string, VoiceActivityData>>(new Map());

  // WebRTC service
  const webrtcServiceRef = useRef<WebRTCVoiceService | null>(null);

  // تحميل بيانات الغرفة الصوتية
  const loadVoiceRoom = async () => {
    try {
      setIsLoading(true);
      const [roomResponse, messagesResponse] = await Promise.all([
        apiService.getVoiceRoom(),
        apiService.getVoiceRoomMessages()
      ]);

      setRoomData(roomResponse as VoiceRoomData);
      setMessages(messagesResponse as VoiceMessage[]);

      // التحقق من حالة المستخدم الحالي
      const userSeat = (roomResponse as VoiceRoomData).seats.find((seat: VoiceSeat) => 
        seat.user && seat.user._id === user.id
      );
      
      if (userSeat) {
        setIsInSeat(true);
        setCurrentSeatNumber(userSeat.seatNumber);
        setIsMuted(userSeat.isMuted);
      } else {
        setIsInSeat(false);
        setCurrentSeatNumber(null);
      }

      // قائمة الانتظار تم إلغاؤها - تبسيط النظام

      setError(null);
    } catch (err: any) {
      console.error('Error loading voice room:', err);
      setError(err.message || 'خطأ في تحميل الغرفة الصوتية');
    } finally {
      setIsLoading(false);
    }
  };

  // إعداد WebRTC service
  useEffect(() => {
    // التأكد من وجود user.id قبل إنشاء WebRTC service
    if (!user?.id) {
      console.warn('⚠️ No user ID available, skipping WebRTC service setup');
      return;
    }

    console.log('🔧 Setting up WebRTC Voice Service with user ID:', user.id);

    try {
      webrtcServiceRef.current = new WebRTCVoiceService(wsService);
    } catch (error) {
      console.error('❌ Error creating WebRTC service:', error);
      return;
    }

    // إعداد callbacks للأحداث
    if (webrtcServiceRef.current) {
      webrtcServiceRef.current.onUserJoined = (voiceUser: VoiceUser) => {
        console.log(`👤 User joined voice chat: ${voiceUser.id}`);
        setRemoteUsers(prev => [...prev.filter(u => u.id !== voiceUser.id), voiceUser]);
      };

      webrtcServiceRef.current.onUserLeft = (userId: string) => {
        console.log(`👋 User left voice chat: ${userId}`);
        setRemoteUsers(prev => prev.filter(u => u.id !== userId));
        setVoiceActivity(prev => {
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
      };

      webrtcServiceRef.current.onVoiceActivity = (data: VoiceActivityData) => {
        console.log('🎤 Voice activity changed:', data.isSpeaking ? 'speaking' : 'silent', `(level: ${data.level})`);

        // تحديث الحالة المحلية
        setVoiceActivity(prev => {
          const newMap = new Map(prev);
          newMap.set(data.userId, data);
          return newMap;
        });

        // إرسال Voice Activity للمستخدمين الآخرين عبر WebSocket
        if (user?.id && isInSeat) {
          console.log('📤 Voice activity sent:', data.isSpeaking ? 'speaking' : 'silent', `(userId: ${user.id})`);
          wsService.send({
            type: 'voice_activity',
            data: {
              userId: user.id,
              level: data.level,
              isSpeaking: data.isSpeaking,
              timestamp: Date.now()
            }
          });
        } else {
          if (!user?.id) {
            console.warn('⚠️ No currentUserId available for voice activity');
          }
          if (!isInSeat) {
            console.log('🔍 User not in seat, voice activity not sent');
          }
        }
      };

      webrtcServiceRef.current.onError = (error: Error) => {
        console.error('❌ WebRTC error:', error);
        setError(`خطأ في الصوت: ${error.message}`);
      };
    }

    return () => {
      if (webrtcServiceRef.current) {
        console.log('🧹 Cleaning up WebRTC service');
        webrtcServiceRef.current.leaveRoom().catch(console.error);
      }
    };
  }, [wsService, user?.id]); // إضافة optional chaining

  // WebRTC configuration is simpler - no tokens needed



  // إعداد WebSocket listeners
  useEffect(() => {
    const handleVoiceRoomMessage = (data: any) => {
      setMessages(prev => [...prev, data]);
    };

    const handleVoiceRoomUpdate = (data: any) => {
      loadVoiceRoom(); // إعادة تحميل بيانات الغرفة

      // إذا انضم مستخدم جديد للمقعد، ابدأ اتصال WebRTC
      if (data.action === 'seat_joined' && isInSeat && data.userId !== user.id) {
        setTimeout(() => {
          webrtcServiceRef.current?.sendOffer(data.userId);
        }, 1000);
      }
    };

    // معالج استقبال Voice Activity من المستخدمين الآخرين
    const handleVoiceActivity = (data: any) => {
      console.log('📥 Received voice activity:', data);
      if (data.userId && data.userId !== user.id) {
        // تحديث Voice Activity للمستخدمين الآخرين
        setVoiceActivity(prev => {
          const newMap = new Map(prev);
          newMap.set(data.userId.toString(), {
            uid: data.userId.toString(),
            level: data.level,
            isSpeaking: data.isSpeaking
          });
          return newMap;
        });
      }
    };

    wsService.onMessage('voice_room_message', handleVoiceRoomMessage);
    wsService.onMessage('voice_room_update', handleVoiceRoomUpdate);
    wsService.onMessage('voice_activity', handleVoiceActivity);

    return () => {
      wsService.offMessage('voice_room_message', handleVoiceRoomMessage);
      wsService.offMessage('voice_room_update', handleVoiceRoomUpdate);
      wsService.offMessage('voice_activity', handleVoiceActivity);
    };
  }, [wsService, isInSeat, user.id]);

  // تحميل البيانات عند بدء التشغيل
  useEffect(() => {
    loadVoiceRoom();
  }, []);

  // إضافة تحذير عند مغادرة الصفحة إذا كان المستخدم في مقعد
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isInSeat) {
        e.preventDefault();
        e.returnValue = 'أنت حالياً في الغرفة الصوتية. هل تريد المغادرة؟';
        return 'أنت حالياً في الغرفة الصوتية. هل تريد المغادرة؟';
      }
    };

    const handleUnload = () => {
      // إذا غادر المستخدم الصفحة وهو في مقعد، أرسل إشارة مغادرة
      if (isInSeat) {
        navigator.sendBeacon('/api/voice-room/leave-seat', JSON.stringify({
          userId: user.id
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [isInSeat, user.id]);

  // إرسال رسالة نصية
  const sendMessage = async (content: string) => {
    try {
      const response = await apiService.sendVoiceRoomMessage(content);
      
      // إرسال عبر WebSocket للتحديث الفوري
      wsService.send({
        type: 'voice_room_message',
        data: (response as any).messageData
      });
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'خطأ في إرسال الرسالة');
    }
  };

  // طلب المايك
  const requestMic = async () => {
    try {
      setIsConnecting(true);
      await apiService.requestMic();
      
      // إرسال تحديث عبر WebSocket
      wsService.send({
        type: 'voice_room_update',
        data: { action: 'mic_requested', userId: user.id }
      });
      
      await loadVoiceRoom();
    } catch (err: any) {
      console.error('Error requesting mic:', err);
      setError(err.message || 'خطأ في طلب المايك');
    } finally {
      setIsConnecting(false);
    }
  };

  // إلغاء طلب المايك
  const cancelMicRequest = async () => {
    try {
      await apiService.cancelMicRequest();
      
      wsService.send({
        type: 'voice_room_update',
        data: { action: 'mic_request_cancelled', userId: user.id }
      });
      
      await loadVoiceRoom();
    } catch (err: any) {
      console.error('Error cancelling mic request:', err);
      setError(err.message || 'خطأ في إلغاء طلب المايك');
    }
  };

  // الانضمام لمقعد
  const joinSeat = async (seatNumber: number) => {
    try {
      setIsConnecting(true);
      setError(null);

      // الانضمام للمقعد في قاعدة البيانات
      await apiService.joinVoiceSeat(seatNumber);

      // بدء المحادثة الصوتية مع WebRTC
      if (webrtcServiceRef.current && user?.id) {
        console.log('🎤 Starting WebRTC voice chat for seat', seatNumber);

        try {
          // الانضمام لغرفة الصوت
          const roomId = `voice-room-${roomData?.id || 'default'}`;
          await webrtcServiceRef.current.joinRoom(roomId, user.id);

          setIsVoiceConnected(true);
          console.log('✅ WebRTC voice chat started successfully');

        } catch (webrtcError) {
          console.error('❌ WebRTC initialization failed:', webrtcError);
          setError(`فشل في بدء المحادثة الصوتية: ${webrtcError.message}`);
        }
      }

      // حفظ حالة الانضمام للغرفة الصوتية
      localStorage.setItem('isInVoiceRoom', 'true');
      localStorage.setItem('voiceRoomSeat', seatNumber.toString());

      // إشعار المستخدمين الآخرين
      wsService.send({
        type: 'voice_room_update',
        data: { action: 'seat_joined', userId: user.id, seatNumber }
      });

      await loadVoiceRoom();
    } catch (err: any) {
      console.error('Error joining seat:', err);
      setError(err.message || 'خطأ في الانضمام للمقعد');
      setIsVoiceConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  // مغادرة المقعد
  const leaveSeat = async () => {
    try {
      // مغادرة المقعد في قاعدة البيانات
      await apiService.leaveVoiceSeat();

      // إيقاف المحادثة الصوتية مع WebRTC
      if (webrtcServiceRef.current) {
        await webrtcServiceRef.current.leaveRoom();
        setIsVoiceConnected(false);
        setRemoteUsers([]);
        setVoiceActivity(new Map());
        console.log('🔇 WebRTC voice chat stopped');
      }

      // إزالة حالة الانضمام للغرفة الصوتية
      localStorage.removeItem('isInVoiceRoom');
      localStorage.removeItem('voiceRoomSeat');

      // إشعار المستخدمين الآخرين
      wsService.send({
        type: 'voice_room_update',
        data: { action: 'seat_left', userId: user.id, seatNumber: currentSeatNumber }
      });

      await loadVoiceRoom();
    } catch (err: any) {
      console.error('Error leaving seat:', err);
      setError(err.message || 'خطأ في مغادرة المقعد');
    }
  };

  // تبديل كتم المايك
  const toggleMute = async () => {
    try {
      if (!webrtcServiceRef.current) {
        throw new Error('خدمة الصوت غير متاحة');
      }

      // تبديل الكتم في WebRTC
      const newMutedState = await webrtcServiceRef.current.toggleMute();

      // تحديث حالة الكتم في الخادم
      await apiService.toggleMute(newMutedState);

      // تحديث حالة الكتم محلياً
      setIsMuted(newMutedState);

      // إشعار المستخدمين الآخرين
      wsService.send({
        type: 'voice_room_update',
        data: { action: 'mute_toggled', userId: user.id, isMuted: newMutedState }
      });

      console.log(newMutedState ? '🔇 Muted' : '🔊 Unmuted');
    } catch (err: any) {
      console.error('Error toggling mute:', err);
      setError(err.message || 'خطأ في تبديل كتم المايك');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-400" />
          <p className="text-gray-300">جاري تحميل الغرفة الصوتية...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={loadVoiceRoom}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div className="text-center text-gray-400">
        <p>لا توجد بيانات للغرفة الصوتية</p>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto p-4 sm:p-6 space-y-6 ${isInSeat ? 'pb-24 sm:pb-6' : ''}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl p-4 sm:p-6 border border-purple-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center gap-3">
              <Volume2 className="w-6 sm:w-8 h-6 sm:h-8 text-purple-400" />
              INFINITY ROOM
            </h1>
            <p className="text-gray-300 text-sm sm:text-base">غرفة صوتية للمحادثة مع الأصدقاء</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-4 text-gray-300">
              <div className="flex items-center gap-2">
                <Users className="w-4 sm:w-5 h-4 sm:h-5" />
                <span className="text-sm">{roomData.seats.filter(seat => seat.user).length}/{roomData.maxSeats}</span>
              </div>

              {/* مؤشر حالة Agora */}
              <div className="flex items-center gap-2 bg-black/20 px-2 sm:px-3 py-1 rounded-lg">
                {isVoiceConnected ? (
                  <Wifi className="w-3 sm:w-4 h-3 sm:h-4 text-green-400" />
                ) : (
                  <WifiOff className="w-3 sm:w-4 h-3 sm:h-4 text-red-400" />
                )}
                <span className="text-xs sm:text-sm">
                  {isVoiceConnected ? 'متصل' : 'غير متصل'}
                </span>
              </div>
            </div>
            
            {/* أزرار التحكم - محسنة للهواتف المحمولة */}
            {isInSeat && (
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={toggleMute}
                  className={`w-full sm:w-auto p-3 sm:p-2 rounded-lg transition-colors text-sm font-medium ${
                    isMuted
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                  title={isMuted ? 'إلغاء كتم المايك' : 'كتم المايك'}
                >
                  <div className="flex items-center justify-center gap-2">
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    <span className="sm:hidden">{isMuted ? 'إلغاء الكتم' : 'كتم المايك'}</span>
                  </div>
                </button>

                <button
                  onClick={leaveSeat}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors text-sm font-medium"
                >
                  مغادرة المقعد
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* المقاعد الصوتية */}
        <div className="lg:col-span-2">
          <VoiceSeats
            seats={roomData.seats}
            waitingQueue={roomData.waitingQueue}
            currentUser={user}
            isInSeat={isInSeat}
            currentSeatNumber={currentSeatNumber}
            isInWaitingQueue={isInWaitingQueue}
            isConnecting={isConnecting}
            onJoinSeat={joinSeat}
            onRequestMic={requestMic}
            onCancelMicRequest={cancelMicRequest}
          />
        </div>

        {/* المحادثة النصية */}
        <div className="lg:col-span-1">
          <VoiceChatBox
            messages={messages}
            currentUser={user}
            isInWaitingQueue={isInWaitingQueue}
            onSendMessage={sendMessage}
            onRequestMic={requestMic}
          />
        </div>
      </div>

      {/* شريط أزرار التحكم الثابت للهواتف المحمولة */}
      {isInSeat && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-4 sm:hidden z-50">
          <div className="flex items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={toggleMute}
              className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl transition-all duration-200 font-medium ${
                isMuted
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25'
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/25'
              }`}
              title={isMuted ? 'إلغاء كتم المايك' : 'كتم المايك'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              <span>{isMuted ? 'إلغاء الكتم' : 'كتم المايك'}</span>
            </button>

            <button
              onClick={leaveSeat}
              className="flex-1 flex items-center justify-center gap-2 p-4 bg-red-600 hover:bg-red-700 rounded-xl text-white transition-all duration-200 font-medium shadow-lg shadow-red-600/25"
            >
              <span>مغادرة المقعد</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRoom;
