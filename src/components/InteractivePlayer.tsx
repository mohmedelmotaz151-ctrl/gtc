/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  Pause, 
  Video, 
  FileText, 
  CheckCircle2, 
  Lock, 
  HelpCircle, 
  Check, 
  X, 
  Award, 
  Printer, 
  BookOpen, 
  GraduationCap, 
  Sparkles, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut,
  Sliders,
  Bookmark,
  Share2,
  Search,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Course, Lesson, QuizQuestion, Certificate } from '../types';

interface InteractivePlayerProps {
  course: Course;
  lessons: Lesson[];
  progress: Set<string>; // Completed lesson IDs
  onToggleLessonCompleted: (lessonId: string) => void;
  onBackToCourses: () => void;
  currentUser: { id: string; name: string } | null;
  certificate: Certificate | null;
  onIssueCertificate: (grade: number) => void;
}

export default function InteractivePlayer({
  course,
  lessons,
  progress,
  onToggleLessonCompleted,
  onBackToCourses,
  currentUser,
  certificate,
  onIssueCertificate
}: InteractivePlayerProps) {
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // States
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [lessonSearchQuery, setLessonSearchQuery] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [videoProgress, setVideoProgress] = useState(0); // 0 to 100
  const [pdfZoom, setPdfZoom] = useState(100); // percentage
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [videoPlayError, setVideoPlayError] = useState(false);

  // Filter lessons based on inner query
  const filteredLessons = React.useMemo(() => {
    if (!lessonSearchQuery.trim()) return lessons;
    const query = lessonSearchQuery.toLowerCase().trim();
    return lessons.filter(l => 
      l.title.toLowerCase().includes(query) || 
      (l.description && l.description.toLowerCase().includes(query))
    );
  }, [lessons, lessonSearchQuery]);
  
  // Lesson Quiz State
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [lessonQuizSubmitted, setLessonQuizSubmitted] = useState(false);
  const [lessonQuizScore, setLessonQuizScore] = useState(0);

  // Course Final Exam State
  const [showFinalExam, setShowFinalExam] = useState(false);
  const [examAnswers, setExamAnswers] = useState<Record<string, number>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examScore, setExamScore] = useState(0);
  const [examPassed, setExamPassed] = useState(false);

  const activeLesson = lessons[activeLessonIndex] || null;

  // Helper to dynamically resolve public or secure redirected R2 stream links
  const getPlayableMediaUrl = React.useCallback((url: string | undefined): string => {
    if (!url) return '';
    // Return standard public cloud URL (Cloudflare R2 public subdomain, Cloudinary, or relative server path)
    // directly so that videos stream at maximum speed with full worldwide public access, bypassing server proxies.
    return url;
  }, []);

  // Keep track of all created Blob URLs so we can clean them up on unmount without breaking active views
  const createdBlobUrlsRef = React.useRef<string[]>([]);

  useEffect(() => {
    return () => {
      // Cleanup all blob URLs on unmount to avoid memory leaks
      createdBlobUrlsRef.current.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          console.warn('Error revoking blob URL on unmount:', e);
        }
      });
    };
  }, []);

  // Blob loading state for PDF to bypass target="_blank" sandbox & reverse proxy authentication barriers
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loadingPdfBlob, setLoadingPdfBlob] = useState(false);

  useEffect(() => {
    const lessonMedia = activeLesson?.mediaUrl || (activeLesson as any)?.videoUrl;
    if (activeLesson?.type !== 'pdf' || !lessonMedia) {
      setPdfBlobUrl(null);
      setLoadingPdfBlob(false);
      return;
    }

    let isMounted = true;
    setLoadingPdfBlob(true);

    const playableUrl = getPlayableMediaUrl(lessonMedia);

    fetch(playableUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load PDF asset (${response.status})`);
        }
        return response.blob();
      })
      .then(blob => {
        if (!isMounted) return;
        const objectUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        createdBlobUrlsRef.current.push(objectUrl);
        setPdfBlobUrl(objectUrl);
        setLoadingPdfBlob(false);
      })
      .catch(err => {
        console.warn('PDF blob loading caution (falling back to direct CDN link):', err);
        if (!isMounted) return;
        // Strip out the custom parsing if the proxy doesn't support the file directly
        setPdfBlobUrl(playableUrl);
        setLoadingPdfBlob(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeLesson?.id, activeLesson?.mediaUrl, (activeLesson as any)?.videoUrl]);

  // Track video mock timeline (fallback if no real video element is mounted)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && activeLesson?.type === 'video') {
      if (!videoRef.current) {
        interval = setInterval(() => {
          setVideoProgress((prev) => {
            const nextVal = prev + (1.5 * playbackSpeed);
            return nextVal >= 100 ? 100 : nextVal;
          });
        }, 1000);
      }
    }
    return () => clearInterval(interval);
  }, [isPlaying, activeLesson, playbackSpeed]);

  // Handle video mock timeline completion side effects safely
  useEffect(() => {
    if (activeLesson?.type === 'video' && !videoRef.current && videoProgress >= 100 && isPlaying) {
      setIsPlaying(false);
      if (!progress.has(activeLesson.id)) {
        onToggleLessonCompleted(activeLesson.id);
      }
    }
  }, [videoProgress, isPlaying, activeLesson, progress, onToggleLessonCompleted]);

  // Sync real video play/pause status and playbackSpeed
  useEffect(() => {
    if (activeLesson?.type === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, activeLessonIndex]);

  useEffect(() => {
    if (activeLesson?.type === 'video' && videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, activeLessonIndex]);

  // Reset lesson specific states on active lesson change
  useEffect(() => {
    setIsPlaying(false);
    setVideoProgress(0);
    setCurrentSlideIndex(0);
    setSelectedAnswers({});
    setLessonQuizSubmitted(false);
    setLessonQuizScore(0);
    setVideoPlayError(false);
  }, [activeLessonIndex]);

  // Calculate percentage
  const completedCount = lessons.filter(l => progress.has(l.id)).length;
  const completionPercentage = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
  const isCourseFullyCompleted = completionPercentage === 100;

  // Specific exam questions for each course
  const getExamQuestions = (courseId: string): QuizQuestion[] => {
    if (courseId.includes('safety')) {
      return [
        {
          id: 'fe-s1',
          question: 'ما هي الخطوة الأولى المسؤولة في مكافحة الحوادث الميدانية وفق مبادئ السلامة الاستباقية؟',
          options: [
            'التحليل الشامل لمخاطر العمل JSA وتوفير تصاريح ملائمة وإقصاء مسببات الهلاك المباشرة',
            'الاتفاق مع شركات التأمين والتغاضي عن تفتيش الخوذات لتوفير الوقت',
            'التنبيه الصوتي فقط دون إمداد العمال بأقنعة للغازات الكاوية الكيميائية',
            'إرجاء التحقيق في الإصابة لما بعد انتهاء الشهر الحالي'
          ],
          correctAnswerIndex: 0
        },
        {
          id: 'fe-s2',
          question: 'أي من العناصر التالية يعد ركيزة أساسية لتكوين الحريق وبقاء اشتعاله مستعراً بالمنشأة؟',
          options: [
            'ثاني أكسيد الكربون، والنيتروجين، والبرودة القارسة المستقرة',
            'الرباعي الحريقه: الحرارة، والأكسجين المتاح، والوقود الملائم، والتفاعل الكيميائي المستمر',
            'الرمل الجيري الجاف والغطاء المنسوج المخصص للحرائق السطحية',
            'الأرجون النقي وعزل الهواء'
          ],
          correctAnswerIndex: 1
        },
        {
          id: 'fe-s3',
          question: 'في حالة وقوع تسرب مكثف لغاز H2S القاتل، كيف يجب أن يكون اتجاه إجلاء عمال الحفر البترولي فوراً؟',
          options: [
            'المسار مع اتجاه الرياح الهابطة والجلوس في الخنادق القاعية الأقل ارتفاعاً',
            'التوجه في خط عمودي أو عكس اتجاه هبوب الرياح والنزوح للمرتفعات الآمنة الشاهقة بموجب الإرشادات',
            'الاختباء في المبرّدات المغلقة دون اتخاذ قنوات اتصال',
            'مواصلة العمل حتى يصدر أمر رسمي آخر من مكاتب العاصمة'
          ],
          correctAnswerIndex: 1
        },
        {
          id: 'fe-s4',
          question: 'ما هو الحد المقبول والمعتمد للتبليغ السريع الفيدرالي في إصابة المنشآت الصناعية الكبرى حسب تشريع الأوشا؟',
          options: [
            'التأخير لثمانية وثلاثين يوماً',
            'إشعار الهيئة والمهندس المسؤول خلال 8 ساعات بمجرد حدوث الوفاة وصعوبة الإسعاف الموقعي',
            'عدم الإبلاغ نهائياً عند توفير رعاية خاصة محلية',
            'ملاحظة السجلات السنوية فقط'
          ],
          correctAnswerIndex: 1
        },
        {
          id: 'fe-s5',
          question: 'تعتبر النظارات البلاستيكية والخوّذ الصلبة وسدادات السمع المزدوجة جزءاً لا يتجزأ من مسمى:',
          options: [
            'أجهزة العرض واللوحات الكلاسيكية لخط الائتمان الدائري',
            'معدات الوقاية والحماية الشخصية لدرء الضجيج وحطام الماكينات (PPE)',
            'مواد مسكنة يستهلكها عمال الكهرباء بالمكاتب الجافة',
            'مستلزمات الديكور والصيانة الإدارية'
          ],
          correctAnswerIndex: 1
        }
      ];
    } else if (courseId.includes('quality')) {
      return [
        {
          id: 'fe-q1',
          question: 'ما هو الهدف الجوهري الذي تقرّه المستويات المتقدمة لحزام الجودة والسيجما السادسة؟',
          options: [
            'الوصول لأعلى هامش تصنيع، مع السماح بنصف عيوب الإنتاج طالما النقل مستمراً',
            'حصر العيوب التشغيلية في الموازنة الكلية وتقليص التشتت لنسبة 3.4 جزء من المليون خطوة أو هجمة صناعية',
            'التخلي التام عن المدخلات البشرية والاعتماد فقط على المكنسة الميكانيكية لتقليص الأتربة الكلية',
            'تطبيق استراتيجية الـ PDF'
          ],
          correctAnswerIndex: 1
        },
        {
          id: 'fe-q2',
          question: 'ماذا يرمز إليه المحور المسمى (Analyze) في منهج التطوير الشهير DMAIC؟',
          options: [
            'تحليل وحصر المسببات والعيوب الحقيقية الجذرية للمشكلات لاستبعاد الآثار المضللة والوصول للحقائق',
            'الاعتذار للشركاء الخارجيين ونشر تقارير صحفية عامة',
            'إلغاء خط الإنتاج بالكلية واستئجار كوادر مستحدثة لعدم إضاعة الوقت',
            'تحصيل العوائد السنوية للمساهمين بالشركة'
          ],
          correctAnswerIndex: 0
        },
        {
          id: 'fe-q3',
          question: 'يعزى الفضل للأداة التوثيقية "عظمة السمكة" أو مخطط "إيشيكاوا" في المساعدة في:',
          options: [
            'معالجة وجبات الأسماك داخل المنشآت النفطية البحرية',
            'تجسيد المشكلة المحورية وتحليل كافة الأسباب الموزعة لمحاورها الرئيسية والفرعية كالبشر والمعدات والجو',
            'تخزين بيانات الأيزو وتزوير الاختام السنوية للمؤسسة',
            'حساب وتوتير المبيعات اليومية'
          ],
          correctAnswerIndex: 1
        },
        {
          id: 'fe-q4',
          question: 'ما هو معيار الجودة العالمي الأكثر مبيعاً وشهرة في تطبيق نظام إدارة الجودة التنظيمي بالمؤسسات التجارية؟',
          options: [
            'الـ ISO 14001 الخاص بإدارة شؤون البيئة والتشجير',
            'الـ ISO 9001:2015 المخصص لتنظيم متطلبات وتطلعات العملاء وضمان مطابقة الأداء والعمل',
            'شهادة الفيفا للتحكيم الرياضي الدولي',
            'رخص قيادة المركبات الثقيلة'
          ],
          correctAnswerIndex: 1
        },
        {
          id: 'fe-q5',
          question: 'عند تحليل مخطط "باريتو" لإصلاح العيوب الهندسية، ننطلق من قاعدة مبنية على فلسفة:',
          options: [
            'تحسين كل شيء بالتساوي دون الإكتراث بالنفقات الفائتة',
            'حل الـ 20٪ من المسببات الأكثر إلحاحاً لإقصاء وتلاشي 80٪ من المشاكل الكبرى المزعجة للمؤسسة',
            'تشغيل الآلات بأقصى طاقة وحجب بيانات الفنيين',
            'مبدأ الميزانية المتضاعفة'
          ],
          correctAnswerIndex: 1
        }
      ];
    } else {
      // Default / general / programming / accounting
      return [
        {
          id: 'fe-g1',
          question: 'ما هي عمارة تشغيل تطبيقات الصفحة الواحدة (SPA) في بيئات برمجيات وتطبيقات رياكت؟',
          options: [
            'إنشاء قوالب ورقية وإرسالها بالبريد مع كراس العمل الموحد',
            'تحديث الواجهات والبيانات في المتصفح محلياً وبشكل فوري وحيوي دون الاضطرار لإعادة تحميل وتحديث كامل الموقع الكلي',
            'استخدام خطوط الهاتف العتيقة لنشر الشيفرة وعزل قواعد جلب الويب',
            'حصر الذاكرة الداخلية للهواتف والأجهزة فقط'
          ],
          correctAnswerIndex: 1
        },
        {
          id: 'fe-g2',
          question: 'في منهج البرمجة والتطوير، لتجنب حدوث عمليات إعادة الرسم والتحميل الدائري اللانهائي في رياكت، يوجب استقرار مصفوفة التبعية لخطاف:',
          options: [
            'useRef بشكل تماثلي وبلا قيود',
            'useEffect وتمرير المصفوفة الأنسب للتحكم بدقة أو تركها فارغة لتعمل عند إقلاع المشهد الأولي الفوري فقط',
            'العقد البرمجية المحلية المباشرة',
            'أمر console.log'
          ],
          correctAnswerIndex: 1
        },
        {
          id: 'fe-g3',
          question: 'النسبة المعتمدة السارية لضريبة القيمة المضافة (VAT) في المملكة العربية السعودية ومسجلة في القوائم المحاسبية هي:',
          options: [
            '10 ٪ فقط',
            '15 ٪ من القيمة الإجمالية للسلعة أو الخدمة المحصلة أو المستوردة',
            '25 ٪ كاملة لتسوية الأصول والالتزامات الحركية بالبنوك',
            'لا توجد ضريبة قيمة مضافة'
          ],
          correctAnswerIndex: 1
        },
        {
          id: 'fe-g4',
          question: 'ما هو مبدأ القيد المزدوج الأساسي لدفاتر الصندوق المحاسبي الخليجي؟',
          options: [
            'أن كل عملية مالية للشركة تؤثر بصورة ممتدة ومتساوية على طرفين على الأقل: طرف مدين (آخذ) وطرف دائن (معطي)',
            'تسجيل النفقات بأسماء الموظفين على أوراق مبعثرة وتفادي تدوينها بالبرامق المعتمدة',
            'مضاعفة الأرقام كعربون لموثوقية البنوك الاستثمارية الكبرى',
            'تسجيل المدخلات على المروحة السنوية بالشركة'
          ],
          correctAnswerIndex: 0
        },
        {
          id: 'fe-g5',
          question: 'تقاس السرعة الجوية في معدات قمرة الطائرات للملاحة عن طريق أنبوب القياس الهيدروستاتيكي الشهير باسم:',
          options: [
            'أنبوب بيتو (Pitot Tube) المعتمد لمقارنة ضغط الاصطدام مع الضغط الساكن المحيط وتحديد سرعة التقدم بالعقدة الجوية',
            'خرطوم الحرارة الوقائي لغرف الأمتعة السفلية',
            'العداد البوقي ومضخم الترددات الخلوية',
            'صمامات غسيل التروس المعدنية'
          ],
          correctAnswerIndex: 0
        }
      ];
    }
  };

  const examQuestions = getExamQuestions(course.id);

  // Submit Lesson-level Quiz
  const handleLessonQuizSubmit = () => {
    let score = 0;
    const questions = activeLesson?.quizQuestions || [];
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswerIndex) {
        score++;
      }
    });
    setLessonQuizScore(score);
    setLessonQuizSubmitted(true);

    // If passed or completed, mark lesson as checked
    if (!progress.has(activeLesson.id)) {
      onToggleLessonCompleted(activeLesson.id);
    }
  };

  // Submit Course Final Exam
  const handleFinalExamSubmit = () => {
    let score = 0;
    examQuestions.forEach((q) => {
      if (examAnswers[q.id] === q.correctAnswerIndex) {
        score++;
      }
    });
    const percentage = Math.round((score / examQuestions.length) * 100);
    setExamScore(percentage);
    setExamSubmitted(true);
    
    if (percentage >= 70) {
      setExamPassed(true);
      onIssueCertificate(percentage);
    } else {
      setExamPassed(false);
    }
  };

  // Reset exam to try again
  const handleRetryExam = () => {
    setExamAnswers({});
    setExamSubmitted(false);
    setExamScore(0);
    setExamPassed(false);
  };

  // Trigger browser print for certificate element
  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 font-sans text-right" id="course-player-container">
      
      {/* Back to courses banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6" id="player-breadcrumb">
        <button
          onClick={onBackToCourses}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-amber-600 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200"
          id="back-courses-header-btn"
        >
          <ArrowRight className="h-4.5 w-4.5" />
          <span>العودة لكافة الكورسات والمسارات</span>
        </button>

        <div className="text-right">
          <span className="text-xs bg-amber-500/10 text-amber-600 font-bold px-2.5 py-1 rounded-full border border-amber-500/20">
            {course.level}
          </span>
          <span className="text-slate-400 text-xs mr-3">مدة المسار الكلية: {course.duration}</span>
        </div>
      </div>

      {/* Main Course Title Banner */}
      <div className="bg-slate-900 border border-slate-850 p-6 md:p-8 rounded-3xl text-white mb-8 shadow-xl relative overflow-hidden" id="course-info-banner">
        <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -ml-16 -mt-16 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {course.title}
            </h1>
            <p className="text-sm text-slate-350 leading-relaxed max-w-xl font-normal">
              {course.description}
            </p>
            <div className="flex items-center gap-4 pt-2 text-xs text-slate-450 font-medium">
              <span>المدرب: <strong className="text-amber-400 font-semibold">{course.instructor}</strong></span>
              <span>•</span>
              <span>المحاضرات: {lessons.length}</span>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/50 p-5 rounded-2xl flex flex-col items-center justify-center min-w-[200px]" id="completion-progress-card">
            <span className="text-amber-500 font-black text-3xl mb-1">{completionPercentage}%</span>
            <span className="text-xs text-slate-400 font-medium mb-3">نسبة إنجازك للمسار الحالي</span>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-amber-500 h-2 rounded-full transition-all duration-550"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Course Sidebar (right) & Player Viewport (left) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="player-grid">
        
        {/* Left Column - Lesson Viewport / Final Exam Area (Lg: 8 cols) */}
        <div className="lg:col-span-8 space-y-6" id="player-viewport">
          
          {/* Main learning screen */}
          {!showFinalExam ? (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-lg" id="lesson-viewport-card">
              
              {/* Active Lesson header */}
              <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-center justify-between" id="viewport-header">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-lg shrink-0">
                    {activeLesson?.type === 'video' && <Video className="h-5 w-5" />}
                    {activeLesson?.type === 'presentation' && <BookOpen className="h-5 w-5" />}
                    {activeLesson?.type === 'pdf' && <FileText className="h-5 w-5" />}
                    {activeLesson?.type === 'quiz' && <HelpCircle className="h-5 w-5" />}
                  </div>
                  <div>
                    <h2 className="font-extrabold text-slate-900 text-base md:text-lg">
                      {activeLesson?.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">مدة دراسة المحاضرة المقترحة: {activeLesson?.duration}</p>
                  </div>
                </div>

                <button
                  onClick={() => onToggleLessonCompleted(activeLesson.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    progress.has(activeLesson.id)
                      ? 'bg-emerald-50 text-emerald-750 border-emerald-205'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  id="mark-completed-btn"
                >
                  <CheckCircle2 className={`h-4 w-4 ${progress.has(activeLesson.id) ? 'text-emerald-500 fill-emerald-100' : 'text-slate-400'}`} />
                  <span>{progress.has(activeLesson.id) ? 'مكتملة (اضغط للتراجع)' : 'تحديد كمقروءة'}</span>
                </button>
              </div>

              {/* Active Content Box */}
              <div className="p-6 md:p-8" id="viewport-body">
                
                {/* 1. Video Lesson */}
                {activeLesson?.type === 'video' && (
                  <div className="space-y-6" id="video-lesson-content">
                    <div className="rounded-2xl overflow-hidden bg-slate-950 aspect-video relative group border border-slate-900 shadow-inner flex flex-col items-center justify-center text-white">
                      
                      {/* Interactive Visual/Video elements overlay */}
                      <div className="absolute inset-0 bg-slate-955/40 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity z-10 flex flex-col justify-between p-4 pointer-events-none">
                        <div className="flex justify-between items-center w-full">
                          <span className="bg-slate-950/80 text-[10px] px-2.5 py-1 rounded-full border border-slate-700 text-amber-400">
                            فيديو تعليمي تجريبي
                          </span>
                          <span className="text-[10px] text-slate-200">
                            {playbackSpeed}x :سرعة التشغيل
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs text-slate-300 mt-auto bg-slate-950/70 p-3 rounded-lg backdrop-blur-sm border border-slate-800 pointer-events-auto">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                if (videoProgress >= 100) setVideoProgress(0);
                                setIsPlaying(!isPlaying);
                              }}
                              className="bg-amber-500 text-slate-950 p-1.5 rounded-full hover:bg-amber-400 hover:scale-105 transition-all cursor-pointer"
                              title={isPlaying ? "إيقاف مؤقت" : "تشغيل المحاضرة"}
                            >
                              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-slate-950" />}
                            </button>
                            <button 
                              onClick={() => {
                                setVideoProgress(0);
                                if (videoRef.current) videoRef.current.currentTime = 0;
                              }}
                              className="text-slate-400 hover:text-white cursor-pointer"
                              title="إعادة المحاضرة من الأول"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="flex-1 mx-4">
                            <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden relative cursor-pointer" onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const clickX = e.clientX - rect.left;
                              const percentage = Math.round((clickX / rect.width) * 100);
                              setVideoProgress(percentage);
                              if (videoRef.current && videoRef.current.duration) {
                                videoRef.current.currentTime = (percentage / 100) * videoRef.current.duration;
                              }
                            }}>
                              <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${videoProgress}%` }}></div>
                            </div>
                          </div>

                          <span className="font-mono text-[10px] min-w-[32px]">
                            {Math.round(videoProgress)}%
                          </span>
                        </div>
                      </div>

                      {/* Real HTML5 Video element or simulation fallback */}
                      {(activeLesson?.mediaUrl || (activeLesson as any)?.videoUrl) && !videoPlayError ? (
                        <video
                          key={activeLesson.id}
                          ref={videoRef}
                          src={getPlayableMediaUrl(activeLesson.mediaUrl || (activeLesson as any)?.videoUrl)}
                          className="w-full h-full object-contain"
                          playsInline
                          preload="metadata"
                          onTimeUpdate={() => {
                            if (videoRef.current && videoRef.current.duration) {
                              const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
                              setVideoProgress(pct || 0);
                            }
                          }}
                          onEnded={() => {
                            setIsPlaying(false);
                            setVideoProgress(100);
                            if (!progress.has(activeLesson.id)) {
                              onToggleLessonCompleted(activeLesson.id);
                            }
                          }}
                          onError={(e) => {
                            const err = e.currentTarget.error;
                            console.warn("HTML5 Video playback event check:", err ? { code: err.code, message: err.message } : "Unknown event error");
                            
                            // Only trigger fatal playback errors for real codec decode (3) or entirely unsupported source formatting (4)
                            if (err) {
                              if (err.code === 3 || err.code === 4) {
                                console.error("Fatal browser video error detected:", err.code);
                                setVideoPlayError(true);
                              } else {
                                console.log("Ignored transient media progress/abort code:", err.code);
                              }
                            } else {
                              console.log("Ignored unclassified video event to ensure highest compatibility on Safari/Chromium.");
                            }
                          }}
                        />
                      ) : videoPlayError ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900 border-b border-slate-800 space-y-4">
                          <AlertCircle className="h-12 w-12 text-rose-500 animate-bounce" />
                          <div className="space-y-1">
                            <h3 className="font-bold text-sm text-slate-250">صيغة الفيديو أو الرابط غير مدعوم بالكامل في متصفحك</h3>
                            <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed">
                              ربما لم تتوافق صيغة ملف الـ MP4 مع متصفحك أو حدثت مشكلة في تحميله من سيران المزود. لا تقلق، يمكنك تشغيل محاكاة المحاضرة بالموقع أو فتح وتحميل ملف الفيديو برابط مباشر ومتابعة الدرس فوراً!
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <a 
                              href={getPlayableMediaUrl(activeLesson.mediaUrl || (activeLesson as any)?.videoUrl)} 
                              target="_blank" 
                              rel="noreferrer"
                              className="bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-amber-400 transition-all text-[11px] cursor-pointer"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>تحميل وتشغيل الفيديو مباشرة</span>
                            </a>
                            <button
                              onClick={() => {
                                setVideoPlayError(false);
                                setIsPlaying(true);
                              }}
                              className="bg-slate-800 hover:bg-slate-750 text-slate-200 px-3 py-2 rounded-xl text-[11px] font-bold border border-slate-700"
                            >
                              تشغيل المحاكاة التعليمية
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900 border-b border-slate-800">
                          <Video className={`h-16 w-16 mb-4 ${isPlaying ? 'text-amber-500 rotate-12 transition-all duration-700 animate-pulse' : 'text-slate-600'}`} />
                          <h3 className="font-bold text-base text-slate-200">
                            {isPlaying ? 'جاري تشغيل محاكاة المحاضرة الحيوية...' : 'تم إيقاف تشغيل المحاضرة مؤقتاً'}
                          </h3>
                          <p className="text-xs text-slate-400 max-w-sm mt-2">
                            يقوم النظام بحفظ نسبة مشاهدتك ومتابعتك للدرس. يمكنك الضغط على "تحديد كمقروءة" في الأعلى في أي وقت لتأكيد انتهاء الدرس وحفظ تقدمك يدويًا.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Speed controllers & triggers */}
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-600">سرعة تشغيل الفيديو المحاكي:</span>
                        <div className="flex gap-1">
                          {[1, 1.25, 1.5, 2].map((speed) => (
                            <button
                              key={speed}
                              onClick={() => setPlaybackSpeed(speed)}
                              className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                                playbackSpeed === speed
                                  ? 'bg-slate-900 text-amber-400 border border-slate-850'
                                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                              }`}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setVideoProgress(100);
                          setIsPlaying(false);
                          if (!progress.has(activeLesson.id)) onToggleLessonCompleted(activeLesson.id);
                        }}
                        className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-bold px-4 py-2 rounded-xl transition-all"
                      >
                        تخطي الفيديو وتعليم الدرس كمكتمل
                      </button>
                    </div>

                    {/* Textual descriptions underneath video */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-150">
                      <h4 className="font-bold text-slate-800 text-sm mb-2">عن هذه المحاضرة المرئية:</h4>
                      <p className="text-xs leading-relaxed text-slate-600 font-normal">
                        {activeLesson.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. Presentation Slideshow */}
                {activeLesson?.type === 'presentation' && activeLesson?.slides && (
                  <div className="space-y-6" id="presentation-lesson-content">
                    
                    <div className="bg-gradient-to-br from-slate-900 to-slate-850 text-white p-6 md:p-8 rounded-2xl border border-slate-800 shadow-inner min-h-[300px] flex flex-col justify-between transition-all duration-300">
                      
                      {/* Slide Indicator header */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                        <span className="text-xs bg-amber-500/20 text-amber-400 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/35">
                          العرض التقديمي الشامل
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          شريحة {currentSlideIndex + 1} من {activeLesson.slides.length}
                        </span>
                      </div>

                      {/* Active Slide Body */}
                      <div className="my-auto space-y-4 text-slate-200">
                        <h3 className="font-extrabold text-lg md:text-xl text-amber-400 border-r-4 border-amber-500 pr-3 leading-tight">
                          {activeLesson.slides[currentSlideIndex].title}
                        </h3>
                        <ul className="space-y-2.5 text-xs md:text-sm pr-1">
                          {activeLesson.slides[currentSlideIndex].content.map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 leading-relaxed text-slate-300">
                              <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0 mt-2"></span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Slide Controllers */}
                      <div className="flex items-center justify-between mt-6 pt-3 border-t border-slate-800/60 text-slate-400">
                        <button
                          onClick={() => currentSlideIndex > 0 && setCurrentSlideIndex(currentSlideIndex - 1)}
                          disabled={currentSlideIndex === 0}
                          className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-750 disabled:opacity-40 disabled:hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl border border-slate-700/60 transition-all cursor-pointer disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="h-4 w-4" />
                          <span>السابق</span>
                        </button>

                        <button
                          onClick={() => {
                            if (currentSlideIndex < (activeLesson.slides?.length || 1) - 1) {
                              setCurrentSlideIndex(currentSlideIndex + 1);
                            } else {
                              // If final slide, auto-complete
                              if (!progress.has(activeLesson.id)) {
                                onToggleLessonCompleted(activeLesson.id);
                              }
                            }
                          }}
                          className="flex items-center gap-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 rounded-xl transition-all font-bold cursor-pointer"
                        >
                          <span>{currentSlideIndex === (activeLesson.slides?.length || 1) - 1 ? 'إنهاء وحفظ الركائز' : 'التالي'}</span>
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                      </div>

                    </div>

                    <div className="bg-amber-500/10 text-amber-800 border border-amber-500/20 rounded-2xl p-4 text-xs font-normal leading-relaxed">
                      💡 <strong>توجيه إداري:</strong> يرجى تصفح كامل الشرائح التعليمية المخصصة وتدوين الأسئلة قبل المرور للاختبار القصير لضمان تحصيل مخرجات ممتازة.
                    </div>
                  </div>
                )}

                {/* 3. PDF Document Reader */}
                {activeLesson?.type === 'pdf' && (
                  <div className="space-y-6" id="pdf-lesson-content">
                    
                    {/* Embedded PDF File Viewer */}
                    {(activeLesson?.mediaUrl || (activeLesson as any)?.videoUrl) ? (
                      <div className="space-y-4">
                        <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="font-extrabold text-slate-800">تحميل واستعراض المذكرة التعليمية المرفقة:</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {loadingPdfBlob ? (
                              <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 font-bold px-4 py-2 rounded-xl text-[11px]">
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                                <span>جاري تهيئة الملف للمعاينة والتنزيل...</span>
                              </div>
                            ) : (
                              <a 
                                href={pdfBlobUrl || getPlayableMediaUrl(activeLesson.mediaUrl || (activeLesson as any)?.videoUrl)} 
                                download={`${activeLesson.title}.pdf`}
                                className="bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-amber-400 transition-all text-[11px] shadow-sm cursor-pointer"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span>تحميل مباشر للكمبيوتر / الجوال</span>
                              </a>
                            )}
                          </div>
                        </div>

                        {loadingPdfBlob ? (
                          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-slate-200 h-[400px] bg-slate-55/40 space-y-3">
                            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                            <p className="text-xs font-bold text-slate-600">جاري تأمين وتهيئة ملف المذكرة وحلها من عوائق الترخيص...</p>
                            <span className="text-[10px] text-slate-400">يرجى الانتظار ثوانٍ معدودة</span>
                          </div>
                        ) : (
                          <div className="relative rounded-2xl border-2 border-slate-200 overflow-hidden bg-white shadow-sm h-[550px] w-full">
                            <iframe
                              src={pdfBlobUrl ? pdfBlobUrl : (getPlayableMediaUrl(activeLesson.mediaUrl || (activeLesson as any)?.videoUrl) ? `${getPlayableMediaUrl(activeLesson.mediaUrl || (activeLesson as any)?.videoUrl)}#toolbar=1&navpanes=0&scrollbar=1` : '')}
                              className="w-full h-full border-0"
                              title={activeLesson.title}
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-amber-500/10 text-amber-800 border border-amber-500/25 rounded-2xl p-4 text-xs font-semibold text-center leading-relaxed">
                        💡 لم يتم رفع ملف ورقي سحابي لهذه المذكرة حتى الآن، يرجى الاستعانة بالنصوص التعليمية الملخصة أدناه.
                      </div>
                    )}

                    {/* PDF Written Text Notes Falling Block */}
                    {(activeLesson?.pdfContent || activeLesson?.description) && (
                      <div className="space-y-4 pt-2">
                        <div className="bg-slate-100 border border-slate-200/80 px-4 py-2.5 rounded-2xl flex items-center justify-between gap-4 text-slate-600 text-xs font-semibold">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setPdfZoom(z => Math.max(75, z - 25))}
                              className="p-1 rounded bg-white border border-slate-205 hover:bg-slate-55 flex items-center cursor-pointer"
                              title="تصغير الخط"
                            >
                              <ZoomOut className="h-3.5 w-3.5" />
                            </button>
                            <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-205">{pdfZoom}%</span>
                            <button 
                              onClick={() => setPdfZoom(z => Math.min(150, z + 25))}
                              className="p-1 rounded bg-white border border-slate-205 hover:bg-slate-55 flex items-center cursor-pointer"
                              title="تكبير الخط"
                            >
                              <ZoomIn className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <span className="text-[10px] text-slate-500 font-bold hidden sm:block">ملخص ونصوص المذكرة التعليمية</span>

                          <button
                            onClick={() => {
                              const textToCopy = activeLesson.pdfContent || activeLesson.description || '';
                              navigator.clipboard.writeText(textToCopy);
                              alert('تم نسخ الكتيب التعليمي بنجاح إلى الحافظة.');
                            }}
                            className="bg-white border border-slate-205 px-3 py-1 rounded text-[10px] font-bold hover:bg-slate-55 transition-all text-slate-700 cursor-pointer"
                          >
                            نسخ نص الدليل
                          </button>
                        </div>

                        {/* PDF Reading Paper layout */}
                        <div 
                          className="bg-[#fcfbf9] border-2 border-slate-200 rounded-2xl p-6 md:p-8 shadow-inner overflow-y-auto max-h-[400px] border-b-4 border-slate-300"
                          style={{ fontSize: `${pdfZoom}%` }}
                          id="pdf-document-paper"
                        >
                          <pre className="whitespace-pre-wrap font-sans text-xs md:text-sm text-slate-800 leading-relaxed font-normal text-right">
                            {activeLesson.pdfContent || activeLesson.description}
                          </pre>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center pt-2">
                      <button
                        onClick={() => {
                          if (!progress.has(activeLesson.id)) onToggleLessonCompleted(activeLesson.id);
                        }}
                        className="bg-slate-900 text-amber-500 font-bold text-xs py-2.5 px-6 rounded-xl hover:bg-slate-805 transition-all shadow-md cursor-pointer"
                      >
                        لقد أكملت قراءة وفهم الملف الورقي
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. Lesson Micro-Quiz */}
                {activeLesson?.type === 'quiz' && activeLesson?.quizQuestions && (
                  <div className="space-y-6" id="quiz-lesson-content">
                    <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 space-y-6">
                      <p className="text-xs text-slate-500 leading-relaxed font-bold border-b border-slate-200 pb-3">
                        يرجى الإجابة على الأسئلة القصيرة التالية بدقة، الإجابة تمنحك حفظاً فورياً لعلامة المحاضرة كأداء تفاعلي.
                      </p>

                      {activeLesson.quizQuestions.map((q, questionIndex) => (
                        <div key={q.id} className="space-y-3" id={`lesson-q-${q.id}`}>
                          <h4 className="font-extrabold text-slate-900 text-sm leading-relaxed">
                            {questionIndex + 1}. {q.question}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {q.options.map((opt, optIndex) => {
                              const isSelected = selectedAnswers[q.id] === optIndex;
                              const isCorrect = q.correctAnswerIndex === optIndex;
                              let btnClass = "bg-white hover:bg-slate-100/80 border-slate-200 text-slate-700";

                              if (lessonQuizSubmitted) {
                                if (isSelected) {
                                  btnClass = isCorrect 
                                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-900 bold" 
                                    : "bg-rose-500/10 border-rose-500 text-rose-900";
                                } else if (isCorrect) {
                                  btnClass = "bg-emerald-500/10 border-emerald-500 text-emerald-900";
                                } else {
                                  btnClass = "bg-white opacity-60 border-slate-200 text-slate-400";
                                }
                              } else if (isSelected) {
                                btnClass = "bg-slate-900 border-slate-900 text-white font-semibold";
                              }

                              return (
                                <button
                                  key={optIndex}
                                  onClick={() => !lessonQuizSubmitted && setSelectedAnswers(prev => ({ ...prev, [q.id]: optIndex }))}
                                  disabled={lessonQuizSubmitted}
                                  className={`w-full py-2 px-3 text-right text-xs rounded-xl border text-slate-750 transition-all ${btnClass}`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {/* Submit controls */}
                      {!lessonQuizSubmitted ? (
                        <div className="pt-4 border-t border-slate-200 flex justify-end">
                          <button
                            onClick={handleLessonQuizSubmit}
                            disabled={Object.keys(selectedAnswers).length < (activeLesson.quizQuestions?.length || 0)}
                            className="bg-amber-500 disabled:opacity-40 text-slate-950 font-bold px-6 py-2 rounded-xl text-xs transition-all disabled:cursor-not-allowed cursor-pointer shadow-md hover:bg-amber-400"
                          >
                            إرسال الإجابات للتصحيح
                          </button>
                        </div>
                      ) : (
                        <div className="pt-4 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="text-right">
                            <span className="font-bold text-sm text-slate-800">
                              درجتك الإجمالية: <strong className="text-amber-600 font-extrabold">{lessonQuizScore}</strong> من أصل {activeLesson.quizQuestions.length}
                            </span>
                            <p className="text-[11px] text-slate-500 mt-0.5">تم تسجيل إتمام هذه المحاضرة في كرت التقدم.</p>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedAnswers({});
                              setLessonQuizSubmitted(false);
                            }}
                            className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl transition-all font-semibold"
                          >
                            <RotateCcw className="h-4 w-4" />
                            <span>إعادة محاولة الاختبار</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* Prev / Next footer */}
              <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between" id="viewport-footer">
                <button
                  onClick={() => activeLessonIndex > 0 && setActiveLessonIndex(activeLessonIndex - 1)}
                  disabled={activeLessonIndex === 0}
                  className="flex items-center gap-1 text-xs text-slate-600 hover:text-amber-600 disabled:opacity-40 disabled:hover:text-slate-650 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span>المحاضرة السابقة</span>
                </button>

                {activeLessonIndex < lessons.length - 1 ? (
                  <button
                    onClick={() => setActiveLessonIndex(activeLessonIndex + 1)}
                    className="flex items-center gap-1 text-xs text-slate-600 hover:text-amber-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 font-semibold"
                  >
                    <span>المحاضرة التالية</span>
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    وصلت إلى نهاية الدروس
                  </span>
                )}
              </div>

            </div>
          ) : (
            
            /* SHOW THE FINAL EXAM PORTAL */
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-lg p-6 md:p-8 space-y-6 text-right" id="final-exam-viewport">
              <div className="flex items-center justify-between border-b border-slate-150 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shadow-md">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-slate-900 text-lg md:text-xl">بوابة الاختبار التأهيلي النهائي</h2>
                    <p className="text-slate-500 text-xs mt-0.5">مسار: {course.title}</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowFinalExam(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!examSubmitted ? (
                /* EXAM QUESTIONS WIZARD */
                <div className="space-y-6">
                  <div className="bg-amber-500/10 text-amber-900 border border-amber-500/20 p-4 rounded-2xl text-xs md:text-sm font-semibold leading-relaxed">
                    📑 <strong>شروط الحصول على الشهادة:</strong> يتوجب عليك الحصول على درجة لا تقل عن <b>70٪</b> لاجتياز الدبلوم والحصول على شهادة رسمية بإنهاء المسار من GCC Center. يمكنك المحاولة مجدداً في حال لم توفّق بسنتك الأولى.
                  </div>

                  <div className="space-y-6 pt-2">
                    {examQuestions.map((q, qIdx) => (
                      <div key={q.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3" id={`final-ex-q-${q.id}`}>
                        <h4 className="font-extrabold text-slate-900 text-sm md:text-base leading-relaxed">
                          {qIdx + 1}. {q.question}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          {q.options.map((opt, oIdx) => {
                            const isSelected = examAnswers[q.id] === oIdx;
                            return (
                              <button
                                key={oIdx}
                                onClick={() => setExamAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                                className={`py-2.5 px-3.5 text-right text-xs rounded-xl border transition-all ${
                                  isSelected 
                                    ? 'bg-slate-950 border-slate-950 text-white font-bold shadow-md' 
                                    : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-slate-150 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                      الإجابة على {Object.keys(examAnswers).length} من أصل {examQuestions.length} سؤالاً
                    </span>

                    <button
                      onClick={handleFinalExamSubmit}
                      disabled={Object.keys(examAnswers).length < examQuestions.length}
                      className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 px-8 py-3 rounded-2xl text-xs sm:text-sm font-extrabold shadow-md transition-all disabled:cursor-not-allowed cursor-pointer"
                    >
                      تسليم ورقة الامتحان النهائي
                    </button>
                  </div>
                </div>
              ) : (
                /* EXAM RESULTS DISPLAY */
                <div className="text-center py-6 space-y-6">
                  <div className="flex justify-center">
                    <div className={`h-20 w-20 rounded-full flex items-center justify-center text-3xl font-black ${
                      examPassed ? 'bg-emerald-500/10 text-emerald-600 ring-4 ring-emerald-500/20' : 'bg-rose-500/10 text-rose-500 ring-4 ring-rose-500/20'
                    }`}>
                      {examScore}%
                    </div>
                  </div>

                  <div className="max-w-md mx-auto space-y-2">
                    <h3 className={`text-xl font-extrabold ${examPassed ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {examPassed ? 'ألف مبروك! لقد اجتزت الامتحان بنجاح' : 'لم توفّق في تحقيق نسبة النجاح المطلوبة'}
                    </h3>
                    <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-normal">
                      {examPassed 
                        ? 'لقد بذلت مجهوداً رائعاً في دراسة مقررات هذا الدبلوم الشامل وفهم طرقه السليمة. تم توليد شهادة إتمام موثقة وحصرية باسمك الآن.'
                        : 'حصلت على درجة أقل من 70٪. لا تقلق، يمكنك إعادة مراجعة المحاضرات والمواد المكتوبة والتقديم للاختبار النهائي مجدداً في أي وقت.'
                      }
                    </p>
                  </div>

                  <div className="pt-4 flex flex-wrap gap-4 items-center justify-center">
                    {!examPassed ? (
                      <button
                        onClick={handleRetryExam}
                        className="bg-amber-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition-style hover:bg-amber-450 shadow-md flex items-center gap-2"
                      >
                        <RotateCcw className="h-4.5 w-4.5" />
                        <span>تقديم محاولة جديدة للاختبار</span>
                      </button>
                    ) : (
                      <div className="text-xs text-slate-600 bg-white border border-slate-200/80 p-3 rounded-xl flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500 animate-bounce shrink-0" />
                        <span>تم إصدار الشهادة! يمكنك مشاهدتها في الجانب الأيسر للصفحة.</span>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setShowFinalExam(false);
                        handleRetryExam();
                      }}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl transition-all"
                    >
                      العودة للمحاضرات والدروس
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Certificate Display Area (under exam when passed) */}
          {examPassed && certificate && (
            <div className="bg-white border-2 border-amber-300 rounded-3xl p-4 md:p-6 shadow-xl text-center space-y-6 relative" id="certificate-preview-viewport">
              <div className="absolute top-2 right-2 bg-amber-500/10 text-amber-800 text-[10px] px-2 py-0.5 rounded font-bold">
                نسخة الطالب المعتمدة
              </div>
              <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2 justify-center">
                <Award className="h-5 w-5 text-amber-500 shrink-0" />
                <span>عرض وثيقة إنجاز GCC Center الحصرية للطباعة</span>
              </h3>

              {/* STUNNING CERTIFICATE BOARD */}
              <div 
                className="mx-auto max-w-2xl bg-[#faf9f6] border-[14px] border-double border-amber-955 rounded-2xl p-6 sm:p-10 text-slate-900 text-right font-sans relative shadow-md select-none print:m-0 print:border-8" 
                id="printable-gcc-certificate"
              >
                {/* Certificate Background Elements (Print safe) */}
                <div className="absolute inset-2 border border-amber-950/20 pointer-events-none"></div>
                <div className="absolute bottom-4 left-4 h-14 w-14 bg-amber-500/10 rounded-full flex items-center justify-center text-xs text-amber-950 border border-amber-950/30 font-black tracking-tight" style={{ writingMode: 'vertical-rl' }}>
                  GCC SEAL
                </div>

                {/* Content */}
                <div className="text-center space-y-6 relative z-10">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <GraduationCap className="h-8 w-8 text-amber-700 shrink-0" />
                    <span className="font-extrabold text-sm sm:text-base text-amber-950">المركز الخليجي المشترك للتدريب والتعليم والتشغيل</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-amber-955 drop-shadow-sm font-sans tracking-tight">
                    شهادة إتمام برنامج تدريبي
                  </h2>
                  
                  <div className="text-slate-700 text-xs sm:text-sm space-y-3 pt-2 font-normal leading-relaxed">
                    <p>يشهد المركز الخليجي المشترك والمسؤولون الأكاديميون بأن المتدرب(ة):</p>
                    <p className="text-lg sm:text-xl font-bold text-slate-900 border-b border-dashed border-amber-950/40 inline-block px-10 pb-1.5 mt-2 bg-amber-550/10" dir="rtl">
                      {certificate.userName}
                    </p>
                    <p className="mt-4">قد أكمل بنجاح واجتاز بامتياز المقررات والمتطلبات المقررة للدبلوم الشامل في:</p>
                    <p className="text-sm sm:text-base font-extrabold text-amber-900 px-3 py-1 bg-amber-500/5 rounded-lg border border-amber-500/10 max-w-lg mx-auto leading-relaxed">
                      {certificate.courseTitle}
                    </p>
                    <p className="text-xs pt-1">درجة الاختبار النهائي: <strong className="text-slate-900 font-extrabold">{certificate.grade}%</strong> بنسبة تقدير معتمد من لجان التحكيم الخليجية.</p>
                  </div>

                  {/* Signatures & Stamps Row */}
                  <div className="grid grid-cols-2 gap-4 pt-6 text-right sm:text-center text-slate-800 text-[10px] sm:text-xs font-normal">
                    <div className="space-y-1 bg-slate-100/50 p-2.5 rounded-lg border border-slate-200/50">
                      <p className="text-slate-500">المدرب المشرف:</p>
                      <p className="font-bold text-slate-900">{course.instructor}</p>
                      <p className="italic text-slate-400 text-[9px] font-mono">Verified Signature</p>
                    </div>

                    <div className="space-y-1 bg-slate-100/50 p-2.5 rounded-lg border border-slate-200/50">
                      <p className="text-slate-500">عميد المركز الخليجي:</p>
                      <p className="font-bold text-slate-900">د. عادل الصبيحي</p>
                      <p className="text-green-600 font-bold text-[9px] border border-green-500/30 px-1 py-0.5 rounded-full inline-block bg-green-500/5">STAMPED</p>
                    </div>
                  </div>

                  {/* Serial Footer of Certificate */}
                  <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono flex items-center justify-between pt-4 border-t border-slate-700/10">
                    <span>كود التحقق: {certificate.certificateCode}</span>
                    <span>تاريخ الإصدار الموثق: {certificate.issueDate}</span>
                  </div>
                </div>
              </div>

              {/* Certificate Actions */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handlePrintCertificate}
                  className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
                  id="print-cert-btn"
                >
                  <Printer className="h-4 w-4 shrink-0" />
                  <span>طباعة أو تحميل كـ PDF</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/verify/${certificate.certificateCode}`);
                    alert('تم نسخ رابط التقصي للشهادة! يمكنك مشاركته مع أصحاب العمل.');
                  }}
                  className="bg-white hover:bg-slate-50 border border-slate-250 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
                  id="share-cert-btn"
                >
                  <Share2 className="h-4 w-4 shrink-0 text-slate-400" />
                  <span>نسخ رابط التحقق</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Column - Lesson Playlist & Sidebar (Lg: 4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-md p-5 text-right space-y-5" id="player-playlist">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base leading-tight mb-1">
              مفردات ومحاضرات المسار
            </h3>
            <p className="text-xs text-slate-500 font-medium">اختر المحاضرة المطلوبة لبدء التعلم والتطبيق</p>
          </div>

          {/* Sub-search bar inside course content */}
          <div className="relative" id="lesson-inner-search-box">
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={lessonSearchQuery}
              onChange={(e) => setLessonSearchQuery(e.target.value)}
              placeholder="البحث عن محاضرة أو موضوع في الكورس..."
              className="w-full bg-slate-50 border border-slate-200 py-2.5 pr-9 pl-8 rounded-xl text-xs text-right focus:outline-none focus:border-amber-500 text-slate-900 font-sans font-medium"
            />
            {lessonSearchQuery && (
              <button
                onClick={() => setLessonSearchQuery('')}
                className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer font-bold"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Playlist items links list */}
          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1" id="lessons-list">
            {filteredLessons.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl" id="no-lessons-found">
                لا توجد محاضرات تطابق بحثك الحالي.
              </div>
            ) : (
              filteredLessons.map((lesson) => {
                const originalIndex = lessons.findIndex(l => l.id === lesson.id);
                const isActive = originalIndex === activeLessonIndex;
                const isCompleted = progress.has(lesson.id);

                return (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      setShowFinalExam(false);
                      if (originalIndex !== -1) {
                        setActiveLessonIndex(originalIndex);
                      }
                    }}
                    className={`w-full p-3.5 rounded-2xl border transition-all text-right flex items-center gap-3 cursor-pointer group ${
                      isActive
                        ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                        : 'bg-white hover:bg-slate-50 border-slate-200/85 text-slate-700'
                    }`}
                    id={`lesson-playlist-item-${lesson.id}`}
                  >
                    {/* Icon status circle */}
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                      isActive 
                        ? 'bg-amber-500 text-slate-950 border-amber-400' 
                        : isCompleted 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}>
                      {isCompleted ? (
                        <Check className="h-4.5 w-4.5 stroke-[2.5]" />
                      ) : (
                        <span>{originalIndex + 1}</span>
                      )}
                    </div>

                    {/* Lecture brief info */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-bold truncate ${isActive ? 'text-amber-400 font-black' : 'text-slate-800'}`}>
                        {lesson.title.replace(/محاضرة \d+: /, '')}
                      </h4>
                      
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          {lesson.type === 'video' && <Video className="h-3 w-3 shrink-0" />}
                          {lesson.type === 'presentation' && <BookOpen className="h-3 w-3 shrink-0" />}
                          {lesson.type === 'pdf' && <FileText className="h-3 w-3 shrink-0" />}
                          {lesson.type === 'quiz' && <HelpCircle className="h-3 w-3 shrink-0" />}
                          
                          <span>
                            {lesson.type === 'video' ? 'فيديو' : lesson.type === 'pdf' ? 'ملف PDF' : lesson.type === 'presentation' ? 'عرض تقدمي' : 'اختبار'}
                          </span>
                        </span>
                        <span>•</span>
                        <span>{lesson.duration}</span>
                      </div>
                    </div>

                    {/* Circle checked status representation */}
                    {isCompleted && !isActive && (
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 hidden sm:block" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Exam Unlock Area (Shows at bottom of list) */}
          <div className="pt-4 border-t border-slate-200 text-right space-y-4" id="exam-unlock-widget">
            <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <Bookmark className={`h-5 w-5 ${isCourseFullyCompleted ? 'text-amber-600' : 'text-slate-450'}`} />
                <h4 className="font-extrabold text-sm text-slate-800">الترشيح للامتحان النهائي</h4>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500 font-normal">
                عند إكمال دراسة 100٪ من محاضرات المسار الحالي، تفتح بوابة الامتحان النهائي لتتحصل على شهادة GCC Center المعتمدة والموقعة.
              </p>
            </div>

            <button
              onClick={() => {
                if (isCourseFullyCompleted) {
                  setShowFinalExam(true);
                } else {
                  alert('يرجى إنهاء كافة الدروس الستة للمسار الحالي أولاً لتتمكن من خوض الامتحان النهائي للأهمية التدريبية.');
                }
              }}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${
                isCourseFullyCompleted
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 hover:scale-[1.02] cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
              id="final-exam-trigger-btn"
            >
              {isCourseFullyCompleted ? (
                <>
                  <Award className="h-4.5 w-4.5 shrink-0" />
                  <span>دخول الامتحان النهائي الآن</span>
                </>
              ) : (
                <>
                  <Lock className="h-4.5 w-4.5 shrink-0" />
                  <span>انتهِ من المحاضرات لفتح الامتحان</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
