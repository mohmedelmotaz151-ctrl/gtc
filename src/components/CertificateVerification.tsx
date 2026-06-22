import React from 'react';
import { Award, CheckCircle, AlertTriangle, Printer, ArrowRight, Calendar, User, BookOpen, ShieldCheck, QrCode } from 'lucide-react';
import { Certificate, Course } from '../types';

interface CertificateVerificationProps {
  code: string;
  certificates: Certificate[];
  courses: Course[];
  onClose: () => void;
}

export default function CertificateVerification({
  code,
  certificates,
  courses,
  onClose
}: CertificateVerificationProps) {
  
  // Find the certificate by code (case-insensitive check)
  const cert = certificates.find(
    c => c.certificateCode.trim().toLowerCase() === code.trim().toLowerCase()
  );

  // Find the associated course for instructor name or details
  const associatedCourse = cert ? courses.find(co => co.id === cert.courseId) : null;
  const instructor = associatedCourse ? associatedCourse.instructor : 'الادارة الأكاديمية';

  const handlePrint = () => {
    window.print();
  };

  const validationUrl = `${window.location.origin}/verify/${code}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 font-sans" id="certificate-verification-page-container">
      
      {/* Back button */}
      <div className="mb-6 flex justify-between items-center bg-white p-3 rounded-2xl shadow-xs border border-slate-200">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-amber-600 transition-colors cursor-pointer"
        >
          <ArrowRight className="h-4.5 w-4.5" />
          <span>العودة للأكاديمية والبوابة الرئيسية</span>
        </button>
        <div className="text-[10px] text-slate-500 font-mono">
          SYSTEM_VERIFICATION_NODE: ONLINE
        </div>
      </div>

      {!cert ? (
        /* PATH NOT FOUND / ERROR STATE */
        <div className="bg-white rounded-3xl p-8 border-2 border-rose-100 shadow-xl text-center space-y-6">
          <div className="mx-auto h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 border border-rose-100">
            <AlertTriangle className="h-8 w-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-black text-rose-950 font-sans">فشل التحقق من صحة المستند</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              عذراً، كود التحقق <code className="bg-rose-50 text-rose-700 px-2 py-1 rounded-md font-mono font-bold text-xs">{code}</code> غير مسجل في سجلات قاعدة بيانات مركز التدريب الخليجي gcc traning center.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl max-w-lg mx-auto text-right text-xs space-y-2 border border-slate-200">
            <p className="font-extrabold text-slate-800">توجيهات التحقق الأكاديمي:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 font-normal">
              <li>تأكد من كتابة الكود بشكل صحيح وبنفس الصيغة (مثال: GCC-123456).</li>
              <li>قد يستغرق تزامن السحابة بضع دقائق إذا تم إصدار الشهادة للتو.</li>
              <li>إذا كنت صاحب العمل، يرجى التواصل مع إدارة العمليات للتحقق اليدوي.</li>
            </ul>
          </div>
        </div>
      ) : (
        /* SUCCESS / DOCUMENT FOUND STATE */
        <div className="space-y-8">
          
          {/* Main Success Certificate Alert */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-650 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            {/* Visual shine accents */}
            <div className="absolute right-0 bottom-0 translate-y-1/4 translate-x-1/4 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-right">
              <div className="h-16 w-16 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                <ShieldCheck className="h-10 w-10 text-amber-300" />
              </div>
              
              <div className="space-y-1 flex-grow">
                <div className="inline-block bg-emerald-400/20 border border-emerald-300/30 text-emerald-100 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                  وثيقة رقمية معتمدة ومسجلة رسمياً
                </div>
                <h2 className="text-xl sm:text-2xl font-black font-sans leading-tight">تم التحقق بنجاح من صحة الشهادة!</h2>
                <p className="text-xs sm:text-sm text-emerald-100 font-normal">
                  هذه الشهادة رسمية وصادرة مباشرة من <strong className="text-white underline decoration-amber-400 font-semibold">gcc traning center</strong> برقم مسلسل معتمد دولياً.
                </p>
              </div>

              {/* Action Buttons inside alert view */}
              <button
                onClick={handlePrint}
                className="bg-slate-950 hover:bg-slate-900 text-amber-400 font-extrabold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all shrink-0 cursor-pointer"
              >
                <Printer className="h-4 w-4 shrink-0 animate-bounce" />
                <span>طباعة الشهادة الرسمية</span>
              </button>
            </div>
          </div>

          {/* Verification Audit Log metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400">اسم المتدرب المعتمد</p>
                <p className="text-xs font-bold text-slate-850 truncate">{cert.userName}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400">المسار التدريبي المشتاز</p>
                <p className="text-xs font-bold text-slate-850 truncate">{cert.courseTitle}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400">تاريخ إصدار الوثيقة</p>
                <p className="text-xs font-bold text-slate-850">{cert.issueDate}</p>
              </div>
            </div>
          </div>

          {/* STUNNING CERTIFICATE CONTAINER - IDENTICAL TO STUDENT PRINT VIEW */}
          <div className="bg-white border border-slate-200 rounded-3xl p-3 sm:p-6 shadow-sm relative">
            <div className="absolute top-3 right-3 bg-slate-900 text-amber-400 text-[9px] px-2.5 py-1 rounded-full font-black uppercase">
              Official Digital Specimen
            </div>
            
            <h3 className="text-xs font-extrabold text-slate-400 mb-4 text-center">وثيقة الإنجاز الرسمية الرقمية</h3>

            {/* LANDSCAPE CONTAINER */}
            <div 
              className="mx-auto max-w-2xl bg-[#faf9f6] border-[14px] border-double border-amber-955 rounded-2xl p-6 sm:p-10 text-slate-900 text-right font-sans relative shadow-md select-none print:m-0 print:border-8" 
              id="printable-gcc-certificate"
            >
              {/* Certificate Background Elements (Print safe) */}
              <div className="absolute inset-2 border border-amber-950/20 pointer-events-none"></div>

              {/* Gold Ribbon Seal Graphic */}
              <div className="absolute bottom-6 right-6 hidden sm:flex flex-col items-center">
                <div className="h-12 w-12 bg-amber-500 rounded-full border-4 border-amber-600 flex items-center justify-center text-[8px] text-amber-950 font-black shadow-inner rotate-12 relative z-25">
                  SEAL
                </div>
                <div className="w-0 h-0 border-t-[16px] border-t-amber-600 border-x-[10px] border-x-transparent -mt-2 -mr-4 rotate-45"></div>
                <div className="w-0 h-0 border-t-[16px] border-t-amber-600 border-x-[10px] border-x-transparent -mt-4 mr-4 rotate-12"></div>
              </div>

              {/* Content */}
              <div className="text-center space-y-6 relative z-10">
                
                {/* Header Brand */}
                <div className="flex flex-col items-center justify-center gap-1.5 mb-2">
                  <div className="flex items-center gap-2">
                    <Award className="h-8 w-8 text-amber-700 shrink-0" />
                    <span className="font-extrabold text-base sm:text-lg text-amber-950 uppercase tracking-wide font-sans">gcc traning center</span>
                  </div>
                  <span className="text-[10px] text-amber-900 bg-amber-500/10 px-3 py-0.5 rounded-full font-extrabold">المركز الخليجي المشترك للتدريب والتعليم والتشغيل</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-amber-955 drop-shadow-xs font-sans tracking-tight">
                  شهادة غرس وإتمام برنامج تدريبي
                </h2>
                
                <div className="text-slate-700 text-xs sm:text-sm space-y-3 pt-2 font-normal leading-relaxed">
                  <p>يشهد مركز التدريب ومسؤولو التطوير في <strong className="text-amber-950 font-black">gcc traning center</strong> بأن المتدرب(ة):</p>
                  <p className="text-lg sm:text-xl font-bold text-slate-900 border-b border-dashed border-amber-950/40 inline-block px-10 pb-1.5 mt-2 bg-amber-550/10" dir="rtl">
                    {cert.userName}
                  </p>
                  <p className="mt-4">قد أكمل بنجاح واجتاز بتميز المقررات والمتطلبات المقررة للدبلوم الشامل في:</p>
                  <p className="text-sm sm:text-base font-extrabold text-amber-900 px-3 py-1 bg-amber-500/5 rounded-lg border border-amber-500/10 max-w-lg mx-auto leading-relaxed">
                    {cert.courseTitle}
                  </p>
                  <p className="text-xs pt-1">
                    درجة الاختبار النهائي: <strong className="text-slate-900 font-extrabold">{cert.grade}%</strong> بنسبة تقدير معتمد من لجان التحكيم الخليجية.
                  </p>
                </div>

                {/* Signatures & Stamps Row */}
                <div className="grid grid-cols-2 gap-4 pt-6 text-right sm:text-center text-slate-800 text-[10px] sm:text-xs font-normal">
                  <div className="space-y-1 bg-slate-100/50 p-2.5 rounded-lg border border-slate-200/50">
                    <p className="text-slate-500">المدرب والمقيم الأكاديمي:</p>
                    <p className="font-bold text-slate-900">{instructor}</p>
                    <p className="italic text-slate-400 text-[8px] font-mono">Digital Signature Verified</p>
                  </div>

                  <div className="space-y-1 bg-slate-100/50 p-2.5 rounded-lg border border-slate-200/50 flex flex-col justify-center items-center">
                    <p className="text-slate-500 text-[9px]">الاعتماد الأكاديمي:</p>
                    <p className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">gcc traning center</p>
                    <p className="text-green-600 font-bold text-[8px] border border-green-500/30 px-1 py-0.5 rounded-full inline-block bg-green-500/5">STAMPED APPROVED</p>
                  </div>
                </div>

                {/* Serial Footer with QR Code block on bottom-right/left */}
                <div className="pt-4 border-t border-slate-700/10 flex items-center justify-between gap-4">
                  
                  {/* Left Column verification metadata */}
                  <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono text-right flex-grow space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 font-bold">كود الموثوقية:</span>
                      <span className="bg-amber-100 text-amber-950 font-extrabold px-1.5 py-0.2 rounded font-mono">{cert.certificateCode}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold">تاريخ الإصدار:</span> {cert.issueDate}
                    </div>
                    <div className="text-[8px] text-slate-350">GCC Training Verification Hub Secure Specimen • 2026</div>
                  </div>

                  {/* QR Code inside the actual Certificate layout as requested */}
                  <div className="flex flex-col items-center justify-center bg-white p-1 rounded-lg border border-amber-950/20 shadow-xs shrink-0 pointer-events-none">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&margin=4&data=${encodeURIComponent(validationUrl)}`}
                      alt="Certificate QR Verification" 
                      className="h-14 w-14 sm:h-16 sm:w-16"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[7px] text-slate-500 font-extrabold mt-0.5 tracking-tighter">التحقق الرقمي QR</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Quick FAQ / Audit Details */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-250 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <QrCode className="h-10 w-10 text-slate-400 shrink-0" />
              <div className="text-right">
                <p className="text-xs font-bold text-slate-800">تحقق عبر الهواتف والأجهزة الذكية</p>
                <p className="text-[10px] text-slate-500">يتيح الرمز المطبوع في أسفل الشهادة لأصحاب المقابلات أو مسؤولي الموارد البشرية مسح الكود ومطابقة البيانات فوراً لمنع التزوير.</p>
              </div>
            </div>
            <div className="bg-amber-100 text-amber-950 text-[10px] px-3 py-1 rounded-full font-black border border-amber-250 shrink-0">
              رابط الاستدلال: gcc-verification-active
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
