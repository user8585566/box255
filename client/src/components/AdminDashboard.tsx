import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Settings, 
  Activity, 
  Image, 
  Search, 
  Edit3, 
  Trash2, 
  Crown, 
  Shield, 
  Eye, 
  EyeOff,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  UserCheck,
  UserX,
  Coins,
  Star,
  Box,
  Infinity
} from 'lucide-react';
import { apiService } from '../services/api';
import ImageManagement from './ImageManagement';

interface AdminDashboardProps {
  userData: any;
  onLogout: () => void;
}

interface User {
  id?: string;
  userId?: string;
  playerId: string;
  username: string;
  email: string;
  isAdmin: boolean;
  coins: number;
  goldCoins?: number;
  pearls: number;
  createdAt: string;
  lastActive: string;
  avatar?: string;
}

interface GameSettings {
  numBoxes: number;
  winRatio: number;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ userData, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'game' | 'suspicious' | 'images'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [gameSettings, setGameSettings] = useState<GameSettings>({ numBoxes: 10, winRatio: 0.3 });
  const [suspiciousUsers, setSuspiciousUsers] = useState<any[]>([]);

  // تحميل البيانات عند تحميل المكون
  useEffect(() => {
    if (userData?.isAdmin) {
      loadUsers();
      loadGameSettings();
      loadSuspiciousActivity();
    }
  }, [userData]);

  // عرض الرسائل
  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // تحميل المستخدمين
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getAllUsersAdmin();
      console.log('📥 Loaded users:', (data as any).users);

      // التأكد من أن كل مستخدم لديه معرف صحيح
      const validUsers = ((data as any).users || []).map((user: any) => ({
        ...user,
        id: user.id || user.userId || user._id,
        userId: user.userId || user.id || user._id
      }));

