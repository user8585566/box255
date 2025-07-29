import React, { useState, useEffect } from 'react';
import { MessageCircle, Phone, Gamepad2, Box, Infinity, Target, Globe } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthPageProps {
  onAuthSuccess: (userData: any) => void;
}

// نظام الترجمات
const translations = {
  ar: {
    welcome: "مرحباً بك",
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    selectLanguage: "اختر اللغة",
    loginDesc: "أنشطة مربحة تمتزج مع المرح والصداقات",
    registerDesc: "انضم إلينا واستمتع بتجربة فريدة",
    registerSuccess: "تم إنشاء الحساب بنجاح!",
    welcomeMessage: "مرحباً بك في INFINITY BOX - يمكنك الآن تسجيل الدخول"
  },
  en: {
    welcome: "Welcome",
    login: "Login",
    register: "Register",
    selectLanguage: "Select Language",
    loginDesc: "Profitable activities that blend with fun and friendships",
    registerDesc: "Join us and enjoy a unique experience",
    registerSuccess: "Account created successfully!",
    welcomeMessage: "Welcome to INFINITY BOX - you can now login"
  },
  ur: {
    welcome: "خوش آمدید",
    login: "لاگ ان",
    register: "رجسٹر",
    selectLanguage: "زبان منتخب کریں",
    loginDesc: "منافع بخش سرگرمیاں جو تفریح اور دوستی کے ساتھ ملتی ہیں",
    registerDesc: "ہمارے ساتھ شامل ہوں اور منفرد تجربہ کا لطف اٹھائیں",
    registerSuccess: "اکاؤنٹ کامیابی سے بن گیا!",
    welcomeMessage: "INFINITY BOX میں خوش آمدید - اب آپ لاگ ان کر سکتے ہیں"
  },
  es: {
    welcome: "Bienvenido",
    login: "Iniciar Sesión",
    register: "Registrarse",
    selectLanguage: "Seleccionar Idioma",
    loginDesc: "Actividades rentables que se mezclan con diversión y amistades",
    registerDesc: "Únete a nosotros y disfruta de una experiencia única",
    registerSuccess: "¡Cuenta creada exitosamente!",
    welcomeMessage: "Bienvenido a INFINITY BOX - ahora puedes iniciar sesión"
  }
};

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [currentView, setCurrentView] = useState<'login' | 'register'>('login');
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    return localStorage.getItem('selectedLanguage') || 'ar';
  });
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // وظائف إدارة اللغة
  const getLanguageFlag = (lang: string) => {
    const flags: { [key: string]: string } = {
      'ar': '🇸🇦',
      'en': '🇺🇸',
      'ur': '🇵🇰',
      'es': '🇪🇸'
    };
    return flags[lang] || '🌍';
  };

  const getLanguageName = (lang: string) => {
    const names: { [key: string]: string } = {
      'ar': 'العربية',
      'en': 'English',
      'ur': 'اردو',
      'es': 'Español'
    };
    return names[lang] || lang;
  };

  const translate = (key: string) => {
    return (translations as any)[currentLanguage]?.[key] || (translations as any)['ar'][key] || key;
  };

  const changeLanguage = (lang: string) => {
    setCurrentLanguage(lang);
    localStorage.setItem('selectedLanguage', lang);
    document.documentElement.dir = ['ar', 'ur'].includes(lang) ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    setShowLanguageModal(false);
  };

  // تطبيق اتجاه اللغة عند التحميل
  useEffect(() => {
    document.documentElement.dir = ['ar', 'ur'].includes(currentLanguage) ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  // دالة لمسح localStorage في حالة الطوارئ
  const clearLocalStorage = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleLoginSuccess = (userData: any) => {
    if (userData.isAdmin) {
      // Show admin choice modal
      const choice = window.confirm('مرحباً أيها المشرف! هل تريد الذهاب إلى لوحة التحكم؟ (إلغاء للذهاب إلى اللعبة)');
      if (choice) {
        window.location.href = '/admin.html';
        return;
      }
    }
    onAuthSuccess(userData);
  };

  const handleRegisterSuccess = (userData?: any) => {
    if (userData) {
      // تسجيل دخول تلقائي بعد التسجيل الناجح
      handleLoginSuccess(userData);
    } else {
      // عرض رسالة النجاح والانتقال لتسجيل الدخول
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setCurrentView('login');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-800 text-white relative overflow-hidden">
      {/* زر اختيار اللغة */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => setShowLanguageModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all duration-300"
        >
          <Globe className="w-5 h-5" />
          <span className="text-2xl">{getLanguageFlag(currentLanguage)}</span>
          <span className="hidden sm:inline">{getLanguageName(currentLanguage)}</span>
        </button>
      </div>

      {/* نافذة اختيار اللغة */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-center mb-6">{translate('selectLanguage')}</h3>
            <div className="grid grid-cols-2 gap-4">
              {['ar', 'en', 'ur', 'es'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => changeLanguage(lang)}
                  className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 ${
                    currentLanguage === lang
                      ? 'bg-blue-500/30 border-2 border-blue-400'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span className="text-3xl">{getLanguageFlag(lang)}</span>
                  <span className="font-medium">{getLanguageName(lang)}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowLanguageModal(false)}
              className="w-full mt-6 py-3 bg-gray-500/20 hover:bg-gray-500/30 rounded-xl transition-all duration-300"
            >
              إغلاق / Close
            </button>
          </div>
        </div>
      )}

      {/* خلفية متحركة محسّنة */}
      <div className="absolute inset-0 overflow-hidden">
        {/* طبقة الخلفية الأساسية */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-purple-900/30 to-indigo-900/50"></div>

        {/* كرات متحركة متعددة الطبقات */}
        <div className="absolute -inset-10 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-3000"></div>
        </div>

        {/* تأثيرات إضافية */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full filter blur-xl animate-bounce delay-500"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-yellow-300 rounded-full filter blur-lg animate-bounce delay-1500"></div>
          <div className="absolute top-1/3 right-10 w-20 h-20 bg-green-400 rounded-full filter blur-lg animate-bounce delay-2500"></div>
        </div>

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
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header - شعار دائري */}
        <header className="text-center py-12 relative">
          <div className="relative z-10">
            {/* شعار دائري في المنتصف */}
            <div className="inline-flex items-center justify-center mb-8">
              <div className="relative group">
                {/* الكرة ثلاثية الأبعاد - دوران طولي مثل الكرة الأرضية */}
                <div className="w-32 h-32 sphere-3d rounded-full flex items-center justify-center relative group-hover:scale-110 transition-all duration-500 rotate-y">

                  {/* طبقة الألوان المتحركة */}
                  <div className="color-layer"></div>

                  {/* النص داخل الكرة ثلاثية الأبعاد */}
                  <div className="text-center relative z-10">
                    <div className="bg-gradient-to-r from-yellow-200 via-amber-100 to-blue-200 bg-clip-text text-transparent font-black text-lg leading-tight mb-1 drop-shadow-2xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(255,255,255,0.3)' }}>
                      INFINITY
                    </div>
                    <div className="bg-gradient-to-r from-yellow-200 via-amber-100 to-blue-200 bg-clip-text text-transparent font-black text-lg leading-tight drop-shadow-2xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(255,255,255,0.3)' }}>
                      BOX
                    </div>
                  </div>

                  {/* أيقونة اللانهاية */}
                  <Infinity className="w-6 h-6 text-white absolute -top-2 -right-2 animate-spin bg-gradient-to-r from-yellow-600 to-blue-700 rounded-full p-1 z-20" style={{ animationDuration: '12s' }} />
                </div>

                {/* هالة متوهجة كروية - دوران طولي معاكس */}
                <div className="absolute inset-0 sphere-glow rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500 rotate-y-reverse"></div>

                {/* دوائر إضافية للتأثير - حلقات مدارية طولية */}
                <div className="absolute inset-0 rounded-full border-2 border-white/10 rotate-y-fast"></div>
                <div className="absolute -inset-2 rounded-full border border-white/5 rotate-y-slow"></div>
              </div>
            </div>
          </div>

          {/* تأثير خلفي متحرك */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5">
            <div className="text-8xl font-black text-white animate-spin" style={{ animationDuration: '25s' }}>∞</div>
          </div>
        </header>

        {/* المحتوى الرئيسي - تسجيل الدخول فقط */}
        <div className="flex-1 flex items-start justify-center px-4 pt-8 pb-8">
          <div className="w-full max-w-md mx-auto">

            {/* حاوية تسجيل الدخول فقط */}
            <div className="flex items-center justify-center">
              <div className="w-full">
                {showSuccess ? (
                  <div className="w-full max-w-md mx-auto">
                    <div className="bg-green-500/20 border border-green-500/50 rounded-3xl p-8 text-center">
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{translate('registerSuccess')}</h3>
                      <p className="text-green-300">{translate('welcomeMessage')}</p>
                    </div>
                  </div>
                ) : currentView === 'login' ? (
                  <LoginForm
                    onLoginSuccess={handleLoginSuccess}
                    onSwitchToRegister={() => setCurrentView('register')}
                  />
                ) : (
                  <RegisterForm
                    onRegisterSuccess={handleRegisterSuccess}
                    onSwitchToLogin={() => setCurrentView('login')}
                  />
                )}
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default AuthPage;