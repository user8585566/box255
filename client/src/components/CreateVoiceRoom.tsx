import React, { useState } from 'react';

const CreateVoiceRoom: React.FC = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roomId, setRoomId] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setRoomId('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/voice-rooms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok && data.roomId) {
        setRoomId(data.roomId);
      } else {
        setError(data.message || 'حدث خطأ في إنشاء الغرفة');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="bg-white/90 rounded-xl shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-purple-700">إنشاء غرفة صوتية خاصة</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block mb-2 font-semibold">كلمة مرور الغرفة</label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={3}
              required
              placeholder="أدخل كلمة مرور للغرفة"
            />
          </div>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold py-2 rounded-lg shadow hover:from-purple-700 hover:to-blue-600 transition-all"
            disabled={loading}
          >
            {loading ? 'جاري الإنشاء...' : 'إنشاء الغرفة'}
          </button>
        </form>
        {roomId && (
          <div className="mt-6 text-center">
            <div className="text-green-700 font-bold mb-2">تم إنشاء الغرفة بنجاح!</div>
            <div className="text-gray-700">معرف الغرفة: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{roomId}</span></div>
            <button
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              onClick={() => window.location.href = `/voice-room/${roomId}`}
            >
              دخول الغرفة
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateVoiceRoom; 