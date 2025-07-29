import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { 
  Send, 
  Mic, 
  MessageCircle, 
  Clock,
  AlertCircle,
  Volume2
} from 'lucide-react';

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

interface VoiceChatBoxProps {
  messages: VoiceMessage[];
  currentUser: User;
  isInWaitingQueue: boolean;
  onSendMessage: (content: string) => void;
  onRequestMic: () => void;
}

const VoiceChatBox: React.FC<VoiceChatBoxProps> = ({
  messages,
  currentUser,
  isInWaitingQueue,
  onSendMessage,
  onRequestMic
}) => {
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // التمرير التلقائي للأسفل عند وصول رسائل جديدة
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // التركيز على حقل الإدخال عند التحميل
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || isSending) return;

    const content = messageInput.trim();
    setMessageInput('');
    setIsSending(true);

    try {
      await onSendMessage(content);
    } catch (error) {
      console.error('Error sending message:', error);
      // إعادة النص في حالة الخطأ
      setMessageInput(content);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getMessageTypeIcon = (messageType: string) => {
    switch (messageType) {
      case 'system':
        return <AlertCircle className="w-4 h-4 text-blue-400" />;
      case 'mic_request':
        return <Mic className="w-4 h-4 text-yellow-400" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getMessageStyle = (messageType: string, senderId: string) => {
    const isOwnMessage = senderId === currentUser.id;
    
    switch (messageType) {
      case 'system':
        return 'bg-blue-900/30 border-blue-500/30 text-blue-200';
      case 'mic_request':
        return 'bg-yellow-900/30 border-yellow-500/30 text-yellow-200';
      default:
        return isOwnMessage
          ? 'bg-purple-900/50 border-purple-500/30 text-white'
          : 'bg-gray-800/50 border-gray-600/30 text-gray-200';
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900/50 to-blue-900/30 rounded-xl border border-blue-500/20 flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-400" />
          المحادثة النصية
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          {messages.length} رسالة
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        <div className="flex flex-col space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد رسائل بعد</p>
              <p className="text-sm mt-1">ابدأ المحادثة!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`p-3 rounded-lg border ${getMessageStyle(message.messageType, message.sender._id)} ${
                  message.messageType !== 'system' && message.sender._id === currentUser.id
                    ? 'max-w-[60%] self-end ml-auto'
                    : ''
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getMessageTypeIcon(message.messageType)}
                    <span className="font-medium text-sm">
                      {message.sender.username}
                    </span>
                    <span className="text-xs opacity-60">
                      #{message.sender.playerId}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs opacity-60">
                    <Clock className="w-3 h-3" />
                    <span>{formatMessageTime(message.timestamp)}</span>
                  </div>
                </div>

                {/* Message Content */}
                <div className="text-sm leading-relaxed">
                  {message.content}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-700/50">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="اكتب رسالتك هنا..."
              maxLength={500}
              disabled={isSending}
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:bg-gray-800/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            
            {/* Character Counter */}
            <div className="absolute bottom-1 left-2 text-xs text-gray-500">
              {messageInput.length}/500
            </div>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!messageInput.trim() || isSending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white transition-colors flex items-center gap-2"
            title="إرسال الرسالة"
          >
            <Send className="w-4 h-4" />
            {isSending ? 'جاري الإرسال...' : 'إرسال'}
          </button>

          {/* Mic Request Button */}
          {!isInWaitingQueue && (
            <button
              type="button"
              onClick={onRequestMic}
              className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white transition-colors flex items-center gap-1"
              title="طلب المايك"
            >
              <Mic className="w-4 h-4" />
              <span className="hidden sm:inline">طلب المايك</span>
            </button>
          )}
        </form>

        {/* Status Messages */}
        {isInWaitingQueue && (
          <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-500/30 rounded-lg text-yellow-200 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>أنت في قائمة انتظار المايك</span>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-4">
          <span>اضغط Enter للإرسال</span>
          <span>الحد الأقصى: 500 حرف</span>
        </div>
      </div>
    </div>
  );
};

export default VoiceChatBox;
