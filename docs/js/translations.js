// نظام الترجمات متعدد اللغات
const translations = {
    ar: {
        // صفحة تسجيل الدخول
        welcome: "مرحباً بك",
        login: "تسجيل الدخول",
        register: "إنشاء حساب",
        username: "اسم المستخدم",
        email: "البريد الإلكتروني",
        password: "كلمة المرور",
        confirmPassword: "تأكيد كلمة المرور",
        loginButton: "دخول",
        registerButton: "إنشاء حساب",
        switchToRegister: "ليس لديك حساب؟ إنشاء حساب",
        switchToLogin: "لديك حساب؟ تسجيل الدخول",
        selectLanguage: "اختر اللغة",
        
        // اللعبة
        gameTitle: "لعبة الصناديق",
        balance: "الرصيد",
        singleShot: "ضربة فردية",
        tripleShot: "ضربة ثلاثية",
        hammerShot: "ضربة المطرقة",
        itemsCollection: "مجموعة العناصر",
        logout: "تسجيل الخروج",
        recharge: "تعبئة رصيد",
        home: "الرئيسية",
        
        // العناصر
        rarePearl: "لؤلؤة نادرة",
        magicKey: "مفتاح سحري",
        goldCoin: "عملة ذهبية",
        harmfulBomb: "قنبلة ضارة",
        luckyStar: "نجمة الحظ",
        harmfulBat: "خفاش مؤذي",
        
        // الرسائل
        congratulations: "مبروك! ربحت {amount} عملة من {wins} صناديق! 🎉",
        insufficientBalance: "رصيدك لا يسمح بالمراهنة. يرجى شحن رصيدك.",
        itemAdded: "{item} {action} {amount} عملة ذهبية وأُضيفت لممتلكاتك! يمكنك إهداؤها للأصدقاء 🎁",
        added: "أضيفت",
        deducted: "خُصمت",
        
        // أوصاف العناصر
        pearlDesc: "لؤلؤة نادرة تضيف 75 عملة ذهبية وتبقى في ممتلكاتك للإهداء",
        keyDesc: "مفتاح سحري يضيف 150 عملة ذهبية ويبقى في ممتلكاتك للإهداء",
        coinDesc: "عملة ذهبية تضيف 40 عملة ذهبية وتبقى في ممتلكاتك للإهداء",
        bombDesc: "قنبلة ضارة تخصم 50 عملة ذهبية لكنها تبقى في ممتلكاتك للإهداء",
        starDesc: "نجمة الحظ تضيف 300 عملة ذهبية وتبقى في ممتلكاتك للإهداء",
        batDesc: "خفاش مؤذي يخصم 75 عملة ذهبية لكنه يبقى في ممتلكاتك للإهداء",
        
        // الندرة
        common: "شائع",
        rare: "نادر",
        legendary: "أسطوري",
        harmful: "ضار",
        
        // أخرى
        canGift: "يمكن إهداؤه",
        adds: "يضيف",
        deducts: "يخصم",
        coins: "عملة",

        // رسائل إضافية
        loggingIn: "جاري تسجيل الدخول...",
        registerSuccess: "تم إنشاء الحساب بنجاح!",
        welcomeMessage: "مرحباً بك - يمكنك الآن تسجيل الدخول",

        // أزرار الإجراءات
        muteSound: "كتم الصوت",
        unmuteSound: "إلغاء كتم الصوت"
    },
    
    en: {
        // Login page
        welcome: "Welcome",
        login: "Login",
        register: "Register",
        username: "Username",
        email: "Email",
        password: "Password",
        confirmPassword: "Confirm Password",
        loginButton: "Login",
        registerButton: "Create Account",
        switchToRegister: "Don't have an account? Register",
        switchToLogin: "Have an account? Login",
        selectLanguage: "Select Language",
        
        // Game
        gameTitle: "Box Game",
        balance: "Balance",
        singleShot: "Single Shot",
        tripleShot: "Triple Shot",
        hammerShot: "Hammer Shot",
        itemsCollection: "Items Collection",
        logout: "Logout",
        recharge: "Recharge",
        home: "Home",
        
        // Items
        rarePearl: "Rare Pearl",
        magicKey: "Magic Key",
        goldCoin: "Gold Coin",
        harmfulBomb: "Harmful Bomb",
        luckyStar: "Lucky Star",
        harmfulBat: "Harmful Bat",
        
        // Messages
        congratulations: "Congratulations! You won {amount} coins from {wins} boxes! 🎉",
        insufficientBalance: "Insufficient balance. Please recharge your account.",
        itemAdded: "{item} {action} {amount} gold coins and added to your inventory! You can gift it 🎁",
        added: "added",
        deducted: "deducted",
        
        // Item descriptions
        pearlDesc: "Rare pearl that adds 75 gold coins and stays in your inventory for gifting",
        keyDesc: "Magic key that adds 150 gold coins and stays in your inventory for gifting",
        coinDesc: "Gold coin that adds 40 gold coins and stays in your inventory for gifting",
        bombDesc: "Harmful bomb that deducts 50 gold coins but stays in your inventory for gifting",
        starDesc: "Lucky star that adds 300 gold coins and stays in your inventory for gifting",
        batDesc: "Harmful bat that deducts 75 gold coins but stays in your inventory for gifting",
        
        // Rarity
        common: "Common",
        rare: "Rare",
        legendary: "Legendary",
        harmful: "Harmful",
        
        // Others
        canGift: "Can be gifted",
        adds: "adds",
        deducts: "deducts",
        coins: "coins",

        // Additional messages
        loggingIn: "Logging in...",
        registerSuccess: "Account created successfully!",
        welcomeMessage: "Welcome - you can now login",

        // Action buttons
        muteSound: "Mute Sound",
        unmuteSound: "Unmute Sound"
    },
    
    ur: {
        // لاگ ان صفحہ
        welcome: "خوش آمدید",
        login: "لاگ ان",
        register: "رجسٹر",
        username: "صارف نام",
        email: "ای میل",
        password: "پاس ورڈ",
        confirmPassword: "پاس ورڈ کی تصدیق",
        loginButton: "داخل ہوں",
        registerButton: "اکاؤنٹ بنائیں",
        switchToRegister: "اکاؤنٹ نہیں ہے؟ رجسٹر کریں",
        switchToLogin: "اکاؤنٹ ہے؟ لاگ ان کریں",
        selectLanguage: "زبان منتخب کریں",
        
        // کھیل
        gameTitle: "ڈبے کا کھیل",
        balance: "بیلنس",
        singleShot: "سنگل شاٹ",
        tripleShot: "ٹرپل شاٹ",
        hammerShot: "ہتھوڑا شاٹ",
        itemsCollection: "اشیاء کا مجموعہ",
        logout: "لاگ آؤٹ",
        recharge: "ری چارج",
        home: "گھر",
        
        // اشیاء
        rarePearl: "نایاب موتی",
        magicKey: "جادوئی چابی",
        goldCoin: "سونے کا سکہ",
        harmfulBomb: "نقصان دہ بم",
        luckyStar: "خوش قسمت ستارہ",
        harmfulBat: "نقصان دہ چمگادڑ",
        
        // پیغامات
        congratulations: "مبارک ہو! آپ نے {wins} ڈبوں سے {amount} سکے جیتے! 🎉",
        insufficientBalance: "ناکافی بیلنس۔ براہ کرم اپنا اکاؤنٹ ری چارج کریں۔",
        itemAdded: "{item} نے {amount} سونے کے سکے {action} اور آپ کی انوینٹری میں شامل! آپ اسے تحفہ دے سکتے ہیں 🎁",
        added: "شامل کیے",
        deducted: "کاٹے",
        
        // اشیاء کی تفصیلات
        pearlDesc: "نایاب موتی جو 75 سونے کے سکے شامل کرتا ہے اور تحفے کے لیے آپ کی انوینٹری میں رہتا ہے",
        keyDesc: "جادوئی چابی جو 150 سونے کے سکے شامل کرتی ہے اور تحفے کے لیے آپ کی انوینٹری میں رہتی ہے",
        coinDesc: "سونے کا سکہ جو 40 سونے کے سکے شامل کرتا ہے اور تحفے کے لیے آپ کی انوینٹری میں رہتا ہے",
        bombDesc: "نقصان دہ بم جو 50 سونے کے سکے کاٹتا ہے لیکن تحفے کے لیے آپ کی انوینٹری میں رہتا ہے",
        starDesc: "خوش قسمت ستارہ جو 300 سونے کے سکے شامل کرتا ہے اور تحفے کے لیے آپ کی انوینٹری میں رہتا ہے",
        batDesc: "نقصان دہ چمگادڑ جو 75 سونے کے سکے کاٹتا ہے لیکن تحفے کے لیے آپ کی انوینٹری میں رہتا ہے",
        
        // نایابی
        common: "عام",
        rare: "نایاب",
        legendary: "افسانوی",
        harmful: "نقصان دہ",
        
        // دیگر
        canGift: "تحفہ دیا جا سکتا ہے",
        adds: "شامل کرتا ہے",
        deducts: "کاٹتا ہے",
        coins: "سکے",

        // اضافی پیغامات
        loggingIn: "لاگ ان ہو رہے ہیں...",
        registerSuccess: "اکاؤنٹ کامیابی سے بن گیا!",
        welcomeMessage: "خوش آمدید - اب آپ لاگ ان کر سکتے ہیں",

        // ایکشن بٹن
        muteSound: "آواز بند کریں",
        unmuteSound: "آواز چالو کریں"
    },
    
    es: {
        // Página de inicio de sesión
        welcome: "Bienvenido",
        login: "Iniciar Sesión",
        register: "Registrarse",
        username: "Nombre de Usuario",
        email: "Correo Electrónico",
        password: "Contraseña",
        confirmPassword: "Confirmar Contraseña",
        loginButton: "Entrar",
        registerButton: "Crear Cuenta",
        switchToRegister: "¿No tienes cuenta? Regístrate",
        switchToLogin: "¿Tienes cuenta? Inicia sesión",
        selectLanguage: "Seleccionar Idioma",
        
        // Juego
        gameTitle: "Juego de Cajas",
        balance: "Saldo",
        singleShot: "Disparo Simple",
        tripleShot: "Disparo Triple",
        hammerShot: "Disparo de Martillo",
        itemsCollection: "Colección de Objetos",
        logout: "Cerrar Sesión",
        recharge: "Recargar",
        home: "Inicio",
        
        // Objetos
        rarePearl: "Perla Rara",
        magicKey: "Llave Mágica",
        goldCoin: "Moneda de Oro",
        harmfulBomb: "Bomba Dañina",
        luckyStar: "Estrella de la Suerte",
        harmfulBat: "Murciélago Dañino",
        
        // Mensajes
        congratulations: "¡Felicidades! ¡Ganaste {amount} monedas de {wins} cajas! 🎉",
        insufficientBalance: "Saldo insuficiente. Por favor recarga tu cuenta.",
        itemAdded: "¡{item} {action} {amount} monedas de oro y se agregó a tu inventario! Puedes regalarlo 🎁",
        added: "agregó",
        deducted: "dedujo",
        
        // Descripciones de objetos
        pearlDesc: "Perla rara que agrega 75 monedas de oro y permanece en tu inventario para regalar",
        keyDesc: "Llave mágica que agrega 150 monedas de oro y permanece en tu inventario para regalar",
        coinDesc: "Moneda de oro que agrega 40 monedas de oro y permanece en tu inventario para regalar",
        bombDesc: "Bomba dañina que deduce 50 monedas de oro pero permanece en tu inventario para regalar",
        starDesc: "Estrella de la suerte que agrega 300 monedas de oro y permanece en tu inventario para regalar",
        batDesc: "Murciélago dañino que deduce 75 monedas de oro pero permanece en tu inventario para regalar",
        
        // Rareza
        common: "Común",
        rare: "Raro",
        legendary: "Legendario",
        harmful: "Dañino",
        
        // Otros
        canGift: "Se puede regalar",
        adds: "agrega",
        deducts: "deduce",
        coins: "monedas",

        // Mensajes adicionales
        loggingIn: "Iniciando sesión...",
        registerSuccess: "¡Cuenta creada exitosamente!",
        welcomeMessage: "Bienvenido - ahora puedes iniciar sesión",

        // Botones de acción
        muteSound: "Silenciar Sonido",
        unmuteSound: "Activar Sonido"
    }
};