      console.log('✅ Processed users:', validUsers);
      setUsers(validUsers);
    } catch (error) {
      console.error('❌ Error loading users:', error);
      showMessage('error', 'خطأ في تحميل المستخدمين');
    } finally {
      setIsLoading(false);
    }
  };

  // تحميل إعدادات اللعبة
  const loadGameSettings = async () => {
    try {
      const data = await apiService.getGameSettings();
      setGameSettings(data as GameSettings);
    } catch (error) {
      console.error('خطأ في تحميل إعدادات اللعبة:', error);
    }
  };

  // تحميل النشاطات المشبوهة
  const loadSuspiciousActivity = async () => {
    try {
      const data = await apiService.getSuspiciousActivities();
      setSuspiciousUsers((data as any) || []);
    } catch (error) {
      console.error('خطأ في تحميل النشاطات المشبوهة:', error);
      // لا نعرض رسالة خطأ للمستخدم هنا لأن هذه الميزة قد تكون غير متوفرة
      setSuspiciousUsers([]);
    }
  };

  // البحث عن المستخدمين
  const searchUsers = async (term: string) => {
    if (!term.trim()) {
      loadUsers();
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiService.searchUsersAdmin(term);
      setUsers((data as any).users || []);
    } catch (error) {
      showMessage('error', 'خطأ في البحث');
    } finally {
      setIsLoading(false);
    }
  };

  // تحديث بيانات المستخدم
  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      // التحقق من وجود userId
      if (!userId || userId === 'undefined' || userId === '') {
        console.error('❌ Invalid userId:', userId);
        console.error('❌ Updates object:', updates);
        showMessage('error', 'خطأ: معرف المستخدم غير صحيح. يرجى إعادة تحميل الصفحة.');
        return;
      }

      console.log('🔄 Updating user:', userId, 'with updates:', updates);

      // إذا كان التحديث يشمل معرف اللاعب، تحقق من صحته
      if (updates.playerId) {
        if (!/^\d{6}$/.test(updates.playerId)) {
          showMessage('error', 'معرف اللاعب يجب أن يكون 6 أرقام فقط');
          return;
        }
        // تحديث معرف اللاعب بشكل منفصل
        await apiService.updatePlayerId(userId, updates.playerId);
        showMessage('success', 'تم تحديث معرف اللاعب بنجاح');
      }

      // تحديث باقي البيانات
      const { playerId, ...otherUpdates } = updates;
      if (Object.keys(otherUpdates).length > 0) {
        await apiService.updateUserAdmin(userId, otherUpdates);
        showMessage('success', 'تم تحديث المستخدم بنجاح');
      }
      
      loadUsers();
      setSelectedUser(null);
    } catch (error) {
      showMessage('error', 'خطأ في تحديث المستخدم');
    }
  };

  // حفظ إعدادات اللعبة
  const saveGameSettings = async () => {
    try {
      await apiService.updateGameSettings(gameSettings);
      showMessage('success', 'تم حفظ إعدادات اللعبة بنجاح');
    } catch (error) {
      showMessage('error', 'خطأ في حفظ الإعدادات');
    }
  };

  // فلترة المستخدمين
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // التحقق من صلاحيات المشرف
  if (!userData?.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500/50 rounded-3xl p-8 text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">غير مصرح</h2>
          <p className="text-red-300 mb-6">ليس لديك صلاحيات للوصول إلى لوحة تحكم المشرف</p>
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl transition-colors"
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
        </div>
      </div>

      <div className="relative z-10 px-4 py-4">
        {/* رأس لوحة التحكم - محسن للجوال */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center relative">
                <Crown className="w-6 h-6 text-white" />
                <Infinity className="w-3 h-3 text-white absolute -top-1 -right-1" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  لوحة تحكم المشرف
                </h1>
                <p className="text-gray-300 text-sm">INFINITY BOX</p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg px-3 py-2 text-red-300 hover:text-red-200 transition-all duration-200 text-sm"
            >
              خروج
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl px-3 py-2 border border-white/20 flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-gray-300">مرحباً، {userData.username}</span>
          </div>
        </div>

        {/* رسائل التنبيه */}
        {message && (
          <div className={`mb-6 p-4 rounded-2xl border ${
            message.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-300' :
            message.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-300' :
            'bg-blue-500/20 border-blue-500/50 text-blue-300'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {message.type === 'error' && <XCircle className="w-5 h-5" />}
              {message.type === 'info' && <AlertTriangle className="w-5 h-5" />}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* تبويبات التنقل - محسنة للجوال */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {[
            { id: 'users', label: 'إدارة المستخدمين', shortLabel: 'المستخدمين', icon: Users, color: 'from-blue-500 to-cyan-500' },
            { id: 'game', label: 'إعدادات اللعبة', shortLabel: 'الألعاب', icon: Settings, color: 'from-green-500 to-emerald-500' },
            { id: 'suspicious', label: 'النشاطات المشبوهة', shortLabel: 'المشبوهة', icon: Activity, color: 'from-red-500 to-pink-500' },
            { id: 'images', label: 'إدارة الصور', shortLabel: 'الصور', icon: Image, color: 'from-purple-500 to-indigo-500' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-2 px-3 py-3 rounded-xl transition-all duration-200 ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                  : 'bg-white/10 hover:bg-white/20 text-gray-300'
              }`}
            >
              <tab.icon className="w-6 h-6" />
              <span className="text-sm font-medium">{tab.shortLabel}</span>
            </button>
          ))}
        </div>

        {/* محتوى التبويبات - محسن للجوال */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          {/* إدارة المستخدمين */}
          {activeTab === 'users' && (
            <div className="p-4">
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    المستخدمين ({filteredUsers.length})
                  </h2>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      console.log('🧹 Clearing local data...');
                      apiService.clearLocalData();
                      showMessage('info', 'تم تنظيف البيانات المحلية. سيتم إعادة تحميل الصفحة...');
                      setTimeout(() => window.location.reload(), 1000);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg px-3 py-2 text-red-300 transition-colors text-sm"
                  >
                    <XCircle className="w-4 h-4" />
                    تنظيف البيانات
                  </button>
                  <button
                    onClick={loadUsers}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg px-3 py-2 text-blue-300 transition-colors text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    تحديث
                  </button>
                </div>
              </div>

              {/* شريط البحث - محسن للجوال */}
              <div className="relative mb-4">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    searchUsers(e.target.value);
                  }}
                  placeholder="البحث عن المستخدمين..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-10 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  autoComplete="off"
                />
              </div>

              {/* قائمة المستخدمين - محسنة للجوال */}
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mx-auto mb-3" />
                  <p className="text-gray-300 text-sm">جاري التحميل...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="bg-white/10 rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-sm font-bold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                            <span className="truncate">{user.username}</span>
                            {user.isAdmin && <Crown className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
                          </h3>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                          <p className="text-xs text-blue-400">المعرف: {user.playerId}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-white/5 rounded-lg p-2 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Coins className="w-3 h-3 text-yellow-400" />
                            <span className="text-yellow-400 font-semibold text-sm">{user.goldCoins || user.coins || 0}</span>
                          </div>
                          <p className="text-xs text-gray-400">العملات</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Star className="w-3 h-3 text-purple-400" />
                            <span className="text-purple-400 font-semibold text-sm">{user.pearls || 0}</span>
                          </div>
                          <p className="text-xs text-gray-400">اللآلئ</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg px-2 py-2 text-blue-300 text-xs transition-colors flex items-center justify-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          تعديل
                        </button>
                        <button
                          onClick={() => updateUser(user.id || user._id, { isAdmin: !user.isAdmin })}
                          className={`flex-1 border rounded-lg px-2 py-2 text-xs transition-colors flex items-center justify-center gap-1 ${
                            user.isAdmin
                              ? 'bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-300'
                              : 'bg-green-500/20 hover:bg-green-500/30 border-green-500/50 text-green-300'
                          }`}
                        >
                          {user.isAdmin ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                          {user.isAdmin ? 'إلغاء' : 'ترقية'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* إعدادات اللعبة - محسنة للجوال */}
          {activeTab === 'game' && (
            <div className="p-4">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-green-400" />
                إعدادات اللعبة
              </h2>

              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-base font-semibold text-white mb-4">إعدادات صناديق الحظ</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        عدد الصناديق في الجولة
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="100"
                        value={gameSettings.numBoxes}
                        onChange={(e) => setGameSettings(prev => ({ ...prev, numBoxes: parseInt(e.target.value) }))}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        نسبة الفوز (من 0.1 إلى 0.9)
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        max="0.9"
                        step="0.1"
                        value={gameSettings.winRatio}
                        onChange={(e) => setGameSettings(prev => ({ ...prev, winRatio: parseFloat(e.target.value) }))}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <button
                      onClick={saveGameSettings}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                    >
                      <Save className="w-4 h-4" />
                      حفظ الإعدادات
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* النشاطات المشبوهة */}
          {activeTab === 'suspicious' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Activity className="w-6 h-6 text-red-400" />
                  النشاطات المشبوهة
                </h2>
                <button
                  onClick={loadSuspiciousActivity}
                  className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl px-4 py-2 text-red-300 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  تحديث
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-red-500/20 rounded-2xl p-6 border border-red-500/50">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                    <div>
                      <p className="text-2xl font-bold text-red-300">{suspiciousUsers.length}</p>
                      <p className="text-sm text-red-400">مستخدمين مشبوهين</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-orange-500/20 rounded-2xl p-6 border border-orange-500/50">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-8 h-8 text-orange-400" />
                    <div>
                      <p className="text-2xl font-bold text-orange-300">
                        {suspiciousUsers.filter(u => u.riskLevel === 'high').length}
                      </p>
                      <p className="text-sm text-orange-400">مخاطر عالية</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-500/20 rounded-2xl p-6 border border-yellow-500/50">
                  <div className="flex items-center gap-3">
                    <Eye className="w-8 h-8 text-yellow-400" />
                    <div>
                      <p className="text-2xl font-bold text-yellow-300">
                        {suspiciousUsers.filter(u => u.riskLevel === 'medium').length}
                      </p>
                      <p className="text-sm text-yellow-400">تحت المراقبة</p>
                    </div>
                  </div>
                </div>
              </div>

              {suspiciousUsers.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">لا توجد نشاطات مشبوهة</h3>
                  <p className="text-gray-300">جميع المستخدمين يتصرفون بشكل طبيعي</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suspiciousUsers.map((user, index) => (
                    <div key={index} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center text-lg font-bold">
                            {user.username?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{user.username}</h3>
                            <p className="text-sm text-gray-400">آخر نشاط: {user.lastActivity}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.riskLevel === 'high' ? 'bg-red-500/20 text-red-300' :
                          user.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-green-500/20 text-green-300'
                        }`}>
                          {user.riskLevel === 'high' ? 'خطر عالي' :
                           user.riskLevel === 'medium' ? 'خطر متوسط' : 'خطر منخفض'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* إدارة الصور */}
          {activeTab === 'images' && (
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Image className="w-6 h-6 text-purple-400" />
                  إدارة الصور
                </h2>

                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Image className="w-5 h-5 text-purple-400" />
                    <h3 className="font-semibold text-purple-300">إدارة صور المستخدمين</h3>
                  </div>
                  <p className="text-gray-300 text-sm">
                    عرض وإدارة جميع صور المستخدمين، حذف الصور غير المناسبة، والبحث في المستخدمين.
                  </p>
                </div>
              </div>

              <ImageManagement />
            </div>
          )}
        </div>
      </div>

      {/* مودال تعديل المستخدم */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-3xl p-8 max-w-md w-full border border-white/20">
            <h3 className="text-xl font-bold text-white mb-6">تعديل المستخدم</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">معرف اللاعب</label>
                <input
                  type="text"
                  value={selectedUser.playerId}
                  onChange={(e) => setSelectedUser(prev => prev ? { ...prev, playerId: e.target.value } : null)}
                  maxLength={6}
                  pattern="\d{6}"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="6 أرقام فقط"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">اسم المستخدم</label>
                <input
                  type="text"
                  value={selectedUser.username}
                  onChange={(e) => setSelectedUser(prev => prev ? { ...prev, username: e.target.value } : null)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">العملات الذهبية</label>
                <div className="space-y-3">
                  <input
                    type="number"
                    value={selectedUser.goldCoins || selectedUser.coins || 0}
                    onChange={(e) => setSelectedUser(prev => prev ? { ...prev, goldCoins: parseInt(e.target.value) } : null)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoComplete="off"
                  />
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedUser(prev => prev ? { ...prev, goldCoins: (prev.goldCoins || prev.coins || 0) + 1000 } : null)}
                      className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-300 text-sm hover:bg-yellow-500/30 transition-colors"
                    >
                      +1,000
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(prev => prev ? { ...prev, goldCoins: (prev.goldCoins || prev.coins || 0) + 5000 } : null)}
                      className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-300 text-sm hover:bg-yellow-500/30 transition-colors"
                    >
                      +5,000
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(prev => prev ? { ...prev, goldCoins: (prev.goldCoins || prev.coins || 0) + 10000 } : null)}
                      className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-300 text-sm hover:bg-yellow-500/30 transition-colors"
                    >
                      +10,000
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">اللآلئ</label>
                <div className="space-y-3">
                  <input
                    type="number"
                    value={selectedUser.pearls || 0}
                    onChange={(e) => setSelectedUser(prev => prev ? { ...prev, pearls: parseInt(e.target.value) } : null)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoComplete="off"
                  />
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedUser(prev => prev ? { ...prev, pearls: (prev.pearls || 0) + 1 } : null)}
                      className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-300 text-sm hover:bg-purple-500/30 transition-colors"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(prev => prev ? { ...prev, pearls: (prev.pearls || 0) + 5 } : null)}
                      className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-300 text-sm hover:bg-purple-500/30 transition-colors"
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(prev => prev ? { ...prev, pearls: (prev.pearls || 0) + 10 } : null)}
                      className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-300 text-sm hover:bg-purple-500/30 transition-colors"
                    >
                      +10
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={selectedUser.isAdmin}
                  onChange={(e) => setSelectedUser(prev => prev ? { ...prev, isAdmin: e.target.checked } : null)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isAdmin" className="text-sm font-medium text-gray-300">
                  صلاحيات المشرف
                </label>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  const userId = selectedUser.id || selectedUser.userId;
                  console.log('🔍 Selected user data:', selectedUser);
                  console.log('🔍 Extracted userId:', userId);

                  if (!userId) {
                    showMessage('error', 'خطأ: لا يمكن العثور على معرف المستخدم. يرجى إعادة تحميل الصفحة.');
                    return;
                  }

                  updateUser(userId, selectedUser);
                }}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
              >
                حفظ التغييرات
              </button>
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/50 text-gray-300 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;