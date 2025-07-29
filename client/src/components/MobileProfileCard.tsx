import React, { useState, useEffect } from 'react';
import { WebSocketService } from '../services/websocket';
import {
  User,
  Users,
  Gift,
  Star,
  Shield,
  CreditCard,
  ArrowLeftRight,
  Upload,
  Edit,
  X,
  Check,
  Camera,
  MessageCircle,
  UserPlus,
  Send,
  ChevronLeft,
  LogOut,
  Trophy,
  Coins,
  Gamepad2,
  Target,
  Zap,
  Award,
  Medal,
  Flame,
  Diamond,
  Gem,
  Sparkles,
  Clock,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  Settings,
  Bell,
  Activity,
  TrendingUp,
  BarChart,
  Heart,
  ThumbsUp,
  Smile
} from 'lucide-react';

// CSS للرسوم المتحركة المخصصة
const customStyles = `
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  @keyframes glow {
    0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
    50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.8); }
  }

  .animate-spin-slow {
    animation: spin-slow 3s linear infinite;
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  .animate-glow {
    animation: glow 2s ease-in-out infinite;
  }
`;

// إضافة الأنماط للصفحة
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = customStyles;
  document.head.appendChild(styleSheet);
}

interface MobileProfileCardProps {
  userData: any;
  isOwner: boolean; // هل هذا الملف الشخصي للمستخدم نفسه
  onUpdateProfile?: (updates: any) => void;
  onLogout?: () => void; // دالة تسجيل الخروج

}

