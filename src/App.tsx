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
  deleteUserFromDb,
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
import { useLanguage } from './lib/LanguageContext';

// Set up initial state keys in LocalStorage
const LOCAL_CAT_KEY = 'gcc_categories';
const LOCAL_CRS_KEY = 'gcc_courses';
const LOCAL_LSN_KEY = 'gcc_lessons';
const LOCAL_USR_KEY = 'gcc_users';
const LOCAL_PRG_KEY = 'gcc_progress';
const LOCAL_CRT_KEY = 'gcc_certificates';
const LOCAL_CURR_USR_KEY = 'gcc_current_user';

// Helper to migrate and secure public lesson media URLs
function migrateLessonMediaUrl(url: string | undefined, type: 'video' | 'pdf' | 'presentation' | 'quiz'): string | undefined {
  if (!url) return url;
  
  // 1. If it's a blob url, replace with an accessible fallback in production
  if (url.startsWith('blob:')) {
    console.log(`Migrating blob URL to public domain fallback: ${url}`);
    if (type === 'video') {
      return 'https://assets.mixkit.co/videos/preview/mixkit-firefighter-putting-out-a-car-fire-40336-large.mp4';
    } else if (type === 'pdf') {
      return 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    }
    return '';
  }
  
  // 2. If it is a proxy redirect or internal video stream path, convert directly to public R2
  let key = '';
  if (url.includes('/api/video/stream?key=')) {
    const match = url.match(/[?&]key=([^&]+)/);
    if (match && match[1]) {
      key = decodeURIComponent(match[1]);
    }
  } else if (url.startsWith('videos/') || url.startsWith('documents/')) {
    key = url;
  }
  
  if (key) {
    const publicR2Domain = 'https://pub-9e3616bcd27644489c80a1831756eb22.r2.dev';
    const cleanUrl = `${publicR2Domain}/${key}`;
    console.log(`Migrating custom path R2 URL "${url}" to direct public URL: "${cleanUrl}"`);
    return cleanUrl;
  }
  
  return url;
}

