import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { WebSocketService } from '../services/websocket';
import { WebRTCVoiceService } from '../services/webrtc-voice';
import { textPredictionService } from '../services/textPrediction';
import { User } from '../types';
import EmojiPicker from './EmojiPicker';
import TextPrediction from './TextPrediction';
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Users,
  MessageCircle,
  Send,
  Clock,
  UserPlus,
  RefreshCw,
  AlertCircle,
  Shield,
  UserX,
  Volume1,
  MessageSquareOff,
  MessageSquare,
  ArrowDown,
  Trash2,
  MoreVertical,
  Smile,
  Zap,
  Target,
  Puzzle,
  Apple,
  Brain,
  Trees,
  X
} from 'lucide-react';

interface MobileVoiceRoomProps {
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
  maxUsers: number;
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
  listeners: Array<{
    user: {
      _id: string;
      username: string;
      profileImage?: string;
      playerId: string;
    };
    userPlayerId: string;
    joinedAt: string;
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

const MobileVoiceRoom: React.FC<MobileVoiceRoomProps> = ({ user, wsService }) => {
  const [roomData, setRoomData] = useState<VoiceRoomData | null>(null);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInSeat, setIsInSeat] = useState(false);
  const [currentSeatNumber, setCurrentSeatNumber] = useState<number | null>(null);
  // إزالة قائمة الانتظار - تبسيط النظام
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState<string | null>(null);
  const [showKickModal, setShowKickModal] = useState<string | null>(null);
  const [kickDuration, setKickDuration] = useState('30'); // بالدقائق
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [textSuggestions, setTextSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [showGameArea, setShowGameArea] = useState(false);
  const [audioTestMode, setAudioTestMode] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [audioPermission, setAudioPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [isSoundMuted, setIsSoundMuted] = useState(false);

  // WebRTC service
  const webrtcServiceRef = useRef<WebRTCVoiceService | null>(null);
  const remoteAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // تحميل بيانات الغرفة الصوتية
  const loadVoiceRoom = async () => {
    try {
      setIsLoading(true);
      const [roomResponse, messagesResponse] = await Promise.all([
        apiService.getVoiceRoom(),
        apiService.getVoiceRoomMessages()
      ]);

      setRoomData(roomResponse);

      // تحديث الرسائل مع بيانات المرسل الكاملة
      const messagesWithFullSender = messagesResponse.map((message: any) => ({
        ...message,
        sender: {
          ...message.sender,
          role: message.sender.role || (message.sender.isAdmin ? 'admin' : 'member'),
          isAdmin: message.sender.isAdmin || false,
          gender: message.sender.gender || 'male'
        }
      }));
      setMessages(messagesWithFullSender);

      // التحقق من حالة المستخدم الحالي
      const userSeat = roomResponse.seats.find((seat: VoiceSeat) => 
        seat.user && seat.user._id === user.id
      );
      
      if (userSeat) {
        console.log('✅ User is in seat:', userSeat.seatNumber);
        setIsInSeat(true);
        setCurrentSeatNumber(userSeat.seatNumber);
        setIsMuted(userSeat.isMuted);
      } else {
        console.log('❌ User is not in any seat');
        setIsInSeat(false);
        setCurrentSeatNumber(null);
      }

      // قائمة الانتظار تم إلغاؤها - تبسيط النظام

      setError(null);
    } catch (err: any) {
      console.error('Error loading voice room:', err);

      // التحقق من حالة الطرد
      if (err.message && err.message.includes('مطرود من الغرفة الصوتية')) {
        setError(err.message);
        // منع المستخدم من استخدام أي وظائف في الغرفة
        setRoomData({
          id: '',
          name: 'INFINITY ROOM',
          description: 'غرفة صوتية للمحادثة مع الأصدقاء',
          maxSeats: 5,
          maxUsers: 100,
          seats: [],
          waitingQueue: [],
          listeners: [],
          settings: {},
          isActive: false
        });
        setMessages([]);
        return;
      }

      setError(err.message || 'خطأ في تحميل الغرفة الصوتية');
    } finally {
      setIsLoading(false);
    }
  };

  // تحديث صامت للغرفة (بدون loading) - للحفاظ على ثبات الغرفة
  const updateVoiceRoomSilently = async () => {
    try {
      const [roomResponse, messagesResponse] = await Promise.all([
        apiService.getVoiceRoom(),
        apiService.getVoiceRoomMessages()
      ]);

      setRoomData(roomResponse);

      // تحديث الرسائل مع بيانات المرسل الكاملة
      const messagesWithFullSender = messagesResponse.map((message: any) => ({
        ...message,
        sender: {
          ...message.sender,
          role: message.sender.role || (message.sender.isAdmin ? 'admin' : 'member'),
          isAdmin: message.sender.isAdmin || false,
          gender: message.sender.gender || 'male'
        }
      }));
      setMessages(messagesWithFullSender);

      // التحقق من حالة المستخدم الحالي
      const userSeat = roomResponse.seats.find((seat: VoiceSeat) =>
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

      setError(null);
    } catch (err: any) {
      console.error('Error updating voice room silently:', err);
      // لا نعرض خطأ للمستخدم في التحديث الصامت
    }
  };

  // إعداد WebRTC service
  useEffect(() => {
    webrtcServiceRef.current = new WebRTCVoiceService(wsService);
    
    // إعداد callbacks للصوت البعيد
    webrtcServiceRef.current.onRemoteStreamAdded = (userId: string, stream: MediaStream) => {
      const audio = new Audio();
      audio.srcObject = stream;
      audio.autoplay = true;
      audio.muted = isSoundMuted; // تطبيق حالة كتم الصوت
      remoteAudiosRef.current.set(userId, audio);
    };

    webrtcServiceRef.current.onRemoteStreamRemoved = (userId: string) => {
      const audio = remoteAudiosRef.current.get(userId);
      if (audio) {
        audio.pause();
        audio.srcObject = null;
        remoteAudiosRef.current.delete(userId);
      }
    };

    // معالج النشاط الصوتي (مع تقليل logs)
    webrtcServiceRef.current.onVoiceActivity = (data: any) => {
      if (data && typeof data.level === 'number') {
        setMicLevel(data.level);

        // تحديث حالة التحدث في الغرفة
        setRoomData(prev => ({
          ...prev,
          seats: prev.seats.map(seat =>
            seat.user?._id === user.id
              ? { ...seat, isSpeaking: data.isSpeaking }
              : seat
          )
        }));
      }
    };

    return () => {
      console.log('🧹 Component cleanup - leaving voice room...');

      // إذا كان المستخدم في مقعد، اتركه أولاً
      if (isInSeat) {
        console.log('🚪 User was in seat, leaving seat...');
        // مغادرة المقعد على الخادم
        apiService.leaveVoiceSeat().catch(console.error);

        // إشعار المستخدمين الآخرين
        wsService.send({
          type: 'voice_room_update',
          data: { action: 'seat_left', userId: user.id }
        });
      }

      // تنظيف WebRTC
      webrtcServiceRef.current?.cleanup();
    };
  }, [wsService, user.id]);

  // إعداد WebSocket listeners
  useEffect(() => {
    const handleVoiceRoomMessage = (data: any) => {
      // التأكد من أن الرسالة تحتوي على بيانات المرسل الكاملة
      const messageWithFullSender = {
        ...data,
        sender: {
          ...data.sender,
          role: data.sender.role || (data.sender.isAdmin ? 'admin' : 'member'),
          isAdmin: data.sender.isAdmin || false,
          gender: data.sender.gender || 'male'
        }
      };

      // تجنب إضافة الرسالة مرتين - لا نضيف رسائل المستخدم الحالي لأنها مضافة محلياً
      if (data.sender._id !== user.id) {
        setMessages(prev => [...prev, messageWithFullSender]);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };

    const handleVoiceRoomUpdate = (data: any) => {
      // لا نعيد تحميل الغرفة عند الكتم - نبقيها ثابتة
      if (data.action === 'mute_toggled') {
        // تحديث محلي فقط لحالة الكتم بدون إعادة تحميل
        if (roomData) {
          const updatedSeats = roomData.seats.map(seat => {
            if (seat.user && seat.user._id === data.userId) {
              return { ...seat, isMuted: data.isMuted };
            }
            return seat;
          });
          setRoomData({ ...roomData, seats: updatedSeats });
        }
      } else {
        // تحديث صامت للحفاظ على ثبات الغرفة
        updateVoiceRoomSilently();
      }

      if (data.action === 'seat_joined' && isInSeat && data.userId !== user.id) {
        console.log('🔄 User joined seat, initiating WebRTC connection:', data.userId);
        setTimeout(() => {
          if (webrtcServiceRef.current) {
            console.log('📞 Sending offer to new user:', data.userId);
            webrtcServiceRef.current.sendOffer(data.userId);
          } else {
            console.warn('⚠️ WebRTC service not available for offer');
          }
        }, 1000);
      }
    };

    // معالج التحديثات الإدارية المحسن
    const handleAdminActionUpdate = (data: any) => {
      const { action, targetUserId, adminId, message } = data;

      // تطبيق التحديث محلياً
      updateLocalRoomData(action, targetUserId);

      // إظهار إشعار للمستخدم المستهدف
      if (targetUserId === user.id) {
        setError(message || `تم تطبيق إجراء إداري: ${action}`);

        // إذا تم طرد المستخدم الحالي، إعادة تحميل الصفحة
        if (action === 'kick') {
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      }
    };

    const handleVoiceActivity = (data: any) => {
      const { userId, isSpeaking } = data;

      // تحديث حالة التحدث للمستخدمين الآخرين (بدون logs مفرطة)
      setRoomData(prev => ({
        ...prev,
        seats: prev.seats.map(seat =>
          seat.user?._id === userId
            ? { ...seat, isSpeaking }
            : seat
        )
      }));
    };

    wsService.onMessage('voice_room_message', handleVoiceRoomMessage);
    wsService.onMessage('voice_room_update', handleVoiceRoomUpdate);
    wsService.onMessage('admin_action_update', handleAdminActionUpdate);
    wsService.onMessage('voice_activity', handleVoiceActivity);

    return () => {
      wsService.offMessage('voice_room_message', handleVoiceRoomMessage);
      wsService.offMessage('voice_room_update', handleVoiceRoomUpdate);
      wsService.offMessage('admin_action_update', handleAdminActionUpdate);
    };
  }, [wsService, isInSeat, user.id]);

  // التمرير التلقائي للأسفل عند وصول رسائل جديدة
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // تحميل البيانات عند بدء التشغيل
  useEffect(() => {
    loadVoiceRoom();
    // تسجيل دور المستخدم للتشخيص
    console.log('User role:', user.role);
    console.log('User isAdmin:', user.isAdmin);
    console.log('User object:', user);
  }, []);

  // مراقبة لوحة المفاتيح للجوال
  useEffect(() => {
    const handleResize = () => {
      // إذا انخفض ارتفاع النافذة بشكل كبير، فهذا يعني أن لوحة المفاتيح مفتوحة
      const isKeyboard = window.innerHeight < window.screen.height * 0.75;
      setIsKeyboardOpen(isKeyboard);
    };

    const handleFocus = () => setIsKeyboardOpen(true);
    const handleBlur = () => setIsKeyboardOpen(false);

    window.addEventListener('resize', handleResize);
    if (inputRef.current) {
      inputRef.current.addEventListener('focus', handleFocus);
      inputRef.current.addEventListener('blur', handleBlur);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (inputRef.current) {
        inputRef.current.removeEventListener('focus', handleFocus);
        inputRef.current.removeEventListener('blur', handleBlur);
      }
    };
  }, []);

  // إغلاق القوائم عند الضغط خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAdminMenu) {
        setShowAdminMenu(null);
      }
      if (showEmojiPicker) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showAdminMenu, showEmojiPicker]);

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
        console.log('🚪 Page unload - user leaving seat via beacon');

        // استخدام sendBeacon لضمان وصول الرسالة
        const token = localStorage.getItem('token');
        if (token) {
          navigator.sendBeacon('/api/voice-room/leave-seat', JSON.stringify({
            userId: user.id,
            token: token
          }));
        }

        // إشعار WebSocket إذا كان متاح
        try {
          wsService.send({
            type: 'voice_room_update',
            data: { action: 'seat_left', userId: user.id }
          });
        } catch (error) {
          console.warn('WebSocket not available for unload notification');
        }
      }
    };

    // معالج إخفاء/إظهار الصفحة (تبديل التبويبات)
    const handleVisibilityChange = () => {
      if (document.hidden && isInSeat) {
        console.log('📱 Page hidden - user still in seat');
        // لا نخرج المستخدم عند إخفاء الصفحة فقط
      } else if (!document.hidden && isInSeat) {
        console.log('📱 Page visible - user back in seat');
        // تحديث حالة الغرفة عند العودة (صامت)
        updateVoiceRoomSilently();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isInSeat, user.id]);

  // إرسال رسالة نصية
  const sendMessage = async (content: string) => {
    try {
      const response = await apiService.sendVoiceRoomMessage(content);

      // إضافة الرسالة فوراً للواجهة مع بيانات المستخدم الكاملة
      const newMessage = {
        _id: response.messageData._id,
        sender: {
          _id: user.id,
          username: user.username,
          role: user.role,
          isAdmin: user.isAdmin,
          gender: user.gender
        },
        content: content,
        timestamp: new Date().toISOString(),
        messageType: 'text'
      };

      setMessages(prev => [...prev, newMessage]);

      wsService.send({
        type: 'voice_room_message',
        data: response.messageData
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
      
      wsService.send({
        type: 'voice_room_update',
        data: { action: 'mic_requested', userId: user.id }
      });
      
      // تحديث صامت بعد طلب المايك
      await updateVoiceRoomSilently();
    } catch (err: any) {
      console.error('Error requesting mic:', err);
      setError(err.message || 'خطأ في طلب المايك');
    } finally {
      setIsConnecting(false);
    }
  };

  // الانضمام لمقعد
  const joinSeat = async (seatNumber: number) => {
    try {
      setIsConnecting(true);
      await apiService.joinVoiceSeat(seatNumber);

      // تحديث فوري للحالة
      setIsInSeat(true);
      setCurrentSeatNumber(seatNumber);
      setIsMuted(false);

      if (webrtcServiceRef.current && user?.id) {
        console.log('🎤 Starting WebRTC voice chat for user:', user.username);
        const roomId = `voice-room-${roomData?.id || 'default'}`;
        await webrtcServiceRef.current.joinRoom(roomId, user.id);
        console.log('✅ WebRTC voice chat started successfully');
      }

      // حفظ حالة الانضمام للغرفة الصوتية
      localStorage.setItem('isInVoiceRoom', 'true');
      localStorage.setItem('voiceRoomSeat', seatNumber.toString());

      wsService.send({
        type: 'voice_room_update',
        data: { action: 'seat_joined', userId: user.id, seatNumber }
      });

      // تحديث صامت بعد الانضمام للمقعد
      await updateVoiceRoomSilently();

      // إضافة آلية للتأكد من الاتصال مع المستخدمين الموجودين
      setTimeout(() => {
        if (webrtcServiceRef.current && roomData) {
          console.log('🔄 Checking for existing users to connect with...');
          roomData.seats.forEach(seat => {
            if (seat.user && seat.user._id !== user.id) {
              console.log('📞 Initiating connection with existing user:', seat.user._id);
              webrtcServiceRef.current?.sendOffer(seat.user._id);
            }
          });
        }
      }, 2000);
    } catch (err: any) {
      console.error('Error joining seat:', err);
      setError(err.message || 'خطأ في الانضمام للمقعد');
    } finally {
      setIsConnecting(false);
    }
  };

  // مغادرة المقعد
  const leaveSeat = async () => {
    try {
      await apiService.leaveVoiceSeat();

      // تحديث فوري للحالة
      setIsInSeat(false);
      setCurrentSeatNumber(null);
      setIsMuted(false);

      if (webrtcServiceRef.current) {
        webrtcServiceRef.current.leaveRoom();
      }

      // إزالة حالة الانضمام للغرفة الصوتية
      localStorage.removeItem('isInVoiceRoom');
      localStorage.removeItem('voiceRoomSeat');

      wsService.send({
        type: 'voice_room_update',
        data: { action: 'seat_left', userId: user.id, seatNumber: currentSeatNumber }
      });

      // تحديث صامت بعد مغادرة المقعد
      await updateVoiceRoomSilently();
    } catch (err: any) {
      console.error('Error leaving seat:', err);
      setError(err.message || 'خطأ في مغادرة المقعد');
    }
  };

  // تبديل كتم المايك
  const toggleMute = async () => {
    try {
      const newMutedState = !isMuted;

      // تحديث الحالة المحلية أولاً للاستجابة السريعة
      setIsMuted(newMutedState);

      // تطبيق الكتم على WebRTC
      if (webrtcServiceRef.current) {
        await webrtcServiceRef.current.toggleMute(newMutedState);
      }

      // تحديث الخادم
      await apiService.toggleMute(newMutedState);

      // إشعار المستخدمين الآخرين
      wsService.send({
        type: 'voice_room_update',
        data: { action: 'mute_toggled', userId: user.id, isMuted: newMutedState }
      });

      console.log(`🎤 Microphone ${newMutedState ? 'muted' : 'unmuted'}`);
    } catch (err: any) {
      console.error('Error toggling mute:', err);
      // إعادة الحالة في حالة الخطأ
      setIsMuted(!isMuted);
      setError(err.message || 'خطأ في تبديل كتم المايك');
    }
  };

  // كتم/إلغاء كتم الصوت
  const toggleSound = () => {
    const newSoundMuted = !isSoundMuted;
    setIsSoundMuted(newSoundMuted);

    // كتم جميع عناصر الصوت البعيدة
    remoteAudiosRef.current.forEach(audio => {
      audio.muted = newSoundMuted;
    });

    // حفظ الحالة في localStorage
    localStorage.setItem('soundMuted', newSoundMuted.toString());

    console.log(`🔊 Sound ${newSoundMuted ? 'muted' : 'unmuted'}`);
  };

  // معالجة تغيير النص
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageInput(value);

    // الحصول على اقتراحات النص التنبئي
    if (value.length >= 2) {
      const suggestions = textPredictionService.getSuggestions(value);
      setTextSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // اختيار اقتراح نصي
  const handleSuggestionSelect = (suggestion: string) => {
    setMessageInput(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // اختيار إيموجي
  const handleEmojiSelect = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // معالجة إرسال الرسالة
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim()) return;

    const content = messageInput.trim();
    setMessageInput('');
    setShowSuggestions(false);

    // إضافة الرسالة لخدمة النص التنبئي
    textPredictionService.addMessage(content);

    try {
      await sendMessage(content);
    } catch (error) {
      setMessageInput(content);
    }
  };

  // الدوال الإدارية
  const handleAdminAction = async (action: string, targetUserId: string, duration?: number) => {
    try {
      let result;
      switch (action) {
        case 'kick':
          result = await apiService.kickUserFromVoiceRoom(targetUserId, duration);
          break;
        case 'mute':
          result = await apiService.muteUserInVoiceRoom(targetUserId);
          break;
        case 'unmute':
          result = await apiService.unmuteUserInVoiceRoom(targetUserId);
          break;
        case 'removeSeat':
          result = await apiService.removeUserFromSeat(targetUserId);
          break;
        case 'removeQueue':
          result = await apiService.removeUserFromQueue(targetUserId);
          break;
        case 'banChat':
          result = await apiService.banUserFromChat(targetUserId);
          break;
        case 'unbanChat':
          result = await apiService.unbanUserFromChat(targetUserId);
          break;
      }

      setShowAdminMenu(null);
      setShowKickModal(null);

      // تحديث محلي فوري بدلاً من إعادة تحميل كامل
      updateLocalRoomData(action, targetUserId);

      // إرسال تحديث محدد للمستخدمين الآخرين فقط
      wsService.send({
        type: 'admin_action_update',
        data: {
          action,
          targetUserId,
          adminId: user.id,
          duration,
          message: result?.message
        }
      });

    } catch (err: any) {
      console.error('Error performing admin action:', err);
      setError(err.message || 'خطأ في تنفيذ الإجراء الإداري');
    }
  };

  // تحديث البيانات محلياً بدون إعادة تحميل
  const updateLocalRoomData = (action: string, targetUserId: string) => {
    setRoomData(prevData => {
      if (!prevData) return prevData;

      const newData = { ...prevData };

      switch (action) {
        case 'kick':
        case 'removeSeat':
          // إزالة المستخدم من المقعد
          newData.seats = newData.seats.map(seat =>
            seat.user && seat.user._id === targetUserId
              ? { ...seat, user: null, isMuted: false }
              : seat
          );
          // إزالة من قائمة الانتظار
          newData.waitingQueue = newData.waitingQueue.filter(
            item => item.user._id !== targetUserId
          );
          break;

        case 'removeQueue':
          // إزالة من قائمة الانتظار فقط
          newData.waitingQueue = newData.waitingQueue.filter(
            item => item.user._id !== targetUserId
          );
          break;

        case 'mute':
          // كتم المستخدم
          newData.seats = newData.seats.map(seat =>
            seat.user && seat.user._id === targetUserId
              ? { ...seat, isMuted: true }
              : seat
          );
          break;

        case 'unmute':
          // إلغاء كتم المستخدم
          newData.seats = newData.seats.map(seat =>
            seat.user && seat.user._id === targetUserId
              ? { ...seat, isMuted: false }
              : seat
          );
          break;

        case 'banChat':
          // منع من الكتابة
          newData.seats = newData.seats.map(seat =>
            seat.user && seat.user._id === targetUserId
              ? { ...seat, user: { ...seat.user, isChatBanned: true } }
              : seat
          );
          newData.waitingQueue = newData.waitingQueue.map(item =>
            item.user._id === targetUserId
              ? { ...item, user: { ...item.user, isChatBanned: true } }
              : item
          );
          break;

        case 'unbanChat':
          // إلغاء منع من الكتابة
          newData.seats = newData.seats.map(seat =>
            seat.user && seat.user._id === targetUserId
              ? { ...seat, user: { ...seat.user, isChatBanned: false } }
              : seat
          );
          newData.waitingQueue = newData.waitingQueue.map(item =>
            item.user._id === targetUserId
              ? { ...item, user: { ...item.user, isChatBanned: false } }
              : item
          );
          break;
      }

      return newData;
    });
  };

  // التعامل مع الطرد مع اختيار المدة
  const handleKickWithDuration = async () => {
    const durationInMinutes = parseInt(kickDuration);
    await handleAdminAction('kick', showKickModal!, durationInMinutes);
  };

  // فتح لعبة داخل الغرفة
  const openGame = (gameUrl: string) => {
    setCurrentGame(gameUrl);
    setShowGameArea(true);
  };

  // إغلاق منطقة الألعاب
  const closeGame = () => {
    setCurrentGame(null);
    setShowGameArea(false);
  };

  // دعم مفتاح ESC للخروج من اللعبة
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showGameArea) {
        closeGame();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showGameArea]);

  // اختبار الصوت والمايك
  const testAudio = async () => {
    try {
      setAudioTestMode(true);

      // طلب إذن المايك
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setAudioPermission('granted');

      // إنشاء AudioContext لقياس مستوى الصوت
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      microphone.connect(analyser);
      analyser.fftSize = 256;

      // مراقبة مستوى الصوت
      const checkAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setMicLevel(Math.min(100, (average / 128) * 100));

        if (audioTestMode) {
          requestAnimationFrame(checkAudioLevel);
        }
      };

      checkAudioLevel();

      // إيقاف الاختبار بعد 10 ثوان
      setTimeout(() => {
        setAudioTestMode(false);
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        setMicLevel(0);
      }, 10000);

    } catch (error) {
      console.error('Audio test failed:', error);
      setAudioPermission('denied');
      setAudioTestMode(false);
      setError('فشل في الوصول للمايك. تأكد من منح الإذن في المتصفح.');
    }
  };

  // فحص حالة إذن الصوت عند التحميل
  useEffect(() => {
    const checkAudioPermission = async () => {
      try {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setAudioPermission(permission.state as 'granted' | 'denied' | 'prompt');

        permission.addEventListener('change', () => {
          setAudioPermission(permission.state as 'granted' | 'denied' | 'prompt');
        });
      } catch (error) {
        console.log('Permission API not supported');
      }
    };

    checkAudioPermission();

    // استعادة حالة كتم الصوت
    const savedSoundMuted = localStorage.getItem('soundMuted');
    if (savedSoundMuted === 'true') {
      setIsSoundMuted(true);
    }
  }, []);

  // محاكاة حالة التحدث للاختبار
  const simulateSpeaking = () => {
    if (!isInSeat) return;

    // تحديث حالة التحدث محلياً للاختبار
    setRoomData(prev => ({
      ...prev,
      seats: prev.seats.map(seat =>
        seat.user?._id === user.id
          ? { ...seat, isSpeaking: true }
          : seat
      )
    }));

    // إيقاف المحاكاة بعد 3 ثوان
    setTimeout(() => {
      setRoomData(prev => ({
        ...prev,
        seats: prev.seats.map(seat =>
          seat.user?._id === user.id
            ? { ...seat, isSpeaking: false }
            : seat
        )
      }));
    }, 3000);
  };



  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-400" />
          <p className="text-gray-300">جاري تحميل الغرفة الصوتية...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isKicked = error.includes('مطرود من الغرفة الصوتية');

    return (
      <div className="p-4">
        <div className={`border rounded-lg p-6 text-center max-w-md mx-auto ${
          isKicked
            ? 'bg-orange-900/20 border-orange-500/30'
            : 'bg-red-900/20 border-red-500/30'
        }`}>
          <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${
            isKicked ? 'text-orange-400' : 'text-red-400'
          }`} />

          {isKicked ? (
            <>
              <h3 className="text-orange-400 font-bold text-lg mb-2">
                تم طردك من الغرفة الصوتية
              </h3>
              <p className="text-orange-300 mb-4 text-sm leading-relaxed">
                {error}
              </p>
              <p className="text-gray-400 text-xs">
                سيتم السماح لك بالدخول مرة أخرى بعد انتهاء المدة المحددة
              </p>
            </>
          ) : (
            <>
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={loadVoiceRoom}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white"
              >
                إعادة المحاولة
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div className="p-4 text-center text-gray-400">
        <p>لا توجد بيانات للغرفة الصوتية</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-900/50 to-purple-900/30">
      {/* Header */}
      <div className="p-3 border-b border-purple-500/20">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-bold text-white flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-purple-400" />
            INFINITY ROOM
          </h1>

          <div className="flex items-center gap-2 text-xs text-gray-300">
            <Users className="w-3 h-3" />
            <span>
              {(roomData.seats?.filter(seat => seat.user).length || 0) + (roomData.listeners?.length || 0)}/{roomData.maxUsers || 100}
            </span>
            <span className="text-gray-500">
              (🎤 {roomData.seats?.filter(seat => seat.user).length || 0}/5)
            </span>
            {/* مؤشر الأدمن للاختبار */}
            {(user.role === 'admin' || user.isAdmin) && (
              <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">ADMIN</span>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        {(isInSeat || currentSeatNumber !== null) && (
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={toggleMute}
              disabled={!isInSeat}
              className={`py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                !isInSeat
                  ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                  : isMuted
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
              <span className="text-xs">{isMuted ? 'إلغاء كتم' : 'كتم مايك'}</span>
            </button>

            <button
              onClick={toggleSound}
              className={`py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                isSoundMuted
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isSoundMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              <span className="text-xs">{isSoundMuted ? 'إلغاء كتم' : 'كتم صوت'}</span>
            </button>

            <button
              onClick={leaveSeat}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors text-xs"
            >
              مغادرة
            </button>
          </div>
        )}

        {/* شريط اختبار الصوت */}
        <div className="flex items-center gap-3 p-2 bg-gray-800/30 rounded-lg mb-3">
          <div className="flex items-center gap-2">
            {/* مؤشر حالة المايك */}
            <div className={`w-2 h-2 rounded-full ${
              audioPermission === 'granted'
                ? 'bg-green-500'
                : audioPermission === 'denied'
                  ? 'bg-red-500'
                  : 'bg-yellow-500'
            }`}></div>

            {/* مؤشر مستوى الصوت */}
            <div className="flex items-center gap-1">
              <Mic className={`w-3 h-3 ${
                audioTestMode && micLevel > 10
                  ? 'text-green-400'
                  : 'text-gray-400'
              }`} />
              <div className="w-12 h-1.5 bg-gray-600 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-100 ${
                    micLevel > 70 ? 'bg-red-500' :
                    micLevel > 30 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${micLevel}%` }}
                ></div>
              </div>
            </div>
          </div>

          <button
            onClick={testAudio}
            disabled={audioTestMode}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              audioTestMode
                ? 'bg-yellow-600 text-white cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {audioTestMode ? 'اختبار...' : 'اختبار مايك'}
          </button>

          {isInSeat && (
            <button
              onClick={simulateSpeaking}
              className="px-2 py-1 text-xs rounded bg-green-600 hover:bg-green-700 text-white transition-colors"
            >
              محاكاة تحدث
            </button>
          )}

          {audioPermission === 'denied' && (
            <span className="text-xs text-red-400">
              مرفوض
            </span>
          )}
        </div>

        {/* إزالة Tab Switcher */}
      </div>

      {/* Content - المقاعد والمحادثة في شاشة واحدة */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* المقاعد الصوتية */}
        <div className="p-3 border-b border-gray-700/50">
          {/* المقاعد المدورة - صف واحد */}
          <div className="flex justify-center gap-2 mb-2 overflow-x-auto px-1">
            {roomData.seats.map((seat) => (
              <div key={seat.seatNumber} className="flex flex-col items-center flex-shrink-0">
                {seat.user ? (
                  <div className="relative">
                    {/* صورة المستخدم مع حدود ملونة */}
                    <div className={`relative w-14 h-14 rounded-full p-1 ${
                      seat.isSpeaking && !seat.isMuted
                        ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-lg shadow-green-500/50 animate-pulse'
                        : seat.user._id === user.id
                          ? 'bg-gradient-to-r from-green-500 to-green-600'
                          : (seat.user.role === 'admin' || seat.user.isAdmin)
                            ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/50'
                            : 'bg-gradient-to-r from-blue-500 to-purple-600'
                    } shadow-lg`}>
                      <div className="w-full h-full rounded-full overflow-hidden bg-gray-800">
                        {seat.user.profileImage ? (
                          <img
                            src={seat.user.profileImage}
                            alt={seat.user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img src="/images/default-avatar.png" alt="الصورة الشخصية" className="w-full h-full object-cover" />
                        )}
                      </div>

                      {/* مؤشر المايك */}
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-lg ${
                        seat.isMuted
                          ? 'bg-red-600'
                          : seat.isSpeaking
                            ? 'bg-green-500 animate-pulse shadow-green-500/50'
                            : 'bg-green-600'
                      }`}>
                        {seat.isMuted ? (
                          <MicOff className="w-3 h-3 text-white" />
                        ) : (
                          <Mic className={`w-3 h-3 text-white ${seat.isSpeaking ? 'animate-pulse' : ''}`} />
                        )}
                      </div>

                      {/* مؤشر التحدث - دوائر متحركة */}
                      {seat.isSpeaking && !seat.isMuted && (
                        <div className="absolute inset-0 rounded-full">
                          <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping"></div>
                          <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping" style={{ animationDelay: '0.5s' }}></div>
                        </div>
                      )}
                    </div>

                    {/* اسم المستخدم */}
                    <div className="text-center mt-1 relative">
                      <div className="flex items-center justify-center gap-1">
                        <div className="flex flex-col items-center">
                          <h3 className="font-medium text-white text-xs mb-1 truncate max-w-12">
                            {seat.user.username}
                          </h3>
                          {/* مؤشرات الحالة */}
                          <div className="flex gap-1">
                            {seat.isMuted && (
                              <div className="bg-red-600 rounded-full p-1" title="مكتوم">
                                <VolumeX className="w-2 h-2 text-white" />
                              </div>
                            )}
                            {seat.user.isChatBanned && (
                              <div className="bg-orange-600 rounded-full p-1" title="محظور من الكتابة">
                                <MessageSquareOff className="w-2 h-2 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                        {/* زر الإدارة - يظهر للأدمن فقط */}
                        {(user.role === 'admin' || user.isAdmin) && seat.user._id !== user.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Admin menu clicked for user:', seat.user.username);
                              setShowAdminMenu(showAdminMenu === seat.user._id ? null : seat.user._id);
                            }}
                            className="text-red-500 hover:text-red-300 transition-colors bg-gray-700 rounded-full p-1"
                            title="إجراءات الإدارة"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* قائمة الإجراءات الإدارية */}
                      {showAdminMenu === seat.user._id && (user.role === 'admin' || user.isAdmin) && (
                        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 border-2 border-red-500 rounded-lg shadow-2xl z-[9999] p-3 min-w-40">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleAdminAction('removeSeat', seat.user._id)}
                              className="flex items-center gap-2 px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 rounded transition-colors"
                            >
                              <ArrowDown className="w-3 h-3" />
                              إنزال
                            </button>

                            {/* كتم / إلغاء كتم */}
                            {seat.isMuted ? (
                              <button
                                onClick={() => handleAdminAction('unmute', seat.user._id)}
                                className="flex items-center gap-2 px-2 py-1 text-xs text-green-400 hover:bg-green-900/30 rounded transition-colors"
                              >
                                <Volume1 className="w-3 h-3" />
                                إلغاء كتم
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAdminAction('mute', seat.user._id)}
                                className="flex items-center gap-2 px-2 py-1 text-xs text-yellow-400 hover:bg-yellow-900/30 rounded transition-colors"
                              >
                                <VolumeX className="w-3 h-3" />
                                كتم
                              </button>
                            )}

                            {/* منع / إلغاء منع الكتابة */}
                            {seat.user.isChatBanned ? (
                              <button
                                onClick={() => handleAdminAction('unbanChat', seat.user._id)}
                                className="flex items-center gap-2 px-2 py-1 text-xs text-green-400 hover:bg-green-900/30 rounded transition-colors"
                              >
                                <MessageSquare className="w-3 h-3" />
                                إلغاء منع الكتابة
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAdminAction('banChat', seat.user._id)}
                                className="flex items-center gap-2 px-2 py-1 text-xs text-orange-400 hover:bg-orange-900/30 rounded transition-colors"
                              >
                                <MessageSquareOff className="w-3 h-3" />
                                منع الكتابة
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setShowAdminMenu(null);
                                setShowKickModal(seat.user._id);
                              }}
                              className="flex items-center gap-2 px-2 py-1 text-xs text-red-500 hover:bg-red-900/50 rounded transition-colors"
                            >
                              <UserX className="w-3 h-3" />
                              طرد
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    {/* المقعد الفارغ - قابل للضغط */}
                    <button
                      onClick={() => !isInSeat ? joinSeat(seat.seatNumber) : null}
                      disabled={isConnecting || isInSeat}
                      className="relative w-14 h-14 rounded-full p-1 bg-gradient-to-r from-gray-600 to-gray-700 shadow-lg hover:from-purple-600 hover:to-purple-700 disabled:hover:from-gray-600 disabled:hover:to-gray-700 transition-all duration-300 disabled:cursor-not-allowed"
                    >
                      <div className="w-full h-full rounded-full bg-gray-800/50 border-2 border-dashed border-gray-500 flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-gray-400" />
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* أزرار التحكم */}
          {!isInSeat && roomData.seats.every(seat => seat.user) && (
            <button
              onClick={requestMic}
              disabled={isConnecting}
              className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2 mb-4"
            >
              <Mic className="w-4 h-4" />
              {isConnecting ? 'جاري الطلب...' : 'طلب المايك'}
            </button>
          )}

          {/* قائمة الانتظار */}
          {roomData.waitingQueue.length > 0 && (
            <div className="bg-yellow-900/20 rounded-lg p-2 border border-yellow-500/20">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                قائمة الانتظار ({roomData.waitingQueue.length})
              </h3>

              <div className="space-y-2">
                {roomData.waitingQueue.map((item, index) => (
                  <div
                    key={item.user._id}
                    className="flex items-center gap-2 p-2 bg-gray-800/50 rounded text-sm relative"
                  >
                    <div className="w-6 h-6 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                      {index + 1}
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-white">{item.user.username}</span>
                      {/* مؤشرات الحالة */}
                      <div className="flex gap-1">
                        {item.user.isChatBanned && (
                          <div className="bg-orange-600 rounded-full p-1" title="محظور من الكتابة">
                            <MessageSquareOff className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </div>
                    </div>

                    {item.user._id === user.id && (
                      <span className="px-2 py-1 bg-yellow-600 rounded text-xs text-white">
                        أنت
                      </span>
                    )}

                    {/* زر الإدارة لقائمة الانتظار */}
                    {(user.role === 'admin' || user.isAdmin) && item.user._id !== user.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Admin menu clicked for queue user:', item.user.username);
                          setShowAdminMenu(showAdminMenu === `queue_${item.user._id}` ? null : `queue_${item.user._id}`);
                        }}
                        className="text-red-500 hover:text-red-300 transition-colors bg-gray-700 rounded-full p-1"
                        title="إجراءات الإدارة"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    )}

                    {/* قائمة الإجراءات الإدارية لقائمة الانتظار */}
                    {showAdminMenu === `queue_${item.user._id}` && (user.role === 'admin' || user.isAdmin) && (
                      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 border-2 border-red-500 rounded-lg shadow-2xl z-[9999] p-3 min-w-40">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleAdminAction('removeQueue', item.user._id)}
                            className="flex items-center gap-2 px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            إزالة
                          </button>

                          {/* منع / إلغاء منع الكتابة */}
                          {item.user.isChatBanned ? (
                            <button
                              onClick={() => handleAdminAction('unbanChat', item.user._id)}
                              className="flex items-center gap-2 px-2 py-1 text-xs text-green-400 hover:bg-green-900/30 rounded transition-colors"
                            >
                              <MessageSquare className="w-3 h-3" />
                              إلغاء منع الكتابة
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAdminAction('banChat', item.user._id)}
                              className="flex items-center gap-2 px-2 py-1 text-xs text-orange-400 hover:bg-orange-900/30 rounded transition-colors"
                            >
                              <MessageSquareOff className="w-3 h-3" />
                              منع الكتابة
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setShowAdminMenu(null);
                              setShowKickModal(item.user._id);
                            }}
                            className="flex items-center gap-2 px-2 py-1 text-xs text-red-500 hover:bg-red-900/50 rounded transition-colors"
                          >
                            <UserX className="w-3 h-3" />
                            طرد
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* المحادثة النصية - مساحة محددة لعرض 10 رسائل */}
        <div className="h-96 flex flex-col">
          {/* الرسائل */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="flex flex-col space-y-1">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-4">
                <MessageCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">لا توجد رسائل بعد</p>
              </div>
            ) : (
              messages.map((message) => {
                // تحديد لون الاسم حسب الجنس
                const getGenderColor = (sender: any) => {
                  // استخدام حقل gender من قاعدة البيانات أولاً
                  if (sender.gender === 'female') {
                    return 'text-pink-400';
                  } else if (sender.gender === 'male') {
                    return 'text-blue-400';
                  }

                  // إذا لم يكن محدد، استخدام الأسماء كاحتياطي
                  const femaleNames = ['فاطمة', 'عائشة', 'خديجة', 'زينب', 'مريم', 'سارة', 'نور', 'هند', 'ليلى', 'أمل', 'رنا', 'دانا', 'لينا', 'ريم', 'نادية', 'سلمى', 'ياسمين', 'روان', 'جنى', 'تالا'];
                  const isFemale = femaleNames.some(name => sender.username.includes(name));
                  return isFemale ? 'text-pink-400' : 'text-blue-400';
                };

                // تحديد ألوان الرسالة - جميع الرسائل من اليسار لليمين
                const getMessageStyle = () => {
                  if (message.messageType === 'system') {
                    return 'bg-blue-900/30 border border-blue-500/30 text-blue-200 ml-auto max-w-[85%]';
                  }

                  // رسائل الأدمن باللون الأحمر دائماً - مميزة بقوة
                  if (message.sender.role === 'admin' || message.sender.isAdmin) {
                    return 'bg-red-900/60 border-2 border-red-400/50 text-white ml-auto max-w-[75%] shadow-xl shadow-red-500/30 ring-1 ring-red-400/20';
                  }

                  // رسائل المستخدمين العاديين
                  return message.sender._id === user.id
                    ? 'bg-purple-900/50 border border-purple-500/30 text-white ml-auto max-w-[75%]'
                    : 'bg-gray-800/50 border border-gray-600/30 text-gray-200 ml-auto max-w-[75%]';
                };

                return (
                  <div
                    key={message._id}
                    className={`px-3 py-1.5 rounded-xl text-sm ${getMessageStyle()}`}
                  >
                    <div className="flex items-center justify-between mb-0.5 gap-2">
                      <span className={`font-medium text-xs flex-shrink-0 ${
                        message.sender.role === 'admin' || message.sender.isAdmin
                          ? 'text-red-300 font-bold'
                          : getGenderColor(message.sender)
                      }`}>
                        {message.sender.role === 'admin' || message.sender.isAdmin ? '👑 ' : ''}
                        {message.sender.username}
                      </span>
                      <span className="text-xs opacity-60 flex-shrink-0">
                        {formatMessageTime(message.timestamp)}
                      </span>
                    </div>
                    <div className="text-sm leading-snug">
                      {message.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
            </div>
          </div>

        {/* أيقونات الألعاب */}
        <div className="px-4 py-2 border-t border-gray-700/50 bg-gray-900/30">
          <div className="flex justify-center gap-4">
            <button
              onClick={() => openGame('/speed-challenge.html')}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-700/50 transition-colors group"
              title="تحدي السرعة"
            >
              <Zap className="w-6 h-6 text-yellow-400 group-hover:text-yellow-300" />
              <span className="text-xs text-gray-400 group-hover:text-gray-300">سرعة</span>
            </button>

            <button
              onClick={() => openGame('/game8.html')}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-700/50 transition-colors group"
              title="صناديق الحظ"
            >
              <Target className="w-6 h-6 text-green-400 group-hover:text-green-300" />
              <span className="text-xs text-gray-400 group-hover:text-gray-300">صناديق</span>
            </button>

            <button
              onClick={() => openGame('/mind-puzzles.html')}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-700/50 transition-colors group"
              title="ألغاز العقل"
            >
              <Puzzle className="w-6 h-6 text-blue-400 group-hover:text-blue-300" />
              <span className="text-xs text-gray-400 group-hover:text-gray-300">ألغاز</span>
            </button>

            <button
              onClick={() => openGame('/fruit-catching.html')}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-700/50 transition-colors group"
              title="قطف الفواكه"
            >
              <Apple className="w-6 h-6 text-red-400 group-hover:text-red-300" />
              <span className="text-xs text-gray-400 group-hover:text-gray-300">فواكه</span>
            </button>

            <button
              onClick={() => openGame('/memory-match.html')}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-700/50 transition-colors group"
              title="لعبة الذاكرة"
            >
              <Brain className="w-6 h-6 text-purple-400 group-hover:text-purple-300" />
              <span className="text-xs text-gray-400 group-hover:text-gray-300">ذاكرة</span>
            </button>

            <button
              onClick={() => openGame('/forest-game.html')}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-700/50 transition-colors group"
              title="لعبة الغابة"
            >
              <Trees className="w-6 h-6 text-green-600 group-hover:text-green-500" />
              <span className="text-xs text-gray-400 group-hover:text-gray-300">غابة</span>
            </button>
          </div>
        </div>

        {/* حقل إدخال الرسالة وأزرار المايك */}
        <div className="p-4 mb-4 border-t border-gray-700/50 bg-gray-900/50">
          <div className="relative">
            {/* النص التنبئي */}
            <TextPrediction
              suggestions={textSuggestions}
              onSuggestionSelect={handleSuggestionSelect}
              isVisible={showSuggestions}
            />

            {/* منتقي الإيموجي */}
            {showEmojiPicker && (
              <EmojiPicker
                onEmojiSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={messageInput}
                  onChange={handleInputChange}
                  placeholder="اكتب رسالتك..."
                  maxLength={500}
                  className="w-full px-3 py-2 pr-10 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 text-sm"
                  onFocus={() => setShowSuggestions(textSuggestions.length > 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />

                {/* زر الإيموجي */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowEmojiPicker(!showEmojiPicker);
                  }}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-yellow-400 transition-colors"
                >
                  <Smile className="w-4 h-4" />
                </button>
              </div>

              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>

              {!isInSeat && (
                <button
                  type="button"
                  onClick={requestMic}
                  className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white transition-colors"
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>
        </div>
        </div>
      </div>

      {/* Modal اختيار مدة الطرد */}
      {showKickModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-gray-800 rounded-lg border border-red-500 p-6 w-full max-w-sm">
            <h3 className="text-white font-bold text-lg mb-4 text-center">
              اختر مدة الطرد
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  المدة:
                </label>
                <select
                  value={kickDuration}
                  onChange={(e) => setKickDuration(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                >
                  <option value="30">30 دقيقة</option>
                  <option value="60">ساعة واحدة</option>
                  <option value="180">3 ساعات</option>
                  <option value="360">6 ساعات</option>
                  <option value="720">12 ساعة</option>
                  <option value="1440">يوم واحد</option>
                  <option value="4320">3 أيام</option>
                  <option value="10080">أسبوع واحد</option>
                  <option value="43200">شهر واحد</option>
                  <option value="525600">سنة واحدة</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowKickModal(null)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleKickWithDuration}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  طرد
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* منطقة الألعاب المدمجة */}
      {showGameArea && currentGame && (
        <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm z-50 flex flex-col">
          {/* شريط التحكم */}
          <div className="flex items-center justify-between p-4 bg-gray-800/90 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-white font-medium">اللعبة نشطة</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (currentGame) {
                    window.open(currentGame, '_blank');
                  }
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                فتح في نافذة جديدة
              </button>
              <button
                onClick={closeGame}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title="إغلاق اللعبة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* إطار اللعبة */}
          <div className="flex-1 relative">
            <iframe
              src={currentGame}
              className="w-full h-full border-0"
              title="لعبة مدمجة"
              allow="fullscreen; autoplay; microphone; camera"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />

            {/* طبقة تحميل */}
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center pointer-events-none opacity-0 transition-opacity duration-300" id="game-loading">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white">جاري تحميل اللعبة...</p>
              </div>
            </div>
          </div>

          {/* شريط سفلي للمعلومات */}
          <div className="p-3 bg-gray-800/90 border-t border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>يمكنك الاستمرار في الدردشة أثناء اللعب</span>
              </div>
              <div className="text-gray-500">
                اضغط ESC للخروج السريع
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileVoiceRoom;
