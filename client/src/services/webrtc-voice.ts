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
      console.log('🎤 Joining voice room:', roomId, 'as user:', userId);
      
      this.roomId = roomId;
      this.userId = userId;
      
      // Get user media with enhanced echo cancellation
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
          // Enhanced echo cancellation settings
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
          googTypingNoiseDetection: true,
          googAudioMirroring: false
        },
        video: false
      });
      
      console.log('✅ Got local audio stream');
      
      // Start voice activity detection
      this.startVoiceActivityDetection();
      
      // Notify server about joining
      console.log('📤 Sending join_voice_room message to server');
      this.wsService.send({
        type: 'join_voice_room',
        data: { roomId, userId }
      });
      console.log('✅ join_voice_room message sent');
      
      this.isJoined = true;
      console.log('✅ Joined voice room successfully');
      
    } catch (error) {
      console.error('❌ Error joining voice room:', error);
      this.onError?.(error as Error);
      throw error;
    }
  }

  // Leave voice room
  async leaveRoom(): Promise<void> {
    try {
      console.log('🔄 Leaving voice room...');
      
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
      
      console.log('✅ Left voice room successfully');
      
    } catch (error) {
      console.error('❌ Error leaving voice room:', error);
      this.onError?.(error as Error);
    }
  }

  // Toggle mute
  async toggleMute(muteState?: boolean): Promise<boolean> {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      // إذا تم تمرير حالة محددة، استخدمها، وإلا قم بالتبديل
      if (muteState !== undefined) {
        audioTrack.enabled = !muteState;
        this.isMuted = muteState;
      } else {
        audioTrack.enabled = !audioTrack.enabled;
        this.isMuted = !audioTrack.enabled;
      }

      console.log(this.isMuted ? '🔇 Muted' : '🔊 Unmuted');
      return this.isMuted;
    }

    return false;
  }

  // Create peer connection for a user
  private async createPeerConnection(userId: string): Promise<RTCPeerConnection> {
    // إعداد RTCConfiguration محسن لضمان ترتيب ثابت
    const configuration = {
      iceServers: this.iceServers,
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle' as RTCBundlePolicy,
      rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy
    };

    const pc = new RTCPeerConnection(configuration);

    // Add local stream بترتيب ثابت (audio أولاً)
    if (this.localStream) {
      // إضافة audio tracks أولاً لضمان ترتيب ثابت
      const audioTracks = this.localStream.getAudioTracks();
      audioTracks.forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }
    
    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('🔊 Received remote stream from:', userId);
      const [remoteStream] = event.streams;
      
      // Play remote audio with echo prevention
      const audio = new Audio();
      audio.srcObject = remoteStream;
      audio.volume = 0.8; // Reduce volume to prevent feedback
      audio.autoplay = true;

      // Prevent echo by ensuring audio doesn't loop back
      if (audio.setSinkId) {
        // Use default audio output device
        audio.setSinkId('default').catch(console.error);
      }

      audio.play().catch(console.error);
      
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
    
    this.peerConnections.set(userId, pc);
    return pc;
  }

  // Handle WebRTC offer
  private async handleOffer(data: any) {
    try {
      const { offer, fromUserId } = data;
      console.log('📥 Received offer from:', fromUserId);
      console.log('🔄 Creating peer connection and answer for:', fromUserId);

      const pc = await this.createPeerConnection(fromUserId);
      await pc.setRemoteDescription(offer);
      console.log('✅ Set remote description (offer)');

      // إضافة answerOptions لضمان ترتيب متطابق مع الـ offer
      const answerOptions = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      };

      const answer = await pc.createAnswer(answerOptions);
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

    } catch (error) {
      console.error('❌ Error handling offer:', error);
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

      // تحقق من حالة الاتصال قبل تطبيق الإجابة
      if (pc.signalingState === 'have-local-offer') {
        // التحقق من تطابق ترتيب m-lines قبل setRemoteDescription
        const localSdp = pc.localDescription?.sdp || '';
        const remoteSdp = answer.sdp || '';

        // فحص بسيط لترتيب media lines
        const localMediaOrder = this.extractMediaOrder(localSdp);
        const remoteMediaOrder = this.extractMediaOrder(remoteSdp);

        if (localMediaOrder.join(',') === remoteMediaOrder.join(',')) {
          await pc.setRemoteDescription(answer);
          console.log('✅ Set remote description (answer) for:', fromUserId);
        } else {
          console.warn('⚠️ Media order mismatch, recreating connection for:', fromUserId);
          // إعادة إنشاء الاتصال مع ترتيب صحيح
          this.peerConnections.delete(fromUserId);
          setTimeout(() => this.sendOffer(fromUserId), 1000);
        }
      } else if (pc.signalingState === 'stable') {
        console.log('ℹ️ Connection already stable with:', fromUserId);
      } else {
        console.warn('⚠️ Peer connection in wrong state:', pc.signalingState, 'for:', fromUserId);
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
      if (!pc) {
        console.warn('⚠️ No peer connection for ICE candidate from:', fromUserId);
        return;
      }

      // تحقق من حالة الاتصال قبل إضافة ICE candidate
      if (pc.remoteDescription) {
        await pc.addIceCandidate(candidate);
      } else {
        console.warn('⚠️ No remote description set, skipping ICE candidate from:', fromUserId);
      }

    } catch (error) {
      console.error('❌ Error handling ICE candidate:', error);
    }
  }

  // دالة مساعدة لاستخراج ترتيب media lines من SDP
  private extractMediaOrder(sdp: string): string[] {
    const mediaLines = sdp.split('\n').filter(line => line.startsWith('m='));
    return mediaLines.map(line => {
      const parts = line.split(' ');
      return parts[0]; // m=audio أو m=video
    });
  }

  // Send offer to specific user (public method)
  async sendOffer(userId: string): Promise<void> {
    try {
      if (userId === this.userId) return; // Skip self

      console.log('🔄 Sending offer to:', userId);

      // Create offer for user
      const pc = await this.createPeerConnection(userId);

      // إضافة offerOptions لضمان ترتيب ثابت
      const offerOptions = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      };

      const offer = await pc.createOffer(offerOptions);
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

  // Handle user joined
  private async handleUserJoined(data: any) {
    try {
      const { userId } = data;
      if (userId === this.userId) return; // Skip self

      // تقليل logs - فقط للأحداث المهمة
      console.log('👤 User joined voice room:', userId);

      // Create offer for new user
      const pc = await this.createPeerConnection(userId);

      // إضافة offerOptions لضمان ترتيب ثابت
      const offerOptions = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      };

      const offer = await pc.createOffer(offerOptions);
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

      // تحقق من صحة القيم
      if (isNaN(level) || level < 0) {
        requestAnimationFrame(checkActivity);
        return;
      }

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

          // تقليل logs - فقط للتغييرات المهمة جداً
          if (stateChanged && isSpeaking && level > 35) {
            console.log('🎤 Voice activity changed:', isSpeaking ? 'speaking' : 'silent', `(level: ${level})`);
          }
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

  // Cleanup method for React component unmount
  cleanup() {
    console.log('🧹 Cleaning up WebRTC service...');

    // إيقاف مراقبة الصوت
    this.stopVoiceActivityDetection();

    // إغلاق جميع اتصالات WebRTC
    this.peerConnections.forEach((pc, userId) => {
      console.log('🔌 Closing connection with:', userId);
      pc.close();
    });
    this.peerConnections.clear();

    // إيقاف الـ stream المحلي
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped local track:', track.kind);
      });
      this.localStream = null;
    }

    // تنظيف المتغيرات
    this.remoteUsers.clear();
    this.isJoined = false;
    this.isMonitoringVoice = false;

    console.log('✅ WebRTC cleanup completed');
  }
}
