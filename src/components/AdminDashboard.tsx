/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Award, 
  Video, 
  FileText, 
  Check, 
  Settings, 
  Activity, 
  Grid,
  PlusCircle,
  FolderOpen
} from 'lucide-react';
import { Category, Course, Lesson, User } from '../types';
import FileUploader from './FileUploader';

interface AdminDashboardProps {
  categories: Category[];
  courses: Course[];
  lessons: Record<string, Lesson[]>;
  users: User[];
  onAddCategory: (category: { name: string; image: string; iconName: string }) => void;
  onAddCourse: (course: { categoryId: string; title: string; description: string; image: string; instructor: string; duration: string; level: 'مبتدئ' | 'متوسط' | 'متقدم' }) => void;
  onAddLesson: (courseId: string, lesson: { title: string; type: 'video' | 'pdf' | 'presentation' | 'quiz'; duration: string; description: string; url?: string }) => void;
  onDeleteCourse: (courseId: string) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export default function AdminDashboard({
  categories,
  courses,
  lessons,
  users,
  onAddCategory,
  onAddCourse,
  onAddLesson,
  onDeleteCourse,
  onDeleteCategory
}: AdminDashboardProps) {
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'stats' | 'categories' | 'courses' | 'lessons' | 'users'>('stats');

  // Form states
  // Add Category
  const [catName, setCatName] = useState('');
  const [catImage, setCatImage] = useState('');
  const [catIcon, setCatIcon] = useState('ShieldAlert');

  // Add Course
  const [courseCatId, setCourseCatId] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseImg, setCourseImg] = useState('');
  const [courseInst, setCourseInst] = useState('');
  const [courseDuration, setCourseDuration] = useState('12 ساعة');
  const [courseLvl, setCourseLvl] = useState<'مبتدئ' | 'متوسط' | 'متقدم'>('مبتدئ');

