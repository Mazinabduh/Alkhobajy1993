# محطة الخبجي الكهربائية - نظام الإدارة المتكامل

## 🚀 تشغيل المشروع

### المتطلبات
- Node.js 18+
- npm أو yarn

### التثبيت
```bash
# تثبيت المكتبات
npm install

# تشغيل للتطوير
npm run dev

# بناء للإنتاج
npm run build

# معاينة البناء
npm run preview
```

### تحويل إلى APK للأندرويد
```bash
# تثبيت Capacitor CLI
npm install -g @capacitor/cli

# بناء المشروع
npm run build

# إضافة منصة الأندرويد
npx cap add android

# مزامنة الملفات
npx cap sync

# فتح في Android Studio
npx cap open android
```

## 📁 هيكل المشروع
```
src/
├── main.js              # نقطة الدخول
├── App.vue              # المكون الجذر
├── router/              # التوجيه
├── stores/              # إدارة الحالة (Pinia)
├── database/            # قاعدة البيانات المحلية (Dexie)
├── services/            # الخدمات (طباعة، تصدير، GitHub)
├── utils/               # الأدوات المساعدة
├── composables/         # المنطق القابل لإعادة الاستخدام
├── views/               # الصفحات
├── components/          # المكونات المشتركة
└── assets/              # الأصول (CSS، خطوط)
```

## 🔑 بيانات الدخول الافتراضية
- **اسم المستخدم:** `mazin`
- **كلمة المرور:** `mazin`

## ✨ المميزات
- ✅ يعمل بدون إنترنت (Local-First)
- ✅ قاعدة بيانات محلية (IndexedDB)
- ✅ نسخ احتياطي على GitHub
- ✅ تصدير PDF / Excel / JSON / TXT
- ✅ دعم كامل للعربية وRTL
- ✅ وضع ليلي ونهاري
- ✅ PWA قابل للتثبيت
- ✅ قابل للتحويل إلى APK

## 📱 التقنيات المستخدمة
- Vue 3 + Vite
- Pinia (إدارة الحالة)
- Dexie.js (IndexedDB)
- Chart.js (الرسوم البيانية)
- jsPDF + jspdf-autotable (PDF)
- XLSX (Excel)
- bcryptjs (تشفير)
- Capacitor (APK)