'use client';

import { useEffect, useState } from 'react';

const translations = {
  'Dashboard': 'لوحة التحكم', 'Projects': 'المشروعات', 'Companies': 'الشركات', 'Contacts': 'جهات الاتصال',
  'Follow-ups': 'المتابعات', 'Collections': 'التحصيلات', 'Employees': 'الموظفون', 'Reports': 'التقارير',
  'Administrator': 'مدير النظام', 'Sales Employee': 'موظف مبيعات', 'Refresh data': 'تحديث البيانات',
  'EMDAD ENGINEERING SOLUTIONS': 'إمداد للحلول الهندسية', 'Search company, project, contact...': 'ابحث عن شركة أو مشروع أو جهة اتصال...',
  'Executive Sales Overview': 'نظرة تنفيذية على المبيعات', 'My Sales Workspace': 'مساحة عمل المبيعات الخاصة بي',
  'EMDAD sales pipeline, project ownership, follow-ups and collections.': 'مسار مبيعات إمداد، ومسؤولية المشروعات، والمتابعات والتحصيلات.',
  'View projects →': 'عرض المشروعات ←', 'Active Projects': 'المشروعات النشطة', 'Expected Pipeline': 'قيمة الـ Pipeline المتوقعة',
  'Contract Value': 'قيمة العقود', 'Collected': 'المحصل', 'Overdue Follow-ups': 'المتابعات المتأخرة', 'Due Today': 'مستحق اليوم',
  'Attention required': 'يحتاج إلى إجراء', 'Next actions for the team': 'الإجراءات التالية للفريق', 'Open follow-ups →': 'فتح المتابعات ←',
  'Customer/project actions that need attention': 'إجراءات العملاء والمشروعات التي تحتاج إلى متابعة', 'Team': 'الفريق',
  'Active sales employees': 'موظفو المبيعات النشطون', 'View team →': 'عرض الفريق ←', 'No employees yet.': 'لا يوجد موظفون حتى الآن.',
  'No records found': 'لا توجد بيانات', 'Each project has one responsible employee.': 'لكل مشروع موظف مسؤول واحد فقط.',
  '+ New Project': '+ مشروع جديد', '+ New Company': '+ شركة جديدة', '+ New Contact': '+ جهة اتصال جديدة', '+ New Follow-up': '+ متابعة جديدة',
  '+ Add Employee': '+ إضافة موظف', 'New Company': 'شركة جديدة', 'New Contact': 'جهة اتصال جديدة', 'New Project': 'مشروع جديد',
  'New Follow-up': 'متابعة جديدة', 'New Collection Payment': 'دفعة تحصيل جديدة', 'Add Employee': 'إضافة موظف', 'Edit Employee': 'تعديل موظف',
  'Edit Project': 'تعديل مشروع', 'Edit Company': 'تعديل شركة', 'Edit Contact': 'تعديل جهة اتصال', 'Edit Follow-up': 'تعديل متابعة',
  'Project': 'المشروع', 'Company': 'الشركة', 'Owner': 'المسؤول', 'Stage': 'المرحلة', 'Expected': 'المتوقع', 'Contract': 'العقد',
  'Type': 'النوع', 'Industry': 'النشاط', 'Contacts': 'جهات الاتصال', 'Name': 'الاسم', 'Title': 'المسمى الوظيفي', 'Phone': 'الهاتف',
  'Email': 'البريد الإلكتروني', 'Edit': 'تعديل', 'Unassigned': 'غير مسند', 'HVAC / MEP': 'تكييف / MEP', 'Lead': 'عميل محتمل',
  'Proposal / Technical': 'عرض / فني', 'Follow-up': 'متابعة', 'Negotiation': 'تفاوض', 'Won / Contract': 'تم الفوز / عقد', 'Lost': 'خسارة',
  'Overdue follow-ups': 'متابعات متأخرة', 'Due today': 'مستحق اليوم', 'Loading CRM data...': 'جاري تحميل بيانات الـCRM...',
  'Unable to load CRM data': 'تعذر تحميل بيانات الـCRM', 'English': 'الإنجليزية', 'العربية': 'العربية'
};

const reverseTranslations = Object.fromEntries(Object.entries(translations).map(([en, ar]) => [ar, en]));

function translateText(value, lang) {
  if (!value) return value;
  return lang === 'en' ? (reverseTranslations[value] || value) : (translations[value] || value);
}

function applyLayout(lang) {
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.classList.toggle('language-ar', lang === 'ar');
  document.body.classList.toggle('language-en', lang === 'en');
  let style = document.getElementById('emdad-language-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'emdad-language-style';
    document.head.appendChild(style);
  }
  style.textContent = `
    .crm-app.language-ar { direction: rtl !important; }
    .crm-app.language-en { direction: ltr !important; }
    .language-ar .sidebar { text-align: right; }
    .language-ar .top-actions { direction: rtl; }
    .language-ar table { direction: rtl; }
    .language-ar input, .language-ar textarea, .language-ar select { direction: rtl; text-align: right; }
    .language-ar [data-language-toggle] { left: 18px !important; right: auto !important; }
  `;
}

function translateDocument(lang) {
  applyLayout(lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = translateText(key, lang);
  });

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const parent = node.parentElement;
    if (!parent || parent.closest('[data-language-toggle]')) return;
    const value = node.nodeValue?.trim();
    if (!value) return;
    const translated = translateText(value, lang);
    if (translated !== value) node.nodeValue = node.nodeValue.replace(value, translated);
  });

  document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
    const original = el.getAttribute('data-original-placeholder') || el.getAttribute('placeholder');
    if (!el.getAttribute('data-original-placeholder')) el.setAttribute('data-original-placeholder', original);
    el.setAttribute('placeholder', translateText(el.getAttribute('data-original-placeholder'), lang));
  });
}

export default function LanguageToggle() {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('emdad-language') || 'en';
    setLang(saved);
    translateDocument(saved);
    const observer = new MutationObserver(() => translateDocument(saved));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  function toggle() {
    const next = lang === 'en' ? 'ar' : 'en';
    setLang(next);
    localStorage.setItem('emdad-language', next);
    translateDocument(next);
  }

  return (
    <button type="button" data-language-toggle onClick={toggle}
      aria-label={lang === 'en' ? 'Switch to Arabic' : 'Switch to English'}
      style={{ position:'fixed', top:14, right:18, zIndex:99999, border:'1px solid rgba(255,255,255,.18)', borderRadius:10, padding:'9px 13px', background:'#111722', color:'#fff', fontWeight:700, cursor:'pointer', boxShadow:'0 6px 20px rgba(0,0,0,.18)' }}>
      {lang === 'en' ? 'العربية' : 'English'}
    </button>
  );
}
