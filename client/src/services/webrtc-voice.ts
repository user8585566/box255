// WebRTC Voice Chat Service - Simple and Reliable
export interface VoiceUser {
  id: string;
  isSpeaking: boolean;
  isMuted: boolean;
  audioLevel: number;
}

export interface VoiceActivityData {
  userId: string;
  level: number;
  isSpeaking: boolean;
}

export class WebRTCVoiceService {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteUsers: Map<string, VoiceUser> = new Map();
  private isJoined = false;
  private isMuted = false;
  private roomId: string | null = null;
  private userId: string | null = null;

  // منع التكرار
  private processingOffers: Set<string> = new Set();
  private connectionAttempts: Map<string, number> = new Map();
  private connectionMonitorInterval: NodeJS.Timeout | null = null;
  
  // Voice Activity Detection
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private voiceActivityThreshold = 25;
  private isMonitoringVoice = false;
  private isSpeaking = false;
  private lastVoiceActivitySent = 0;
  private voiceActivityDebounce = 500; // 500ms debounce
  
  // Callbacks
  public onUserJoined?: (user: VoiceUser) => void;
  public onUserLeft?: (userId: string) => void;
  public onVoiceActivity?: (data: VoiceActivityData) => void;
  public onError?: (error: Error) => void;
  
  // WebSocket for signaling
  private wsService: any;
  
  // ICE Servers (STUN/TURN)
  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { 
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ];

  constructor(wsService: any) {
    this.wsService = wsService;
    this.setupWebSocketHandlers();
  }

  // Setup WebSocket handlers for signaling
  private setupWebSocketHandlers() {
    this.wsService.onMessage('webrtc_offer', this.handleOffer.bind(this));
    this.wsService.onMessage('webrtc_answer', this.handleAnswer.bind(this));
    this.wsService.onMessage('webrtc_ice_candidate', this.handleIceCandidate.bind(this));
    this.wsService.onMessage('user_joined_voice', this.handleUserJoined.bind(this));
    this.wsService.onMessage('user_left_voice', this.handleUserLeft.bind(this));
  }

  // Join voice room
  async joinRoom(roomId: string, userId: string): Promise<void> {
    try {
      this.roomId = roomId;
      this.userId = userId;

      // Get user media with simple, reliable settings
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      
      // Start voice activity detection
      this.startVoiceActivityDetection();

      // Notify server about joining
      this.wsService.send({
        type: 'join_voice_room',
        data: { roomId, userId }
      });

      this.isJoined = true;

      // بدء فحص دوري للاتصالات
      this.startConnectionMonitoring();
      
    } catch (error) {
      console.error('❌ Error joining voice room:', error);
      this.onError?.(error as Error);
      throw error;
    }
  }

  // Leave voice room
  async leaveRoom(): Promise<void> {
    try {
      // Close all peer connections
      this.peerConnections.forEach((pc, userId) => {
        pc.close();
      });
      this.peerConnections.clear();

      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      // Stop voice monitoring
      this.stopVoiceActivityDetection();

      // Notify server
      if (this.roomId && this.userId) {
        this.wsService.send({
          type: 'leave_voice_room',
          data: { roomId: this.roomId, userId: this.userId }
        });
      }

      this.isJoined = false;
      this.remoteUsers.clear();

      // تنظيف متغيرات منع التكرار
      this.processingOffers.clear();
      this.connectionAttempts.clear();

      // إيقاف مراقبة الاتصالات
      this.stopConnectionMonitoring();
      
    } catch (error) {
      console.error('❌ Error leaving voice room:', error);
      this.onError?.(error as Error);
    }
  }

  // Toggle mute
  async toggleMute(): Promise<boolean> {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.isMuted = !audioTrack.enabled;
      return this.isMuted;
    }