export default function App() {
  const { language, t, isAr } = useLanguage();
  
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
  const [loginPassword, setLoginPassword] = useState('');
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
        } else {
          // PROACTIVE RECURSIVE MIGRATION & HEALING OF STORED LESSON MEDIA URLS
          let migrationPerformed = false;
          const healedLessonsMap: Record<string, Lesson[]> = {};
          const healedLessonsToUpdate: Lesson[] = [];

          for (const [courseId, lsnList] of Object.entries(dbLessons)) {
            const healedList: Lesson[] = [];
            for (const lesson of lsnList) {
              const originalUrl = lesson.mediaUrl;
              const cleanUrl = migrateLessonMediaUrl(originalUrl, lesson.type);
              
              if (cleanUrl !== originalUrl) {
                console.log(`Detected outdated/non-public URL "${originalUrl}" in lesson "${lesson.title}". Healing to: "${cleanUrl}"`);
                const healedLesson: Lesson = {
                  ...lesson,
                  mediaUrl: cleanUrl
                };
                healedList.push(healedLesson);
                healedLessonsToUpdate.push(healedLesson);
                migrationPerformed = true;
              } else {
                healedList.push(lesson);
              }
            }
            healedLessonsMap[courseId] = healedList;
          }

          if (migrationPerformed && healedLessonsToUpdate.length > 0) {
            console.log(`Rewriting ${healedLessonsToUpdate.length} healed/migrated public lessons back to Firestore in background...`);
            await saveLessonsBatchToDb(healedLessonsToUpdate);
            dbLessons = healedLessonsMap;
          }
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

        // Hydrate current active user (Keep session active until explicit manual signout)
        const localUser = localStorage.getItem(LOCAL_CURR_USR_KEY);
        if (localUser && localUser !== 'null') {
          try {
            const parsed = JSON.parse(localUser);
            if (parsed && typeof parsed === 'object' && parsed.id) {
              const parsedEmail = parsed.email ? parsed.email.toLowerCase() : '';
              const found = dbUsers.find(u => u.id === parsed.id || (parsedEmail && u.email.toLowerCase() === parsedEmail));
              if (found) {
                setCurrentUser(found);
                localStorage.setItem(LOCAL_CURR_USR_KEY, JSON.stringify(found));
              } else {
                setCurrentUser(null);
                localStorage.removeItem(LOCAL_CURR_USR_KEY);
              }
            } else {
              setCurrentUser(null);
            }
          } catch {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error("Error loading users:", err);
        const localUsers = localStorage.getItem(LOCAL_USR_KEY);
        const loadedUsers = localUsers ? JSON.parse(localUsers) : initialUsers;
        setUsers(loadedUsers);

        const localUser = localStorage.getItem(LOCAL_CURR_USR_KEY);
        if (localUser && localUser !== 'null') {
          try {
            const parsed = JSON.parse(localUser);
            if (parsed && typeof parsed === 'object') {
              setCurrentUser(parsed);
            } else {
              setCurrentUser(null);
            }
          } catch {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
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

  // Enforce scrolling to the top of the page when active view or course selection changes, addressing "واجعل الصفحة تبدا من الاعلي وليس الاسفل"
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeCourse, unregisteredCourse, isAdminView, currentUser]);

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
    const emailLower = loginEmail.trim().toLowerCase();
    if (!emailLower) return;

    if (emailLower === 'admin@gcc.com') {
      if (loginPassword !== 'GCC2026') {
        alert(isAr ? 'كلمة المرور المدخلة للمسؤول غير صحيحة.' : 'Incorrect password for the Administrator.');
        return;
      }
      
      const adminUsr = users.find(u => u.email.toLowerCase() === 'admin@gcc.com');
      if (adminUsr) {
        setCurrentUser(adminUsr);
        localStorage.setItem(LOCAL_CURR_USR_KEY, JSON.stringify(adminUsr));
      } else {
        const fallbackAdmin: UserType = {
          id: 'usr-1',
          name: 'أ. د. عمر بن عبد العزيز',
          email: 'admin@gcc.com',
          phone: '0500112233',
          role: 'admin'
        };
        setCurrentUser(fallbackAdmin);
        localStorage.setItem(LOCAL_CURR_USR_KEY, JSON.stringify(fallbackAdmin));
      }
      setShowLoginModal(false);
      resetLoginFields();
      alert(isAr ? 'تم تسجيل دخول المسؤول بنجاح.' : 'Admin logged in successfully.');
    } else {
      // Student login: MUST exist in the system (i.e. added by Admin)
      const match = users.find(u => u.email.toLowerCase() === emailLower && u.role === 'student');
      if (match) {
        setCurrentUser(match);
        localStorage.setItem(LOCAL_CURR_USR_KEY, JSON.stringify(match));
        setShowLoginModal(false);
        resetLoginFields();
        alert(isAr ? `مرحباً بك مجدداً بمجلس GCC Center: ${match.name}` : `Welcome back to GCC Center: ${match.name}`);
      } else {
        alert(isAr 
          ? 'عذراً، هذا البريد غير مسجل بنظام الطلاب لدينا. يرجى التواصل مع إدارة المركز للتفعيل وإسناد المقررات.' 
          : 'Sorry, this email is not registered in our student system. Please contact the center administration to activate your account and assign courses.'
        );
      }
    }
  };

  const resetLoginFields = () => {
    setLoginEmail('');
    setLoginName('');
    setLoginPhone('');
    setLoginPassword('');
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

  const handleAddLesson = (courseId: string, newLsn: { title: string; type: 'video' | 'pdf' | 'presentation' | 'quiz'; duration: string; description: string; mediaUrl?: string }) => {
    const courseLessons = lessons[courseId] || [];
    const lessonId = `lesson-${Date.now()}`;
    
    const entry: Lesson = {
      id: lessonId,
      courseId,
      title: newLsn.title,
      type: newLsn.type,
      duration: newLsn.duration,
      mediaUrl: migrateLessonMediaUrl(newLsn.mediaUrl, newLsn.type),
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

  const handleDeleteLesson = (courseId: string, lessonId: string) => {
    const courseLessons = lessons[courseId] || [];
    const filtered = courseLessons.filter(l => l.id !== lessonId);
    
    const updatedLsnMap = {
      ...lessons,
      [courseId]: filtered
    };
    saveLessons(updatedLsnMap);
    deleteLessonFromDb(lessonId);

    // Update the course lessonsCount
    const updatedCourses = courses.map(c => {
      if (c.id === courseId) {
        return { ...c, lessonsCount: Math.max(0, (c.lessonsCount || 0) - 1) };
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

  const handleEditCategory = (updatedCat: Category) => {
    const updated = categories.map(cat => cat.id === updatedCat.id ? updatedCat : cat);
    saveCategories(updated);
  };

  const handleEditCourse = (updatedCourse: Course) => {
    const updated = courses.map(c => c.id === updatedCourse.id ? updatedCourse : c);
    saveCourses(updated);
  };

  const handleEditLesson = (courseId: string, lessonId: string, updatedLesson: Lesson) => {
    const courseLessons = lessons[courseId] || [];
    const sanitizedLesson = {
      ...updatedLesson,
      mediaUrl: migrateLessonMediaUrl(updatedLesson.mediaUrl, updatedLesson.type)
    };
    const updated = courseLessons.map(l => l.id === lessonId ? sanitizedLesson : l);
    const updatedLsnMap = {
      ...lessons,
      [courseId]: updated
    };
    saveLessons(updatedLsnMap);
  };

  const handleDeleteUser = (userId: string) => {
    const filtered = users.filter(u => u.id !== userId);
    saveUsers(filtered);
    deleteUserFromDb(userId);
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
            onDeleteLesson={handleDeleteLesson}
            onSaveUsers={saveUsers}
            onEditCategory={handleEditCategory}
            onEditCourse={handleEditCourse}
            onEditLesson={handleEditLesson}
            onDeleteUser={handleDeleteUser}
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
          <div className="space-y-12 block">
            
            {/* Elegant Premium Academy Hero Banner */}
            <div className={`relative bg-slate-900 text-white overflow-hidden border-b border-slate-800 ${isAr ? 'text-right' : 'text-left'}`} id="hero-banner">
              <div className="absolute inset-0 bg-radial-gradient from-slate-800/40 via-transparent to-slate-950 pointer-events-none"></div>
              <div className="absolute top-1/2 left-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  
                  <div className="space-y-6 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/15 border border-amber-500/20 rounded-full text-xs font-bold text-amber-400">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{t('hero_badge')}</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white font-sans">
                      {t('hero_title')} <strong className="text-amber-500 font-black">{t('brand_name')}</strong>
                    </h1>
                    
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                      {t('hero_desc')}
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
                        <span>{t('hero_explore')}</span>
                        <ArrowRight className={`h-4 w-4 ${isAr ? 'rotate-180' : ''}`} />
                      </button>

                      {!currentUser && (
                        <button
                          onClick={() => setShowLoginModal(true)}
                          className="bg-slate-800 hover:bg-slate-750 text-slate-205 border border-slate-700 font-bold px-5 py-3 rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
                        >
                          {t('hero_register')}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Graphics / Highlights Grid */}
                  <div className={`hidden lg:grid grid-cols-2 gap-4 ${isAr ? 'text-right' : 'text-left'}`}>
                    
                    <div className="bg-slate-850/80 border border-slate-750 p-6 rounded-2xl">
                      <ShieldCheck className="h-8 w-8 text-amber-500 mb-3" />
                      <h4 className="font-bold text-sm text-slate-100">{t('hero_cert_title')}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed font-normal">{t('hero_cert_desc')}</p>
                    </div>

                    <div className="bg-slate-850/80 border border-slate-750 p-6 rounded-2xl">
                      <Briefcase className="h-8 w-8 text-emerald-500 mb-3" />
                      <h4 className="font-bold text-sm text-slate-100">{t('hero_job_title')}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed font-normal">{t('hero_job_desc')}</p>
                    </div>

                    <div className="bg-slate-850/80 border border-slate-750 p-6 rounded-2xl">
                      <Video className="h-8 w-8 text-indigo-500 mb-3" />
                      <h4 className="font-bold text-sm text-slate-100">{t('hero_materials_title')}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed font-normal">{t('hero_materials_desc')}</p>
                    </div>

                    <div className="bg-slate-850/80 border border-slate-750 p-6 rounded-2xl">
                      <GraduationCap className="h-8 w-8 text-rose-500 mb-3" />
                      <h4 className="font-bold text-sm text-slate-100">{t('hero_progress_title')}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed font-normal">{t('hero_progress_desc')}</p>
                    </div>

                  </div>

                </div>
              </div>
            </div>

            {/* Resume last studied course card */}
            {currentUser && progress.length > 0 && (
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" id="recent-progress-box">
                <div className={`bg-white rounded-2xl border border-slate-205 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 ${isAr ? 'text-right' : 'text-left'}`}>
                  <div className={`flex items-center gap-3 ${isAr ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-450 font-bold block">{t('recent_resume_label')}</span>
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                        {t('recent_resume_desc')}
                      </h4>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      // pick the most recent progress course
                      const lastC = allowedCourses.find(c => c.id === progress[progress.length - 1].courseId) || allowedCourses[0];
                      if (lastC) setActiveCourse(lastC);
                    }}
                    className="bg-slate-900 border border-slate-900 text-amber-500 hover:bg-slate-805 text-xs font-bold py-2 px-5 rounded-xl transition-all cursor-pointer"
                  >
                    {t('recent_resume_btn')}
                  </button>
                </div>
              </div>
            )}

            {/* Core Section: Course Categories Filtering Tabs */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6" id="categories-hub">
              <div className={isAr ? 'text-right' : 'text-left'}>
                <h2 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">{t('cat_title_head')}</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">{t('cat_title_sub')}</p>
              </div>

              {/* Grid of category round selectors */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4" id="categories-selector-grid">
                
                {/* Clear Filter button */}
                <button
                  onClick={() => setSelectedCategoryFilter(null)}
                  className={`p-4 rounded-2xl border flex flex-col justify-between h-28 transition-all duration-300 group shadow-sm ${isAr ? 'text-right' : 'text-left'} ${
                    selectedCategoryFilter === null
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50 shadow-sm'
                  }`}
                  id="cat-all-btn"
                >
                  <span className={`p-1.5 rounded-lg shrink-0 ${selectedCategoryFilter === null ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-505'}`}>
                    <Grid className="h-5 w-5" />
                  </span>
                  <div className={`mt-2 ${isAr ? 'text-right' : 'text-left'}`}>
                    <span className="text-xs font-extrabold block">{t('cat_all')}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{allowedCourses.length} {t('cat_all_sub')}</span>
                  </div>
                </button>

                {categories.map((cat) => {
                   const isSelected = selectedCategoryFilter === cat.id;
                   const catCoursesCount = allowedCourses.filter(c => c.categoryId === cat.id).length;
                   // Translate category name based on language
                   let catNameTranslated = cat.name;
                   if (!isAr) {
                     if (cat.name.includes('السلامة والصحة')) catNameTranslated = 'Safety & Health';
                     else if (cat.name.includes('الطيران')) catNameTranslated = 'Aviation Systems';
                     else if (cat.name.includes('إدارة ونظم')) catNameTranslated = 'Quality Control';
                     else if (cat.name.includes('اللغات والاتصال')) catNameTranslated = 'Languages';
                     else if (cat.name.includes('المحاسبة والمالية')) catNameTranslated = 'Finance & Accounts';
                     else if (cat.name.includes('البرمجة')) catNameTranslated = 'Software Systems';
                   } else {
                     catNameTranslated = cat.name.replace('قسم ', '');
                   }

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryFilter(cat.id)}
                      className={`p-4 rounded-2xl border flex flex-col justify-between h-28 transition-all duration-300 group shadow-sm ${isAr ? 'text-right' : 'text-left'} ${
                        isSelected
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-white border-slate-205 text-slate-700 hover:bg-slate-50 shadow-sm'
                      }`}
                      id={`cat-filter-btn-${cat.id}`}
                    >
                      <span className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-105'}`}>
                        {getCategoryIcon(cat.iconName)}
                      </span>
                      <div className={`mt-2 ${isAr ? 'text-right' : 'text-left'}`}>
                        <span className="text-xs font-extrabold block leading-tight">{catNameTranslated}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{catCoursesCount} {t('cat_sub_active')}</span>
                      </div>
                    </button>
                  );
                })}

              </div>
            </div>

            {/* Courses Catalog listings */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6" id="academy-courses-grid">
              
              <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 ${isAr ? 'text-right' : 'text-left'}`}>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-950">
                    {selectedCategoryFilter 
                      ? `${t('catalog_filter_results')} ${
                          !isAr
                            ? categories.find(c => c.id === selectedCategoryFilter)?.name
                                .replace('قسم السلامة والصحة المهنية', 'Occupational Safety & Health')
                                .replace('قسم الطيران وهندسته', 'Aviation & Aerospace Engineering')
                                .replace('قسم إدارة ونظم الجودة المعاصرة', 'Modern Quality Control Management')
                                .replace('قسم اللغات والاتصال الدولي', 'Languages & International Communication')
                                .replace('قسم المحاسبة والمالية للمدراء', 'Accounting & Financial Management')
                                .replace('قسم البرمجة وتقنيات الويب', 'Programming & Web Technologies')
                            : categories.find(c => c.id === selectedCategoryFilter)?.name || ''
                        }`
                      : t('catalog_all_title')
                    }
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{t('catalog_desc')}</p>
                </div>

                <span className="text-xs text-slate-505 font-extrabold">{t('catalog_stats_prefix')} {filteredCourses.length} {t('catalog_stats_suffix')}</span>
              </div>

              {/* Course grid items card list */}
              {filteredCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredCourses.map((course) => {
                    const completedPercentage = getCourseProgressPercentage(course.id);
                    const isPassed = certificates.some(c => c.userId === currentUser?.id && c.courseId === course.id);
                    const courseLsnCount = lessons[course.id]?.length || 0;

                    let translatedLevel = course.level;
                    if (!isAr) {
                      if (course.level.includes('مبتدئ')) translatedLevel = t('level_beginner');
                      else if (course.level.includes('متوسط')) translatedLevel = t('level_intermediate');
                      else if (course.level.includes('متقدم')) translatedLevel = t('level_advanced');
                    }

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
                          <div className={`absolute top-3 ${isAr ? 'right-3' : 'left-3'} flex gap-2`}>
                            <span className="bg-slate-900/80 backdrop-blur-sm shadow-sm text-amber-500 text-[10px] font-black px-2.5 py-1 rounded-lg">
                              {translatedLevel}
                            </span>
                          </div>

                          {/* Completed percentage badge overlay */}
                          {completedPercentage > 0 && (
                            <div className={`absolute bottom-3 ${isAr ? 'left-3' : 'right-3'} bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow`}>
                              <Check className="h-3 w-3" />
                              <span>{t('course_percentage_done')} {Math.min(100, completedPercentage)}%</span>
                            </div>
                          )}

                          {isPassed && (
                            <div className={`absolute top-3 ${isAr ? 'left-3' : 'right-3'} bg-yellow-500 text-slate-950 text-[9px] font-black tracking-tight px-2 py-1 rounded-lg flex items-center gap-1 shadow animate-bounce`}>
                              <Award className="h-3 w-3" />
                              <span>{t('course_qualified')}</span>
                            </div>
                          )}
                        </div>

                        {/* Title & Body of course details */}
                        <div className={`p-5 flex-grow flex flex-col justify-between ${isAr ? 'text-right' : 'text-left'} space-y-4`}>
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
                            <div className={`flex items-center justify-between text-[11px] text-slate-500 font-semibold ${isAr ? 'flex-row' : 'flex-row-reverse'}`}>
                              <span>{t('course_instructor')}: <strong className="text-slate-800 font-bold">{course.instructor}</strong></span>
                              <span>{t('course_duration')}: {course.duration}</span>
                            </div>

                            {/* Completed Progress bar indicator for index feed */}
                            {completedPercentage > 0 && (
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="text-slate-400">{t('course_enrolled_progress')}</span>
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
                                className="w-full bg-slate-900 border border-slate-900 hover:bg-slate-805 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                              >
                                <span>{completedPercentage > 0 ? t('course_btn_resume') : t('course_btn_start')}</span>
                                <ChevronLeft className={`h-4 w-4 shrink-0 text-amber-500 ${isAr ? '' : 'rotate-180'}`} />
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
                  <h4 className="font-bold text-slate-700 text-sm">{t('search_empty_title')}</h4>
                  <p className="text-xs text-slate-400 mt-1">{t('search_empty_desc')}</p>
                </div>
              )}
            </div>

            {/* Static sections: Accreditations (من نحن) inside home feed */}
            <div className="bg-white border-y border-slate-200 py-16" id="about-us-section">
              <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 ${isAr ? 'text-right' : 'text-left'}`}>
                <div className={`max-w-2xl space-y-2 ${isAr ? 'text-right' : 'text-left'}`}>
                  <h2 className="text-xl md:text-2xl font-extrabold text-slate-950">{t('home_about_title')}</h2>
                  <p className="text-slate-500 text-xs md:text-sm font-normal leading-relaxed">
                    {t('home_about_desc')}
                  </p>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm leading-relaxed text-slate-600 font-normal ${isAr ? 'text-right' : 'text-left'}`}>
                  <div className="space-y-2.5 bg-slate-55/60 p-5 rounded-2xl border border-slate-200/50">
                    <h4 className="font-extrabold text-slate-905 text-sm flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                      <span>{t('home_about_col1_title')}</span>
                    </h4>
                    <p>{t('home_about_col1_desc')}</p>
                  </div>

                  <div className="space-y-2.5 bg-slate-55/60 p-5 rounded-2xl border border-slate-200/50">
                    <h4 className="font-extrabold text-slate-905 text-sm flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                      <span>{t('home_about_col2_title')}</span>
                    </h4>
                    <p>{t('home_about_col2_desc')}</p>
                  </div>

                  <div className="space-y-2.5 bg-slate-55/60 p-5 rounded-2xl border border-slate-200/50">
                    <h4 className="font-extrabold text-slate-905 text-sm flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                      <span>{t('home_about_col3_title')}</span>
                    </h4>
                    <p>{t('home_about_col3_desc')}</p>
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
                {isAr ? 'بوابة تسجيل دخول المتدربين والمسؤولين' : 'Trainee & Admin Login Portal'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr ? 'أدخل بريدك الإلكتروني المعتمد لإجراء المصادقة ومتابعة المقررات' : 'Enter your registered email to gain access and resume your courses'}
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5 text-right font-medium">
                <label className="text-xs font-bold text-slate-600 block">
                  {isAr ? 'عنوان البريد الإلكتروني:' : 'Email Address:'}
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full text-xs text-slate-900 border border-slate-250 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-left placeholder:text-right"
                />
              </div>

              {loginEmail.trim().toLowerCase() === 'admin@gcc.com' && (
                <div className="space-y-1.5 text-right font-medium transition-all duration-300">
                  <label className="text-xs font-bold text-slate-600 block">
                    {isAr ? 'كلمة المرور الخاصة بالمسؤول:' : 'Administrator Password:'}
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full text-xs text-slate-900 border border-slate-250 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-left placeholder:text-right"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-805 text-white font-extrabold py-3 rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                <span>{isAr ? 'تسجيل دخول فوري للمنصة' : 'Immediate Platform Sign In'}</span>
              </button>
            </form>

            <div className="text-center font-medium pt-3 border-t border-slate-150">
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {isAr 
                  ? 'ملاحظة للمتدربين: يتم تسجيل حسابات الطلاب وإتاحة إيميلاتهم للدخول حصراً من خلال إدارة المركز والمسؤول العام.' 
                  : 'Note for students: Student accounts are registered and pre-authorized for entry exclusively by the Center Administration.'}
              </p>
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
