/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Award, 
  ArrowRight, 
  Search, 
  Plus, 
  Trash2, 
  Play, 
  CheckCircle2, 
  Video, 
  FileText, 
  X, 
  LogOut, 
  GraduationCap, 
  User, 
  ShieldAlert, 
  PlaneTakeoff, 
  Calculator, 
  ShieldCheck, 
  Sparkles, 
  Clock,
  ChevronLeft,
  ChevronRight,
  Info,
  Check,
  Briefcase,
  Code,
  Grid,
  FolderOpen,
  Settings
} from 'lucide-react';

import { Category, Course, Lesson, User as UserType, Certificate, LessonProgress } from './types';
import { INITIAL_CATEGORIES, INITIAL_COURSES, INITIAL_LESSONS } from './initialData';

import {
  fetchCategoriesFromDb,
  saveCategoryToDb,
  deleteCategoryFromDb,
  fetchCoursesFromDb,
  saveCourseToDb,
  deleteCourseFromDb,
  fetchLessonsFromDb,
  saveLessonToDb,
  deleteLessonFromDb,
  saveLessonsBatchToDb,
  fetchUsersFromDb,
  saveUserToDb,
  fetchProgressFromDb,
  saveProgressRecordToDb,
  deleteProgressRecordFromDb,
  fetchCertificatesFromDb,
  saveCertificateToDb
} from './lib/firestoreService';

import Header from './components/Header';
import Footer from './components/Footer';
import InteractivePlayer from './components/InteractivePlayer';
import AdminDashboard from './components/AdminDashboard';
import UnregisteredStudentContact from './components/UnregisteredStudentContact';

// Set up initial state keys in LocalStorage
const LOCAL_CAT_KEY = 'gcc_categories';
const LOCAL_CRS_KEY = 'gcc_courses';
const LOCAL_LSN_KEY = 'gcc_lessons';
const LOCAL_USR_KEY = 'gcc_users';
const LOCAL_PRG_KEY = 'gcc_progress';
const LOCAL_CRT_KEY = 'gcc_certificates';
const LOCAL_CURR_USR_KEY = 'gcc_current_user';