const MobileProfileCard: React.FC<MobileProfileCardProps> = ({
  userData,
  isOwner,
  onUpdateProfile,
  onLogout,

}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'friends' | 'gifts' | 'items' | 'charge' | 'exchange'>('overview');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState(userData?.gender || 'male');
  const [isUploading, setIsUploading] = useState(false);
  const [itemCounts, setItemCounts] = useState({
    gems: 0,
    stars: 0,
    coins: 0,
    bombs: 0,
    bats: 0,
    snakes: 0
  });
  const [isFriend, setIsFriend] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isActivatingShield, setIsActivatingShield] = useState(false);
  const [userShield, setUserShield] = useState<any>(null);

  // حالات البحث عن الأصدقاء
  const [friendSearchId, setFriendSearchId] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // حالات الهدايا
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [giftAmount, setGiftAmount] = useState(100);
  const [giftType, setGiftType] = useState<'gold' | 'pearls'>('gold');
  const [giftMessage, setGiftMessage] = useState('');
  const [isSendingGift, setIsSendingGift] = useState(false);

  // قوائم البيانات
  const [friends, setFriends] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [gifts, setGifts] = useState<any[]>([]);

  // حالات الشحن والتبديل
  const [isCharging, setIsCharging] = useState(false);
  const [exchangeAmount, setExchangeAmount] = useState(10000);
  const [isExchanging, setIsExchanging] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(250);
  const [availableFreeCharges, setAvailableFreeCharges] = useState({
    '1_dollar': true,
    '5_dollar': true
  });

  // حالات إرسال العناصر
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [recipientPlayerId, setRecipientPlayerId] = useState('');
  const [isSendingItem, setIsSendingItem] = useState(false);

  // حالات الإشعارات والرسائل
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatUser, setChatUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // ألوان حسب الجنس
  const getThemeColors = (gender: string) => {
    if (gender === 'female') {
      return {
        primary: 'from-pink-500 to-red-400',
        secondary: 'bg-pink-50',
        accent: 'text-pink-600',
        button: 'bg-pink-500 hover:bg-pink-600',
        border: 'border-pink-200'
      };
    } else {
      return {
        primary: 'from-blue-500 to-yellow-400',
        secondary: 'bg-blue-50',
        accent: 'text-blue-600',
        button: 'bg-blue-500 hover:bg-blue-600',
        border: 'border-blue-200'
      };
    }
  };

  const theme = getThemeColors(userData?.gender || 'male');

  // جلب البيانات الكاملة للمستخدم عند تحميل المكون - مرة واحدة فقط
  useEffect(() => {
    let isMounted = true;

    const fetchCompleteUserData = async () => {
      if (isOwner && userData?.id && isMounted) {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            return;
          }

          const response = await fetch('/api/profile/me', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok && isMounted) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const completeUserData = await response.json();

              // تحديث البيانات في المكون الأب
              if (onUpdateProfile && isMounted) {
                onUpdateProfile(completeUserData);
              }
            }
          }
        } catch (error) {
          console.error('❌ Error fetching complete user data:', error);
        }
      }
    };

    // تأخير التنفيذ لتجنب التحديث المستمر
    const timeoutId = setTimeout(fetchCompleteUserData, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [isOwner, userData?.id]); // إزالة onUpdateProfile من dependencies

  // جلب عدد العناصر وفحص حالة الصداقة عند تحميل المكون
  useEffect(() => {
    if (userData?.id) {
      fetchUserItems();
      checkFriendshipStatus();
      if (isOwner) {
        fetchUserShield();
      }
    }
  }, [userData?.id, isOwner]);

  // إعداد WebSocket listener منفصل - مرة واحدة فقط
  useEffect(() => {
    if (isOwner && userData?.id) {
      const cleanup = setupMessageListener();
      return cleanup;
    }
  }, [isOwner, userData?.id]); // إزالة showChat و chatUser من dependencies

  // إنشاء WebSocket service
  const wsService = new WebSocketService(`ws${window.location.protocol === 'https:' ? 's' : ''}://${window.location.host}/ws`);

  // تحديث البيانات عند فتح البروفايل - مرة واحدة فقط
  useEffect(() => {
    let isMounted = true;

    if (isOwner && userData?.id && isMounted) {
      fetchFriends();
      fetchFriendRequests();
      fetchGifts();
      fetchNotifications();
      fetchFreeCharges();

      // تحديث دوري لطلبات الصداقة والإشعارات كل 5 دقائق
      const interval = setInterval(() => {
        if (isMounted) {
          fetchFriendRequests();
          fetchNotifications();
        }
      }, 300000); // 5 دقائق

      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }
  }, [isOwner, userData?.id]); // استخدام userData?.id بدلاً من userData الكامل

  // إعداد مستمع الرسائل الجديدة
  const setupMessageListener = () => {
    console.log('🔧 Setting up message listener...');

    const handleNewMessage = (data: any) => {
      console.log('📨 WebSocket message received:', data);

      if (data.messageData) {
        const senderId = data.messageData.sender._id;
        const recipientId = data.messageData.recipient._id;
        const currentUserId = userData?.id;

        console.log('📋 Message details:', {
          senderId,
          recipientId,
          currentUserId,
          showChat,
          chatUserId: chatUser?.id || chatUser?._id
        });

        // تحقق إذا كانت الرسالة موجهة لي
        if (recipientId === currentUserId) {
          console.log('✅ Message is for me, processing...');

          // إذا كانت المحادثة مفتوحة مع المرسل، أضف الرسالة فوراً
          if (showChat && chatUser && (senderId === chatUser.id || senderId === chatUser._id)) {
            console.log('💬 Adding message to open chat');
            setMessages(prev => {
              // تحقق من عدم وجود الرسالة مسبقاً
              const messageExists = prev.some(msg => msg._id === data.messageData._id);
              if (messageExists) {
                console.log('⚠️ Message already exists, skipping');
                return prev;
              }
              console.log('✅ Adding new message to chat');
              return [...prev, data.messageData];
            });

            // التمرير لأسفل بعد تأخير قصير
            setTimeout(scrollToBottom, 100);

            // تشغيل صوت استقبال الرسالة
            try {
              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
              audio.volume = 0.5;
              audio.play().catch(() => {}); // تجاهل الأخطاء
            } catch (error) {
              // تجاهل أخطاء الصوت
            }
          } else {
            // إذا لم تكن المحادثة مفتوحة، أعد تحميل الإشعارات لإظهار الرسالة الجديدة
            console.log('🔔 Chat not open, refreshing notifications');
            fetchNotifications();

            // تشغيل صوت إشعار
            try {
              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
              audio.volume = 0.3;
              audio.play().catch(() => {}); // تجاهل الأخطاء
            } catch (error) {
              // تجاهل أخطاء الصوت
            }
          }
        } else {
          console.log('ℹ️ Message not for me, ignoring');
        }
      } else {
        console.log('⚠️ No messageData in WebSocket message');
      }
    };

    // إزالة المستمع القديم أولاً
    wsService.offMessage('new_message', handleNewMessage);

    // إضافة المستمع الجديد
    wsService.onMessage('new_message', handleNewMessage);
    console.log('✅ Message listener added');

    // تنظيف المستمع عند إلغاء التحميل
    return () => {
      console.log('🧹 Cleaning up message listener');
      wsService.offMessage('new_message', handleNewMessage);
    };
  };



  const fetchUserItems = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found for fetching user items');
        return;
      }

      const response = await fetch(`/api/user-items/${userData.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setItemCounts(data.items);
        console.log('✅ User items fetched successfully:', data.items);
      } else {
        console.error('❌ Failed to fetch user items:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching user items:', error);
    }
  };

  const fetchUserShield = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found for fetching user shield');
        return;
      }

      const response = await fetch(`/api/profile/shield/${userData.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserShield(data.shield);
        console.log('✅ User shield fetched successfully:', data.shield);
      } else {
        console.error('❌ Failed to fetch user shield:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching user shield:', error);
    }
  };

  const activateShield = async (shieldType: 'gold' | 'usd', cost: number) => {
    if (isActivatingShield) return;

    setIsActivatingShield(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile/activate-shield', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ shieldType })
      });

      const data = await response.json();

      if (response.ok) {
        setUserShield(data.shield);
        // تحديث رصيد المستخدم إذا كان متاحاً
        if (onUpdateProfile && data.newBalance !== undefined) {
          onUpdateProfile({ goldCoins: data.newBalance });
        }
        alert(data.message);
        await fetchUserShield(); // إعادة جلب حالة الدرع
      } else {
        alert(data.message || 'فشل في تفعيل الدرع الواقي');
      }
    } catch (error) {
      console.error('Error activating shield:', error);
      alert('حدث خطأ في تفعيل الدرع الواقي');
    } finally {
      setIsActivatingShield(false);
    }
  };

  // جلب قائمة الأصدقاء
  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/profile/friends', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setFriends(data);
        console.log('✅ Friends fetched:', data.length);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  // جلب طلبات الصداقة
  const fetchFriendRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/profile/friend-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setFriendRequests(data);
        console.log('✅ Friend requests fetched:', data.length);
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  // جلب الهدايا
  const fetchGifts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/profile/gifts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setGifts(data);
        console.log('✅ Gifts fetched:', data.length);
      }
    } catch (error) {
      console.error('Error fetching gifts:', error);
    }
  };

  // البحث عن صديق
  const searchForFriend = async () => {
    if (!friendSearchId.trim()) {
      setSearchError('يرجى إدخال رقم اللاعب');
      return;
    }

    if (friendSearchId.length !== 6) {
      setSearchError('رقم اللاعب يجب أن يكون 6 أرقام');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/search-by-id/${friendSearchId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const user = await response.json();
        setSearchResult(user);
        console.log('✅ User found:', user.username);
      } else {
        setSearchError('لم يتم العثور على لاعب بهذا الرقم');
      }
    } catch (error) {
      console.error('Error searching for friend:', error);
      setSearchError('حدث خطأ أثناء البحث');
    } finally {
      setIsSearching(false);
    }
  };

  // إرسال طلب صداقة
  const sendFriendRequest = async (friendId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile/friend-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ friendId })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setSearchResult(null);
        setFriendSearchId('');

        // تحديث طلبات الصداقة للمستخدم المرسل (لا يحتاج لرؤية طلباته المرسلة)
        // ولكن نحدث الإشعارات للتأكد من التزامن
        await fetchNotifications();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'فشل في إرسال طلب الصداقة');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('حدث خطأ في إرسال طلب الصداقة');
    }
  };

  // إرسال هدية
  const sendGift = async () => {
    if (!selectedFriend) return;

    setIsSendingGift(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile/send-gift', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          toUserId: selectedFriend.id,
          giftType,
          amount: giftAmount,
          message: giftMessage
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setSelectedFriend(null);
        setGiftMessage('');
        setGiftAmount(100);
        // تحديث الرصيد إذا كان متاحاً
        if (onUpdateProfile && data.fromUserBalance) {
          onUpdateProfile(data.fromUserBalance);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'فشل في إرسال الهدية');
      }
    } catch (error) {
      console.error('Error sending gift:', error);
      alert('حدث خطأ في إرسال الهدية');
    } finally {
      setIsSendingGift(false);
    }
  };

  // قبول طلب صداقة
  const acceptFriendRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile/accept-friend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ friendshipId: requestId })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        await fetchFriendRequests();
        await fetchFriends();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'فشل في قبول طلب الصداقة');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('حدث خطأ في قبول طلب الصداقة');
    }
  };

  // جلب معلومات الشحن المجاني
  const fetchFreeCharges = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile/free-charges', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableFreeCharges(data.availableCharges);
      }
    } catch (error) {
      console.error('Error fetching free charges:', error);
    }
  };

  // شحن الرصيد
  const chargeBalance = async (amount: number, isFree: boolean = false, chargeType?: string) => {
    setIsCharging(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile/charge-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount, isFree, chargeType })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        // تحديث الرصيد
        if (onUpdateProfile && data.newBalance !== undefined) {
          onUpdateProfile({ goldCoins: data.newBalance });
        }
        // إذا كان شحن مجاني، تحديث الحالة
        if (isFree && chargeType) {
          setAvailableFreeCharges(prev => ({
            ...prev,
            [chargeType]: false
          }));
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'فشل في شحن الرصيد');
      }
    } catch (error) {
      console.error('Error charging balance:', error);
      alert('حدث خطأ في شحن الرصيد');
    } finally {
      setIsCharging(false);
    }
  };

  // تحويل الذهب إلى لآلئ
  const exchangeGoldToPearls = async () => {
    if (exchangeAmount < 10000) {
      alert('الحد الأدنى للتحويل هو 10,000 عملة ذهبية');
      return;
    }

    if (exchangeAmount % 10000 !== 0) {
      alert('يجب أن تكون الكمية مضاعفات 10,000');
      return;
    }

    if ((userData?.goldCoins || 0) < exchangeAmount) {
      alert('رصيد العملات الذهبية غير كافي');
      return;
    }

    setIsExchanging(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile/exchange-gold-to-pearls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ goldAmount: exchangeAmount })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        // تحديث الرصيد
        if (onUpdateProfile && data.newBalance) {
          onUpdateProfile(data.newBalance);
        }
        setExchangeAmount(10000); // إعادة تعيين القيمة
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'فشل في تحويل العملات');
      }
    } catch (error) {
      console.error('Error exchanging gold to pearls:', error);
      alert('حدث خطأ في تحويل العملات');
    } finally {
      setIsExchanging(false);
    }
  };

  // طلب سحب دولارات
  const requestWithdrawal = async () => {
    if (withdrawAmount < 250) {
      alert('الحد الأدنى للسحب هو 250 لؤلؤة ($25)');
      return;
    }

    if ((userData?.pearls || 0) < withdrawAmount) {
      alert('رصيد اللآلئ غير كافي');
      return;
    }

    const usdAmount = withdrawAmount / 10; // 10 لآلئ = $1
    const whatsappMessage = `طلب سحب دولارات%0A` +
      `المبلغ: $${usdAmount}%0A` +
      `اللآلئ المطلوبة: ${withdrawAmount}%0A` +
      `اسم المستخدم: ${userData?.username}%0A` +
      `رقم اللاعب: ${userData?.playerId}`;

    const whatsappUrl = `https://wa.me/1234567890?text=${whatsappMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // إرسال عنصر
  const sendItem = async () => {
    if (!selectedItem) {
      alert('يرجى اختيار عنصر للإرسال');
      return;
    }

    if (!recipientPlayerId || recipientPlayerId.length !== 6) {
      alert('يرجى إدخال رقم لاعب صحيح (6 أرقام)');
      return;
    }

    setIsSendingItem(true);
    try {
      // البحث عن المستقبل أولاً
      const token = localStorage.getItem('token');
      const searchResponse = await fetch(`/api/users/search-by-id/${recipientPlayerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!searchResponse.ok) {
        alert('لم يتم العثور على لاعب بهذا الرقم');
        return;
      }

      const recipient = await searchResponse.json();

      // إرسال العنصر
      const response = await fetch('/api/profile/send-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          toUserId: recipient.id,
          itemType: selectedItem,
          message: `عنصر ${getItemName(selectedItem)} من ${userData?.username}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setSelectedItem('');
        setRecipientPlayerId('');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'فشل في إرسال العنصر');
      }
    } catch (error) {
      console.error('Error sending item:', error);
      alert('حدث خطأ في إرسال العنصر');
    } finally {
      setIsSendingItem(false);
    }
  };

  // الحصول على اسم العنصر
  const getItemName = (itemType: string) => {
    const itemNames: { [key: string]: string } = {
      'bomb': 'قنبلة مدمرة',
      'bat': 'خفاش مؤذي',
      'snake': 'ثعبان سام',
      'gem': 'جوهرة نادرة',
      'star': 'نجمة ذهبية',
      'coin': 'عملة خاصة',
      'gold': 'عملات ذهبية'
    };
    return itemNames[itemType] || itemType;
  };

  // إرسال طلب شحن عبر واتساب
  const requestCharge = (amount: number, price: string) => {
    const whatsappMessage = `طلب شحن رصيد%0A` +
      `المبلغ المطلوب: ${amount} عملة ذهبية%0A` +
      `السعر: ${price}%0A` +
      `اسم المستخدم: ${userData?.username}%0A` +
      `رقم اللاعب: ${userData?.playerId}%0A` +
      `الرصيد الحالي: ${userData?.goldCoins || 0} عملة`;

    const whatsappUrl = `https://wa.me/1234567890?text=${whatsappMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // جلب الإشعارات
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        console.log('✅ Notifications fetched:', data.length);

        // تحديث الرصيد إذا كان هناك إشعار عنصر جديد غير مقروء
        const newItemNotifications = data.filter((n: any) =>
          !n.isRead &&
          n.type === 'item_received' &&
          n.data?.newBalance
        );

        if (newItemNotifications.length > 0 && onUpdateProfile) {
          const latestNotification = newItemNotifications[0];
          onUpdateProfile(latestNotification.data.newBalance);
          console.log('💰 Balance updated from item notification:', latestNotification.data.newBalance);
        }

        // تحديث طلبات الصداقة إذا كان هناك إشعارات طلبات صداقة جديدة
        const friendRequestNotifications = data.filter((n: any) =>
          n.type === 'friend_request' && !n.isRead
        );

        if (friendRequestNotifications.length > 0) {
          console.log('🤝 New friend request notifications found, refreshing friend requests');
          await fetchFriendRequests();
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // تحديث الإشعارات كمقروءة
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // تحديث الإشعار محلياً
        setNotifications(prev =>
          prev.map(notif =>
            notif._id === notificationId
              ? { ...notif, isRead: true }
              : notif
          )
        );
        console.log('✅ Notification marked as read:', notificationId);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // تحديث جميع الإشعارات كمقروءة
  const markAllNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // تحديث جميع الإشعارات محلياً
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        console.log('✅ All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // جلب الرسائل
  const fetchMessages = async (userId: string): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ No token found');
        return;
      }

      console.log('📥 Fetching messages for user:', userId);

      const response = await fetch(`/api/messages/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Messages fetched:', data.length);
        setMessages(data);
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to fetch messages:', errorData);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // إرسال رسالة
  const sendMessage = async () => {
    if (!newMessage.trim() || !chatUser) {
      console.log('❌ Missing message or chat user:', { newMessage, chatUser });
      return;
    }

    // التحقق من وجود معرف المستخدم
    const recipientId = chatUser.id || chatUser._id;
    if (!recipientId) {
      console.error('❌ No recipient ID found:', chatUser);
      alert('خطأ: لا يمكن تحديد المستقبل');
      return;
    }

    console.log('📤 Sending message:', { recipientId, content: newMessage });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId: recipientId,
          content: newMessage
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Message sent successfully:', data);

        // إضافة الرسالة محلياً
        setMessages([...messages, data.messageData]);
        setNewMessage('');
        scrollToBottom();

        // إرسال الرسالة عبر WebSocket للمزامنة
        if (wsService) {
          wsService.sendPrivateMessage(data.messageData, recipientId);
        }

        // تشغيل صوت الإرسال
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
          audio.volume = 0.3;
          audio.play().catch(() => {}); // تجاهل الأخطاء
        } catch (error) {
          // تجاهل أخطاء الصوت
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Message send failed:', errorData);
        alert(errorData.message || 'فشل في إرسال الرسالة');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('حدث خطأ في إرسال الرسالة');
    }
  };

  // التمرير لأسفل المحادثة مع تأثير سلس
  const scrollToBottom = () => {
    setTimeout(() => {
      const container = document.getElementById('messages-container');
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  // فتح المحادثة
  const openChat = (user: any) => {
    console.log('💬 Opening chat with user:', user);
    const userId = user.id || user._id;
    console.log('📋 User ID for messages:', userId);

    setChatUser(user);
    setShowChat(true);
    setMessages([]); // مسح الرسائل السابقة

    if (userId) {
      fetchMessages(userId).then(() => {
        scrollToBottom(); // التمرير لأسفل بعد جلب الرسائل
      });
    } else {
      console.error('❌ No user ID found for chat');
    }
  };

  const checkFriendshipStatus = async () => {
    if (!isOwner && userData?.id) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found for checking friendship');
          return;
        }

        const response = await fetch(`/api/friends/check/${userData.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setIsFriend(data.isFriend);
          console.log('✅ Friendship status checked:', data.isFriend);
        } else {
          console.error('❌ Failed to check friendship:', response.status);
          // إذا فشل، نفترض أنهما ليسا أصدقاء
          setIsFriend(false);
        }
      } catch (error) {
        console.error("Error checking friendship:", error);
        setIsFriend(false);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId: userData.id,
          content: messageText
        })
      });

      if (response.ok) {
        setMessageText('');
        setShowMessageDialog(false);
        alert('تم إرسال الرسالة بنجاح!');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'فشل في إرسال الرسالة');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('خطأ في إرسال الرسالة');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        alert('حجم الصورة كبير جداً. يجب أن يكون أقل من 5 ميجابايت');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSave = async () => {
    setIsUploading(true);
    try {
      const token = localStorage.getItem('token');

      // إعداد البيانات للإرسال
      const updateData: any = {
        gender: selectedGender
      };

      // إضافة الصورة فقط إذا تم تغييرها
      if (selectedImage && selectedImage !== userData?.profileImage) {
        updateData.profileImage = selectedImage;
      }

      console.log('🔄 Updating profile with data:', {
        hasProfileImage: !!updateData.profileImage,
        gender: updateData.gender,
        selectedImageLength: selectedImage?.length || 0,
        currentImageLength: userData?.profileImage?.length || 0
      });

      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        console.log('✅ Profile updated successfully:', {
          hasProfileImage: !!updatedUser.profileImage,
          profileImageLength: updatedUser.profileImage?.length || 0
        });

        // تحديث البيانات المحلية
        onUpdateProfile?.(updatedUser);

        // إعادة تعيين الصورة المختارة لتجنب التضارب
        setSelectedImage('');
        setIsEditingProfile(false);
        alert('تم تحديث الملف الشخصي بنجاح!');
      } else {
        const errorData = await response.json();
        console.error('❌ Profile update failed:', errorData);
        alert(errorData.message || 'فشل في تحديث الملف الشخصي');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('حدث خطأ في تحديث الملف الشخصي');
    } finally {
      setIsUploading(false);
    }
  };

  const getProfileImage = () => {
    if (selectedImage) return selectedImage;
    if (userData?.profileImage) return userData.profileImage;
    // صورة افتراضية حسب الجنس
    return userData?.gender === 'female' 
      ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiByeD0iNTAiIGZpbGw9IiNGRjY5QjQiLz4KPHN2ZyB4PSIyNSIgeT0iMjUiIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xMiAyQzEzLjEgMiAxNCAyLjkgMTQgNFMxMy4xIDYgMTIgNiAxMCA1LjEgMTAgNFMxMC45IDIgMTIgMlpNMjEgOVYxMUgyMFYxMkMxOS4xIDEyIDE4LjQgMTIuNiAxOC4xIDEzLjNDMTcuMSAxMS45IDE1LjEgMTEgMTMuOCAxMC43QzE0IDEwLjUgMTQuMSAxMC4yIDE0LjEgMTBDMTQgOS4xIDEzLjYgOC40IDEzIDhDMTMuNCA3LjYgMTMuNyA3IDE0IDYuOUMxNS40IDcuNyAxNi4yIDkuMSAxNiAzMEMxOC40IDI5IDEwLjUgMzAgOFMxMS42IDI5IDEwIDI5LjdIMThDMTggMjguNSAxOC4zIDI3LjUgMTguOSAyNi43QzE5LjMgMjcuMSAxOS44IDI3LjMgMjAuNSAyNy4zSDE5QzE5IDI3IDEwLjMgMjcgMTAuNSAyNy4zSDE5LjQgMjEgOVoiLz4KPHN2Zz4KPHN2Zz4K'
      : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiByeD0iNTAiIGZpbGw9IiMzQjgyRjYiLz4KPHN2ZyB4PSIyNSIgeT0iMjUiIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xMiAyQTMgMyAwIDAgMSAxNSA1QTMgMyAwIDAgMSAxMiA4QTMgMyAwIDAgMSA5IDVBMyAzIDAgMCAxIDEyIDJNMjEgMjFWMjBDMjEgMTYuMTMgMTcuODcgMTMgMTQgMTNIMTBDNi4xMyAxMyAzIDE2LjEzIDMgMjBWMjFIMjFaIi8+Cjwvc3ZnPgo=';
  };

  return (
    <div className="max-w-md mx-auto bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen shadow-2xl overflow-hidden flex flex-col">
      {/* Compact Header with navy blue theme */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4 text-white relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-20 h-20 bg-blue-400/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-10 right-0 w-16 h-16 bg-indigo-400/5 rounded-full blur-lg animate-bounce"></div>
          <div className="absolute bottom-0 left-1/2 w-24 h-24 bg-slate-400/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-0 left-0 w-40 h-40 bg-white/30 rounded-full -translate-x-20 -translate-y-20 blur-xl"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/20 rounded-full translate-x-12 translate-y-12 blur-lg"></div>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white/10 rounded-full -translate-x-12 -translate-y-12 blur-md"></div>
        </div>
        
        <div className="relative z-10">
          {/* Compact Profile Image Section */}
          <div className="flex flex-col items-center mb-3">
            <div className="relative group">
              {/* Subtle ring around profile picture */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-slate-500 animate-spin-slow opacity-60 blur-sm"></div>

              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/70 shadow-lg bg-gradient-to-br from-blue-400 to-indigo-500 ring-1 ring-white/40 backdrop-blur-sm transform group-hover:scale-105 transition-all duration-300">
                <img
                  src={getProfileImage()}
                  alt="الصورة الشخصية"
                  className="w-full h-full object-cover"
                />

                {/* Compact online status indicator */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-white shadow-sm animate-pulse"></div>
              </div>

              {isOwner && (
                <button
                  onClick={() => isEditingProfile ? document.getElementById('imageUpload')?.click() : setIsEditingProfile(true)}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center shadow-lg border border-white/60 hover:scale-110 transition-all duration-300"
                >
                  <Camera className="w-3 h-3 text-white" />
                </button>
              )}

              {isEditingProfile && (
                <input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              )}
            </div>

            {/* Compact user info */}
            <div className="text-center mt-2">
              <h2 className="text-lg font-bold text-white mb-1 drop-shadow-md">{userData?.username}</h2>
              <p className="text-white/60 text-xs bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm">ID: {userData?.playerId}</p>

              {/* Compact level/rank indicator */}
              <div className="flex items-center justify-center mt-1 gap-1">
                <div className="flex items-center bg-blue-500/20 px-1.5 py-0.5 rounded-full">
                  <Star className="w-2.5 h-2.5 text-blue-300 mr-1" />
                  <span className="text-blue-200 text-xs font-medium">Lv.{userData?.level || 1}</span>
                </div>
                <div className="flex items-center bg-indigo-500/20 px-1.5 py-0.5 rounded-full">
                  <Trophy className="w-2.5 h-2.5 text-indigo-300 mr-1" />
                  <span className="text-indigo-200 text-xs font-medium">{userData?.points || 0}</span>
                </div>
              </div>
            </div>
            
            {/* Gender selector for editing */}
            {isEditingProfile && (
              <div className="mt-3 flex space-x-2 rtl:space-x-reverse">
                <button
                  onClick={() => setSelectedGender('male')}
                  className={`px-3 py-1 rounded-full text-xs ${selectedGender === 'male' ? 'bg-white text-blue-600' : 'bg-white/20 text-white'}`}
                >
                  ذكر
                </button>
                <button
                  onClick={() => setSelectedGender('female')}
                  className={`px-3 py-1 rounded-full text-xs ${selectedGender === 'female' ? 'bg-white text-pink-600' : 'bg-white/20 text-white'}`}
                >
                  أنثى
                </button>
              </div>
            )}
          </div>
          
          {/* Compact Stats Grid - Private info only for owner */}
          {isOwner ? (
            <>
              <div className="grid grid-cols-3 gap-1.5 text-center mt-3">
                <div className="bg-gradient-to-br from-slate-700/40 to-blue-700/40 rounded-lg p-2 backdrop-blur-sm border border-blue-400/20 hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-center mb-0.5">
                    <Coins className="w-3 h-3 text-yellow-400" />
                  </div>
                  <div className="text-sm font-bold text-yellow-200">{userData?.goldCoins || 0}</div>
                  <div className="text-xs text-yellow-300/80">ذهب</div>
                </div>

                <div className="bg-gradient-to-br from-slate-700/40 to-indigo-700/40 rounded-lg p-2 backdrop-blur-sm border border-indigo-400/20 hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-center mb-0.5">
                    <Gem className="w-3 h-3 text-purple-400" />
                  </div>
                  <div className="text-sm font-bold text-purple-200">{userData?.pearls || 0}</div>
                  <div className="text-xs text-purple-300/80">لؤلؤ</div>
                </div>

                <div className="bg-gradient-to-br from-slate-700/40 to-blue-700/40 rounded-lg p-2 backdrop-blur-sm border border-blue-400/20 hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-center mb-0.5">
                    <Star className="w-3 h-3 text-blue-400" />
                  </div>
                  <div className="text-sm font-bold text-blue-200">Lv.{userData?.level || 1}</div>
                  <div className="text-xs text-blue-300/80">مستوى</div>
                </div>
              </div>

              {/* Compact additional stats row */}
              <div className="grid grid-cols-2 gap-1.5 text-center mt-1.5">
                <div className="bg-gradient-to-br from-slate-700/40 to-green-700/40 rounded-lg p-1.5 backdrop-blur-sm border border-green-400/20">
                  <div className="flex items-center justify-center mb-0.5">
                    <Activity className="w-3 h-3 text-green-400" />
                  </div>
                  <div className="text-sm font-bold text-green-200">{userData?.gamesPlayed || 0}</div>
                  <div className="text-xs text-green-300/80">ألعاب</div>
                </div>

                <div className="bg-gradient-to-br from-slate-700/40 to-red-700/40 rounded-lg p-1.5 backdrop-blur-sm border border-red-400/20">
                  <div className="flex items-center justify-center mb-0.5">
                    <Heart className="w-3 h-3 text-red-400" />
                  </div>
                  <div className="text-sm font-bold text-red-200">{userData?.friends?.length || 0}</div>
                  <div className="text-xs text-red-300/80">أصدقاء</div>
                </div>
              </div>

              {/* زر الإشعارات للمالك فقط */}
              <div className="mt-3 flex justify-center">
                <button
                  onClick={() => setShowNotifications(true)}
                  className="relative bg-white/20 hover:bg-white/30 rounded-lg p-3 backdrop-blur-sm transition-all duration-300 flex items-center gap-2"
                >
                  <span className="text-xl">🔔</span>
                  <span className="text-white text-sm font-medium">الإشعارات</span>
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                      {notifications.filter(n => !n.isRead).length}
                    </div>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm text-center">
                <div className="text-lg font-bold text-black">Lv.{userData?.level || 1}</div>
                <div className="text-xs text-white/80">مستوى</div>
              </div>
              
              {/* زر إرسال رسالة للأصدقاء فقط */}
              {isFriend && (
                <button
                  onClick={() => setShowMessageDialog(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>إرسال رسالة</span>
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Edit controls */}
        {isEditingProfile && (
          <div className="absolute top-4 right-4 flex space-x-2 rtl:space-x-reverse">
            <button
              onClick={handleProfileSave}
              disabled={isUploading}
              className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
            >
              <Check className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => {
                setIsEditingProfile(false);
                setSelectedImage('');
                setSelectedGender(userData?.gender || 'male');
              }}
              className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>
      
      {/* Enhanced Navigation Tabs */}
      <div className="bg-gradient-to-r from-gray-900/95 via-purple-900/95 to-gray-900/95 backdrop-blur-md border-b border-purple-500/30 z-20 mx-4 rounded-xl mt-4 shadow-xl flex-shrink-0">
        <div className="flex overflow-x-auto scrollbar-hide p-2">
          {[
            { id: 'overview', label: 'عام', icon: User, color: 'from-blue-500 to-cyan-500' },
            ...(isOwner ? [
              { id: 'friends', label: 'أصدقاء', icon: Users, color: 'from-green-500 to-emerald-500' },
              { id: 'gifts', label: 'هدايا', icon: Gift, color: 'from-pink-500 to-rose-500' },
              { id: 'items', label: 'عناصر', icon: Star, color: 'from-yellow-500 to-orange-500' },
              { id: 'charge', label: 'شحن', icon: CreditCard, color: 'from-purple-500 to-violet-500' },
              { id: 'exchange', label: 'تبديل', icon: ArrowLeftRight, color: 'from-indigo-500 to-blue-500' }
            ] : [])
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex-shrink-0 flex flex-col items-center px-4 py-3 min-w-[70px] transition-all duration-500 rounded-xl relative overflow-hidden group ${
                activeSection === tab.id
                  ? `bg-gradient-to-br ${tab.color} text-white shadow-2xl transform scale-110 animate-glow`
                  : 'text-gray-300 hover:bg-gray-800/60 hover:text-white hover:scale-105'
              }`}
            >
              {/* Background glow effect */}
              {activeSection === tab.id && (
                <div className={`absolute inset-0 bg-gradient-to-br ${tab.color} opacity-20 blur-xl`}></div>
              )}

              <div className="relative z-10 flex flex-col items-center">
                <tab.icon className={`w-5 h-5 mb-1 transition-all duration-300 ${
                  activeSection === tab.id ? 'animate-bounce' : 'group-hover:scale-110'
                }`} />
                <span className="text-xs font-medium">{tab.label}</span>
              </div>

              {/* Active indicator */}
              {activeSection === tab.id && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col">
        {activeSection === 'overview' && (
          <div className="flex-1 flex flex-col p-4 gap-4">
            {/* Compact Account Info Card */}
            <div className="bg-gradient-to-br from-slate-800/90 via-blue-800/90 to-indigo-800/90 rounded-xl p-3 border border-blue-400/30 shadow-lg backdrop-blur-sm relative overflow-hidden flex-shrink-0">
              {/* Subtle background decoration */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 bg-indigo-500/10 rounded-full blur-lg animate-float"></div>

              <div className="relative z-10">
                <h3 className="font-bold text-blue-300 mb-3 text-base flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  معلومات الحساب
                </h3>

                <div className="grid gap-2">
                  <div className="flex justify-between items-center p-2 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 rounded-lg backdrop-blur-sm border border-blue-400/20">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gradient-to-br from-pink-500 to-purple-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs">👤</span>
                      </div>
                      <span className="text-blue-100 font-medium text-sm">الجنس</span>
                    </div>
                    <span className="text-blue-200 font-bold text-sm">
                      {userData?.gender === 'female' ? '👩 أنثى' : '👨 ذكر'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 rounded-lg backdrop-blur-sm border border-blue-400/20">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded flex items-center justify-center">
                        <Calendar className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-blue-100 font-medium text-sm">الانضمام</span>
                    </div>
                    <span className="text-blue-200 font-bold text-sm">
                      {new Date(userData?.joinedAt).toLocaleDateString('ar-EG')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 rounded-lg backdrop-blur-sm border border-blue-400/20">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-500 rounded flex items-center justify-center">
                        <Clock className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-blue-100 font-medium text-sm">آخر نشاط</span>
                    </div>
                    <span className="text-blue-200 font-bold text-sm">
                      {new Date(userData?.lastActive).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Experience and Level Stats */}
            <div className="grid grid-cols-2 gap-3 flex-shrink-0">
              <div className="bg-gradient-to-br from-slate-800/80 to-blue-800/80 rounded-xl p-3 shadow-lg border border-blue-400/30 backdrop-blur-sm">
                <div className="text-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-md">
                    <Trophy className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-lg font-bold text-blue-200">{userData?.experience || 0}</div>
                  <div className="text-xs text-blue-300 font-medium">خبرة</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800/80 to-indigo-800/80 rounded-xl p-3 shadow-lg border border-indigo-400/30 backdrop-blur-sm">
                <div className="text-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-md">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-lg font-bold text-indigo-200">Lv.{userData?.level || 1}</div>
                  <div className="text-xs text-indigo-300 font-medium">مستوى</div>
                </div>
              </div>
            </div>

            {/* Visitor notice - only for non-owners */}
            {!isOwner && (
              <div className="bg-gradient-to-br from-blue-800/60 to-indigo-800/60 rounded-xl p-3 border border-blue-400/30 shadow-md backdrop-blur-sm flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-sm">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-300 text-sm">ملف عام</h4>
                    <p className="text-xs text-blue-200">معلومات أساسية فقط</p>
                  </div>
                </div>
              </div>
            )}


          </div>
        )}

        {/* Friends Section */}
        {isOwner && activeSection === 'friends' && (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4 drop-shadow-lg">👥</div>
              <h3 className="text-xl font-bold text-white mb-2">إدارة الأصدقاء</h3>
              <p className="text-gray-300 text-sm">أضف وتفاعل مع أصدقائك في المنصة</p>
            </div>
            
            {/* Add Friend Section */}
            <div className="bg-gradient-to-br from-blue-800/60 to-indigo-800/60 p-6 rounded-2xl border border-blue-400/30 shadow-xl backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <UserPlus className="w-6 h-6 text-blue-300" />
                <h4 className="font-bold text-blue-200 text-lg">إضافة صديق جديد</h4>
              </div>
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  placeholder="رقم اللاعب (6 أرقام)"
                  value={friendSearchId}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // أرقام فقط
                    setFriendSearchId(value);
                    setSearchError('');
                  }}
                  className="flex-1 px-4 py-3 bg-blue-900/30 border border-blue-400/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={6}
                  onKeyPress={(e) => e.key === 'Enter' && searchForFriend()}
                />
                <button
                  onClick={searchForFriend}
                  disabled={isSearching || friendSearchId.length !== 6}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-bold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? '⏳' : '🔍'} {isSearching ? 'جاري البحث...' : 'بحث'}
                </button>
              </div>

              {/* رسالة خطأ البحث */}
              {searchError && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3 mb-4">
                  <p className="text-red-200 text-sm text-center">{searchError}</p>
                </div>
              )}

              {/* نتيجة البحث */}
              {searchResult && (
                <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                        {searchResult.profileImage ? (
                          <img src={searchResult.profileImage} alt="صورة" className="w-full h-full object-cover" />
                        ) : (
                          searchResult.username?.charAt(0)?.toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="text-green-200 font-bold">{searchResult.username}</p>
                        <p className="text-green-300 text-xs">رقم اللاعب: {searchResult.playerId}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => sendFriendRequest(searchResult.id)}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:from-green-600 hover:to-emerald-700 transition-all"
                    >
                      ➕ إضافة صديق
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Friends List */}
            <div className="bg-gradient-to-br from-slate-800/60 to-blue-800/60 p-6 rounded-2xl border border-slate-400/30 shadow-xl backdrop-blur-sm">
              <h4 className="font-bold text-slate-200 mb-4 text-lg flex items-center gap-3">
                <span className="text-2xl">👫</span>
                قائمة الأصدقاء ({friends.length})
              </h4>
              {friends.length === 0 ? (
                <div className="text-center py-6 text-slate-300 text-sm bg-slate-900/30 rounded-xl">
                  <div className="text-3xl mb-2">😔</div>
                  لا توجد أصدقاء حالياً
                </div>
              ) : (
                <div className="space-y-3">
                  {friends.map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                          {friend.profileImage ? (
                            <img src={friend.profileImage} alt="صورة" className="w-full h-full object-cover" />
                          ) : (
                            friend.username?.charAt(0)?.toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-slate-200 font-medium">{friend.username}</p>
                          <p className="text-slate-400 text-xs">رقم اللاعب: {friend.playerId}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openChat(friend)}
                          className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:from-blue-600 hover:to-cyan-700 transition-all"
                        >
                          💬 محادثة
                        </button>
                        <button
                          onClick={() => setSelectedFriend(friend)}
                          className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:from-purple-600 hover:to-pink-700 transition-all"
                        >
                          🎁 هدية
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Friend Requests */}
            <div className="bg-gradient-to-br from-emerald-800/60 to-green-800/60 p-6 rounded-2xl border border-emerald-400/30 shadow-xl backdrop-blur-sm">
              <h4 className="font-bold text-emerald-200 mb-4 text-lg flex items-center gap-3">
                <span className="text-2xl">📩</span>
                طلبات الصداقة ({friendRequests.length})
              </h4>
              {friendRequests.length === 0 ? (
                <div className="text-center py-6 text-emerald-300 text-sm bg-emerald-900/30 rounded-xl">
                  <div className="text-3xl mb-2">📭</div>
                  لا توجد طلبات صداقة جديدة
                </div>
              ) : (
                <div className="space-y-3">
                  {friendRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-emerald-900/40 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                          {request.requester.profileImage ? (
                            <img src={request.requester.profileImage} alt="صورة" className="w-full h-full object-cover" />
                          ) : (
                            request.requester.username?.charAt(0)?.toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-emerald-200 font-medium">{request.requester.username}</p>
                          <p className="text-emerald-400 text-xs">رقم اللاعب: {request.requester.playerId}</p>
                          <p className="text-emerald-500 text-xs">
                            {new Date(request.requestedAt).toLocaleDateString('ar')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => acceptFriendRequest(request.id)}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:from-green-600 hover:to-emerald-700 transition-all"
                        >
                          ✅ قبول
                        </button>
                        <button className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:from-red-600 hover:to-red-700 transition-all">
                          ❌ رفض
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gifts Section */}
        {isOwner && activeSection === 'gifts' && (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4 drop-shadow-lg">🎁</div>
              <h3 className="text-xl font-bold text-white mb-2">نظام إدارة الهدايا</h3>
              <p className="text-gray-300 text-sm">أرسل واستقبل الهدايا المتنوعة مع الأصدقاء</p>
            </div>
            
            {/* Send Gift Section */}
            <div className="bg-gradient-to-br from-blue-800/60 to-indigo-800/60 p-6 rounded-2xl border border-blue-400/30 shadow-xl backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-5">
                <Send className="w-6 h-6 text-blue-300" />
                <h4 className="font-bold text-blue-200 text-lg">إرسال هدية جديدة</h4>
              </div>
              
              {/* Currency Gifts */}
              <div className="mb-5">
                <h5 className="text-base font-bold text-yellow-300 mb-3 flex items-center gap-2">
                  <span className="text-xl">💰</span>
                  العملات الذهبية
                </h5>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => setSelectedItem('gold')}
                    className={`p-4 border rounded-xl hover:bg-yellow-700/50 transition-all duration-300 flex items-center gap-4 shadow-lg ${
                      selectedItem === 'gold'
                        ? 'bg-yellow-700/60 border-yellow-300'
                        : 'bg-yellow-800/40 border-yellow-400/30'
                    }`}
                  >
                    <div className="text-3xl drop-shadow-lg">🪙</div>
                    <div className="text-right flex-1">
                      <div className="text-sm font-bold text-yellow-200">عملات ذهبية</div>
                      <div className="text-xs text-yellow-300">للشراء والاستخدام في المنصة</div>
                    </div>
                    {selectedItem === 'gold' && (
                      <div className="text-yellow-300">✓</div>
                    )}
                  </button>
                </div>
              </div>

              {/* Harmful Items */}
              <div className="mb-5">
                <h5 className="text-base font-bold text-red-300 mb-3 flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  العناصر الضارة
                </h5>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setSelectedItem('bomb')}
                    className={`p-4 border rounded-xl hover:bg-red-700/50 transition-all duration-300 text-center shadow-lg ${
                      selectedItem === 'bomb'
                        ? 'bg-red-700/60 border-red-300'
                        : 'bg-red-800/40 border-red-400/30'
                    }`}
                  >
                    <div className="text-3xl mb-2 drop-shadow-lg">💣</div>
                    <div className="text-xs font-bold text-red-200">قنبلة مدمرة</div>
                    {selectedItem === 'bomb' && (
                      <div className="text-red-300 mt-1">✓</div>
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedItem('bat')}
                    className={`p-4 border rounded-xl hover:bg-red-700/50 transition-all duration-300 text-center shadow-lg ${
                      selectedItem === 'bat'
                        ? 'bg-red-700/60 border-red-300'
                        : 'bg-red-800/40 border-red-400/30'
                    }`}
                  >
                    <div className="text-3xl mb-2 drop-shadow-lg">🦇</div>
                    <div className="text-xs font-bold text-red-200">خفاش مؤذي</div>
                    {selectedItem === 'bat' && (
                      <div className="text-red-300 mt-1">✓</div>
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedItem('snake')}
                    className={`p-4 border rounded-xl hover:bg-red-700/50 transition-all duration-300 text-center shadow-lg ${
                      selectedItem === 'snake'
                        ? 'bg-red-700/60 border-red-300'
                        : 'bg-red-800/40 border-red-400/30'
                    }`}
                  >
                    <div className="text-3xl mb-2 drop-shadow-lg">🐍</div>
                    <div className="text-xs font-bold text-red-200">ثعبان سام</div>
                    {selectedItem === 'snake' && (
                      <div className="text-red-300 mt-1">✓</div>
                    )}
                  </button>
                </div>
              </div>

              {/* Beneficial Items */}
              <div className="mb-5">
                <h5 className="text-base font-bold text-emerald-300 mb-3 flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  العناصر المفيدة
                </h5>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setSelectedItem('gem')}
                    className={`p-4 border rounded-xl hover:bg-emerald-700/50 transition-all duration-300 text-center shadow-lg ${
                      selectedItem === 'gem'
                        ? 'bg-emerald-700/60 border-emerald-300'
                        : 'bg-emerald-800/40 border-emerald-400/30'
                    }`}
                  >
                    <div className="text-3xl mb-2 drop-shadow-lg">💎</div>
                    <div className="text-xs font-bold text-emerald-200">جوهرة نادرة</div>
                    {selectedItem === 'gem' && (
                      <div className="text-emerald-300 mt-1">✓</div>
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedItem('star')}
                    className={`p-4 border rounded-xl hover:bg-emerald-700/50 transition-all duration-300 text-center shadow-lg ${
                      selectedItem === 'star'
                        ? 'bg-emerald-700/60 border-emerald-300'
                        : 'bg-emerald-800/40 border-emerald-400/30'
                    }`}
                  >
                    <div className="text-3xl mb-2 drop-shadow-lg">⭐</div>
                    <div className="text-xs font-bold text-emerald-200">نجمة ذهبية</div>
                    {selectedItem === 'star' && (
                      <div className="text-emerald-300 mt-1">✓</div>
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedItem('coin')}
                    className={`p-4 border rounded-xl hover:bg-emerald-700/50 transition-all duration-300 text-center shadow-lg ${
                      selectedItem === 'coin'
                        ? 'bg-emerald-700/60 border-emerald-300'
                        : 'bg-emerald-800/40 border-emerald-400/30'
                    }`}
                  >
                    <div className="text-3xl mb-2 drop-shadow-lg">🪙</div>
                    <div className="text-xs font-bold text-emerald-200">عملة خاصة</div>
                    {selectedItem === 'coin' && (
                      <div className="text-emerald-300 mt-1">✓</div>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {selectedItem && (
                  <div className="bg-blue-900/30 p-3 rounded-xl border border-blue-400/30">
                    <p className="text-blue-200 text-sm text-center">
                      العنصر المختار: <span className="font-bold text-blue-100">{getItemName(selectedItem)}</span>
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="رقم اللاعب (6 أرقام)"
                    value={recipientPlayerId}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // أرقام فقط
                      setRecipientPlayerId(value);
                    }}
                    maxLength={6}
                    className="flex-1 px-4 py-3 bg-blue-900/30 border border-blue-400/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendItem}
                    disabled={isSendingItem || !selectedItem || recipientPlayerId.length !== 6}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-bold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingItem ? '⏳ جاري الإرسال...' : '🎁 إرسال'}
                  </button>
                </div>
              </div>
            </div>

            {/* Received Gifts */}
            <div className="bg-gradient-to-br from-slate-800/60 to-blue-800/60 p-6 rounded-2xl border border-slate-400/30 shadow-xl backdrop-blur-sm">
              <h4 className="font-bold text-slate-200 mb-4 text-lg flex items-center gap-3">
                <span className="text-2xl">📦</span>
                الهدايا المستلمة
              </h4>
              <div className="text-center py-6 text-slate-300 text-sm bg-slate-900/30 rounded-xl">
                <div className="text-3xl mb-2">🎈</div>
                لا توجد هدايا جديدة في الوقت الحالي
              </div>
            </div>
          </div>
        )}

        {/* Items Section */}
        {isOwner && activeSection === 'items' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">العناصر المجمعة</h3>
              <p className="text-sm text-gray-500">العناصر التي حصلت عليها من الألعاب</p>
            </div>
            
            {/* Beneficial Items from Games */}
            <div className="bg-gradient-to-br from-emerald-800/80 to-green-800/80 p-6 rounded-2xl border border-emerald-400/30 shadow-xl backdrop-blur-sm">
              <h4 className="font-bold text-emerald-300 mb-4 text-lg flex items-center gap-3">
                <span className="text-2xl">⭐</span>
                العناصر المفيدة
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-emerald-800/40 rounded-xl border border-emerald-400/30 backdrop-blur-sm hover:bg-emerald-700/50 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  <div className="text-4xl mb-3 drop-shadow-lg">💎</div>
                  <div className="text-sm font-bold text-emerald-200 mb-1">جوهرة نادرة</div>
                  <div className="text-xs text-emerald-300 bg-emerald-900/30 px-2 py-1 rounded-lg mb-2">مكافأة 500 🪙</div>
                  <div className="text-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl py-2 shadow-md">{itemCounts.gems}</div>
                </div>
                <div className="text-center p-4 bg-emerald-800/40 rounded-xl border border-emerald-400/30 backdrop-blur-sm hover:bg-emerald-700/50 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  <div className="text-4xl mb-3 drop-shadow-lg">⭐</div>
                  <div className="text-sm font-bold text-emerald-200 mb-1">نجمة ذهبية</div>
                  <div className="text-xs text-emerald-300 bg-emerald-900/30 px-2 py-1 rounded-lg mb-2">مكافأة 200 🪙</div>
                  <div className="text-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl py-2 shadow-md">{itemCounts.stars}</div>
                </div>
                <div className="text-center p-4 bg-emerald-800/40 rounded-xl border border-emerald-400/30 backdrop-blur-sm hover:bg-emerald-700/50 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  <div className="text-4xl mb-3 drop-shadow-lg">🪙</div>
                  <div className="text-sm font-bold text-emerald-200 mb-1">عملة خاصة</div>
                  <div className="text-xs text-emerald-300 bg-emerald-900/30 px-2 py-1 rounded-lg mb-2">مكافأة 100 🪙</div>
                  <div className="text-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl py-2 shadow-md">{itemCounts.coins}</div>
                </div>
              </div>
            </div>

            {/* Harmful Items from Games */}
            <div className="bg-gradient-to-br from-red-800/80 to-rose-800/80 p-6 rounded-2xl border border-red-400/30 shadow-xl backdrop-blur-sm">
              <h4 className="font-bold text-red-300 mb-4 text-lg flex items-center gap-3">
                <span className="text-2xl">💣</span>
                العناصر الضارة
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-red-800/40 rounded-xl border border-red-400/30 backdrop-blur-sm hover:bg-red-700/50 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  <div className="text-4xl mb-3 drop-shadow-lg">💣</div>
                  <div className="text-sm font-bold text-red-200 mb-1">قنبلة مدمرة</div>
                  <div className="text-xs text-red-300 bg-red-900/30 px-2 py-1 rounded-lg mb-2">خسارة 100 🪙</div>
                  <div className="text-xl font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-xl py-2 shadow-md">{itemCounts.bombs}</div>
                </div>
                <div className="text-center p-4 bg-red-800/40 rounded-xl border border-red-400/30 backdrop-blur-sm hover:bg-red-700/50 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  <div className="text-4xl mb-3 drop-shadow-lg">🦇</div>
                  <div className="text-sm font-bold text-red-200 mb-1">خفاش مؤذي</div>
                  <div className="text-xs text-red-300 bg-red-900/30 px-2 py-1 rounded-lg mb-2">خسارة 50 🪙</div>
                  <div className="text-xl font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-xl py-2 shadow-md">{itemCounts.bats}</div>
                </div>
                <div className="text-center p-4 bg-red-800/40 rounded-xl border border-red-400/30 backdrop-blur-sm hover:bg-red-700/50 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  <div className="text-4xl mb-3 drop-shadow-lg">🐍</div>
                  <div className="text-sm font-bold text-red-200 mb-1">ثعبان سام</div>
                  <div className="text-xs text-red-300 bg-red-900/30 px-2 py-1 rounded-lg mb-2">خسارة 75 🪙</div>
                  <div className="text-xl font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-xl py-2 shadow-md">{itemCounts.snakes}</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-800/60 to-yellow-800/60 p-6 rounded-2xl border border-amber-400/30 shadow-xl backdrop-blur-sm">
              <h4 className="font-bold text-amber-200 mb-3 text-lg flex items-center gap-3">
                <span className="text-2xl">💡</span>
                نصائح مهمة
              </h4>
              <p className="text-amber-100 text-sm leading-relaxed">
                اجمع العناصر المفيدة من الألعاب • أرسلها كهدايا للأصدقاء • بادلها بعملات ذهبية قيمة
              </p>
            </div>

            {/* Shield Protection Section */}
            <div className="bg-gradient-to-br from-blue-800/80 to-indigo-800/80 p-6 rounded-2xl border border-blue-400/30 shadow-xl backdrop-blur-sm">
              <h4 className="font-bold text-blue-200 mb-4 text-lg flex items-center gap-3">
                <span className="text-3xl drop-shadow-lg">🛡️</span>
                نظام الحماية المتطور
              </h4>
              <p className="text-blue-100 text-sm mb-6 leading-relaxed">احمِ نفسك من العناصر الضارة والهجمات الخطيرة في الألعاب والهدايا</p>
              
              <div className="grid grid-cols-1 gap-5">
                <div className="bg-blue-800/40 p-5 rounded-xl border border-blue-400/30 backdrop-blur-sm shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-bold text-blue-200 text-base">🥇 درع ذهبي أساسي</h5>
                    <span className="text-xs text-blue-100 bg-blue-600/40 px-3 py-1 rounded-full font-medium">24 ساعة</span>
                  </div>
                  <p className="text-sm text-blue-100 mb-4 leading-relaxed">حماية قوية ضد القنابل المدمرة والخفافيش المؤذية والثعابين السامة</p>
                  {userShield?.isActive ? (
                    <div className="bg-green-600/40 p-3 rounded-xl border border-green-400/30 text-center">
                      <div className="text-green-200 text-sm font-bold">🛡️ الدرع نشط</div>
                      <div className="text-green-100 text-xs mt-1">
                        ينتهي في: {userShield.expiresAt ? new Date(userShield.expiresAt).toLocaleString('ar') : 'غير محدد'}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => activateShield('gold', 5000)}
                      disabled={isActivatingShield}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isActivatingShield ? '⏳ جاري التفعيل...' : '🛡️ تفعيل الحماية (5,000 🪙)'}
                    </button>
                  )}
                </div>
                
                <div className="bg-purple-800/40 p-5 rounded-xl border border-purple-400/30 backdrop-blur-sm shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-bold text-purple-200 text-base">👑 درع متقدم مميز</h5>
                    <span className="text-xs text-purple-100 bg-purple-600/40 px-3 py-1 rounded-full font-medium">7 أيام</span>
                  </div>
                  <p className="text-sm text-purple-100 mb-4 leading-relaxed">حماية مميزة وشاملة لمدة أسبوع كامل ضد جميع العناصر الضارة والهجمات</p>
                  <button
                    onClick={() => alert('الدرع المميز غير متاح حالياً. استخدم الدرع الأساسي.')}
                    className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-xl text-sm font-bold cursor-not-allowed opacity-60"
                    disabled
                  >
                    👑 قريباً - الحماية المميزة
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Charge Section */}
        {isOwner && activeSection === 'charge' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4 drop-shadow-lg">💰</div>
              <h3 className="text-xl font-bold text-white mb-2">شحن الرصيد الذهبي</h3>
              <p className="text-gray-300 text-sm">اشحن عملاتك الذهبية بأفضل الأسعار</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gradient-to-br from-yellow-800/60 to-amber-800/60 p-6 rounded-2xl border border-yellow-400/30 shadow-xl backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-4xl mb-3 drop-shadow-lg">🪙</div>
                  <h4 className="font-bold text-yellow-200 mb-2 text-lg">5,000 عملة ذهبية</h4>
                  <p className="text-yellow-100 text-base mb-4 font-semibold">💵 $1 USD فقط</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => chargeBalance(5000, true, '1_dollar')}
                      disabled={isCharging || !availableFreeCharges['1_dollar']}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl text-xs font-bold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCharging ? '⏳' : availableFreeCharges['1_dollar'] ? '🆓 مجاني' : '✅ مستخدم'}
                    </button>
                    <button
                      onClick={() => requestCharge(5000, '$1 USD')}
                      className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 text-white py-3 rounded-xl text-xs font-bold hover:from-yellow-600 hover:to-amber-700 transition-all duration-300 shadow-md"
                    >
                      📱 شحن مدفوع
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-800/60 to-emerald-800/60 p-6 rounded-2xl border border-green-400/30 shadow-xl backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-4xl mb-3 drop-shadow-lg">🪙</div>
                  <h4 className="font-bold text-green-200 mb-2 text-lg">27,200 عملة ذهبية</h4>
                  <p className="text-green-100 text-base mb-1 font-semibold">💵 $5 USD</p>
                  <p className="text-sm text-green-300 bg-green-900/30 px-3 py-1 rounded-lg mb-4 font-medium">🎉 وفر 8% أكثر!</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => chargeBalance(27200, true, '5_dollar')}
                      disabled={isCharging || !availableFreeCharges['5_dollar']}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 rounded-xl text-xs font-bold hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCharging ? '⏳' : availableFreeCharges['5_dollar'] ? '🆓 مجاني' : '✅ مستخدم'}
                    </button>
                    <button
                      onClick={() => requestCharge(27200, '$5 USD')}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl text-xs font-bold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-md"
                    >
                      📱 شحن مدفوع
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exchange Section */}
        {isOwner && activeSection === 'exchange' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4 drop-shadow-lg">🔄</div>
              <h3 className="text-xl font-bold text-white mb-2">نظام تبديل العملات</h3>
              <p className="text-gray-300 text-sm">اللآلئ مخصصة حصرياً للتحويل إلى دولارات نقدية</p>
            </div>
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-blue-800/60 to-indigo-800/60 p-6 rounded-2xl border border-blue-400/30 shadow-xl backdrop-blur-sm">
                <h4 className="font-bold text-blue-200 mb-4 text-lg flex items-center gap-3">
                  <span className="text-2xl">🪙➡️🦪</span>
                  تحويل ذهب إلى لآلئ
                </h4>
                <p className="text-blue-100 text-sm mb-4 bg-blue-900/30 px-3 py-2 rounded-lg">معدل التحويل: 10,000 🪙 = 1 🦪</p>
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="number"
                    placeholder="10000"
                    value={exchangeAmount}
                    onChange={(e) => setExchangeAmount(Math.max(10000, parseInt(e.target.value) || 10000))}
                    min="10000"
                    step="10000"
                    max={userData?.goldCoins || 0}
                    className="flex-1 px-4 py-3 bg-blue-900/30 border border-blue-400/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-blue-200 font-medium">🪙 ➡️ 🦪</span>
                </div>
                <div className="text-center mb-4">
                  <p className="text-blue-200 text-sm">
                    ستحصل على: <span className="font-bold text-blue-100">{Math.floor(exchangeAmount / 10000)} 🦪</span>
                  </p>
                  <p className="text-blue-300 text-xs">
                    رصيدك الحالي: {userData?.goldCoins || 0} 🪙
                  </p>
                </div>
                <button
                  onClick={exchangeGoldToPearls}
                  disabled={isExchanging || exchangeAmount < 10000 || (userData?.goldCoins || 0) < exchangeAmount}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl text-sm font-bold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExchanging ? '⏳ جاري التحويل...' : '🔄 تحويل إلى لآلئ'}
                </button>
              </div>
              
              <div className="bg-gradient-to-br from-green-800/60 to-emerald-800/60 p-6 rounded-2xl border border-green-400/30 shadow-xl backdrop-blur-sm">
                <h4 className="font-bold text-green-200 mb-4 text-lg flex items-center gap-3">
                  <span className="text-2xl">🦪➡️💵</span>
                  سحب دولارات نقدية
                </h4>
                <div className="bg-green-900/30 p-4 rounded-xl mb-4">
                  <p className="text-green-100 text-sm leading-relaxed">
                    <strong className="text-green-200">💰 معدل التحويل:</strong> 10 🦪 = $1 USD<br/>
                    <strong className="text-green-200">🎯 الحد الأدنى للسحب:</strong> $25 USD (250 🦪)
                  </p>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="number"
                    placeholder="250"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Math.max(250, parseInt(e.target.value) || 250))}
                    min="250"
                    max={userData?.pearls || 0}
                    className="flex-1 px-4 py-3 bg-green-900/30 border border-green-400/30 rounded-xl text-white placeholder-green-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-green-200 font-medium">🦪 ➡️ $</span>
                </div>
                <div className="text-center mb-4">
                  <p className="text-green-200 text-sm">
                    ستحصل على: <span className="font-bold text-green-100">${withdrawAmount / 10} USD</span>
                  </p>
                  <p className="text-green-300 text-xs">
                    رصيدك الحالي: {userData?.pearls || 0} 🦪
                  </p>
                </div>
                <button
                  onClick={requestWithdrawal}
                  disabled={withdrawAmount < 250 || (userData?.pearls || 0) < withdrawAmount}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl text-sm font-bold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📱 طلب سحب عبر واتساب
                </button>
              </div>

              <div className="bg-gradient-to-br from-amber-800/60 to-yellow-800/60 p-6 rounded-2xl border border-amber-400/30 shadow-xl backdrop-blur-sm">
                <h4 className="font-bold text-amber-200 mb-4 text-lg flex items-center gap-3">
                  <span className="text-2xl">📝</span>
                  معلومات مهمة
                </h4>
                <div className="space-y-2 text-amber-100 text-sm leading-relaxed">
                  <p>• <strong>اللآلئ 🦪</strong> - مخصصة حصرياً للتحويل إلى دولارات نقدية</p>
                  <p>• <strong>العملات الذهبية 🪙</strong> - للشراء والتبادل داخل المنصة</p>
                  <p>• <strong>العناصر الخاصة</strong> - تُكسب من الألعاب والتحديات</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* مربع حوار إرسال الرسالة */}
      {showMessageDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-blue-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-blue-400/30">
            <h3 className="text-xl font-bold text-white mb-4 text-center">إرسال رسالة إلى {userData?.username}</h3>
            
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="w-full p-3 rounded-xl bg-slate-800/40 border border-blue-400/30 text-white placeholder-blue-300 resize-none h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={500}
            />
            
            <div className="text-right text-xs text-blue-300 mt-1 mb-4">
              {messageText.length}/500
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowMessageDialog(false);
                  setMessageText('');
                }}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-500 disabled:to-gray-600 text-white py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                إرسال
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gift Dialog */}
      {selectedFriend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl p-6 w-full max-w-md border border-purple-400/30 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🎁</div>
              <h3 className="text-xl font-bold text-white mb-2">إرسال هدية</h3>
              <p className="text-purple-200 text-sm">إلى: {selectedFriend.username}</p>
            </div>

            <div className="space-y-4">
              {/* نوع الهدية */}
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">نوع الهدية:</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setGiftType('gold')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                      giftType === 'gold'
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white'
                        : 'bg-purple-800/50 text-purple-200 hover:bg-purple-700/50'
                    }`}
                  >
                    🪙 عملات ذهبية
                  </button>
                  <button
                    onClick={() => setGiftType('pearls')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                      giftType === 'pearls'
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'
                        : 'bg-purple-800/50 text-purple-200 hover:bg-purple-700/50'
                    }`}
                  >
                    💎 لآلئ
                  </button>
                </div>
              </div>

              {/* الكمية */}
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">الكمية:</label>
                <input
                  type="number"
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max={giftType === 'gold' ? userData?.goldCoins : userData?.pearls}
                  className="w-full px-4 py-2 bg-purple-800/50 border border-purple-400/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-purple-300 text-xs mt-1">
                  الحد الأقصى: {giftType === 'gold' ? userData?.goldCoins : userData?.pearls}
                </p>
              </div>

              {/* رسالة */}
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">رسالة (اختيارية):</label>
                <textarea
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="اكتب رسالة مع الهدية..."
                  className="w-full px-4 py-2 bg-purple-800/50 border border-purple-400/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  rows={3}
                  maxLength={200}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setSelectedFriend(null);
                  setGiftMessage('');
                  setGiftAmount(100);
                }}
                className="flex-1 bg-gray-600 text-white py-3 rounded-xl font-bold hover:bg-gray-700 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={sendGift}
                disabled={isSendingGift || giftAmount <= 0}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-xl font-bold hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingGift ? '⏳ جاري الإرسال...' : '🎁 إرسال الهدية'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Dialog */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-hidden border border-purple-400/30 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                🔔 الإشعارات
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
                  >
                    تحديد الكل كمقروء
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">📭</div>
                  <p>لا توجد إشعارات</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => {
                      if (!notification.isRead) {
                        markNotificationAsRead(notification._id);
                      }
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer hover:bg-opacity-80 ${
                      notification.isRead
                        ? 'bg-slate-800/50 border-slate-600/30'
                        : 'bg-blue-900/30 border-blue-400/30 shadow-lg'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="text-2xl">
                          {notification.type === 'gift_received' && '🎁'}
                          {notification.type === 'item_received' && '📦'}
                          {notification.type === 'friend_request' && '👥'}
                          {notification.type === 'message' && '💬'}
                        </div>
                        {/* نقطة حمراء للإشعارات غير المقروءة */}
                        {!notification.isRead && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold text-sm ${notification.isRead ? 'text-gray-300' : 'text-white'}`}>
                          {notification.title}
                        </h4>
                        <p className={`text-xs mt-1 ${notification.isRead ? 'text-gray-400' : 'text-gray-200'}`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-gray-400 text-xs">
                            {new Date(notification.createdAt).toLocaleString('ar')}
                          </span>
                          {!notification.isRead && (
                            <span className="text-blue-400 text-xs font-bold">جديد</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Dialog - تصميم SMS حديث */}
      {showChat && chatUser && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col"
          onClick={(e) => {
            // إغلاق قائمة الإيموجي عند النقر خارجها
            if (e.target === e.currentTarget) {
              setShowEmojiPicker(false);
            }
          }}
        >
          {/* Chat Header - مثل WhatsApp */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-3 flex items-center gap-3 shadow-lg">
            <button
              onClick={() => setShowChat(false)}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 border-2 border-white/30">
              {chatUser.profileImage ? (
                <img src={chatUser.profileImage} alt="صورة" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                  {chatUser.username?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-white text-lg">{chatUser.username}</h3>
              <p className="text-green-100 text-xs opacity-90">رقم اللاعب: {chatUser.playerId}</p>
              <p className="text-green-100 text-xs opacity-75">🕐 المحادثات تختفي بعد 3 أيام</p>
            </div>

            <div className="text-green-100">
              <MessageCircle className="w-6 h-6" />
            </div>
          </div>

          {/* Messages Area - خلفية مثل WhatsApp */}
          <div
            className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
            id="messages-container"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundColor: '#0f172a'
            }}
          >
            {messages.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-10 h-10 text-white/50" />
                </div>
                <p className="text-white/70 text-lg font-medium">ابدأ محادثة جديدة</p>
                <p className="text-white/50 text-sm mt-2">أرسل رسالة لبدء المحادثة</p>
                <div className="mt-4 p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                  <p className="text-yellow-200 text-xs">
                    🕐 تنبيه: المحادثات تُحذف تلقائياً بعد 3 أيام للحفاظ على الخصوصية
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => {
                const isMyMessage = message.sender?._id === userData?.id;
                const showTime = index === 0 ||
                  new Date(message.createdAt).getTime() - new Date(messages[index - 1]?.createdAt).getTime() > 300000; // 5 دقائق

                return (
                  <div key={message._id}>
                    {/* عرض الوقت إذا مر وقت طويل */}
                    {showTime && (
                      <div className="text-center my-4">
                        <span className="bg-black/30 text-white/70 px-3 py-1 rounded-full text-xs">
                          {new Date(message.createdAt).toLocaleDateString('ar', {
                            weekday: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}

                    <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-2`}>
                      <div
                        className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-lg relative ${
                          isMyMessage
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white rounded-br-md'
                            : 'bg-white text-gray-800 rounded-bl-md'
                        }`}
                      >
                        {/* محتوى الرسالة */}
                        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                          {message.content}
                        </p>

                        {/* وقت الرسالة */}
                        <div className={`flex items-center justify-end mt-1 text-xs ${
                          isMyMessage ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          <span>
                            {new Date(message.createdAt).toLocaleTimeString('ar', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {isMyMessage && (
                            <div className="ml-1 text-green-200">
                              ✓✓
                            </div>
                          )}
                        </div>

                        {/* ذيل الفقاعة */}
                        <div className={`absolute bottom-0 w-4 h-4 ${
                          isMyMessage
                            ? '-right-2 bg-gradient-to-r from-green-500 to-green-600'
                            : '-left-2 bg-white'
                        }`}
                        style={{
                          clipPath: isMyMessage
                            ? 'polygon(0 0, 100% 0, 0 100%)'
                            : 'polygon(100% 0, 0 0, 100% 100%)'
                        }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* مؤشر الكتابة */}
            {otherUserTyping && (
              <div className="flex justify-start mb-2">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-lg">
                  <div className="flex items-center gap-1">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs text-gray-500 mr-2">يكتب...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Message Input - مثل WhatsApp */}
          <div className="bg-gray-100 px-4 py-3 flex items-end gap-3 relative">
            {/* قائمة الإيموجي */}
            {showEmojiPicker && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 max-h-48 overflow-y-auto">
                <div className="grid grid-cols-8 gap-2">
                  {[
                    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
                    '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
                    '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
                    '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
                    '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
                    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
                    '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
                    '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
                    '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
                    '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
                    '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑',
                    '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻',
                    '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸',
                    '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '❤️',
                    '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎',
                    '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘',
                    '💝', '💟', '👍', '👎', '👌', '🤌', '🤏', '✌️',
                    '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕',
                    '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏',
                    '🙌', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵'
                  ].map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setNewMessage(prev => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="text-xl hover:bg-gray-100 rounded-lg p-1 transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* زر الإيموجي */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`text-gray-500 hover:text-gray-700 transition-colors p-2 ${showEmojiPicker ? 'bg-gray-200 rounded-full' : ''}`}
            >
              <span className="text-xl">😊</span>
            </button>

            {/* حقل الإدخال */}
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  // تعديل الارتفاع تلقائياً
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                placeholder="اكتب رسالة..."
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-3xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none max-h-[120px] min-h-[48px]"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (newMessage.trim()) {
                      sendMessage();
                    }
                  }
                }}
                rows={1}
                autoFocus
              />
            </div>

            {/* زر الإرسال */}
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                newMessage.trim()
                  ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileProfileCard;