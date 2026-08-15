# إمداد CRM

نظام إدارة عملاء داخلي لشركة إمداد (وكيل LG لأنظمة التكييف المركزي).

**Stack:** Next.js 14 (App Router) · Supabase (Postgres + Auth + RLS) · Vercel

---

## 1) التشغيل محليًا

```bash
npm install
cp .env.local.example .env.local
```

افتح `.env.local` واملأ `NEXT_PUBLIC_SUPABASE_ANON_KEY` من:
Supabase Dashboard → مشروع `emdad-crm` → Project Settings → API → anon public key

```bash
npm run dev
```

الموقع هيشتغل على http://localhost:3000

---

## 2) إنشاء أول مستخدم Admin

1. من Supabase Dashboard → Authentication → Users → Add user، أنشئ حساب بإيميل وباسورد
2. من SQL Editor، نفذ (غيّر الإيميل والاسم):

```sql
insert into profiles (id, full_name, role)
select id, 'اسم المدير', 'admin'
from auth.users
where email = 'admin@emdad.com';
```

بعدها تقدر تسجل دخول بالحساب ده وتوصل لـ `/admin`.

---

## 3) رفع المشروع على GitHub

```bash
git init
git add .
git commit -m "Initial commit: EMDAD CRM scaffold"
git branch -M main
git remote add origin <رابط الريبو بتاعك على GitHub>
git push -u origin main
```

> ملحوظة: ملف `.env.local` متضمّن في `.gitignore` تلقائيًا ومش هيترفع — مفاتيحك آمنة.

---

## 4) الربط بـ Vercel

بعد الـ push، هربط المشروع بـ Vercel مباشرة عن طريق الـ connector، وهضيف متغيرات البيئة (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) هناك تلقائيًا.
