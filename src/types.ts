/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Category {
  id: string;
  name: string;
  image: string;
  iconName: string; // Lucide icon name representation
}

export interface Course {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  image: string;
  instructor: string;
  duration: string; // e.g. "12 ساعة"
  level: 'مبتدئ' | 'متوسط' | 'متقدم';
  lessonsCount: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  type: 'video' | 'pdf' | 'presentation' | 'quiz';
  duration: string; // e.g. "15 دقيقة"
  videoUrl?: string; // sample video or embedded code
  description?: string;
  pdfContent?: string; // textual representation to show or key summaries
  slides?: Array<{ title: string; content: string[] }>;
  quizQuestions?: QuizQuestion[]; // optional brief quiz, or course-level final exam questions
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'student';
}

export interface LessonProgress {
  userId: string;
  courseId: string;
  lessonId: string;
  completed: boolean;
  completedAt?: string;
}

export interface CourseExam {
  courseId: string;
  questions: QuizQuestion[];
  passingScore: number; // e.g., 70
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  userName: string;
  courseTitle: string;
  issueDate: string;
  grade: number;
  certificateCode: string;
}
