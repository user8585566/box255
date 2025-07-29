# Dockerfile لتطبيق React + Express
FROM node:18-alpine

# تعيين مجلد العمل
WORKDIR /app

# نسخ ملفات التبعيات
COPY package*.json ./

# تثبيت جميع التبعيات (بما في ذلك devDependencies للبناء)
RUN npm ci

# نسخ جميع ملفات المشروع
COPY . .

# بناء التطبيق
RUN npm run build

# حذف devDependencies لتقليل حجم الصورة
RUN npm prune --production

# فتح المنفذ
EXPOSE 3000

# إضافة معالجة أفضل للإشارات
ENV NODE_ENV=production

# تشغيل التطبيق مع معالجة أفضل للإشارات
CMD ["node", "--max-old-space-size=512", "server.js"] 