export default function App() {
  
  // App-wide data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [users, setUsers] = useState<UserType[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  // Layout states
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [unregisteredCourse, setUnregisteredCourse] = useState<Course | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdminView, setIsAdminView] = useState(false);

  // Modals visibility states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Authentication inputs state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Helper to sync updated values to backend
  const syncToBackend = async (cats: Category[], crs: Course[], lsns: Record<string, Lesson[]>) => {
    try {
      await fetch('/api/training-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: cats, courses: crs, lessons: lsns })
      });
    } catch (err) {
      console.error("Failed syncing to backend database API:", err);
    }
  };

  // Load state from LocalStorage or Server API on mount
  useEffect(() => {
    const fetchServerAndLocalData = async () => {
      try {
        // 1. Fetch categories
        let dbCats = await fetchCategoriesFromDb();
        if (dbCats.length === 0) {
          console.log("Seeding initial categories to Firestore database...");
          for (const cat of INITIAL_CATEGORIES) {
            await saveCategoryToDb(cat);
          }
          dbCats = INITIAL_CATEGORIES;
        }
        setCategories(dbCats);
        localStorage.setItem(LOCAL_CAT_KEY, JSON.stringify(dbCats));

        // 2. Fetch courses
        let dbCourses = await fetchCoursesFromDb();
        if (dbCourses.length === 0) {
          console.log("Seeding initial courses to Firestore database...");
          for (const course of INITIAL_COURSES) {
            await saveCourseToDb(course);
          }
          dbCourses = INITIAL_COURSES;
        }
        setCourses(dbCourses);
        localStorage.setItem(LOCAL_CRS_KEY, JSON.stringify(dbCourses));

        // 3. Fetch lessons
        let dbLessons = await fetchLessonsFromDb();
        if (Object.keys(dbLessons).length === 0) {
          console.log("Seeding initial lessons to Firestore database...");
          const flatLessons: Lesson[] = [];
          Object.values(INITIAL_LESSONS).forEach(list => {
            flatLessons.push(...list);
          });
          await saveLessonsBatchToDb(flatLessons);
          dbLessons = INITIAL_LESSONS;
        }
        setLessons(dbLessons);
        localStorage.setItem(LOCAL_LSN_KEY, JSON.stringify(dbLessons));
        console.log("Firebase Firestore synchronisation completed successfully!");
      } catch (err) {
        console.error("Error synching list data from Firestore, loading from LocalStorage/default:", err);
        const localCats = localStorage.getItem(LOCAL_CAT_KEY);
        setCategories(localCats ? JSON.parse(localCats) : INITIAL_CATEGORIES);
        const localCourses = localStorage.getItem(LOCAL_CRS_KEY);
        setCourses(localCourses ? JSON.parse(localCourses) : INITIAL_COURSES);
        const localLessons = localStorage.getItem(LOCAL_LSN_KEY);
        setLessons(localLessons ? JSON.parse(localLessons) : INITIAL_LESSONS);
      }
    };

    fetchServerAndLocalData();

    // Users
    const initialUsers: UserType[] = [
      { id: 'usr-1', name: 'أ. د. عمر بن عبد العزيز', email: 'admin@gcc.com', phone: '0500112233', role: 'admin' },
      { id: 'usr-2', name: 'سلمان الشمري', email: 'salman@student.com', phone: '0555987654', role: 'student', assignedCourses: ['course-safety-1'] }
    ];

    const loadUsers = async () => {
      try {
        let dbUsers = await fetchUsersFromDb();
        if (dbUsers.length === 0) {
          console.log("Seeding initial users to Firestore database...");
          for (const u of initialUsers) {
            await saveUserToDb(u);
          }
          dbUsers = initialUsers;
        }
        setUsers(dbUsers);
        localStorage.setItem(LOCAL_USR_KEY, JSON.stringify(dbUsers));

        // Hydrate current active user
        const localUser = localStorage.getItem(LOCAL_CURR_USR_KEY);
        if (localUser && localUser !== 'null') {
          const parsed = JSON.parse(localUser);
          if (parsed && typeof parsed === 'object' && parsed.id) {
            const parsedEmail = parsed.email ? parsed.email.toLowerCase() : '';
            const found = dbUsers.find(u => u.id === parsed.id || (parsedEmail && u.email.toLowerCase() === parsedEmail));
            if (found) {
              setCurrentUser(found);
              localStorage.setItem(LOCAL_CURR_USR_KEY, JSON.stringify(found));
            } else {
              setCurrentUser(parsed);
            }
          } else {
            // Auto log in student
            const defaultUser = dbUsers.find(u => u.id === 'usr-2') || dbUsers[0];
            setCurrentUser(defaultUser);
            localStorage.setItem(LOCAL_CURR_USR_KEY, JSON.stringify(defaultUser));
          }
        } else {
          // Auto log in student
          const defaultUser = dbUsers.find(u => u.id === 'usr-2') || dbUsers[0];
          setCurrentUser(defaultUser);
          localStorage.setItem(LOCAL_CURR_USR_KEY, JSON.stringify(defaultUser));
        }
      } catch (err) {
        console.error("Error loading users:", err);
        const localUsers = localStorage.getItem(LOCAL_USR_KEY);
        const loadedUsers = localUsers ? JSON.parse(localUsers) : initialUsers;
        setUsers(loadedUsers);

        const localUser = localStorage.getItem(LOCAL_CURR_USR_KEY);
        if (localUser && localUser !== 'null') {
          const parsed = JSON.parse(localUser);
          if (parsed && typeof parsed === 'object') {
            setCurrentUser(parsed);
          } else {
            const defaultUser = loadedUsers.find((u: any) => u.id === 'usr-2') || loadedUsers[0];
            setCurrentUser(defaultUser);
            localStorage.setItem(LOCAL_CURR_USR_KEY, JSON.stringify(defaultUser));
          }
        } else {
          const defaultUser = loadedUsers.find((u: any) => u.id === 'usr-2') || loadedUsers[0];
          setCurrentUser(defaultUser);
          localStorage.setItem(LOCAL_CURR_USR_KEY, JSON.stringify(defaultUser));
        }
      }
    };
    loadUsers();

    // Progress
    const localPrg = localStorage.getItem(LOCAL_PRG_KEY);
    if (localPrg) {
      setProgress(JSON.parse(localPrg));
    } else {
      // Small pre-seeded lesson completion for সালমান so that they can see recently watched progress immediately on first open!
      const initialPrg: LessonProgress[] = [
        { userId: 'usr-2', courseId: 'course-safety-1', lessonId: 'lesson-s1-1', completed: true, completedAt: '2026-06-03T12:00:00Z' }
      ];
      setProgress(initialPrg);
      localStorage.setItem(LOCAL_PRG_KEY, JSON.stringify(initialPrg));
    }

    // Certificates
    const localCerts = localStorage.getItem(LOCAL_CRT_KEY);
    if (localCerts) {
      setCertificates(JSON.parse(localCerts));
    } else {
      setCertificates([]);
    }
  }, []);

  // Save changes helper functions to sync with localStorage and backend Cloud database
  const saveCategories = (updated: Category[]) => {
    setCategories(updated);
    localStorage.setItem(LOCAL_CAT_KEY, JSON.stringify(updated));
    syncToBackend(updated, courses, lessons);
    updated.forEach(cat => saveCategoryToDb(cat));
  };

  const saveCourses = (updated: Course[]) => {
    setCourses(updated);
    localStorage.setItem(LOCAL_CRS_KEY, JSON.stringify(updated));
    syncToBackend(categories, updated, lessons);
    updated.forEach(crs => saveCourseToDb(crs));
  };

  const saveLessons = (updated: Record<string, Lesson[]>) => {
    setLessons(updated);
    localStorage.setItem(LOCAL_LSN_KEY, JSON.stringify(updated));
    syncToBackend(categories, courses, updated);
    Object.values(updated).forEach(lsnList => {
      lsnList.forEach(l => saveLessonToDb(l));
    });
  };

  const saveUsers = (updated: UserType[]) => {
    setUsers(updated);
    localStorage.setItem(LOCAL_USR_KEY, JSON.stringify(updated));
    updated.forEach(u => saveUserToDb(u));
  };

  const saveProgress = (updated: LessonProgress[]) => {
    setProgress(updated);
    localStorage.setItem(LOCAL_PRG_KEY, JSON.stringify(updated));
  };

  const saveCertificates = (updated: Certificate[]) => {
    setCertificates(updated);
    localStorage.setItem(LOCAL_CRT_KEY, JSON.stringify(updated));
    updated.forEach(c => saveCertificateToDb(c));
  };

  // Sign out handler
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(LOCAL_CURR_USR_KEY);
    setActiveCourse(null);
    setIsAdminView(false);
  };

  // Custom logging in mechanism
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) return;

    if (isRegisterMode) {
      // Check if user already exists
      const existing = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase());
      if (existing) {
        alert('هذا الحساب مسجل بالفعل، الرجاء تسجيل الدخول العادي.');
        setIsRegisterMode(false);
        return;
      }

      // Create new user
      const newUser: UserType = {
        id: `usr-${Date.now()}`,
        name: loginName.trim() || 'متدرب خليجي',
        email: loginEmail.trim().toLowerCase(),
        phone: loginPhone.trim() || undefined,
        role: loginEmail.toLowerCase().includes('admin') ? 'admin' : 'student'
      };

      const updatedUsers = [...users, newUser];
      saveUsers(updatedUsers);
      setCurrentUser(newUser);
      localStorage.setItem(LOCAL_CURR_USR_KEY, JSON.stringify(newUser));
      setShowLoginModal(false);
      resetLoginFields();
      alert(`مرحباً بك بمجلس GCC Center: ${newUser.name}`);
    } else {
      // Standard search login
      const match = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase());
      if (match) {
        setCurrentUser(match);
        localStorage.setItem(LOCAL_CURR_USR_KEY, JSON.stringify(match));
        setShowLoginModal(false);
        resetLoginFields();
      } else {
        // Fallback: If not found, let's create a Student account for them instantly to make it an incredibly frictionless experience!
        const autoName = loginEmail.split('@')[0] || 'طالب جديد';
        const autoUser: UserType = {
          id: `usr-${Date.now()}`,
          name: autoName,
          email: loginEmail.trim().toLowerCase(),
          role: loginEmail.toLowerCase().includes('admin') ? 'admin' : 'student'
        };
        const updatedUsers = [...users, autoUser];
        saveUsers(updatedUsers);
        setCurrentUser(autoUser);
        localStorage.setItem(LOCAL_CURR_USR_KEY, JSON.stringify(autoUser));
        setShowLoginModal(false);
        resetLoginFields();
      }
    }
  };

  const resetLoginFields = () => {
    setLoginEmail('');
    setLoginName('');
    setLoginPhone('');
    setIsRegisterMode(false);
  };

  // Direct login links (Admin vs Student) for quick demo testing
  const triggerQuickLogin = (role: 'admin' | 'student') => {
    if (role === 'admin') {
      const adminUsr = users.find(u => u.role === 'admin') || users[0];
      if (adminUsr) {
        setCurrentUser(adminUsr);
        localStorage.setItem(LOCAL_CURR_USR_KEY, JSON.stringify(adminUsr));
        setShowLoginModal(false);
      }
    } else {
      const studentUsr = users.find(u => u.role === 'student' && u.email === 'salman@student.com') || users[1];
      if (studentUsr) {
        setCurrentUser(studentUsr);
        localStorage.setItem(LOCAL_CURR_USR_KEY, JSON.stringify(studentUsr));
        setShowLoginModal(false);
      }
    }
  };

  // Progress Toggle: Mark a lesson as completed
  const handleToggleLessonCompleted = (lessonId: string) => {
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }

    const existsIdx = progress.findIndex(
      p => p.userId === currentUser.id && p.lessonId === lessonId
    );

    let updatedPrg = [...progress];
    if (existsIdx > -1) {
      // Toggle off
      updatedPrg.splice(existsIdx, 1);
      deleteProgressRecordFromDb(currentUser.id, lessonId);
    } else {
      // Save completion
      const activeCr = courses.find(c => {
        const lsnLit = lessons[c.id] || [];
        return lsnLit.some(l => l.id === lessonId);
      });

      const newProg: LessonProgress = {
        userId: currentUser.id,
        courseId: activeCr ? activeCr.id : 'unknown',
        lessonId: lessonId,
        completed: true,
        completedAt: new Date().toISOString()
      };
      updatedPrg.push(newProg);
      saveProgressRecordToDb(newProg);
    }

    saveProgress(updatedPrg);
  };

  // Certificates generation
  const handleIssueCertificate = (grade: number) => {
    if (!currentUser || !activeCourse) return;

    // Check if copy is already produced
    const found = certificates.find(c => c.userId === currentUser.id && c.courseId === activeCourse.id);
    if (!found) {
      const newCert: Certificate = {
        id: `crt-${Date.now()}`,
        userId: currentUser.id,
        courseId: activeCourse.id,
        userName: currentUser.name,
        courseTitle: activeCourse.title,
        issueDate: new Date().toLocaleDateString('ar-SA'),
        grade: grade,
        certificateCode: `GCC-${Math.floor(Math.random() * 900000) + 100000}`
      };
      saveCertificates([...certificates, newCert]);
    }
  };

  // Admin Operations Callback handlers
  const handleAddCategory = (newCat: { name: string; image: string; iconName: string }) => {
    const freshId = `cat-${newCat.name.trim().toLowerCase().replace(/\s+/g, '-') || Date.now()}`;
    const entry: Category = {
      id: freshId,
      ...newCat
    };
    saveCategories([...categories, entry]);
  };

  const handleAddCourse = (newCr: { categoryId: string; title: string; description: string; image: string; instructor: string; duration: string; level: 'مبتدئ' | 'متوسط' | 'متقدم' }) => {
    const courseId = `course-${Date.now()}`;
    const entry: Course = {
      id: courseId,
      lessonsCount: 0,
      ...newCr
    };
    saveCourses([...courses, entry]);
    
    // Create empty lessons slot
    saveLessons({
      ...lessons,
      [courseId]: []
    });
  };

  const handleAddLesson = (courseId: string, newLsn: { title: string; type: 'video' | 'pdf' | 'presentation' | 'quiz'; duration: string; description: string; url?: string }) => {
    const courseLessons = lessons[courseId] || [];
    const lessonId = `lesson-${Date.now()}`;
    
    const entry: Lesson = {
      id: lessonId,
      courseId,
      title: newLsn.title,
      type: newLsn.type,
      duration: newLsn.duration,
      videoUrl: newLsn.url,
      description: newLsn.description,
      pdfContent: newLsn.type === 'pdf' ? newLsn.description : undefined,
      slides: newLsn.type === 'presentation' ? [
        { title: newLsn.title, content: ['شريحة 1: مقدمة وعروص توضيحية', newLsn.description] }
      ] : undefined
    };

    const updatedLsnMap = {
      ...lessons,
      [courseId]: [...courseLessons, entry]
    };
    saveLessons(updatedLsnMap);

    // Update the courses count
    const updatedCourses = courses.map(c => {
      if (c.id === courseId) {
        return { ...c, lessonsCount: (c.lessonsCount || 0) + 1 };
      }
      return c;
    });
    saveCourses(updatedCourses);
  };

  const handleDeleteCourse = (courseId: string) => {
    const filtered = courses.filter(c => c.id !== courseId);
    saveCourses(filtered);
    deleteCourseFromDb(courseId);

    // Delete associated lessons
    const courseLessons = lessons[courseId] || [];
    courseLessons.forEach(l => deleteLessonFromDb(l.id));

    // Remove from map, progress records
    const updatedLsn = { ...lessons };
    delete updatedLsn[courseId];
    saveLessons(updatedLsn);

    // Filter progress and certificates associated
    const progressFiltered = progress.filter(p => p.courseId !== courseId);
    saveProgress(progressFiltered);

    const certsFiltered = certificates.filter(c => c.courseId !== courseId);
    saveCertificates(certsFiltered);
  };

  const handleDeleteCategory = (catId: string) => {
    const filtered = categories.filter(c => c.id !== catId);
    saveCategories(filtered);
    deleteCategoryFromDb(catId);
  };

  const handleStartStudyCourse = (course: Course) => {
    const isEnrolled = currentUser && (
      currentUser.role === 'admin' || 
      (currentUser.role === 'student' && currentUser.assignedCourses?.includes(course.id))
    );
    if (isEnrolled) {
      setActiveCourse(course);
      setUnregisteredCourse(null);
    } else {
      setUnregisteredCourse(course);
    }
  };

  // Filter courses based on user role and assignments
  const allowedCourses = React.useMemo(() => {
    if (currentUser && currentUser.role === 'student') {
      const assigned = currentUser.assignedCourses || [];
      return courses.filter(c => assigned.includes(c.id));
    }
    return courses;
  }, [courses, currentUser]);

  // Searching logic
  const filteredCourses = allowedCourses.filter(c => {
    const matchesSearch = 
      c.title.includes(searchQuery) || 
      c.description.includes(searchQuery) ||
      c.instructor.includes(searchQuery);
    
    const matchesCategory = selectedCategoryFilter ? c.categoryId === selectedCategoryFilter : true;
    
    return matchesSearch && matchesCategory;
  });

  // Calculate student lesson completion progress for active courses
  const getCompletedLessonsForCourse = (courseId: string): Set<string> => {
    if (!currentUser) return new Set();
    const coursePrg = progress.filter(p => p.userId === currentUser.id && p.courseId === courseId);
    return new Set(coursePrg.map(p => p.lessonId));
  };

  const getCourseProgressPercentage = (courseId: string): number => {
    const list = lessons[courseId] || [];
    if (list.length === 0) return 0;
    const completed = getCompletedLessonsForCourse(courseId).size;
    return Math.round((completed / list.length) * 100);
  };

  // Active certificate search for current user
  const currentActiveCertificate = activeCourse && currentUser 
    ? certificates.find(c => c.userId === currentUser.id && c.courseId === activeCourse.id) || null
    : null;

  // Render specific icons for Categories
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldAlert': return <ShieldAlert className="h-6 w-6 text-amber-500" />;
      case 'Award': return <Award className="h-6 w-6 text-yellow-500" />;
      case 'PlaneTakeoff': return <PlaneTakeoff className="h-6 w-6 text-indigo-500" />;
      case 'Code': return <Code className="h-6 w-6 text-emerald-500 animate-pulse" />;
      case 'Calculator': return <Calculator className="h-6 w-6 text-rose-500" />;
      default: return <BookOpen className="h-6 w-6 text-amber-500" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans leading-normal selection:bg-amber-500 selection:text-slate-950" id="main-layout">
      
      {/* Header bar and navigation controls */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenLogin={() => setShowLoginModal(true)}
        onToggleAdminView={setIsAdminView}
        isAdminView={isAdminView}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onNavigateHome={() => {
          setActiveCourse(null);
          setUnregisteredCourse(null);
          setIsAdminView(false);
          setSelectedCategoryFilter(null);
        }}
        onOpenPrivacy={() => setShowPrivacyModal(true)}
        onOpenAbout={() => setShowAboutModal(true)}
      />

      {/* Main page content viewports switches */}
      <main className="flex-grow pb-16" id="main-content-viewport">
        {isAdminView ? (
          
          /* RENDER ADMINISTRATOR VIEWS */
          <AdminDashboard
            categories={categories}
            courses={courses}
            lessons={lessons}
            users={users}
            progress={progress}
            onAddCategory={handleAddCategory}
            onAddCourse={handleAddCourse}
            onAddLesson={handleAddLesson}
            onDeleteCourse={handleDeleteCourse}
            onDeleteCategory={handleDeleteCategory}
            onSaveUsers={saveUsers}
          />

        ) : unregisteredCourse ? (

          /* RENDER UNREGISTERED STUDENT CONTACT & ENROLLMENT PAGE */
          <UnregisteredStudentContact
            initialCourse={unregisteredCourse}
            courses={courses}
            onBack={() => setUnregisteredCourse(null)}
            currentUser={currentUser}
          />

        ) : activeCourse ? (
          
          /* RENDER ACTIVE STUDENT COURSE VIEW WITH PLAYLISTS AND EXAMES */
          <InteractivePlayer
            course={activeCourse}
            lessons={lessons[activeCourse.id] || []}
            progress={getCompletedLessonsForCourse(activeCourse.id)}
            onToggleLessonCompleted={handleToggleLessonCompleted}
            onBackToCourses={() => setActiveCourse(null)}
            currentUser={currentUser}
            certificate={currentActiveCertificate}
            onIssueCertificate={handleIssueCertificate}
          />

        ) : (
          
          /* RENDER STUDENT PORTAL PAGE / COURSES GRID / HERO OVERLAY */
          <div className="space-y-12">
            
            {/* Elegant Premium Arabic Academy Hero Banner with Slate palette */}
            <div className="relative bg-slate-900 text-white overflow-hidden text-right border-b border-slate-800" id="hero-banner">
              <div className="absolute inset-0 bg-radial-gradient from-slate-800/40 via-transparent to-slate-950 pointer-events-none"></div>
              <div className="absolute top-1/2 left-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  
                  <div className="space-y-6 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/15 border border-amber-500/20 rounded-full text-xs font-bold text-amber-400">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>الاعتماد الأكاديمي الخليجي الأحدث لعام 2026</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white font-sans">
                      ارتقِ بمسيرتك المهنية مع <strong className="text-amber-500 font-black">GCC center</strong>
                    </h1>
                    
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                      منصة التدريب الاحترافية الأولى في الخليج العربي. نقدم برامج ودبلومات معتمدة ومحاضرات تفاعلية في الأمن والسلامة، جودة المعايير، هندسة الطيران، إدارة الحسابات، وصناعة الرموز والبرمجة.
                    </p>

                    <div className="pt-4 flex flex-wrap gap-4">
                      <button
                        onClick={() => {
                          const element = document.getElementById('academy-courses-grid');
                          element?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 py-3 rounded-xl text-xs sm:text-sm font-extrabold shadow-lg hover:shadow-amber-500/10 transition-all flex items-center gap-2 cursor-pointer"
                        id="hero-explore-btn"
                      >
                        <span>تصفح الفهرس التدريبي</span>
                        <ArrowRight className="h-4 w-4 rotate-180" />
                      </button>

                      {!currentUser && (
                        <button
                          onClick={() => setShowLoginModal(true)}
                          className="bg-slate-800 hover:bg-slate-750 text-slate-205 border border-slate-700 font-bold px-5 py-3 rounded-xl text-xs sm:text-sm transition-all"
                        >
                          تأسيس حساب طلابي
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Graphics / Highlights Grid */}
                  <div className="hidden lg:grid grid-cols-2 gap-4 text-right">
                    
                    <div className="bg-slate-850/80 border border-slate-750 p-6 rounded-2xl">
                      <ShieldCheck className="h-8 w-8 text-amber-500 mb-3" />
                      <h4 className="font-bold text-sm text-slate-100">شهادات فورية موثقة</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed font-normal">احصل على وثيقتك الخليجية مطبوعة بجودة مذهلة بمجرد إنهاء الاختبار.</p>
                    </div>

                    <div className="bg-slate-850/80 border border-slate-750 p-6 rounded-2xl">
                      <Briefcase className="h-8 w-8 text-emerald-500 mb-3" />
                      <h4 className="font-bold text-sm text-slate-100">ملاءمة سوق العمل</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed font-normal">تتحاذى المساقات مع متطلبات التوظيف ومعايير أرامكو والإعتمادات الإقليمية.</p>
                    </div>

                    <div className="bg-slate-850/80 border border-slate-750 p-6 rounded-2xl">
                      <Video className="h-8 w-8 text-indigo-500 mb-3" />
                      <h4 className="font-bold text-sm text-slate-100">شروح وكتيبات تفاعلية</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed font-normal">تنوع فريد بين أفلام الفيديوهات، وشرائح السلايدات، وكتب الـ PDF.</p>
                    </div>

                    <div className="bg-slate-850/80 border border-slate-750 p-6 rounded-2xl">
                      <GraduationCap className="h-8 w-8 text-rose-500 mb-3" />
                      <h4 className="font-bold text-sm text-slate-100">متابعة الأداء الاستباقي</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed font-normal">تتبع نسبة تصفحك والعودة لنفس مكان التوقف فوراً ومجاناً.</p>
                    </div>

                  </div>

                </div>
              </div>
            </div>

            {/* Resume last studied course card */}
            {currentUser && progress.length > 0 && (
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" id="recent-progress-box">
                <div className="bg-white rounded-2xl border border-slate-205 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-right">
                    <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-450 font-bold block">متابعة عملية التعلم</span>
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                        لديك دروس معلقة بالمسارات التدريبية، تابع تقدمك لتأمين الشهادة!
                      </h4>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      // pick the most recent progress course
                      const lastC = allowedCourses.find(c => c.id === progress[progress.length - 1].courseId) || allowedCourses[0];
                      if (lastC) setActiveCourse(lastC);
                    }}
                    className="bg-slate-900 border border-slate-900 text-amber-500 hover:bg-slate-805 text-xs font-bold py-2 px-5 rounded-xl transition-all"
                  >
                    متابعة الدرس الحالي
                  </button>
                </div>
              </div>
            )}

            {/* Core Section: Course Categories Filtering Tabs */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6" id="categories-hub">
              <div className="text-right">
                <h2 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">أقسام التدريب والعلوم المتخصصة</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">اختر الفرع التدريبي لعزل الكورسات وعرض تخصصاتها</p>
              </div>

              {/* Grid of category round selectors */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4" id="categories-selector-grid">
                
                {/* Clear Filter button */}
                <button
                  onClick={() => setSelectedCategoryFilter(null)}
                  className={`p-4 rounded-2xl border text-right flex flex-col justify-between h-28 transition-all duration-300 group shadow-sm ${
                    selectedCategoryFilter === null
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
                  }`}
                  id="cat-all-btn"
                >
                  <span className={`p-1.5 rounded-lg shrink-0 ${selectedCategoryFilter === null ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-505'}`}>
                    <Grid className="h-5 w-5" />
                  </span>
                  <div className="text-right mt-2">
                    <span className="text-xs font-extrabold block">كافة المساقات</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{allowedCourses.length} دورة جاهزة</span>
                  </div>
                </button>

                {categories.map((cat) => {
                   const isSelected = selectedCategoryFilter === cat.id;
                   const catCoursesCount = allowedCourses.filter(c => c.categoryId === cat.id).length;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryFilter(cat.id)}
                      className={`p-4 rounded-2xl border text-right flex flex-col justify-between h-28 transition-all duration-300 group shadow-sm ${
                        isSelected
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-white border-slate-205 text-slate-700 hover:bg-slate-50'
                      }`}
                      id={`cat-filter-btn-${cat.id}`}
                    >
                      <span className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-105'}`}>
                        {getCategoryIcon(cat.iconName)}
                      </span>
                      <div className="text-right mt-2">
                        <span className="text-xs font-extrabold block leading-tight">{cat.name.replace('قسم ', '')}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{catCoursesCount} مساقات مفعلة</span>
                      </div>
                    </button>
                  );
                })}

              </div>
            </div>

            {/* Courses Catalog listings */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6" id="academy-courses-grid">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-950">
                    {selectedCategoryFilter 
                      ? `البرامج المدرجة تحت: ${categories.find(c => c.id === selectedCategoryFilter)?.name || ''}`
                      : 'الكتالوج الكامل للدبلومات والبرامج التدريبية المتاحة'
                    }
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">درجة الرعاية والتدريب مصممة لتأهيل المتدرب مباشرة للاستقلال الميداني</p>
                </div>

                <span className="text-xs text-slate-500 font-bold">عرض {filteredCourses.length} برامج تدريبية</span>
              </div>

              {/* Course grid items card list */}
              {filteredCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredCourses.map((course) => {
                    const completedPercentage = getCourseProgressPercentage(course.id);
                    const isPassed = certificates.some(c => c.userId === currentUser?.id && c.courseId === course.id);
                    const courseLsnCount = lessons[course.id]?.length || 0;

                    return (
                      <div 
                        key={course.id} 
                        className="bg-white rounded-3xl overflow-hidden border border-slate-205 flex flex-col h-full shadow-md group hover:shadow-xl transition-all duration-300" 
                        id={`course-item-card-${course.id}`}
                      >
                        {/* Course Cover Image Banner */}
                        <div className="relative aspect-video overflow-hidden bg-slate-900 border-b border-slate-100">
                          <img 
                            src={course.image} 
                            alt={course.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-550 filter brightness-95"
                          />
                          <div className="absolute top-3 right-3 flex gap-2">
                            <span className="bg-slate-900/80 backdrop-blur-sm shadow-sm text-amber-500 text-[10px] font-black px-2.5 py-1 rounded-lg">
                              {course.level}
                            </span>
                          </div>

                          {/* Completed percentage badge overlay */}
                          {completedPercentage > 0 && (
                            <div className="absolute bottom-3 left-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow">
                              <Check className="h-3 w-3" />
                              <span>منجز {Math.min(100, completedPercentage)}%</span>
                            </div>
                          )}

                          {isPassed && (
                            <div className="absolute top-3 left-3 bg-yellow-500 text-slate-950 text-[9px] font-black tracking-tight px-2 py-1 rounded-lg flex items-center gap-1 shadow animate-bounce">
                              <Award className="h-3 w-3" />
                              <span>مؤهل بالشهادة</span>
                            </div>
                          )}
                        </div>

                        {/* Title & Body of course details */}
                        <div className="p-5 flex-grow flex flex-col justify-between text-right space-y-4">
                          <div className="space-y-2">
                            <h4 className="font-extrabold text-sm sm:text-base text-slate-900 line-clamp-1 leading-snug group-hover:text-amber-600 transition-colors">
                              {course.title}
                            </h4>
                            <p className="text-xs text-slate-500 leading-relaxed font-normal line-clamp-2">
                              {course.description}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-100 space-y-3">
                            {/* Instructor / Duration details row */}
                            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                              <span>المشرف الفني: <strong className="text-slate-800 font-bold">{course.instructor}</strong></span>
                              <span>المدة المقررة: {course.duration}</span>
                            </div>

                            {/* Completed Progress bar indicator for index feed */}
                            {completedPercentage > 0 && (
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="text-slate-400">تقدم دراستك</span>
                                  <span className="text-emerald-600 font-bold">{Math.min(100, completedPercentage)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1">
                                  <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${Math.min(100, completedPercentage)}%` }}></div>
                                </div>
                              </div>
                            )}

                            {/* Action key buttons */}
                            <div className="pt-1">
                              <button
                                onClick={() => handleStartStudyCourse(course)}
                                className="w-full bg-slate-900 border border-slate-900 hover:bg-slate-805 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <span>{completedPercentage > 0 ? 'مواصلة المذاكرة الحيوية' : 'بدء دراسة المحاضرات'}</span>
                                <ChevronLeft className="h-4 w-4 shrink-0 text-amber-500" />
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-200" id="blank-courses-state">
                  <FolderOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-700 text-sm">عذراً، لم نجد أي مساق يطابق كلمات البحث</h4>
                  <p className="text-xs text-slate-400 mt-1">تأكد من اختيار قسم مختلف أو كتابة كلمة مفتاحية سليمة.</p>
                </div>
              )}
            </div>

            {/* Static sections: Accreditations (من نحن) inside home feed */}
            <div className="bg-white border-y border-slate-200 py-16" id="about-us-section">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-right space-y-8">
                <div className="max-w-2xl text-right space-y-2">
                  <h2 className="text-xl md:text-2xl font-extrabold text-slate-950">المركز الخليجي المعتمد للتدريب والتطوير (من نحن)</h2>
                  <p className="text-slate-500 text-xs md:text-sm font-normal leading-relaxed">
                    تأسس المركز الخليجي المشترك GCC Center بهدف تمكين الشباب وصناع المستقبل بالخليج عبر برامج رشيقة ومعتمدة وممتازة.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
                  <div className="space-y-2.5 bg-slate-55/60 p-5 rounded-2xl border border-slate-200/50">
                    <h4 className="font-extrabold text-slate-905 text-sm flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                      <span>رؤيتنا الإستراتيجية</span>
                    </h4>
                    <p>المساهمة في بناء الكوادر المهنية والقيادية المتخصصة وفق أعلى المعايير العالمية من خلال بيئة تعليمية ذكية تجمع بين الدراسة التفاعلية النظرية والتمكين التطبيقي المالي واللوجيستي الفعال.</p>
                  </div>

                  <div className="space-y-2.5 bg-slate-55/60 p-5 rounded-2xl border border-slate-200/50">
                    <h4 className="font-extrabold text-slate-905 text-sm flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                      <span>الاعتمادات والتراخيص</span>
                    </h4>
                    <p>برامجنا وتراخيصنا متوائمة بالكامل مع معايير الأوشا الدولية (OSHA)، الأيزو العالمي لترصيف الجودة (ISO)، ومصادقة لجان التدريب والتعليم المهني والتقني بالمملكة ودول مجلس التعاون عاملاً.</p>
                  </div>

                  <div className="space-y-2.5 bg-slate-55/60 p-5 rounded-2xl border border-slate-200/50">
                    <h4 className="font-extrabold text-slate-905 text-sm flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                      <span>آلية دراسة الدبلوم</span>
                    </h4>
                    <p>بفضل الهيكلية الفريدة للبرامج، يمر الطالب بثلاث مراحل متوالية: التعرف والتفاعل مع المحاضرات، حل الأسئلة الفرعية للدروس، ثم التقدم للامتحان الكلي واستخراج الشهادة الخليجية الموقّعة.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Global Footer */}
      <Footer
        onOpenPrivacy={() => {
          setShowAboutModal(false);
          setShowPrivacyModal(true);
        }}
        onOpenAbout={() => {
          setShowPrivacyModal(false);
          setShowAboutModal(true);
        }}
      />

      {/* MODALS / OVERLAYS */}

      {/* 1. Account / Login Signup Modal Overlay (Step 1) */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm text-right" id="login-modal-overlay">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 overflow-hidden shadow-2xl p-6 md:p-8 space-y-6 relative" id="login-modal-card">
            
            <button
              onClick={() => {
                setShowLoginModal(false);
                resetLoginFields();
              }}
              className="absolute top-4 left-4 p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              id="close-login-btn"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold text-lg shadow-inner shadow-amber-300">
                GCC
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                {isRegisterMode ? 'إنشاء حساب طلابي جديد' : 'تسجيل دخول المتدربين'}
              </h3>
              <p className="text-xs text-slate-500">
                {isRegisterMode ? 'سجل بياناتك المعتمدة للالتحاق بالبرامج التدريبية للأكاديمية' : 'أدخل بريدك الإلكتروني المعتمد لإجراء المصادقة ومتابعة المقررات'}
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {isRegisterMode && (
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-600 block">الاسم الكريم بالكامل (ليظهر على شهادتك بدقة):</label>
                  <input
                    type="text"
                    required
                    placeholder="اكتب اسمك الثلاثي باللغة العربية..."
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    className="w-full text-xs text-slate-900 border border-slate-250 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-right"
                  />
                </div>
              )}

              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-slate-600 block">عنوان البريد الإلكتروني للطلاب:</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full text-xs text-slate-900 border border-slate-250 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-left placeholder:text-right"
                />
              </div>

              {isRegisterMode && (
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-600 block">رقم الهاتف الجوال الفعال (مع كود الدولة):</label>
                  <input
                    type="tel"
                    placeholder="05xxxxxx"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    className="w-full text-xs text-slate-905 border border-slate-250 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-left"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-805 text-white font-extrabold py-3 rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                <span>{isRegisterMode ? 'إنشاء الحساب ومباشرة الدراسة' : 'تسجيل دخول فوري للمنصة'}</span>
              </button>

            </form>

            {/* Quick Demo Accout Logins for ease of assessment */}
            <div className="border-t border-slate-150 pt-4 space-y-3">
              <span className="text-[10px] text-slate-400 font-bold block text-center">أو خيارات تجريب سريعة للجان التحكيم والأستاذ:</span>
              <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => triggerQuickLogin('student')}
                  className="bg-amber-500/10 text-amber-705 border border-amber-500/20 py-2 px-1.5 rounded-lg hover:bg-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span>دخول طالب تجريبي</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerQuickLogin('admin')}
                  className="bg-rose-500/10 text-rose-705 border border-rose-500/20 py-2 px-1.5 rounded-lg hover:bg-rose-500/20 transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>دخول بصفة مدير</span>
                </button>
              </div>
            </div>

            <div className="text-center font-medium">
              <button
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-amber-600 hover:text-amber-500 text-xs translate-y-1.5 inline-block"
              >
                {isRegisterMode ? 'لديك حساب بالفعل؟ سجل دخولك' : 'لا تملك حساباً بعد؟ أنشئ حسابك كطالب الآن'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. Privacy Policy Modal Overlay */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm text-right" id="privacy-modal-overlay">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 overflow-hidden shadow-2xl p-6 md:p-8 space-y-6 relative" id="privacy-card">
            
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="absolute top-4 left-4 p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              id="close-privacy-btn"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-150 pb-3">
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
              <h3 className="text-lg font-bold text-slate-900">سياسة الخصوصية وحماية بيانات الطلاب</h3>
            </div>

            <div className="text-xs sm:text-sm text-slate-600 space-y-4 leading-relaxed overflow-y-auto max-h-[300px] font-normal">
              <p>نولي في <b>GCC Center</b> أهمية قصوى لسرية بيانات المتدربين والشركاء ونلتزم بحمايتها وفق القوانين الحكومية السارية بالمملكة ودول مجلس التعاون.</p>
              
              <h4 className="font-bold text-slate-900 text-xs">1. البيانات التي نجمعها:</h4>
              <p>البيانات المدخلة في استمارات تأسيس الحسابات (الاسم الكريم، البريد الإلكتروني، والهاتف) لغرض توليد شهادات تخرج دقيقة وتوثيق تقدم مشاهدتك وحفظها في متصفحك محلياً.</p>

              <h4 className="font-bold text-slate-900 text-xs">2. استخدام البيانات وسجل التقدم:</h4>
              <p>يقتصر سجل تقدمك والمواد المفهرسة على التصفح الشخصي لإدارة وتدبير شؤون دراستك واجتياز الامتحانات. لا نقوم بمشاركة أي عنوان بريد إلكتروني أو رقم هاتف مع أطراف ثالثة لأغراض تسويقية تجارية بالكلية.</p>

              <h4 className="font-bold text-slate-900 text-xs">3. التحقق من صحة وصلاحية الشهادات:</h4>
              <p>يحتوي كل كرت شهادة صادر من مركزنا العتيد على كود فريد للتأكيد. بإمكان متخذي القرارات وأصحاب العمل الاستعلام للتثبت من اجتيازك الكورس بـ GCC Center بطريقة رسمية.</p>
            </div>

            <div className="pt-4 border-t border-slate-150 flex justify-end">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="bg-slate-900 text-white font-bold px-6 py-2 rounded-xl text-xs"
              >
                لقد قرأت وموافق على السياسة
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 3. About Us Modal Overlay */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm text-right" id="about-modal-overlay">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 overflow-hidden shadow-2xl p-6 md:p-8 space-y-6 relative" id="about-card">
            
            <button
              onClick={() => setShowAboutModal(false)}
              className="absolute top-4 left-4 p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              id="close-about-btn"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-150 pb-3">
              <Info className="h-6 w-6 text-amber-500" />
              <h3 className="text-lg font-bold text-slate-900">عن المركز الخليجي المشترك للتدريب والتعليم (من نحن)</h3>
            </div>

            <div className="text-xs sm:text-sm text-slate-605 space-y-4 leading-relaxed overflow-y-auto max-h-[300px] font-normal">
              <p><b>GCC Center</b> هو منصة رائدة متكاملة لتأسيس وإصدار وتدبير برامج الدبلومات والتدريب الفئات المتقدمة والمبتدئة.</p>
              
              <p>تتمحور حلولنا حول تأطير العلوم المادية المعاصرة بموجب متطلبات تشغيل شركات ومصانع الخليج الكبرى لتسهيل انتقال الطلاب من حيز الصفوف الدراسية النظرية لحومة الإنتاج المباشر، وتزويدهم بشهادات معترفة.</p>

              <h4 className="font-bold text-slate-900 text-xs">لماذا المركز الخليجي المشترك؟</h4>
              <ul className="list-disc leading-relaxed pr-4 space-y-1">
                <li>هيئة أكاديمية وفنية تضم نخبة مدراء ومشرفي وصقور الهندسة والسلامة الخليجية.</li>
                <li>تكامل حقيقي وعروض بصرية وكتيبات وشرائح ملخصة تسهل دراستك أينما كنت.</li>
                <li>أداء معزز ومتكامل بالكامل للربط بقواعد بيئية متينة لتمكينك من التعلم والاستمرار دون انقطاع.</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-150 flex justify-end">
              <button
                onClick={() => setShowAboutModal(false)}
                className="bg-slate-900 text-white font-bold px-6 py-2 rounded-xl text-xs"
              >
                العودة للصفحة الرئيسية
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
