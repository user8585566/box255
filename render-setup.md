# 🚀 دليل نشر InfinityBox25 على Render

## 📋 الخطوات المطلوبة:

### 1. 🔗 ربط Repository بـ Render:
1. اذهب إلى [Render Dashboard](https://dashboard.render.com)
2. اضغط "New +" → "Web Service"
3. اختر "Connect a repository"
4. اختر `boxbox25/INFINITYBOX25`

### 2. ⚙️ إعدادات الخدمة:
- **Name**: `infinitybox25-agora`
- **Region**: `Oregon (US West)`
- **Branch**: `main`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `node --max-old-space-size=512 server.js`

### 3. 🔐 متغيرات البيئة المطلوبة:

#### متغيرات أساسية:
```
NODE_ENV=production
PORT=5000
```

#### قاعدة البيانات:
```
MONGODB_URI=mongodb+srv://aser20031:aser20031@cluster0.6re1fvh.mongodb.net/game_db?retryWrites=true&w=majority&appName=Cluster0
```

#### الأمان:
```
JWT_SECRET=8110bb05094b7a3c5a5ae10a5d1d0f1abc3741b130075aee84af0dc260a8a0d13d36cb5d71d5ae1aaebb64abbe8e3da0f
SESSION_SECRET=your-session-secret-here
```

#### Agora (مطلوب للمحادثة الصوتية):
```
AGORA_APP_ID=852ff5f55a7a49b081b799358f2fc329
AGORA_APP_CERTIFICATE=790b4373db0d42ed8a85b9d2397a7c87
```

### 4. 🔧 إعدادات متقدمة:
- **Health Check Path**: `/`
- **Health Check Timeout**: `300` seconds
- **Auto-Deploy**: `Yes`

### 5. 🚀 النشر:
1. اضغط "Create Web Service"
2. انتظر اكتمال البناء (5-10 دقائق)
3. ستحصل على رابط مثل: `https://infinitybox25-agora.onrender.com`

## 🔍 استكشاف الأخطاء:

### إذا فشل البناء:
1. تحقق من logs في Render Dashboard
2. تأكد من وجود جميع متغيرات البيئة
3. تأكد من صحة MONGODB_URI

### إذا لم تعمل المحادثة الصوتية:
1. تحقق من AGORA_APP_ID و AGORA_APP_CERTIFICATE
2. تأكد من تفعيل HTTPS في Render
3. تحقق من إعدادات CORS

### إذا كان التطبيق بطيء:
1. استخدم Free plan (512MB RAM)
2. قم بتحسين الصور والأصول
3. فعّل caching

## 📊 مراقبة الأداء:
- **CPU Usage**: مراقبة في Render Dashboard
- **Memory Usage**: يجب أن يكون أقل من 512MB
- **Response Time**: يجب أن يكون أقل من 2 ثانية
- **Uptime**: يجب أن يكون 99%+

## 🔄 التحديثات:
عند push إلى GitHub، Render سيعيد النشر تلقائياً.

## 🌐 الرابط النهائي:
بعد النشر الناجح: `https://infinitybox25-agora.onrender.com`
