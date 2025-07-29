import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Users,
  Trophy,
  Settings,
  LogOut,
  Coins,
  Star,
  Crown,
  Box,
  Infinity,
  Menu,
  X,
  Shield,
  Home,
  User,
  ArrowLeft,
  ChevronLeft,
  Volume2
} from 'lucide-react';
import GameGrid from './GameGrid';
import AdminDashboard from './AdminDashboard';
import MobileProfileCard from './MobileProfileCard';
import MobileVoiceRoom from './MobileVoiceRoom';

interface MobileDashboardProps {
  userData: any;
  onLogout: () => void;
  onUpdateProfile?: (data: any) => void;
  wsService?: any; // إضافة WebSocket service
}

const MobileDashboard: React.FC<MobileDashboardProps> = ({ userData, onLogout, onUpdateProfile, wsService }) => {
  const [activeTab, setActiveTab] = useState<'games' | 'leaderboard' | 'profile' | 'admin' | 'voice'>('games');
  const [currentUserData, setCurrentUserData] = useState(userData);
  const [navigationHistory, setNavigationHistory] = useState<('games' | 'leaderboard' | 'profile' | 'admin' | 'voice')[]>(['games']);

  // تحديث البيانات المحلية عند تغيير userData من الأب
  useEffect(() => {
    if (userData) {
      console.log('🔄 MobileDashboard: userData updated from parent:', userData);
      setCurrentUserData(userData);
    }
  }, [userData]);

  // دالة تحديث الملف الشخصي
  const handleProfileUpdate = (updatedData: any) => {
    console.log('🔄 MobileDashboard: Updating profile data:', updatedData);
    const newUserData = { ...currentUserData, ...updatedData };
    setCurrentUserData(newUserData);

    if (onUpdateProfile) {
      onUpdateProfile(newUserData);
    }
  };

  // تحديث بيانات المستخدم
  useEffect(() => {
    setCurrentUserData(userData);
  }, [userData]);

  // دالة التنقل مع تتبع التاريخ
  const navigateToTab = (tab: 'games' | 'leaderboard' | 'profile' | 'admin' | 'voice') => {
    console.log('🔄 Navigating to tab:', tab);
    if (tab !== activeTab) {
      // استخدام requestAnimationFrame لتحسين الأداء
      requestAnimationFrame(() => {
        setNavigationHistory(prev => [...prev, tab]);
        setActiveTab(tab);
        console.log('✅ Tab changed to:', tab);
      });
    }
  };

  // دالة الرجوع للقائمة السابقة
  const goBack = () => {
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop(); // إزالة الصفحة الحالية
      const previousTab = newHistory[newHistory.length - 1];
      setNavigationHistory(newHistory);
      setActiveTab(previousTab);
    }
  };

  // التحقق من إمكانية الرجوع
  const canGoBack = navigationHistory.length > 1;

  // الحصول على عنوان القسم الحالي
  const getCurrentTabTitle = () => {
    switch (activeTab) {
      case 'games':
        return 'مركز الألعاب';
      case 'leaderboard':
        return 'لوحة المتصدرين';
      case 'voice':
        return 'الغرفة الصوتية';
      case 'profile':
        return 'الملف الشخصي';
      case 'admin':
        return 'لوحة الإدارة';
      default:
        return 'INFINITY BOX';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'games':
        return <GameGrid setActiveTab={navigateToTab} />;
      case 'leaderboard':
        return <LeaderboardContent />;
      case 'voice':
        return wsService ? (
          <MobileVoiceRoom
            user={currentUserData}
            wsService={wsService}
            onBack={() => navigateToTab('games')}
          />
        ) : (
          <div className="p-4 text-center text-red-400">خدمة WebSocket غير متاحة</div>
        );
      case 'profile':
        return <MobileProfileCard
          userData={currentUserData}
          onUpdateProfile={handleProfileUpdate}
          onLogout={onLogout}
          isOwner={true}
        />;
      case 'admin':
        return userData?.isAdmin ? <AdminDashboard userData={userData} onLogout={onLogout} /> : <GameGrid setActiveTab={navigateToTab} />;
      default:
        return <GameGrid setActiveTab={navigateToTab} />;
    }
  };

  // إذا كان المستخدم في لوحة المشرف، عرضها بدون الشريط الجانبي
  if (activeTab === 'admin' && userData?.isAdmin) {
    return <AdminDashboard userData={userData} onLogout={onLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-slate-900 text-white flex flex-col relative overflow-hidden">
      {/* خلفية متحركة مطابقة */}
      <div className="absolute inset-0 overflow-hidden">
        {/* خلفيات ملونة (أخضر وأحمر غامق) */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-green-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-red-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        {/* نجوم متحركة في السماء الليلية */}
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-16 gap-6 h-full w-full p-4">
            {Array.from({ length: 80 }).map((_, i) => (
              <div
                key={i}
                className={`${i % 4 === 0 ? 'w-1 h-1' : 'w-0.5 h-0.5'} bg-white rounded-full animate-pulse`}
                style={{
                  animationDelay: `${i * 150}ms`,
                  animationDuration: `${2 + (i % 3)}s`
                }}
              ></div>
            ))}
          </div>
        </div>

        {/* قمر في الخلفية */}
        <div className="absolute top-20 right-20 w-16 h-16 bg-gradient-to-br from-yellow-200 to-yellow-100 rounded-full opacity-30 blur-sm"></div>

        {/* تأثير خلفي متحرك - رمز اللانهاية */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="text-[18rem] md:text-[24rem] font-black text-cyan-500 animate-spin" style={{ animationDuration: '40s' }}>∞</div>
        </div>
      </div>

      {/* Header للهاتف */}
      <div className="relative z-10 flex items-center justify-between h-16 px-4 bg-gradient-to-r from-blue-900/90 via-purple-900/90 to-slate-800/90 backdrop-blur-sm border-b border-purple-400/30 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {/* زر الرجوع */}
          {canGoBack && (
            <button
              onClick={goBack}
              className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}

          {/* صورة اللاعب */}
          <div className="relative">
            <img
              src={currentUserData?.profileImage || '/images/default-avatar.png'}
              alt={currentUserData?.username}
              className="w-9 h-9 rounded-full border-2 border-white/30 object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/images/default-avatar.png';
              }}
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
          </div>

          {/* اسم اللاعب أو عنوان القسم */}
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-yellow-300 to-blue-300 bg-clip-text text-transparent">
              {activeTab === 'games' ? (currentUserData?.username || 'اللاعب') : getCurrentTabTitle()}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-1">
            <Coins className="w-5 h-5 text-yellow-300" />
            <span className="text-yellow-300 text-sm font-bold">{currentUserData?.goldCoins || 0}</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-1">
            <Star className="w-5 h-5 text-emerald-300" />
            <span className="text-emerald-300 text-sm font-bold">{currentUserData?.pearls || 0}</span>
          </div>

          {/* زر تسجيل الخروج */}
          <button
            onClick={onLogout}
            className="p-2 rounded-lg hover:bg-red-600/20 transition-colors"
          >
            <LogOut className="w-5 h-5 text-red-400" />
          </button>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="relative z-10 flex-1 overflow-hidden">
        {renderContent()}
      </div>

      {/* Bottom Navigation للهاتف */}
      <div className="relative z-10 bg-gradient-to-r from-blue-900/90 via-purple-900/90 to-slate-800/90 backdrop-blur-sm border-t border-purple-400/30 px-2 py-2 sticky bottom-0 z-40">
        <div className="flex items-center justify-around">
          <button
            onClick={() => navigateToTab('games')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
              activeTab === 'games'
                ? 'bg-cyan-700/40 text-cyan-300'
                : 'text-gray-400 hover:text-cyan-200 hover:bg-slate-700/50'
            }`}
          >
            <Gamepad2 className="w-6 h-6" />
            <span className="text-[11px] font-medium">الألعاب</span>
          </button>



          <button
            onClick={() => navigateToTab('voice')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
              activeTab === 'voice'
                ? 'bg-purple-700/40 text-purple-300'
                : 'text-gray-400 hover:text-purple-200 hover:bg-slate-700/50'
            }`}
          >
            <Volume2 className="w-6 h-6" />
            <span className="text-[11px] font-medium">الغرفة الصوتية</span>
          </button>

          <button
            onClick={() => navigateToTab('leaderboard')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
              activeTab === 'leaderboard'
                ? 'bg-amber-700/40 text-amber-300'
                : 'text-gray-400 hover:text-amber-200 hover:bg-slate-700/50'
            }`}
          >
            <Trophy className="w-6 h-6" />
            <span className="text-[11px] font-medium">المتصدرين</span>
          </button>

          <button
            onClick={() => navigateToTab('profile')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
              activeTab === 'profile'
                ? 'bg-emerald-700/40 text-emerald-300'
                : 'text-gray-400 hover:text-emerald-200 hover:bg-slate-700/50'
            }`}
          >
            <User className="w-6 h-6" />
            <span className="text-[11px] font-medium">الملف الشخصي</span>
          </button>

          {userData?.isAdmin && (
            <button
              onClick={() => navigateToTab('admin')}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
                activeTab === 'admin'
                  ? 'bg-rose-700/40 text-rose-300'
                  : 'text-gray-400 hover:text-rose-200 hover:bg-slate-700/50'
              }`}
            >
              <Crown className="w-6 h-6" />
              <span className="text-[11px] font-medium">الإدارة</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// مكون لوحة المتصدرين
const LeaderboardContent: React.FC = () => {
  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="text-center py-20">
        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">لوحة المتصدرين</h2>
        <p className="text-gray-400">قريباً...</p>
      </div>
    </div>
  );
};

export default MobileDashboard;
