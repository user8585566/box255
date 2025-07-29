import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { apiService } from '../services/api';
import GameGrid from './GameGrid';
import AdminDashboard from './AdminDashboard';
import MobileDashboard from './MobileDashboard';
import MobileProfileCard from './MobileProfileCard';
import VoiceRoom from './VoiceRoom';
import { User } from '../types';
import {
  LogOut,
  Crown,
  Coins,
  Gem,
  Trophy,
  Star,
  Bell,
  Settings,
  User as UserIcon,
  Volume2
} from 'lucide-react';

interface MainDashboardProps {
  user: User;
  onLogout: () => void;
  wsService?: any; // إضافة WebSocket service
}

const MainDashboard: React.FC<MainDashboardProps> = ({ user, onLogout, wsService }) => {
  const [, setLocation] = useLocation();
  // استرجاع التبويب المحفوظ أو الافتراضي
  const [activeTab, setActiveTab] = useState<'games' | 'leaderboard' | 'profile' | 'admin' | 'voice'>(() => {
    const isInVoiceRoom = localStorage.getItem('isInVoiceRoom') === 'true';
    const savedTab = localStorage.getItem('activeTab');

    // إذا كان المستخدم في الغرفة الصوتية، توجيهه مباشرة إليها
    if (isInVoiceRoom) {
      return 'voice';
    }

    return (savedTab as 'games' | 'leaderboard' | 'profile' | 'admin' | 'voice') || 'games';
  });
  const [isMobile, setIsMobile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTabChange = (tab: 'games' | 'leaderboard' | 'profile' | 'admin' | 'voice') => {
    setActiveTab(tab);
    // حفظ التبويب النشط في localStorage
    localStorage.setItem('activeTab', tab);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setLocation('/login');
    onLogout();
  };

  // رسالة اختبارية لعرض جميع بيانات اللاعب
  console.log('USER DATA IN MAIN DASHBOARD:', user);

  if (!user || !user.username) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-900 via-yellow-900 to-black text-white">
        <h1 className="text-3xl font-bold mb-4">⚠️ لا توجد بيانات لاعب!</h1>
        <pre className="bg-black/60 rounded-lg p-4 text-left text-xs max-w-xl overflow-x-auto mb-4">
{JSON.stringify(user, null, 2)}
        </pre>
        <p className="mb-4">يرجى التأكد من أن حسابك يحتوي على اسم مستخدم وصورة ورصيد.</p>
        <button onClick={onLogout} className="px-6 py-2 bg-red-600 rounded-lg text-white font-bold">تسجيل الخروج</button>
      </div>
    );
  }

  if (isMobile) {
    return (
      <MobileDashboard
        userData={user}
        onLogout={handleLogout}
        wsService={wsService}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header with Player Info */}
      <header className="relative z-10 bg-black/30 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Crown className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    {user.username} - Infinity Box
                  </h1>
                  <p className="text-xs text-gray-400">عالم الألعاب المثير</p>
                </div>
              </div>
            </div>
            
            {/* Player Stats */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-yellow-500/50 shadow-lg hover:from-yellow-500/40 hover:to-orange-500/40 transition-all duration-300">
                  <Coins className="w-6 h-6 text-yellow-300" />
                  <span className="text-yellow-300 font-bold text-lg">{user.goldCoins?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-500/30 to-purple-500/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-blue-500/50 shadow-lg hover:from-blue-500/40 hover:to-purple-500/40 transition-all duration-300">
                  <Gem className="w-6 h-6 text-blue-300" />
                  <span className="text-blue-300 font-bold text-lg">{user.pearls || 0}</span>
                </div>
              </div>
            </div>

            {/* Player Profile and Actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/20"
              >
                <Bell className="w-5 h-5 text-white" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              </button>

                          {/* Player Profile */}
            <div className="flex items-center space-x-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-purple-500/30 hover:from-purple-500/30 hover:to-blue-500/30 transition-all duration-300 shadow-lg">
              <div className="relative">
                <img 
                  src={user.profileImage || '/images/default-avatar.png'}
                  alt={user.username}
                  className="w-12 h-12 rounded-full border-2 border-white/30 shadow-lg object-cover"
                  onError={(e) => { e.currentTarget.src = '/images/default-avatar.png'; }}
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div className="text-right">
                <p className="font-bold text-white text-lg">{user.username}</p>
                <p className="text-xs text-yellow-300">مستوى {user.level || 1} - {user.experience || 0} XP</p>
              </div>
            </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm rounded-lg transition-all duration-300 border border-red-500/30 text-red-400 hover:text-red-300"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">خروج</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="relative z-10 bg-black/20 backdrop-blur-xl border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => handleTabChange('games')}
              className={`py-4 px-6 border-b-2 font-medium text-sm transition-all duration-300 rounded-t-lg ${
                activeTab === 'games'
                  ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10'
                  : 'border-transparent text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              🎮 الألعاب
            </button>
            <button
              onClick={() => handleTabChange('leaderboard')}
              className={`py-4 px-6 border-b-2 font-medium text-sm transition-all duration-300 rounded-t-lg ${
                activeTab === 'leaderboard'
                  ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10'
                  : 'border-transparent text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              🏆 المتصدرين
            </button>
            <button
              onClick={() => handleTabChange('voice')}
              className={`py-4 px-6 border-b-2 font-medium text-sm transition-all duration-300 rounded-t-lg ${
                activeTab === 'voice'
                  ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10'
                  : 'border-transparent text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              🎤 الغرفة الصوتية
            </button>
            <button
              onClick={() => handleTabChange('profile')}
              className={`py-4 px-6 border-b-2 font-medium text-sm transition-all duration-300 rounded-t-lg ${
                activeTab === 'profile'
                  ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10'
                  : 'border-transparent text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              👤 الملف الشخصي
            </button>
            {user.isAdmin && (
              <button
                onClick={() => handleTabChange('admin')}
                className={`py-4 px-6 border-b-2 font-medium text-sm transition-all duration-300 rounded-t-lg ${
                  activeTab === 'admin'
                    ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10'
                    : 'border-transparent text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                ⚙️ الإدارة
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'games' && (
          <GameGrid setActiveTab={handleTabChange} />
        )}
        {activeTab === 'games' && (
          <div className="flex justify-center my-6">
            <button
              className="bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:from-purple-700 hover:to-blue-600 transition-all text-lg"
              onClick={() => window.location.href = '/create-voice-room'}
            >
              🎤 أنشئ غرفتك الصوتية
            </button>
          </div>
        )}
        {activeTab === 'leaderboard' && (
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <Trophy className="w-12 h-12 text-yellow-400 mr-4" />
              <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                🏆 المتصدرين
              </h2>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
              <p className="text-gray-300 text-lg">قريباً سيتم إضافة قائمة المتصدرين...</p>
            </div>
          </div>
        )}
        {activeTab === 'voice' && wsService && (
          <VoiceRoom user={user} wsService={wsService} />
        )}
        {activeTab === 'profile' && (
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <UserIcon className="w-12 h-12 text-blue-400 mr-4" />
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                👤 الملف الشخصي
              </h2>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
              <p className="text-gray-300 text-lg">قريباً سيتم إضافة الملف الشخصي...</p>
            </div>
          </div>
        )}
        {activeTab === 'admin' && user.isAdmin && (
          <AdminDashboard userData={user} onLogout={handleLogout} />
        )}
      </main>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed top-20 right-4 z-50 w-80 bg-black/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">الإشعارات</h3>
          </div>
          <div className="p-4">
            <p className="text-gray-400 text-center">لا توجد إشعارات جديدة</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainDashboard;