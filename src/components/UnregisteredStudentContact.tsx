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

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || initialCourse;
  const selectedCourseTitle = selectedCourse ? selectedCourse.title : 'غير محدد';

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
    <div className="max-w-4xl mx-auto px-4 py-8 text-right" id="unregistered-contact-container">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-extrabold mb-6 cursor-pointer"
      >
        <ArrowRight className="h-4 w-4 rotate-180" />
        <span>العودة لتصفح الكتالوج</span>
      </button>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl" id="unregistered-card">
        {/* Banner with alert / state */}
        <div className="bg-gradient-to-l from-slate-900 to-slate-800 text-white p-6 sm:p-8 space-y-3 relative">
          <div className="absolute top-4 left-4 opacity-10">
            <Sparkles className="h-24 w-24" />
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-[10px] sm:text-xs font-black text-amber-400">
            <AlertCircle className="h-4 w-4" />
            <span>طلب تفعيل فوري للمنخرطين الجدد</span>
          </div>

          <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-tight">
            تفعيل الكورس والالتحاق بالدورة التدريبية
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl font-normal">
            عذراً، لم يتم إدراج أو إسناد مقرر <strong className="text-amber-400 font-extrabold">"{selectedCourseTitle}"</strong> لحسابك التدريبي حتى الآن. تفضل بتعبئة طلبك بالأسفل للتواصل المباشر مع إدارة التدريب وإصدار ترخيص دراستك واختبارك فورياً.
          </p>
        </div>

        {/* Dynamic Form Content */}
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Registration Form Inputs */}
          <div className="lg:col-span-7 space-y-5">
            <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2">
              نموذج طلب التفعيل وتعيين المقرر الدراسي
            </h3>

            <div className="space-y-4">
              {/* Full Name input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">الاسم الثنائي أو الكامل للمتدرب:</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: صالح بن محمد الرويلي"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 pr-10 rounded-xl text-xs text-right focus:outline-none focus:border-amber-500 text-slate-900 font-sans font-medium"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">البريد الإلكتروني المعتمد للدخول:</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="مثال: saleh@student.com"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 pr-10 rounded-xl text-xs text-right focus:outline-none focus:border-amber-500 text-slate-900 font-sans font-medium"
                  />
                </div>
              </div>

              {/* Telephone Number */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">رقم جوال المتدرب لتلقي التنبيهات:</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    <Phone className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="مثال: 0501234567"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 pr-10 rounded-xl text-xs text-right focus:outline-none focus:border-amber-500 text-slate-900 font-sans font-medium"
                  />
                </div>
              </div>

              {/* Selected Course Catalog drop container */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">الكورس أو الدبلوم المراد إسناده ومباشرته:</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 pr-10 rounded-xl text-xs text-right focus:outline-none focus:border-amber-500 text-slate-900 font-semibold appearance-none"
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
                <label className="block text-xs font-bold text-slate-700">ملاحظات إضافية لإدارة الأكاديمية (اختياري):</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: أرغب ببدء الدراسة من اليوم واجتياز الاختبار مباشرة لاستلام الشهادة المعاصرة..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-right focus:outline-none focus:border-amber-500 text-slate-900 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Quick Contact & Action Buttons */}
          <div className="lg:col-span-5 space-y-6 bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between h-full">
            <div className="space-y-4">
              <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 justify-start">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                <span>قنوات التواصل المباشرة والتنفيذ الفوري</span>
              </h4>
              
              <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                بمجرد اختيار وسيلة الإرسال بالأسفل، سيتم توجيه بيانات اشتراكك بالكامل لإدارة شؤون المتدربين بمركز الخليج لتسجيل بياناتك وربط حسابك فوراً.
              </p>

              {/* Status and info metrics of administration */}
              <div className="border-t border-b border-slate-200 py-3 space-y-2 text-[11px] text-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">رقم التواصل:</span>
                  <a href="tel:0552232752" className="text-slate-950 font-bold hover:underline">0552232752</a>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">البريد الإلكتروني المعتمد:</span>
                  <a href="mailto:mohmedelmotaz151@gmail.com" className="text-slate-950 font-bold hover:underline select-all">mohmedelmotaz151@gmail.com</a>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">توقيت مراجعة الاعتمادات:</span>
                  <span className="text-emerald-700 font-bold">متاح على مدار 24 ساعة ⚡</span>
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
                <span>إرسال الطلب عبر الواتساب الفوري</span>
              </a>

              {/* Email Direct */}
              <a
                href={getEmailLink()}
                className="w-full bg-slate-900 hover:bg-slate-805 text-white py-3 px-4 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 text-center"
              >
                <Mail className="h-4.5 w-4.5 shrink-0" />
                <span>إرسال الطلب عبر البريد الإلكتروني</span>
              </a>

              {/* Direct call button inside the app */}
              <a
                href="tel:0552232752"
                className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-750 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 text-center"
              >
                <Phone className="h-4.5 w-4.5 shrink-0 text-slate-500" />
                <span>الاتصال المباشر بإدارة التراخيص</span>
              </a>
            </div>

            <p className="text-[9px] text-slate-400 text-center leading-tight mt-3">
              GCC Center © 2026 للأمن والسلامة وإدارة جودة التدريب الخليجي الموحد.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
