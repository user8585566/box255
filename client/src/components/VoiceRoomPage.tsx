import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface User {
  _id: string;
  username: string;
  profileImage?: string;
}

const VoiceRoomPage: React.FC = () => {
  const { roomId } = useParams();
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    // جلب بيانات المستخدم الحالي (من التوكن أو localStorage)
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    setCurrentUserId(userData?._id || userData?.id || '');
    // جلب بيانات الغرفة
    const fetchRoom = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/voice-rooms/${roomId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setRoom(data);
          // تحقق إذا كان المستخدم منضم بالفعل
          const isInRoom = data.users.some((u: User) => u._id === (userData?._id || userData?.id));
          if (!isInRoom) setShowPasswordPrompt(true);
        } else {
          setError(data.message || 'تعذر جلب بيانات الغرفة');
        }
      } catch (err) {
        setError('تعذر الاتصال بالخادم');
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
    // eslint-disable-next-line
  }, [roomId]);

  const isOwner = room && room.owner && (room.owner._id === currentUserId);

  // واجهة فقط: تنفيذ أوامر الطرد والكتم (الربط مع API لاحقاً)
  const handleKick = (userId: string) => {
    alert(`سيتم طرد المستخدم: ${userId} (واجهة فقط)`);
  };
  const handleMute = (userId: string) => {
    alert(`سيتم كتم المستخدم: ${userId} (واجهة فقط)`);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    setJoining(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/voice-rooms/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ roomId, password })
      });
      const data = await res.json();
      if (res.ok) {
        setShowPasswordPrompt(false);
        setPassword('');
        // أعد جلب بيانات الغرفة بعد الانضمام
        setLoading(true);
        const res2 = await fetch(`/api/voice-rooms/${roomId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data2 = await res2.json();
        setRoom(data2);
      } else {
        setJoinError(data.message || 'فشل الانضمام للغرفة');
      }
    } catch (err) {
      setJoinError('تعذر الاتصال بالخادم');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <div className="text-center py-10">جاري التحميل...</div>;
  if (error) return <div className="text-center text-red-600 py-10">{error}</div>;
  if (!room) return null;

  return (
    <div className="max-w-md mx-auto p-4 min-h-[70vh] flex flex-col items-center">
      <h2 className="text-xl font-bold text-purple-700 mb-4 text-center">غرفة صوتية: {room.roomId}</h2>
      {showPasswordPrompt ? (
        <form onSubmit={handleJoin} className="bg-white/90 rounded-xl shadow-lg p-6 w-full max-w-sm flex flex-col items-center gap-4">
          <div className="text-gray-700 font-semibold mb-2">هذه الغرفة محمية بكلمة مرور</div>
          <input
            type="password"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={password}
            onChange={e => setPassword(e.target.value)}
            minLength={3}
            required
            placeholder="أدخل كلمة المرور للغرفة"
          />
          {joinError && <div className="text-red-600 text-sm text-center">{joinError}</div>}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold py-2 rounded-lg shadow hover:from-purple-700 hover:to-blue-600 transition-all"
            disabled={joining}
          >
            {joining ? 'جاري الانضمام...' : 'انضمام للغرفة'}
          </button>
        </form>
      ) : (
        <div className="bg-white/90 rounded-xl shadow-lg p-4 w-full flex-1 flex flex-col">
          <div className="mb-4 text-center text-gray-700 font-semibold">المستخدمون في الغرفة ({room.users.length}/{room.maxUsers})</div>
          <div className="flex flex-col gap-3">
            {room.users.map((user: User) => (
              <div key={user._id} className="flex items-center justify-between bg-gray-100 rounded-lg px-3 py-2">
                <div className="flex items-center gap-3">
                  <img src={user.profileImage || '/images/default-avatar.png'} alt={user.username} className="w-10 h-10 rounded-full object-cover border border-purple-300" />
                  <span className="font-bold text-gray-800">{user.username}</span>
                  {room.owner && user._id === room.owner._id && (
                    <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded ml-2">المالك</span>
                  )}
                </div>
                {isOwner && user._id !== currentUserId && (
                  <div className="flex gap-2">
                    <button onClick={() => handleMute(user._id)} className="bg-yellow-400 hover:bg-yellow-500 text-white px-2 py-1 rounded text-xs">كتم</button>
                    <button onClick={() => handleKick(user._id)} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs">طرد</button>
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

export default VoiceRoomPage; 