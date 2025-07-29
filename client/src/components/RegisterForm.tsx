import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Loader2, UserPlus, Box, Infinity } from 'lucide-react';
import { apiService } from '../services/api';

interface RegisterFormProps {
  onRegisterSuccess: (userData?: any) => void;
  onSwitchToLogin: () => void;
}

// نظام الترجمات
const translations = {
  ar: {
    register: "إنشاء حساب",
    username: "اسم المستخدم",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    registerButton: "إنشاء حساب",
    switchToLogin: "لديك حساب؟ تسجيل الدخول",
    registerDesc: "انضم إلينا واستمتع بتجربة فريدة",
    usernameRequired: "اسم المستخدم مطلوب",
    usernameMinLength: "اسم المستخدم يجب أن يكون 3 أحرف على الأقل",
    emailRequired: "البريد الإلكتروني مطلوب",
    emailInvalid: "البريد الإلكتروني غير صالح",
    passwordRequired: "كلمة المرور مطلوبة",
    passwordMinLength: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
    passwordMismatch: "كلمات المرور غير متطابقة",
    registering: "جاري إنشاء الحساب...",
    registerFailed: "فشل في إنشاء الحساب"
  },
  en: {
    register: "Register",
    username: "Username",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    registerButton: "Create Account",
    switchToLogin: "Have an account? Login",
    registerDesc: "Join us and enjoy a unique experience",
    usernameRequired: "Username is required",
    usernameMinLength: "Username must be at least 3 characters",
    emailRequired: "Email is required",
    emailInvalid: "Invalid email address",
    passwordRequired: "Password is required",
    passwordMinLength: "Password must be at least 6 characters",
    passwordMismatch: "Passwords do not match",
    registering: "Creating account...",
    registerFailed: "Failed to create account"
  },
  ur: {
    register: "رجسٹر",
    username: "صارف نام",
    email: "ای میل",
    password: "پاس ورڈ",
    confirmPassword: "پاس ورڈ کی تصدیق",
    registerButton: "اکاؤنٹ بنائیں",
    switchToLogin: "اکاؤنٹ ہے؟ لاگ ان کریں",
    registerDesc: "ہمارے ساتھ شامل ہوں اور منفرد تجربہ کا لطف اٹھائیں",
    usernameRequired: "صارف نام ضروری ہے",
    usernameMinLength: "صارف نام کم از کم 3 حروف کا ہونا چاہیے",
    emailRequired: "ای میل ضروری ہے",
    emailInvalid: "غلط ای میل ایڈریس",
    passwordRequired: "پاس ورڈ ضروری ہے",
    passwordMinLength: "پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے",
    passwordMismatch: "پاس ورڈ میل نہیں کھاتے",
    registering: "اکاؤنٹ بنایا جا رہا ہے...",
    registerFailed: "اکاؤنٹ بنانے میں ناکامی"
  },
  es: {
    register: "Registrarse",
    username: "Nombre de Usuario",
    email: "Correo Electrónico",
    password: "Contraseña",
    confirmPassword: "Confirmar Contraseña",
    registerButton: "Crear Cuenta",
    switchToLogin: "¿Tienes cuenta? Inicia sesión",
    registerDesc: "Únete a nosotros y disfruta de una experiencia única",
    usernameRequired: "El nombre de usuario es requerido",
    usernameMinLength: "El nombre de usuario debe tener al menos 3 caracteres",
    emailRequired: "El correo electrónico es requerido",
    emailInvalid: "Dirección de correo electrónico inválida",
    passwordRequired: "La contraseña es requerida",
    passwordMinLength: "La contraseña debe tener al menos 6 caracteres",
    passwordMismatch: "Las contraseñas no coinciden",
    registering: "Creando cuenta...",
    registerFailed: "Error al crear la cuenta"
  }
};

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // الحصول على اللغة الحالية
  const currentLanguage = localStorage.getItem('selectedLanguage') || 'ar';

  // وظيفة الترجمة
  const translate = (key: string) => {
    return (translations as any)[currentLanguage]?.[key] || (translations as any)['ar'][key] || key;
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      return translate('usernameRequired');
    }
    if (formData.username.length < 3) {
      return translate('usernameMinLength');
    }
    if (!formData.email.trim()) {
      return translate('emailRequired');
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      return translate('emailInvalid');
    }
    if (!formData.password) {
      return translate('passwordRequired');
    }
    if (formData.password.length < 6) {
      return translate('passwordMinLength');
    }
    if (formData.password !== formData.confirmPassword) {
      return translate('passwordMismatch');
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiService.register(formData.username, formData.email, formData.password);

      // حفظ بيانات المستخدم في localStorage
      if ((response as any).token && (response as any).user) {
        localStorage.setItem('token', (response as any).token);
        localStorage.setItem('userData', JSON.stringify((response as any).user));
      }

      // إظهار رسالة الترحيب للمستخدمين الجدد
      if ((response as any).isNewUser && (response as any).welcomeMessage) {
        // إظهار رسالة ترحيب مخصصة
        alert((response as any).welcomeMessage);
      } else if ((response as any).rewards) {
        // رسالة احتياطية
        alert(`🎉 مرحباً بك في المنصة!

هدية الترحيب:
🪙 ${(response as any).rewards.goldCoins.toLocaleString()} عملة ذهبية
🦪 ${(response as any).rewards.pearls} لآلئ

استمتع باللعب واربح المزيد!`);
      }

      // تمرير بيانات المستخدم للتسجيل التلقائي
      onRegisterSuccess((response as any).user);
    } catch (error: any) {
      setError(error.message || translate('registerFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 relative">
            <UserPlus className="w-10 h-10 text-white" />
            <Infinity className="w-5 h-5 text-white absolute -top-1 -right-1" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{translate('register')}</h2>
          <p className="text-gray-300">{translate('registerDesc')}</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
            <p className="text-red-300 text-sm text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder={translate('username')}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                autoComplete="username"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={translate('email')}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                autoComplete="email"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={translate('password')}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-0 pl-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
                )}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder={translate('confirmPassword')}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 left-0 pl-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {translate('registering')}
              </>
            ) : (
              <>
                <Box className="w-5 h-5" />
                {translate('registerButton')}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-300">
            {translate('switchToLogin')}
          </p>
          <button
            onClick={onSwitchToLogin}
            className="text-blue-400 hover:text-blue-300 font-semibold transition-colors mt-2"
          >
            {translate('login')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;