  // Add Lesson
  const [lessonCourseId, setLessonCourseId] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonType, setLessonType] = useState<'video' | 'pdf' | 'presentation' | 'quiz'>('video');
  const [lessonDuration, setLessonDuration] = useState('15 دقيقة');
  const [lessonDesc, setLessonDesc] = useState('');
  const [lessonUrl, setLessonUrl] = useState('');

  // Submit handers
  const handleSubmitCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    
    // Set fallback image for category
    const imageToUse = catImage.trim() || 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?q=80&w=600';
    
    onAddCategory({
      name: catName,
      image: imageToUse,
      iconName: catIcon
    });

    setCatName('');
    setCatImage('');
    alert('تمت إضافة تصنيف الكورسات الجديد هذا إلى لوحة التحكم بنجاح.');
  };

  const handleSubmitCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim() || !courseCatId) {
      alert('الرجاء تعبئة اسم الكورس واختيار القسم.');
      return;
    }

    const imageToUse = courseImg.trim() || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600';

    onAddCourse({
      categoryId: courseCatId,
      title: courseTitle,
      description: courseDesc,
      image: imageToUse,
      instructor: courseInst || 'مدرب معتمد',
      duration: courseDuration,
      level: courseLvl
    });

    setCourseTitle('');
    setCourseDesc('');
    setCourseImg('');
    setCourseInst('');
    alert('تمت إضافة الكورس الجديد بنجاح في قاعدة البيانات.');
  };

  const handleSubmitLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim() || !lessonCourseId) {
      alert('الرجاء تدوين عنوان الدرس واختيار الكورس التابع له.');
      return;
    }

    onAddLesson(lessonCourseId, {
      title: lessonTitle,
      type: lessonType,
      duration: lessonDuration,
      description: lessonDesc,
      url: lessonUrl || undefined
    });

    setLessonTitle('');
    setLessonDesc('');
    setLessonUrl('');
    alert('تمت إضافة المحاضرة الجديدة وضمها تحت فهرس الكورس المحدد بنجاح.');
  };

  // Calculate generic statistics
  const totalCourses = courses.length;
  const totalCategories = categories.length;
  const totalUsers = users.length;
  const totalLessons = Object.values(lessons).reduce((acc, curr) => acc + curr.length, 0);

  // Quick stats charts simulation data
  const statCompletions = [
    { month: 'يناير', count: 48 },
    { month: 'فبراير', count: 62 },
    { month: 'مارس', count: 85 },
    { month: 'أبريل', count: 110 },
    { month: 'مايو', count: 145 },
    { month: 'يونيو', count: 190 }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-right font-sans" id="admin-dashboard-root">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-8" id="admin-header">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="h-7 w-7 text-rose-500 hover:rotate-45 transition-transform" />
            <span>لوحة المدراء الحيوية ومراقبة وتوريث المحتوى</span>
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1">
            إدارة الأقسام الخليجية، الكورسات، ومحاضرات التدريب والمبيعات الإجمالية.
          </p>
        </div>
        
        {/* Quick Tabs buttons row */}
        <div className="flex flex-wrap gap-2 text-xs font-bold" id="admin-tabs">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-xl border transition-all ${
              activeTab === 'stats' 
                ? 'bg-slate-900 border-slate-900 text-amber-400 font-extrabold' 
                : 'bg-white border-slate-250 text-slate-700 hover:bg-slate-50'
            }`}
          >
            الإحصائيات والنمو
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl border transition-all ${
              activeTab === 'categories' 
                ? 'bg-slate-900 border-slate-900 text-amber-400 font-extrabold' 
                : 'bg-white border-slate-250 text-slate-700 hover:bg-slate-50'
            }`}
          >
            إضافة وإدارة الأقسام
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-xl border transition-all ${
              activeTab === 'courses' 
                ? 'bg-slate-900 border-slate-900 text-amber-400 font-extrabold' 
                : 'bg-white border-slate-250 text-slate-700 hover:bg-slate-50'
            }`}
          >
            تحرير وإضافة الكورسات
          </button>
          <button
            onClick={() => setActiveTab('lessons')}
            className={`px-4 py-2 rounded-xl border transition-all ${
              activeTab === 'lessons' 
                ? 'bg-slate-900 border-slate-900 text-amber-400 font-extrabold' 
                : 'bg-white border-slate-250 text-slate-700 hover:bg-slate-50'
            }`}
          >
            رفع المحاضرات
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl border transition-all ${
              activeTab === 'users' 
                ? 'bg-slate-900 border-slate-900 text-amber-400 font-extrabold' 
                : 'bg-white border-slate-250 text-slate-700 hover:bg-slate-50'
            }`}
          >
            عرض المتدربين المسجلين
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      
      {/* 1. Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-8" id="stats-tab-content">
          
          {/* Bento-grid of Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-bold">إجمالي الكورسات المفعلة</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{totalCourses}</p>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-bold">الأقسام والفروع الكلية</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{totalCategories}</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Grid className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-bold">الدروس والمقررات</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{totalLessons}</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <FileText className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-bold">المتسجلون في المنصة</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{totalUsers}</p>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <Users className="h-6 w-6" />
              </div>
            </div>

          </div>

          {/* SVG Chart display */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Completion Chart Curve */}
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6" id="chart-section">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm md:text-base">وتيرة إصدار الشهادات واكتمال الكورسات</h3>
                  <p className="text-xs text-slate-500 mt-0.5">معدل نمو المتخرجين شهرياً لبرنامج دبلومات المركز</p>
                </div>
                <span className="text-xs bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>+34٪ نمو مستقر</span>
                </span>
              </div>

              {/* Handcrafted Visual Arabic Chart (Bars layout SVG) */}
              <div className="h-64 flex items-end justify-between gap-2.5 pt-6 relative border-b border-slate-200" id="visual-bars-chart">
                {statCompletions.map((item, idx) => {
                  const maxCount = 200;
                  const barHeightPercent = Math.round((item.count / maxCount) * 100);

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end" id={`bar-item-${idx}`}>
                      {/* Tooltip bar */}
                      <span className="opacity-0 group-hover:opacity-100 bg-slate-900 text-amber-400 font-bold text-[10px] px-2 py-0.5 rounded shadow absolute transition-all pointer-events-none mb-1 text-center" style={{ bottom: `${barHeightPercent + 10}%` }}>
                        {item.count} شهادة
                      </span>
                      {/* The bar */}
                      <div 
                        className={`w-full max-w-[40px] rounded-t-lg transition-all duration-700 bg-gradient-to-t ${
                          idx % 2 === 0 ? 'from-slate-900 to-slate-800' : 'from-amber-500 to-amber-400'
                        }`}
                        style={{ height: `${barHeightPercent}%` }}
                      ></div>
                      {/* X label */}
                      <span className="text-[10px] sm:text-xs text-slate-500 font-bold mt-2.5 text-center">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick action buttons sidebar */}
            <div className="lg:col-span-4 bg-slate-900 text-white rounded-2xl border border-slate-850 p-6 shadow-md space-y-6" id="dashboard-notice-box">
              <div className="flex items-center gap-2 text-amber-400">
                <Award className="h-5.5 w-5.5 animate-pulse" />
                <h4 className="font-extrabold text-sm sm:text-base">إشعار الإكاديمية الدوري</h4>
              </div>
              <p className="text-xs leading-relaxed text-slate-350 font-normal">
                مرحباً بك مجدداً زميلنا الإداري في GCC Center. جميع الأنظمة الخلفية مستقرة تماماً، ومنافذ تصحيح الفيديوهات ممررة بشكل سليم ومقاومة لضغط التحميل. يمكنك تعمير أي مادة ونشر الكورسات لتصعد للواجهة الرئيسية للطلاب فوراً.
              </p>
              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
                <span>تحديث المخدم الأخير: </span>
                <span dir="ltr">2026-06-03 15:43:57</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 2. Categories Settings Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-8" id="cat-tab-content">
          
          {/* Creation form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl text-right">
            <h3 className="font-extrabold text-slate-900 text-base mb-4 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-amber-500" />
              <span>إضافة فرع وقسم كورسات جديد للمركز</span>
            </h3>

            <form onSubmit={handleSubmitCategory} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">عنوان وقسم التصنيف (مثال: البرمجة أو السلامة):</label>
                  <input
                    type="text"
                    required
                    placeholder="اكتبي أو اكتب اسم القسم..."
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="w-full text-xs text-slate-900 border border-slate-250 p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-right"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">رابط صورة الغلاف لرمز القسم (أو ارفع بالأسفل):</label>
                  <input
                    type="url"
                    placeholder="رابط URL اختياري للصورة..."
                    value={catImage}
                    onChange={(e) => setCatImage(e.target.value)}
                    className="w-full text-xs text-slate-900 border border-slate-250 p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-right mb-2"
                  />
                  <FileUploader
                    id="category-image-uploader"
                    accept="image/*"
                    label="رفع صورة غلاف القسم إلى السيرفر السحابي:"
                    onUploadSuccess={(url) => setCatImage(url)}
                    helperText="اسحب صورة القسم هنا للرفع التلقائي"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">أيقونة التصنيف من مكتبة Lucide (اختيار من النماذج المتوفرة):</label>
                <div className="grid grid-cols-5 gap-2 text-center text-xs font-semibold">
                  {[
                    { name: 'ShieldAlert', label: 'سلامة وبطولة' },
                    { name: 'Award', label: 'جودة وأوسمة' },
                    { name: 'PlaneTakeoff', label: 'طيران وملاحة' },
                    { name: 'Code', label: 'برمجيات' },
                    { name: 'Calculator', label: 'محاسبة وأوراق مالية' }
                  ].map((ic) => (
                    <button
                      type="button"
                      key={ic.name}
                      onClick={() => setCatIcon(ic.name)}
                      className={`p-2 rounded-xl border transition-all ${
                        catIcon === ic.name
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block text-[11px]">{ic.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-slate-900 text-amber-500 font-bold px-6 py-2.5 rounded-xl text-xs hover:bg-slate-805 transition-all shadow"
                >
                  حفظ وتخزين هذا القسم الجديد
                </button>
              </div>
            </form>
          </div>

          {/* List of existing Categories with delete buttons */}
          <div className="space-y-4" id="categories-inventory">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-amber-500" />
              <span>جرد قائمة الأقسام الحالية ({categories.length})</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div className="text-right">
                    <p className="font-bold text-xs md:text-sm text-slate-900">{cat.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">ID: {cat.id} | Icon: {cat.iconName}</p>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من رغبتك في حذف قسم (${cat.name})؟ هذا قد يخفي الكورسات المنتمية له.`)) {
                        onDeleteCategory(cat.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-rose-500 bg-rose-50 hover:bg-rose-100 transition-colors"
                    title="حذف القسم"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 3. Courses Tab */}
      {activeTab === 'courses' && (
        <div className="space-y-8" id="courses-tab-content">
          
          {/* Create new Course form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl text-right">
            <h3 className="font-extrabold text-slate-900 text-base mb-4 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-rose-500" />
              <span>إضافة برنامج أو كورسات تدريبية جديدة</span>
            </h3>

            <form onSubmit={handleSubmitCourse} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">اختر القسم المستضيف التابع له:</label>
                  <select
                    value={courseCatId}
                    onChange={(e) => setCourseCatId(e.target.value)}
                    required
                    className="w-full text-xs text-slate-900 border border-slate-250 p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-right bg-white"
                  >
                    <option value="">-- اختر القسم --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">عنوان البرنامج التدريبي (مثال: دبلوم الـ OSHA):</label>
                  <input
                    type="text"
                    required
                    placeholder="أدخل عنوان الكورس..."
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    className="w-full text-xs text-slate-900 border border-slate-250 p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-right"
                  />
                </div>

              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">وصف مبسط ومعلوماتي متكامل حول الكورس:</label>
                <textarea
                  required
                  placeholder="الوصف التفصيلي لمخرجات وشروط وخبرات الدبلومة وحاجات المتقدم لها..."
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  rows={2}
                  className="w-full text-xs text-slate-905 border border-slate-250 p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-right"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">اسم المهندس أو المدرب المشرف:</label>
                  <input
                    type="text"
                    placeholder="م. أو د. الاسم الكريم..."
                    value={courseInst}
                    onChange={(e) => setCourseInst(e.target.value)}
                    className="w-full text-xs text-slate-950 border border-slate-250 p-2 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">مدة البرنامج بالكلية:</label>
                  <input
                    type="text"
                    placeholder="مثال: 20 ساعة"
                    value={courseDuration}
                    onChange={(e) => setCourseDuration(e.target.value)}
                    className="w-full text-xs text-slate-900 border border-slate-250 p-2 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">رابط صورة غلاف الكورس (أو ارفع بالأسفل):</label>
                  <input
                    type="url"
                    placeholder="Unsplash URL..."
                    value={courseImg}
                    onChange={(e) => setCourseImg(e.target.value)}
                    className="w-full text-xs text-slate-900 border border-slate-250 p-2 rounded-xl focus:outline-none text-left mb-2"
                  />
                  <FileUploader
                    id="course-image-uploader"
                    accept="image/*"
                    label="رفع غلاف الكورس سحابياً:"
                    onUploadSuccess={(url) => setCourseImg(url)}
                    helperText="اسحب صورة غلاف الدبلومة للرفع والتأمين"
                  />
                </div>

              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">مستوى الصعوبة المعياري الكلي للطلاب:</label>
                <div className="flex gap-4">
                  {['مبتدئ', 'متوسط', 'متقدم'].map((lvl) => (
                    <label key={lvl} className="flex items-center gap-1 text-xs text-slate-605 cursor-pointer">
                      <input
                        type="radio"
                        name="level"
                        checked={courseLvl === lvl}
                        onChange={() => setCourseLvl(lvl as any)}
                        className="accent-slate-900"
                      />
                      <span>{lvl}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-slate-900 text-rose-450 hover:bg-slate-805 font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all text-amber-400"
                >
                  تأكيد وحفظ البرنامج التدريبي
                </button>
              </div>
            </form>
          </div>

          {/* List of courses and deletion triggers */}
          <div className="space-y-4" id="courses-inventory-list">
            <h3 className="font-extrabold text-slate-900 text-base">جرد قائمة الكورسات التدريبية الحالية ({courses.length})</h3>
            
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm" id="table-courses">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="px-4 py-3">الكورس</th>
                      <th className="px-4 py-3">القسم</th>
                      <th className="px-4 py-3">المدرب</th>
                      <th className="px-4 py-3">المستوى والمدة</th>
                      <th className="px-4 py-3">عمليات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal text-slate-650">
                    {courses.map((cr) => {
                      const parentCat = categories.find(c => c.id === cr.categoryId);
                      return (
                        <tr key={cr.id} className="hover:bg-slate-55/40">
                          <td className="px-4 py-3 font-semibold text-slate-900">{cr.title}</td>
                          <td className="px-4 py-3">{parentCat ? parentCat.name : cr.categoryId}</td>
                          <td className="px-4 py-3">{cr.instructor}</td>
                          <td className="px-4 py-3">
                            <span className="bg-amber-500/10 text-amber-705 px-2 py-0.5 rounded text-[10px] font-bold inline-block ml-1">{cr.level}</span>
                            <span>{cr.duration}</span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                if (confirm(`هل تبتغي حذف كورس (${cr.title}) بالكامل من كافة الجداول؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
                                  onDeleteCourse(cr.id);
                                }
                              }}
                              className="text-rose-500 hover:text-rose-700 bg-rose-50 p-1.5 rounded transition-all"
                              title="حذف الكورس"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 4. Lessons Management Tab */}
      {activeTab === 'lessons' && (
        <div className="space-y-6" id="lessons-tab-content">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl text-right">
            <h3 className="font-extrabold text-slate-900 text-base mb-4 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-emerald-500" />
              <span>أدوات رفع وإقحام المحاضرات</span>
            </h3>

            <form onSubmit={handleSubmitLesson} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">اختر الكورس التابعة له هذه المحاضرة:</label>
                  <select
                    value={lessonCourseId}
                    onChange={(e) => setLessonCourseId(e.target.value)}
                    required
                    className="w-full text-xs text-slate-900 border border-slate-250 p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-right bg-white"
                  >
                    <option value="">-- اختر الكورس --</option>
                    {courses.map((cr) => (
                      <option key={cr.id} value={cr.id}>{cr.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">عنوان المحاضرة (مثال: محاضرة 5: إدارة النفايات):</label>
                  <input
                    type="text"
                    required
                    placeholder="أدخل عنوان ومسمى المحاضرة..."
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    className="w-full text-xs text-slate-900 border border-slate-250 p-2 rounded-xl focus:outline-none"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">تصنيف نوع المحتوى للدرس:</label>
                  <select
                    value={lessonType}
                    onChange={(e) => setLessonType(e.target.value as any)}
                    className="w-full text-xs text-slate-900 border border-slate-250 p-2 rounded-xl focus:outline-none bg-white text-right"
                  >
                    <option value="video">فيديو تعليمي</option>
                    <option value="presentation">شرائح عرض تقديمي</option>
                    <option value="pdf">ملخص ورقي ومذكرة PDF</option>
                    <option value="quiz">اختبار قصير</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">تخمين مدة الدراسة كمرجع للطلاب:</label>
                  <input
                    type="text"
                    placeholder="مثال: 25 دقيقة"
                    value={lessonDuration}
                    onChange={(e) => setLessonDuration(e.target.value)}
                    className="w-full text-xs text-slate-900 border border-slate-250 p-2 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-2 col-span-1 md:col-span-3">
                  <label className="block text-xs font-bold text-slate-600 mb-1">رابط الدرس أو ملف المحاضرة (أو ارفع بالأسفل):</label>
                  <input
                    type="text"
                    placeholder="رابط فيديو MP4 أو مستند أو كود..."
                    value={lessonUrl}
                    onChange={(e) => setLessonUrl(e.target.value)}
                    className="w-full text-xs text-slate-905 border border-slate-250 p-2 rounded-xl focus:outline-none text-left mb-2"
                  />
                  <FileUploader
                    id="lesson-media-uploader"
                    accept={lessonType === 'video' ? 'video/*' : lessonType === 'pdf' ? 'application/pdf' : 'image/*,application/*'}
                    label={`رفع ملف المحاضرة (${lessonType === 'video' ? 'فيديو' : lessonType === 'pdf' ? 'PDF' : 'مستند/عرض تقديمي'}) سحابياً لـ Cloudinary:`}
                    onUploadSuccess={(url) => setLessonUrl(url)}
                    helperText={`اسحب ملف الـ ${lessonType === 'video' ? 'فيديو المباشر' : 'مستند'} هنا للرفع الآمن`}
                  />
                </div>

              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">نبذة وملخص سريع لمحتويات الدرس أو نصوص لـ PDF:</label>
                <textarea
                  required
                  placeholder="أدخل نصوص الكتيب أو وصف تفاصيل محتويات المحاضرة التعليمية هنا..."
                  value={lessonDesc}
                  onChange={(e) => setLessonDesc(e.target.value)}
                  rows={3}
                  className="w-full text-xs text-slate-900 border border-slate-250 p-2 rounded-xl focus:outline-none text-right"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-slate-900 text-emerald-450 hover:bg-slate-805 font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md text-amber-450"
                >
                  رفع ونشر المحاضرة الجديدة
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* 5. Users List Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6" id="users-tab-content">
          <h3 className="font-extrabold text-slate-900 text-base">قائمة بيانات المتدربين والمنخرطين بالتعليم ({users.length})</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((usr) => (
              <div key={usr.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4" id={`user-grid-card-${usr.id}`}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="text-right">
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>{usr.name}</span>
                      {usr.role === 'admin' && (
                        <span className="bg-rose-500/10 text-rose-650 text-[9px] font-bold px-2 py-0.5 rounded-full border border-rose-500/20">مدير النظام</span>
                      )}
                    </h4>
                    <p className="text-slate-400 text-[10px]">{usr.email}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>هوية الطالب: <strong>{usr.id}</strong></span>
                  <span>رقم الهاتف المعتمد: {usr.phone || 'غير مسجل'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