// وظائف إدارة اللغة
class LanguageManager {
    constructor() {
        this.currentLanguage = localStorage.getItem('selectedLanguage') || 'ar';
        this.rtlLanguages = ['ar', 'ur'];
    }
    
    setLanguage(lang) {
        this.currentLanguage = lang;
        localStorage.setItem('selectedLanguage', lang);
        this.updatePageDirection();
        this.translatePage();
    }
    
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    translate(key, params = {}) {
        let text = translations[this.currentLanguage]?.[key] || translations['ar'][key] || key;
        
        // استبدال المتغيرات في النص
        Object.keys(params).forEach(param => {
            text = text.replace(`{${param}}`, params[param]);
        });
        
        return text;
    }
    
    updatePageDirection() {
        const isRTL = this.rtlLanguages.includes(this.currentLanguage);
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = this.currentLanguage;
    }
    
    translatePage() {
        // ترجمة جميع العناصر التي تحتوي على data-translate
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            element.textContent = this.translate(key);
        });
        
        // ترجمة placeholders
        document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
            const key = element.getAttribute('data-translate-placeholder');
            element.placeholder = this.translate(key);
        });
        
        // ترجمة titles
        document.querySelectorAll('[data-translate-title]').forEach(element => {
            const key = element.getAttribute('data-translate-title');
            element.title = this.translate(key);
        });
    }
    
    getLanguageFlag(lang) {
        const flags = {
            'ar': '🇸🇦',
            'en': '🇺🇸', 
            'ur': '🇵🇰',
            'es': '🇪🇸'
        };
        return flags[lang] || '🌍';
    }
    
    getLanguageName(lang) {
        const names = {
            'ar': 'العربية',
            'en': 'English',
            'ur': 'اردو',
            'es': 'Español'
        };
        return names[lang] || lang;
    }
}

// إنشاء مثيل عام لمدير اللغة
window.languageManager = new LanguageManager();
