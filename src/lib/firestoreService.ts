/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Category, Course, Lesson, User as UserType, LessonProgress, Certificate, NotificationLog } from '../types';

// ==========================================
// CATEGORIES OPERATIONS
// ==========================================

export async function fetchCategoriesFromDb(): Promise<Category[]> {
  const colPath = 'categories';
  try {
    const snapshot = await getDocs(collection(db, colPath));
    const list: Category[] = [];
    snapshot.forEach(d => {
      list.push(d.data() as Category);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, colPath);
    return [];
  }
}

export async function saveCategoryToDb(category: Category): Promise<void> {
  const docPath = `categories/${category.id}`;
  try {
    await setDoc(doc(db, 'categories', category.id), category);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

export async function deleteCategoryFromDb(id: string): Promise<void> {
  const docPath = `categories/${id}`;
  try {
    await deleteDoc(doc(db, 'categories', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, docPath);
  }
}

// ==========================================
// COURSES OPERATIONS
// ==========================================

export async function fetchCoursesFromDb(): Promise<Course[]> {
  const colPath = 'courses';
  try {
    const snapshot = await getDocs(collection(db, colPath));
    const list: Course[] = [];
    snapshot.forEach(d => {
      list.push(d.data() as Course);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, colPath);
    return [];
  }
}

export async function saveCourseToDb(course: Course): Promise<void> {
  const docPath = `courses/${course.id}`;
  try {
    await setDoc(doc(db, 'courses', course.id), course);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

export async function deleteCourseFromDb(id: string): Promise<void> {
  const docPath = `courses/${id}`;
  try {
    await deleteDoc(doc(db, 'courses', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, docPath);
  }
}

// ==========================================
// LESSONS OPERATIONS
// ==========================================

export async function fetchLessonsFromDb(): Promise<Record<string, Lesson[]>> {
  const colPath = 'lessons';
  try {
    const snapshot = await getDocs(collection(db, colPath));
    const lessonsMap: Record<string, Lesson[]> = {};
    snapshot.forEach(d => {
      const lesson = d.data() as Lesson;
      if (!lessonsMap[lesson.courseId]) {
        lessonsMap[lesson.courseId] = [];
      }
      lessonsMap[lesson.courseId].push(lesson);
    });
    return lessonsMap;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, colPath);
    return {};
  }
}

export async function saveLessonToDb(lesson: Lesson): Promise<void> {
  const docPath = `lessons/${lesson.id}`;
  try {
    await setDoc(doc(db, 'lessons', lesson.id), lesson);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

export async function deleteLessonFromDb(id: string): Promise<void> {
  const docPath = `lessons/${id}`;
  try {
    await deleteDoc(doc(db, 'lessons', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, docPath);
  }
}

export async function saveLessonsBatchToDb(lessonsList: Lesson[]): Promise<void> {
  const colPath = 'lessons';
  try {
    const batch = writeBatch(db);
    lessonsList.forEach(l => {
      batch.set(doc(db, 'lessons', l.id), l);
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, colPath);
  }
}

// ==========================================
// USERS OPERATIONS
// ==========================================

export async function fetchUsersFromDb(): Promise<UserType[]> {
  const colPath = 'users';
  try {
    const snapshot = await getDocs(collection(db, colPath));
    const list: UserType[] = [];
    snapshot.forEach(d => {
      list.push(d.data() as UserType);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, colPath);
    return [];
  }
}

export async function saveUserToDb(user: UserType): Promise<void> {
  const docPath = `users/${user.id}`;
  try {
    await setDoc(doc(db, 'users', user.id), user);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

// ==========================================
// PROGRESS OPERATIONS
// ==========================================

export async function fetchProgressFromDb(): Promise<LessonProgress[]> {
  const colPath = 'progress';
  try {
    const snapshot = await getDocs(collection(db, colPath));
    const list: LessonProgress[] = [];
    snapshot.forEach(d => {
      list.push(d.data() as LessonProgress);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, colPath);
    return [];
  }
}

export async function saveProgressRecordToDb(p: LessonProgress): Promise<void> {
  const id = `${p.userId}_${p.lessonId}`;
  const docPath = `progress/${id}`;
  try {
    await setDoc(doc(db, 'progress', id), p);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

export async function deleteProgressRecordFromDb(userId: string, lessonId: string): Promise<void> {
  const id = `${userId}_${lessonId}`;
  const docPath = `progress/${id}`;
  try {
    await deleteDoc(doc(db, 'progress', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, docPath);
  }
}

// ==========================================
// CERTIFICATE OPERATIONS
// ==========================================

export async function fetchCertificatesFromDb(): Promise<Certificate[]> {
  const colPath = 'certificates';
  try {
    const snapshot = await getDocs(collection(db, colPath));
    const list: Certificate[] = [];
    snapshot.forEach(d => {
      list.push(d.data() as Certificate);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, colPath);
    return [];
  }
}

export async function saveCertificateToDb(cert: Certificate): Promise<void> {
  const docPath = `certificates/${cert.id}`;
  try {
    await setDoc(doc(db, 'certificates', cert.id), cert);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

// ==========================================
// NOTIFICATIONS OPERATIONS
// ==========================================

export async function fetchNotificationsFromDb(): Promise<NotificationLog[]> {
  const colPath = 'notifications';
  try {
    const snapshot = await getDocs(collection(db, colPath));
    const list: NotificationLog[] = [];
    snapshot.forEach(d => {
      list.push(d.data() as NotificationLog);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, colPath);
    return [];
  }
}

export async function saveNotificationToDb(notification: NotificationLog): Promise<void> {
  const docPath = `notifications/${notification.id}`;
  try {
    await setDoc(doc(db, 'notifications', notification.id), notification);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}
