import { WebSocketService } from './websocket';

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

export class WebRTCService {
  private wsService: WebSocketService;
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private config: WebRTCConfig;
  private currentUserId: string;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private voiceActivityThreshold: number = 20;
  private isSpeaking: boolean = false;
  private isInitialized: boolean = false;

  // Event callbacks
  public onRemoteStreamAdded?: (userId: string, stream: MediaStream) => void;
  public onRemoteStreamRemoved?: (userId: string) => void;
  public onConnectionStateChange?: (userId: string, state: RTCPeerConnectionState) => void;
  public onVoiceActivity?: (isSpeaking: boolean, level: number) => void;

  constructor(wsService: WebSocketService, currentUserId: string) {
    this.wsService = wsService;
    this.currentUserId = currentUserId;
    
    // إعداد STUN/TURN servers محسنة
    this.config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        // TURN servers مجانية (محدودة)
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ]
    };

    this.setupWebSocketListeners();
  }

  private setupWebSocketListeners() {
    // إعداد listeners لرسائل WebRTC
    this.wsService.onMessage('webrtc_offer', (data: any) => {
      console.log('📥 Received WebRTC offer:', data);
      this.handleOffer(data);
    });

    this.wsService.onMessage('webrtc_answer', (data: any) => {
      console.log('📥 Received WebRTC answer:', data);
      this.handleAnswer(data);
    });

    this.wsService.onMessage('webrtc_ice_candidate', (data: any) => {
      console.log('🧊 Received ICE candidate:', data);
      this.handleIceCandidate(data);
    });
  }

  // بدء المحادثة الصوتية
  async startVoiceChat(): Promise<MediaStream> {
    try {
      console.log('🎤 Starting voice chat...');
      
      // طلب إذن الوصول للمايك مع إعدادات محسنة
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        },
        video: false
      });

      console.log('✅ Local audio stream obtained');
      console.log('🎵 Audio tracks:', this.localStream.getAudioTracks().length);
      console.log('🔊 Track settings:', this.localStream.getAudioTracks()[0]?.getSettings());

      // إعداد مراقبة النشاط الصوتي
      this.setupVoiceActivityDetection();
      
      this.isInitialized = true;
      console.log('🎤 Voice chat initialized successfully');
      
      return this.localStream;
    } catch (error) {
      console.error('❌ Error starting voice chat:', error);
      throw new Error('فشل في الوصول للمايك. تأكد من منح الإذن.');
    }
  }

  // إعداد كشف النشاط الصوتي
  private setupVoiceActivityDetection() {
    if (!this.localStream) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      const microphone = this.audioContext.createMediaStreamSource(this.localStream);

      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;
      microphone.connect(this.analyser);

      this.monitorVoiceActivity();
      console.log('🎵 Voice activity detection setup complete');
    } catch (error) {
      console.warn('⚠️ Voice activity detection setup failed:', error);
    }
  }

  // مراقبة النشاط الصوتي
  private monitorVoiceActivity() {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const checkActivity = () => {
      if (!this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const level = Math.min(100, (average / 128) * 100);

      const currentlySpeaking = level > this.voiceActivityThreshold;

      if (currentlySpeaking !== this.isSpeaking) {
        this.isSpeaking = currentlySpeaking;
        console.log(`🎤 Voice activity changed: ${this.isSpeaking ? 'speaking' : 'silent'} (level: ${level.toFixed(1)})`);
        this.onVoiceActivity?.(this.isSpeaking, level);

        // إرسال حالة التحدث عبر WebSocket
        if (this.currentUserId) {
          this.wsService.send({
            type: 'voice_activity',
            data: {
              userId: this.currentUserId,
              isSpeaking: this.isSpeaking,
              level: level
            }
          });
          console.log(`📤 Voice activity sent: ${this.isSpeaking ? 'speaking' : 'silent'} (userId: ${this.currentUserId})`);
        } else {
          console.warn('⚠️ No currentUserId available for voice activity');
        }
      }

      requestAnimationFrame(checkActivity);
    };

    checkActivity();
  }

  // إيقاف المحادثة الصوتية
  stopVoiceChat() {
    console.log('🔇 Stopping voice chat...');
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log('🔇 Stopped track:', track.kind);
      });
      this.localStream = null;
    }

    // تنظيف AudioContext
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.analyser = null;
    }

    // إغلاق جميع الاتصالات
    this.peerConnections.forEach((pc, userId) => {
      console.log(`🔌 Closing connection with ${userId}`);
      pc.close();
    });
    this.peerConnections.clear();
    this.remoteStreams.clear();

    this.isSpeaking = false;
    this.isInitialized = false;
    console.log('🔇 Voice chat stopped and resources cleaned');
  }

  // إنشاء اتصال مع مستخدم آخر
  async createPeerConnection(targetUserId: string): Promise<RTCPeerConnection> {
    console.log(`🔗 Creating peer connection with ${targetUserId}`);
    
    const peerConnection = new RTCPeerConnection(this.config);
    this.peerConnections.set(targetUserId, peerConnection);

    // إضافة الصوت المحلي
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        console.log(`➕ Adding track to peer connection: ${track.kind}`);
        peerConnection.addTrack(track, this.localStream!);
      });
    } else {
      console.warn('⚠️ No local stream available for peer connection');
    }

    // معالجة الصوت البعيد
    peerConnection.ontrack = (event) => {
      console.log(`🎵 Track received from ${targetUserId}:`, event.track.kind);
      const [remoteStream] = event.streams;
      if (remoteStream) {
        this.remoteStreams.set(targetUserId, remoteStream);
        this.onRemoteStreamAdded?.(targetUserId, remoteStream);
        console.log(`🔊 Remote stream received from ${targetUserId}`);
        
        // إنشاء عنصر صوت للصوت البعيد
        const audio = new Audio();
        audio.srcObject = remoteStream;
        audio.autoplay = true;
        audio.volume = 1.0;
        console.log(`🔊 Audio element created for ${targetUserId}`);
      }
    };

    // معالجة ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`🧊 ICE candidate for ${targetUserId}:`, event.candidate.type);
        this.wsService.send({
          type: 'webrtc_ice_candidate',
          data: {
            targetUserId,
            candidate: event.candidate
          }
        });
      }
    };

    // معالجة تغيير حالة الاتصال
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      console.log(`🔗 Connection state with ${targetUserId}: ${state}`);
      this.onConnectionStateChange?.(targetUserId, state);

      if (state === 'connected') {
        console.log(`✅ Connected to ${targetUserId}`);
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        console.log(`❌ Connection lost with ${targetUserId}`);
        this.removePeerConnection(targetUserId);
      }
    };

    // معالجة ICE connection state
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`🧊 ICE connection state with ${targetUserId}: ${peerConnection.iceConnectionState}`);
    };

    return peerConnection;
  }

  // إرسال عرض اتصال
  async sendOffer(targetUserId: string) {
    try {
      console.log(`📤 Sending offer to ${targetUserId}`);
      
      if (!this.isInitialized) {
        console.warn('⚠️ WebRTC not initialized, starting voice chat first');
        await this.startVoiceChat();
      }
      
      const peerConnection = await this.createPeerConnection(targetUserId);
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      this.wsService.send({
        type: 'webrtc_offer',
        data: {
          targetUserId,
          offer
        }
      });

      console.log(`📤 Offer sent to ${targetUserId}`);
    } catch (error) {
      console.error(`❌ Error sending offer to ${targetUserId}:`, error);
    }
  }

  // معالجة عرض الاتصال الوارد
  private async handleOffer(data: any) {
    try {
      const { fromUserId, offer } = data;
      console.log(`📥 Handling offer from ${fromUserId}`);
      
      if (!this.isInitialized) {
        console.warn('⚠️ WebRTC not initialized, starting voice chat first');
        await this.startVoiceChat();
      }
      
      const peerConnection = await this.createPeerConnection(fromUserId);
      
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      this.wsService.send({
        type: 'webrtc_answer',
        data: {
          targetUserId: fromUserId,
          answer
        }
      });

      console.log(`📥 Offer handled from ${fromUserId}, answer sent`);
    } catch (error) {
      console.error(`❌ Error handling offer from ${data.fromUserId}:`, error);
    }
  }

  // معالجة رد الاتصال
  private async handleAnswer(data: any) {
    try {
      const { fromUserId, answer } = data;
      console.log(`📥 Handling answer from ${fromUserId}`);
      
      const peerConnection = this.peerConnections.get(fromUserId);
      
      if (peerConnection) {
        await peerConnection.setRemoteDescription(answer);
        console.log(`📥 Answer handled from ${fromUserId}`);
      } else {
        console.warn(`⚠️ No peer connection found for ${fromUserId}`);
      }
    } catch (error) {
      console.error(`❌ Error handling answer from ${data.fromUserId}:`, error);
    }
  }

  // معالجة ICE candidate
  private async handleIceCandidate(data: any) {
    try {
      const { fromUserId, candidate } = data;
      console.log(`🧊 Handling ICE candidate from ${fromUserId}`);
      
      const peerConnection = this.peerConnections.get(fromUserId);
      
      if (peerConnection) {
        await peerConnection.addIceCandidate(candidate);
        console.log(`🧊 ICE candidate added from ${fromUserId}`);
      } else {
        console.warn(`⚠️ No peer connection found for ${fromUserId}`);
      }
    } catch (error) {
      console.error(`❌ Error handling ICE candidate from ${data.fromUserId}:`, error);
    }
  }

  // إزالة اتصال مع مستخدم
  removePeerConnection(userId: string) {
    console.log(`🗑️ Removing peer connection for ${userId}`);
    
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(userId);
    }

    this.remoteStreams.delete(userId);
    this.onRemoteStreamRemoved?.(userId);
    console.log(`🗑️ Peer connection removed for ${userId}`);
  }

  // كتم/إلغاء كتم المايك
  toggleMute(muted: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
        console.log(`🎤 Track ${track.kind} ${muted ? 'muted' : 'unmuted'}`);
      });
      console.log(`🎤 Microphone ${muted ? 'muted' : 'unmuted'}`);
    }
  }

  // الحصول على حالة الاتصالات
  getConnectionStates(): Map<string, RTCPeerConnectionState> {
    const states = new Map<string, RTCPeerConnectionState>();
    this.peerConnections.forEach((pc, userId) => {
      states.set(userId, pc.connectionState);
    });
    return states;
  }

  // الحصول على الصوت البعيد لمستخدم معين
  getRemoteStream(userId: string): MediaStream | undefined {
    return this.remoteStreams.get(userId);
  }

  // الحصول على الصوت المحلي
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // تنظيف الموارد
  cleanup() {
    this.stopVoiceChat();
    console.log('🧹 WebRTC service cleaned up');
  }
}

export default WebRTCService;