    return false;
  }

  // Set mute state directly
  setMute(muted: boolean): void {
    if (!this.localStream) return;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !muted;
      this.isMuted = muted;
      console.log(`🎤 Local audio ${muted ? 'muted' : 'unmuted'}`);
    }
  }

  // Set remote audio muted state
  setRemoteAudioMuted(muted: boolean): void {
    this.peerConnections.forEach((connection, userId) => {
      const remoteStream = connection.getRemoteStreams()[0];
      if (remoteStream) {
        const audioTracks = remoteStream.getAudioTracks();
        audioTracks.forEach(track => {
          track.enabled = !muted;
        });
      }
    });
  }

  // Create peer connection for a user
  private async createPeerConnection(userId: string): Promise<RTCPeerConnection> {
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    
    // Add local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }
    
    // Handle remote stream
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      console.log('🎵 Received remote stream from:', userId);

      // Play remote audio with echo prevention
      const audio = new Audio();
      audio.srcObject = remoteStream;
      audio.volume = 0.8;
      audio.autoplay = true;

      // تأكد من تشغيل الصوت
      audio.play().then(() => {
        console.log('✅ Remote audio playing from:', userId);
      }).catch((error) => {
        console.warn('⚠️ Audio play failed, trying user interaction:', error);
        // محاولة تشغيل الصوت عند التفاعل التالي
        document.addEventListener('click', () => {
          audio.play().catch(() => {});
        }, { once: true });
      });

      // Update user
      const user = this.remoteUsers.get(userId) || {
        id: userId,
        isSpeaking: false,
        isMuted: false,
        audioLevel: 0
      };
      this.remoteUsers.set(userId, user);
      this.onUserJoined?.(user);
    };
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.wsService.send({
          type: 'webrtc_ice_candidate',
          data: {
            candidate: event.candidate,
            targetUserId: userId,
            fromUserId: this.userId
          }
        });
      }
    };

    // معالج حالة الاتصال
    pc.onconnectionstatechange = () => {
      console.log(`🔗 Connection state with ${userId}: ${pc.connectionState}`);
      if (pc.connectionState === 'connected') {
        console.log(`✅ Successfully connected to ${userId}`);
        // إزالة من قائمة المعالجة عند نجاح الاتصال
        this.processingOffers.delete(userId);
        this.connectionAttempts.delete(userId);
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.log(`❌ Connection failed/disconnected with ${userId}`);
        // تنظيف الاتصال المعطل
        this.peerConnections.delete(userId);
        this.processingOffers.delete(userId);
      }
    };

    // معالج حالة ICE
    pc.oniceconnectionstatechange = () => {
      console.log(`🧊 ICE state with ${userId}: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        console.log(`🎉 ICE connection established with ${userId}`);
      }
    };

    this.peerConnections.set(userId, pc);
    return pc;
  }

  // Handle WebRTC offer
  private async handleOffer(data: any) {
    try {
      const { offer, fromUserId } = data;

      // منع معالجة offers متكررة من نفس المستخدم
      if (this.processingOffers.has(fromUserId)) {
        console.log('⏭️ Already processing offer from:', fromUserId);
        return;
      }

      // فحص عدد المحاولات
      const attempts = this.connectionAttempts.get(fromUserId) || 0;
      if (attempts >= 3) {
        console.log('🛑 Too many connection attempts with:', fromUserId);
        return;
      }

      this.processingOffers.add(fromUserId);
      this.connectionAttempts.set(fromUserId, attempts + 1);

      console.log('📥 Received offer from:', fromUserId);

      // التحقق من وجود اتصال موجود ومستقر
      const existingPc = this.peerConnections.get(fromUserId);
      if (existingPc && existingPc.connectionState === 'connected') {
        console.log('✅ Connection already established with:', fromUserId);
        this.processingOffers.delete(fromUserId);
        return;
      }

      if (existingPc && existingPc.signalingState !== 'closed') {
        console.log('🔄 Closing existing connection before creating new one');
        existingPc.close();
        this.peerConnections.delete(fromUserId);
      }

      console.log('🔄 Creating peer connection and answer for:', fromUserId);
      const pc = await this.createPeerConnection(fromUserId);

      try {
        await pc.setRemoteDescription(offer);
        console.log('✅ Set remote description (offer)');

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('✅ Created and set local description (answer)');

        console.log('📤 Sending WebRTC answer to:', fromUserId);
        this.wsService.send({
          type: 'webrtc_answer',
          data: {
            answer,
            targetUserId: fromUserId,
            fromUserId: this.userId
          }
        });

        // إزالة من قائمة المعالجة بعد النجاح
        setTimeout(() => {
          this.processingOffers.delete(fromUserId);
        }, 2000);

      } catch (sdpError) {
        console.error('❌ SDP error in offer handling:', sdpError);
        // تنظيف الاتصال المعطل
        pc.close();
        this.peerConnections.delete(fromUserId);
        this.processingOffers.delete(fromUserId);
      }

    } catch (error) {
      console.error('❌ Error handling offer:', error);
      this.processingOffers.delete(data.fromUserId);
    }
  }

  // Handle WebRTC answer
  private async handleAnswer(data: any) {
    try {
      const { answer, fromUserId } = data;
      console.log('📥 Received answer from:', fromUserId);

      const pc = this.peerConnections.get(fromUserId);
      if (!pc) {
        console.warn('⚠️ No peer connection found for:', fromUserId);
        return;
      }

      // التحقق من حالة الاتصال قبل تطبيق الإجابة
      if (pc.signalingState === 'have-local-offer') {
        try {
          await pc.setRemoteDescription(answer);
          console.log('✅ Set remote description (answer) for:', fromUserId);
          console.log('🔗 WebRTC connection should be established with:', fromUserId);

          // انتظار قصير للتأكد من استقرار الاتصال
          setTimeout(() => {
            if (pc.connectionState === 'connected') {
              console.log('🎉 Connection confirmed with:', fromUserId);
            } else {
              console.log('⏳ Waiting for connection to stabilize with:', fromUserId);
            }
          }, 1000);

        } catch (sdpError) {
          console.warn('⚠️ SDP error, recreating connection:', sdpError.message);
          // إعادة إنشاء الاتصال في حالة خطأ SDP
          this.peerConnections.delete(fromUserId);
          this.processingOffers.delete(fromUserId);

          // محاولة إعادة الاتصال بعد تأخير
          setTimeout(() => {
            if (this.userId! < fromUserId) {
              this.handleUserJoined({ userId: fromUserId });
            }
          }, 2000);
        }
      } else if (pc.signalingState === 'stable') {
        console.log('ℹ️ Connection already stable with:', fromUserId);
      } else {
        console.warn('⚠️ Peer connection not in correct state for answer:', pc.signalingState);
        console.log('🔄 Current state:', pc.signalingState, 'Connection state:', pc.connectionState);
      }

    } catch (error) {
      console.error('❌ Error handling answer:', error);
    }
  }

  // Handle ICE candidate
  private async handleIceCandidate(data: any) {
    try {
      const { candidate, fromUserId } = data;

      const pc = this.peerConnections.get(fromUserId);
      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(candidate);
      } else if (pc) {
        // Queue ICE candidate if remote description not set yet
        setTimeout(() => this.handleIceCandidate(data), 100);
      }

    } catch (error) {
      // Silently ignore ICE candidate errors as they're common and not critical
      if (!error.message.includes('ICE candidate')) {
        console.error('❌ Error handling ICE candidate:', error);
      }
    }
  }

  // Handle user joined
  private async handleUserJoined(data: any) {
    try {
      const { userId } = data;
      if (userId === this.userId) return; // Skip self

      // فحص وجود اتصال مستقر بالفعل
      const existingPc = this.peerConnections.get(userId);
      if (existingPc && existingPc.connectionState === 'connected') {
        console.log('✅ Already connected to:', userId);
        return;
      }

      // منع المعالجة المتكررة
      if (this.processingOffers.has(userId)) {
        console.log('⏭️ Already processing connection with:', userId);
        return;
      }

      console.log('👤 User joined voice room:', userId);

      // تجنب التضارب: فقط المستخدم ذو الـ ID الأصغر يرسل offer
      const shouldSendOffer = this.userId! < userId;

      if (shouldSendOffer) {
        // فحص عدد المحاولات
        const attempts = this.connectionAttempts.get(userId) || 0;
        if (attempts >= 3) {
          console.log('🛑 Too many offer attempts to:', userId);
          return;
        }

        this.connectionAttempts.set(userId, attempts + 1);
        console.log('🔄 Creating peer connection and offer for:', userId);

        // Create offer for new user
        const pc = await this.createPeerConnection(userId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        console.log('📤 Sending WebRTC offer to:', userId);
        this.wsService.send({
          type: 'webrtc_offer',
          data: {
            offer,
            targetUserId: userId,
            fromUserId: this.userId
          }
        });
      } else {
        console.log('⏳ Waiting for offer from:', userId);
        // إنشاء peer connection فقط، بدون إرسال offer
        await this.createPeerConnection(userId);
      }

    } catch (error) {
      console.error('❌ Error handling user joined:', error);
    }
  }

  // Handle user left
  private handleUserLeft(data: any) {
    const { userId } = data;
    console.log('👋 User left voice room:', userId);

    // Close peer connection
    const pc = this.peerConnections.get(userId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(userId);
    }

    // تنظيف متغيرات منع التكرار
    this.processingOffers.delete(userId);
    this.connectionAttempts.delete(userId);

    // Remove user
    this.remoteUsers.delete(userId);
    this.onUserLeft?.(userId);
  }

  // Start voice activity detection
  private startVoiceActivityDetection() {
    if (!this.localStream || this.isMonitoringVoice) return;
    
    try {
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.localStream);
      this.analyser = this.audioContext.createAnalyser();
      
      this.analyser.fftSize = 256;
      source.connect(this.analyser);
      
      this.isMonitoringVoice = true;
      this.monitorVoiceActivity();
      
    } catch (error) {
      console.error('❌ Error starting voice activity detection:', error);
    }
  }

  // Monitor voice activity
  private monitorVoiceActivity() {
    if (!this.analyser || !this.isMonitoringVoice) return;
    
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    
    const checkActivity = () => {
      if (!this.isMonitoringVoice) return;
      
      this.analyser!.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const level = Math.round(average * 10) / 10;
      
      const isSpeaking = level > this.voiceActivityThreshold;
      const now = Date.now();

      // Only send voice activity if state changed or enough time passed
      const stateChanged = isSpeaking !== this.isSpeaking;
      const enoughTimePassed = now - this.lastVoiceActivitySent > this.voiceActivityDebounce;

      if (stateChanged || enoughTimePassed) {
        // Send voice activity
        if (this.onVoiceActivity && this.userId) {
          this.onVoiceActivity({
            userId: this.userId,
            level,
            isSpeaking
          });

          this.lastVoiceActivitySent = now;
          this.isSpeaking = isSpeaking;
        }
      }
      
      requestAnimationFrame(checkActivity);
    };
    
    checkActivity();
  }

  // Stop voice activity detection
  private stopVoiceActivityDetection() {
    this.isMonitoringVoice = false;
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
  }

  // Getters
  get isConnected(): boolean {
    return this.isJoined;
  }

  get mutedState(): boolean {
    return this.isMuted;
  }

  get connectedUsers(): VoiceUser[] {
    return Array.from(this.remoteUsers.values());
  }

  // Send offer to a specific user
  async sendOffer(userId: string): Promise<void> {
    try {
      if (userId === this.userId) return; // Skip self

      console.log('🔄 Creating peer connection and offer for:', userId);

      // Create offer for user
      const pc = await this.createPeerConnection(userId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log('📤 Sending WebRTC offer to:', userId);
      this.wsService.send({
        type: 'webrtc_offer',
        data: {
          offer,
          targetUserId: userId,
          fromUserId: this.userId
        }
      });

    } catch (error) {
      console.error('❌ Error sending offer:', error);
    }
  }

  // فحص حالة الاتصالات وإعادة المحاولة إذا لزم الأمر
  private checkConnectionsAndRetry() {
    this.peerConnections.forEach((pc, userId) => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.log('🔄 Retrying connection with:', userId);
        this.peerConnections.delete(userId);
        this.processingOffers.delete(userId);

        // إعادة المحاولة بعد تأخير قصير
        setTimeout(() => {
          if (this.userId! < userId) {
            this.handleUserJoined({ userId });
          }
        }, 1000);
      }
    });
  }

  // بدء مراقبة الاتصالات
  private startConnectionMonitoring() {
    if (this.connectionMonitorInterval) return;

    this.connectionMonitorInterval = setInterval(() => {
      this.checkConnectionsAndRetry();
    }, 5000); // فحص كل 5 ثوان
  }

  // إيقاف مراقبة الاتصالات
  private stopConnectionMonitoring() {
    if (this.connectionMonitorInterval) {
      clearInterval(this.connectionMonitorInterval);
      this.connectionMonitorInterval = null;
    }
  }

  // Cleanup method for React component unmount
  cleanup() {
    this.stopConnectionMonitoring();
    this.leaveRoom().catch(console.error);
  }
}
