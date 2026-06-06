import React, { useState } from 'react';
import { 
  ArrowRight, 
  MessageSquare, 
  Mail, 
  Phone, 
  User, 
  BookOpen, 
  Check, 
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Course } from '../types';
import { useLanguage } from '../lib/LanguageContext';

interface UnregisteredStudentContactProps {
  initialCourse: Course | null;
  courses: Course[];
  onBack: () => void;
  currentUser: { name?: string; email?: string; phone?: string } | null;
}

export default function UnregisteredStudentContact({
  initialCourse,
  courses,
  onBack,
  currentUser
}: UnregisteredStudentContactProps) {
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourse?.id || courses[0]?.id || '');
  const [notes, setNotes] = useState('');
  const { language, t, isAr } = useLanguage();

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || initialCourse;
  const selectedCourseTitle = selectedCourse ? selectedCourse.title : (isAr ? 'غير محدد' : 'Not Specified');

  // Construct WhatsApp link text
  const getWhatsAppLink = () => {
    const formattedText = `السلام عليكم ورحمة الله وبركاته،
أرغب في التسجيل وتفعيل كورس تدريبي جديد معي في منصة GCC Center:
• الاسم الكامل: ${name || 'غير مدخل'}
• البريد الإلكتروني: ${email || 'غير مدخل'}
• رقم الجوال: ${phone || 'غير مدخل'}
• الكورس المطلوب: **${selectedCourseTitle}**
• ملاحظات إضافية: ${notes || 'لا يوجد'}

يرجى تفعيل الكورس لحسابي في أسرع وقت. شكراً لكم.`;
    return `https://api.whatsapp.com/send?phone=966552232752&text=${encodeURIComponent(formattedText)}`;
  };

  // Construct Email mailto link
  const getEmailLink = () => {
    const subject = `طلب تسجيل وتفعيل كورس: ${selectedCourseTitle}`;
    const body = `مرحباً إدارة أكاديمية GCC Center للتدريب،

أرجو تسجيل اسمي وتفعيل الكورس التدريبي التالي لحسابي:
- الاسم الكامل: ${name || 'غير مدخل'}
- البريد الإلكتروني: ${email || 'غير مدخل'}
- رقم الجوال: ${phone || 'غير مدخل'}
- الكورس المطلوب: ${selectedCourseTitle}

ملاحظات إضافية:
${notes || 'لا يوجد'}

وشكراً لكم.`;
    return `mailto:mohmedelmotaz151@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className={`max-w-4xl mx-auto px-4 py-8 ${isAr ? 'text-right' : 'text-left'}`} id="unregistered-contact-container">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-extrabold mb-6 cursor-pointer"
      >
        <ArrowRight className={`h-4 w-4 ${isAr ? 'rotate-180' : ''}`} />
        <span>{t('unreg_back')}</span>
      </button>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl" id="unregistered-card">
        {/* Banner with alert / state */}
        <div className={`bg-gradient-to-l from-slate-900 to-slate-800 text-white p-6 sm:p-8 space-y-3 relative ${isAr ? 'text-right' : 'text-left'}`}>
          <div className="absolute top-4 left-4 opacity-10">
            <Sparkles className="h-24 w-24" />
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-[10px] sm:text-xs font-black text-amber-400">
            <AlertCircle className="h-4 w-4" />
            <span>{t('unreg_badge')}</span>
          </div>

          <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-tight">
            {t('unreg_title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl font-normal">
            {isAr ? (
              <>
                عذراً، لم يتم إدراج أو إسناد مقرر <strong className="text-amber-400 font-extrabold">"{selectedCourseTitle}"</strong> لحسابك التدريبي حتى الآن. تفضل بتعبئة طلبك بالأسفل للتواصل المباشر مع إدارة التدريب وإصدار ترخيص دراستك واختبارك فورياً.
              </>
            ) : (
              <>
                Sorry, the program <strong className="text-amber-400 font-extrabold">"{selectedCourseTitle}"</strong> has not been assigned or enabled on your account yet. Please complete your registration details below for immediate activation.
              </>
            )}
          </p>
        </div>

        {/* Dynamic Form Content */}
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Registration Form Inputs */}
          <div className="lg:col-span-7 space-y-5">
            <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2">
              {t('unreg_form_title')}
            </h3>

            <div className="space-y-4">
              {/* Full Name input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">{t('unreg_fullname_label')}</label>
                <div className="relative">
                  <span className={`absolute inset-y-0 flex items-center pointer-events-none text-slate-400 ${
                    isAr ? 'right-0 pr-3' : 'left-0 pl-3'
                  }`}>
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('auth_fullName_placeholder')}
                    className={`w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-sans font-medium ${
                      isAr ? 'pr-10 text-right' : 'pl-10 text-left'
                    }`}
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">{t('unreg_email_label')}</label>
                <div className="relative">
                  <span className={`absolute inset-y-0 flex items-center pointer-events-none text-slate-400 ${
                    isAr ? 'right-0 pr-3' : 'left-0 pl-3'
                  }`}>
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth_email_placeholder')}
                    className={`w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-sans font-medium ${
                      isAr ? 'pr-10 text-right' : 'pl-10 text-left'
                    }`}
                  />
                </div>
              </div>

              {/* Telephone Number */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">{t('unreg_phone_label')}</label>
                <div className="relative">
                  <span className={`absolute inset-y-0 flex items-center pointer-events-none text-slate-400 ${
                    isAr ? 'right-0 pr-3' : 'left-0 pl-3'
                  }`}>
                    <Phone className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('auth_phone_placeholder')}
                    className={`w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-sans font-medium ${
                      isAr ? 'pr-10 text-right' : 'pl-10 text-left'
                    }`}
                  />
                </div>
              </div>

              {/* Selected Course Catalog drop container */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">{t('unreg_course_label')}</label>
                <div className="relative">
                  <span className={`absolute inset-y-0 flex items-center pointer-events-none text-slate-400 ${
                    isAr ? 'right-0 pr-3' : 'left-0 pl-3'
                  }`}>
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className={`w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-semibold appearance-none ${
                      isAr ? 'pr-10 text-right' : 'pl-10 text-left'
                    }`}
                  >
                    {courses.map((crs) => (
                      <option key={crs.id} value={crs.id}>
                        {crs.title} ({crs.level})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes / Special text area */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">{t('unreg_notes_label')}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('unreg_notes_placeholder')}
                  rows={3}
                  className={`w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 resize-none ${
                    isAr ? 'text-right' : 'text-left'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Quick Contact & Action Buttons */}
          <div className="lg:col-span-5 space-y-6 bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between h-full">
            <div className="space-y-4">
              <h4 className={`font-extrabold text-slate-900 text-xs flex items-center gap-1.5 ${isAr ? 'flex-row justify-start' : 'flex-row-reverse justify-end'}`}>
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                <span>{t('unreg_channels_title')}</span>
              </h4>
              
              <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                {t('unreg_channels_desc')}
              </p>

              {/* Status and info metrics of administration */}
              <div className="border-t border-b border-slate-200 py-3 space-y-2 text-[11px] text-slate-700">
                <div className={`flex items-center justify-between ${isAr ? 'flex-row' : 'flex-row-reverse'}`}>
                  <span className="text-slate-400 font-semibold">{t('unreg_phone_contact')}</span>
                  <a href="tel:0552232752" className="text-slate-950 font-bold hover:underline">0552232752</a>
                </div>
                <div className={`flex items-center justify-between ${isAr ? 'flex-row' : 'flex-row-reverse'}`}>
                  <span className="text-slate-400 font-semibold">{t('unreg_email_contact')}</span>
                  <a href="mailto:mohmedelmotaz151@gmail.com" className="text-slate-950 font-bold hover:underline select-all">mohmedelmotaz151@gmail.com</a>
                </div>
                <div className={`flex items-center justify-between ${isAr ? 'flex-row' : 'flex-row-reverse'}`}>
                  <span className="text-slate-400 font-semibold">{t('unreg_working_hours')}</span>
                  <span className="text-emerald-700 font-bold">{t('unreg_always_available')}</span>
                </div>
              </div>
            </div>

            {/* DIRECT ACTION ANCHORS SHAPED AS BUTTONS */}
            <div className="space-y-2 pt-2">
              {/* WhatsApp Direct */}
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 text-center"
              >
                <MessageSquare className="h-4.5 w-4.5 shrink-0 fill-current" />
                <span>{t('unreg_send_whatsapp')}</span>
              </a>

              {/* Email Direct */}
              <a
                href={getEmailLink()}
                className="w-full bg-slate-900 hover:bg-slate-805 text-white py-3 px-4 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 text-center"
              >
                <Mail className="h-4.5 w-4.5 shrink-0" />
                <span>{t('unreg_send_email')}</span>
              </a>

              {/* Direct call button inside the app */}
              <a
                href="tel:0552232752"
                className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-750 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 text-center"
              >
                <Phone className="h-4.5 w-4.5 shrink-0 text-slate-500" />
                <span>{t('unreg_direct_call')}</span>
              </a>
            </div>

            <p className="text-[9px] text-slate-400 text-center leading-tight mt-3">
              {t('unreg_footer_copy')}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

