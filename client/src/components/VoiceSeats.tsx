import React from 'react';
import { User } from '../types';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  UserPlus, 
  Clock,
  Crown,
  Users
} from 'lucide-react';

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

interface WaitingQueueItem {
  user: {
    _id: string;
    username: string;
    profileImage?: string;
    playerId: string;
  };
  userPlayerId: string;
  requestedAt: string;
}

interface VoiceSeatsProps {
  seats: VoiceSeat[];
  waitingQueue: WaitingQueueItem[];
  currentUser: User;
  isInSeat: boolean;
  currentSeatNumber: number | null;
  // إزالة isInWaitingQueue - تبسيط النظام
  isConnecting: boolean;
  onJoinSeat: (seatNumber: number) => void;
  onRequestMic: () => void;
  onCancelMicRequest: () => void;
}

const VoiceSeats: React.FC<VoiceSeatsProps> = ({
  seats,
  waitingQueue,
  currentUser,
  isInSeat,
  currentSeatNumber,
  // isInWaitingQueue removed
  isConnecting,
  onJoinSeat,
  onRequestMic,
  onCancelMicRequest
}) => {
  const formatJoinTime = (joinedAt: string) => {
    const now = new Date();
    const joined = new Date(joinedAt);
    const diffMs = now.getTime() - joined.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `${diffMins} دقيقة`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} ساعة`;
  };

  const getQueuePosition = () => {
    const position = waitingQueue.findIndex(item => item.user._id === currentUser.id);
    return position >= 0 ? position + 1 : 0;
  };

  const availableSeats = seats.filter(seat => !seat.user);
  const canJoinDirectly = availableSeats.length > 0 && !isInSeat;

  return (
    <div className="space-y-6">
      {/* المقاعد الصوتية */}
      <div className="bg-gradient-to-br from-gray-900/50 to-purple-900/30 rounded-xl p-6 border border-purple-500/20">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Volume2 className="w-6 h-6 text-purple-400" />
          المقاعد الصوتية
        </h2>
        
        <div className="flex flex-wrap justify-center gap-6">
          {seats.map((seat) => (
            <div key={seat.seatNumber} className="flex flex-col items-center">
              {seat.user ? (
                <div className="relative">
                  {/* صورة المستخدم مع حدود ملونة */}
                  <div className={`relative w-20 h-20 rounded-full p-1 transition-all duration-300 shadow-lg ${
                    seat.user._id === currentUser.id
                      ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-green-500/30'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-blue-500/30'
                  }`}>
                    <div className="w-full h-full rounded-full overflow-hidden bg-gray-800">
                      {seat.user.profileImage ? (
                        <img
                          src={seat.user.profileImage}
                          alt="الصورة الشخصية"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src="/images/default-avatar.png"
                          alt="الصورة الشخصية"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* مؤشر الصوت */}
                    <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                      seat.isMuted
                        ? 'bg-red-600'
                        : seat.isSpeaking
                          ? 'bg-green-600 animate-pulse'
                          : 'bg-gray-600'
                    }`}>
                      {seat.isMuted ? (
                        <MicOff className="w-4 h-4 text-white" />
                      ) : (
                        <Mic className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>

                  {/* معلومات المستخدم */}
                  <div className="text-center mt-3 max-w-20">
                    <h3 className="font-semibold text-white text-sm mb-1 truncate">
                      {seat.user.username}
                    </h3>

                    <p className="text-xs text-gray-400 mb-2">
                      #{seat.user.playerId}
                    </p>

                    {/* وقت الانضمام */}
                    {seat.joinedAt && (
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatJoinTime(seat.joinedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  {/* المقعد الفارغ - قابل للضغط */}
                  <button
                    onClick={() => canJoinDirectly ? onJoinSeat(seat.seatNumber) : null}
                    disabled={isConnecting || !canJoinDirectly}
                    className="relative w-20 h-20 rounded-full p-1 bg-gradient-to-r from-gray-600 to-gray-700 shadow-lg hover:from-purple-600 hover:to-purple-700 disabled:hover:from-gray-600 disabled:hover:to-gray-700 transition-all duration-300 disabled:cursor-not-allowed"
                  >
                    <div className="w-full h-full rounded-full bg-gray-800/50 border-2 border-dashed border-gray-500 flex items-center justify-center hover:border-purple-400 transition-colors">
                      <UserPlus className="w-8 h-8 text-gray-400" />
                    </div>
                  </button>

                  {/* نص المقعد الفارغ */}
                  <div className="text-center mt-3">
                    <p className="text-gray-400 text-sm">مقعد فارغ</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* أزرار التحكم */}
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          {!isInSeat && availableSeats.length === 0 && (
            <button
              onClick={onRequestMic}
              disabled={isConnecting}
              className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors flex items-center gap-2"
            >
              <Mic className="w-4 h-4" />
              {isConnecting ? 'جاري الطلب...' : 'طلب المايك'}
            </button>
          )}

          {/* قائمة الانتظار تم إلغاؤها */ false && (
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-yellow-900/50 border border-yellow-500/50 rounded-lg text-yellow-300 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>في قائمة الانتظار (المركز {getQueuePosition()})</span>
              </div>
              
              <button
                onClick={onCancelMicRequest}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
              >
                إلغاء الطلب
              </button>
            </div>
          )}
        </div>
      </div>

      {/* قائمة الانتظار */}
      {waitingQueue.length > 0 && (
        <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 rounded-xl p-6 border border-yellow-500/20">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            قائمة انتظار المايك ({waitingQueue.length})
          </h3>
          
          <div className="space-y-3">
            {waitingQueue.map((item, index) => (
              <div
                key={item.user._id}
                className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg"
              >
                <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{item.user.username}</span>
                    <span className="text-xs text-gray-400">#{item.user.playerId}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    طلب منذ {formatJoinTime(item.requestedAt)}
                  </div>
                </div>

                {item.user._id === currentUser.id && (
                  <div className="px-2 py-1 bg-yellow-600 rounded text-xs text-white">
                    أنت
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceSeats;
