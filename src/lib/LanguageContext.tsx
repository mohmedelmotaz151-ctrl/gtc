/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ar' | 'en';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isAr: boolean;
  isEn: boolean;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Brand & Header
    "brand_name": "GCC center",
    "brand_sub": "المركز المشترك للتدريب",
    "search_placeholder": "ابحث عن دورة أو محاضرة...",
    "nav_home": "الرئيسية",
    "nav_about": "من نحن",
    "nav_privacy": "سياسة الخصوصية",
    "view_student": "مشاهدة كطالب",
    "admin_panel": "لوحة الإدارة",
    "system_admin": "مدير النظام",
    "student_role": "طالب متدرب",
    "login_register": "تسجيل الدخول / التسجيل",
    "logout": "تسجيل الخروج",
    
    // Auth Modal
    "auth_student_login": "تسجيل دخول المتدربين والقرّاء",
    "auth_fullName": "الاسم الثنائي أو الكامل للمتدرب:",
    "auth_fullName_placeholder": "مثال: صالح بن محمد الرويلي",
    "auth_email": "البريد الإلكتروني المعتمد للدخول:",
    "auth_email_placeholder": "مثال: saleh@student.com",
    "auth_phone": "رقم جوال المتدرب لتلقي التنبيهات:",
    "auth_phone_placeholder": "مثال: 0501234567",
    "auth_login_btn": "دخول للمنصة",
    "auth_register_btn": "إنشاء حساب ومستند متدرب",
    "auth_is_student": "ليس لديك حساب؟",
    "auth_is_student_action": "سجل الآن كطالب جديد في ثوانٍ",
    "auth_has_account": "لديك حساب بالفعل؟",
    "auth_has_account_action": "تسجيل الدخول السريع للمتدرب",
    "auth_admin_hint": "للدخول كمسؤول للنظام للتحكم الكامل، يرجى استخدام البريد admin@gcc.com",
    "close": "إغلاق",

    // Auth Form Labels
    "auth_fullname_label": "الاسم الكريم بالكامل (ليظهر على شهادتك بدقة):",
    "auth_fullname_placeholder": "اكتب اسمك الثلاثي باللغة العربية...",
    "auth_email_label": "عنوان البريد الإلكتروني للطلاب:",
    "auth_phone_label": "رقم الهاتف الجوال الفعال (مع كود الدولة):",
    "auth_submit_register": "إنشاء الحساب ومباشرة الدراسة",
    "auth_submit_login": "تسجيل دخول فوري للمنصة",
    "auth_demo_prefix": "أو خيارات تجريب سريعة للجان التحكيم والأستاذ:",
    "auth_demo_student": "دخول طالب تجريبي",
    "auth_demo_admin": "دخول بصفة مدير",
    "auth_toggle_register": "لا تملك حساباً بعد؟ أنشئ حسابك كطالب الآن",
    "auth_toggle_login": "لديك حساب بالفعل؟ سجل دخولك",

    // Footer
    "footer_description": "منصة المركز المشترك الرائدة في تمكين الكفاءات الوطنية والمهنية عبر تمليك العلوم الحيوية في شتى مجالات السلامة والصناعة، الطيران، وإدارة النظم والجودة الحديثة.",
    "footer_pages": "صفحات تهمك",
    "footer_contact": "موقعنا والتواصل",
    "footer_address": "خميس مشيط - أبها، المملكة العربية السعودية",
    "footer_rights": "جميع الحقوق محفوظة لمركز التدريب.",
    "footer_heart": "صُنع بشغف لتمكين مهارات الغد",
    "footer_about_link": "من نحن - قصة وتطلعاتي",
    "footer_privacy_link": "سياسة الخصوصية وحماية بيانات المتدربين",

    // Unregistered Contact Screen
    "unreg_back": "العودة لتصفح الكتالوج",
    "unreg_badge": "طلب تفعيل فوري للمنخرطين الجدد",
    "unreg_title": "تفعيل الكورس والالتحاق بالدورة التدريبية",
    "unreg_subtitle": "عذراً، لم يتم إدراج أو إسناد المقرر لحسابك التدريبي حتى الآن. تفضل بتعبئة طلبك بالأسفل للتواصل المباشر مع إدارة التدريب وإصدار ترخيص دراستك واختبارك فورياً.",
    "unreg_form_title": "نموذج طلب التفعيل وتعيين المقرر الدراسي",
    "unreg_fullname_label": "الاسم الثنائي أو الكامل للمتدرب:",
    "unreg_email_label": "البريد الإلكتروني المعتمد للدخول:",
    "unreg_phone_label": "رقم جوال المتدرب لتلقي التنبيهات:",
    "unreg_course_label": "الكورس أو الدبلوم المراد إسناده ومباشرته:",
    "unreg_notes_label": "ملاحظات إضافية لإدارة الأكاديمية (اختياري):",
    "unreg_notes_placeholder": "مثال: أرغب ببدء الدراسة من اليوم واجتياز الاختبار مباشرة لاستلام الشهادة المعاصرة...",
    "unreg_channels_title": "قنوات التواصل المباشرة والتنفيذ الفوري",
    "unreg_channels_desc": "بمجرد اختيار وسيلة الإرسال بالأسفل، سيتم توجيه بيانات اشتراكك بالكامل لإدارة شؤون المتدربين بمركز الخليج لتسجيل بياناتك وربط حسابك فوراً.",
    "unreg_phone_contact": "رقم التواصل:",
    "unreg_email_contact": "البريد الإلكتروني المعتمد:",
    "unreg_working_hours": "توقيت مراجعة الاعتمادات:",
    "unreg_always_available": "متاح على مدار 24 ساعة ⚡",
    "unreg_send_whatsapp": "إرسال الطلب عبر الواتساب الفوري",
    "unreg_send_email": "إرسال الطلب عبر البريد الإلكتروني",
    "unreg_direct_call": "الاتصال المباشر بإدارة التراخيص",
    "unreg_footer_copy": "GCC Center © 2026 للأمن والسلامة وإدارة جودة التدريب الخليجي الموحد.",

    // Hero Section
    "hero_badge": "الاعتماد الأكاديمي الخليجي الأحدث لعام 2026",
    "hero_title": "ارتقِ بمسيرتك المهنية مع",
    "hero_desc": "منصة التدريب الاحترافية الأولى في الخليج العربي. نقدم برامج ودبلومات معتمدة ومحاضرات تفاعلية في الأمن والسلامة، جودة المعايير، هندسة الطيران، إدارة الحسابات، وصناعة الرموز والبرمجة.",
    "hero_explore": "تصفح الفهرس التدريبي",
    "hero_register": "تأسيس حساب طلابي",
    "hero_cert_title": "شهادات فورية موثقة",
    "hero_cert_desc": "احصل على وثيقتك الخليجية مطبوعة بجودة مذهلة بمجرد إنهاء الاختبار.",
    "hero_job_title": "ملاءمة سوق العمل",
    "hero_job_desc": "تتحاذى المساقات مع متطلبات التوظيف ومعايير أرامكو والإعتمادات الإقليمية.",
    "hero_materials_title": "شروح وكتيبات تفاعلية",
    "hero_materials_desc": "تنوع فريد بين أفلام الفيديوهات، وشرائح السلايدات، وكتب الـ PDF.",
    "hero_progress_title": "متابعة الأداء الاستباقي",
    "hero_progress_desc": "تتبع نسبة تصفحك والعودة لنفس مكان التوقف فوراً ومجاناً.",
    
    // Recent Progress
    "recent_resume_label": "متابعة عملية التعلم",
    "recent_resume_desc": "لديك دروس معلقة بالمسارات التدريبية، تابع تقدمك لتأمين الشهادة!",
    "recent_resume_btn": "متابعة الدرس الحالي",

    // Catalog & Dashboard
    "categories_title": "أقسام ودبلومات التدريب الشاملة",
    "courses_title": "المناهج والدبلومات التخصصية المعتمدة",
    "stats_lessons": "درس ومحاضرة تخصصية",
    "level_beginner": "مبتدئ / أساسي",
    "level_intermediate": "متوسط / ممارس",
    "level_advanced": "متقدم / خبير",
    "enter_course": "دخول قاعة الدرس ومباشرة الدورة",
    "request_access": "طلب تفعيل المسار والانضمام",
    "badge_enrolled": "ملتحق ومفعّل للحساب",
    "search_no_results": "لم نجد أي نتائج تطابق بحثك الحالي.",
    "dashboard_stats_courses": "إجمالي الكورسات",
    "dashboard_stats_lessons": "المحاضرات التعليمية",
    "dashboard_stats_categories": "الأقسام والمسارات",
    "dashboard_stats_certificates": "الشهادات المصدرة",

    "cat_title_head": "أقسام التدريب والعلوم المتخصصة",
    "cat_title_sub": "اختر الفرع التدريبي لعزل الكورسات وعرض تخصصاتها",
    "cat_all": "كافة المساقات",
    "cat_all_sub": "دورة جاهزة",
    "cat_sub_active": "مسارات مفعلة",
    "catalog_filter_results": "البرامج المدرجة تحت:",
    "catalog_all_title": "الكتالوج الكامل للدبلومات والبرامج التدريبية المتاحة",
    "catalog_desc": "درجة الرعاية والتدريب مصممة لتأهيل المتدرب مباشرة للاستقلال الميداني",
    "catalog_stats_prefix": "عرض",
    "catalog_stats_suffix": "برامج تدريبية",
    "course_level": "مستوى",
    "course_enrolled_progress": "تقدم دراستك",
    "course_percentage_done": "منجز",
    "course_qualified": "مؤهل بالشهادة",
    "course_instructor": "المشرف الفني",
    "course_duration": "المدة المقررة",
    "course_btn_resume": "مواصلة المذاكرة الحيوية",
    "course_btn_start": "بدء دراسة المحاضرات",
    "search_empty_title": "عذراً، لم نجد أي مساق يطابق كلمات البحث",
    "search_empty_desc": "تأكد من اختيار قسم مختلف أو كتابة كلمة مفتاحية سليمة.",

    // About Section
    "home_about_title": "المركز الخليجي المعتمد للتدريب والتطوير (من نحن)",
    "home_about_desc": "تأسس المركز الخليجي المشترك GCC Center بهدف تمكين الشباب وصناع المستقبل بالخليج عبر برامج رشيقة ومعتمدة وممتازة.",
    "home_about_col1_title": "رؤيتنا الإستراتيجية",
    "home_about_col1_desc": "المساهمة في بناء الكوادر المهنية والقيادية المتخصصة وفق أعلى المعايير العالمية من خلال بيئة تعليمية ذكية تجمع بين الدراسة التفاعلية النظرية والتمكين التطبيقي المالي واللوجيستي الفعال.",
    "home_about_col2_title": "الاعتمادات والتراخيص",
    "home_about_col2_desc": "برامجنا وتراخيصنا متوائمة بالكامل مع معايير الأوشا الدولية (OSHA)، الأيزو العالمي لترصيف الجودة (ISO)، ومصادقة لجان التدريب والتعليم المهني والتقني بالمملكة ودول مجلس التعاون عاملاً.",
    "home_about_col3_title": "آلية دراسة الدبلوم",
    "home_about_col3_desc": "بفضل الهيكلية الفريدة للبرامج، يمر الطالب بثلاث مراحل متوالية: التعرف والتفاعل مع المحاضرات، حل الأسئلة الفرعية للدروس، ثم التقدم للامتحان الكلي واستخراج الشهادة الخليجية الموقّعة.",

    // Interactive Player
    "player_back_catalog": "العودة لتصفح كتالوج الكورسات والمسارات",
    "player_curriculum": "منهج المساق وجدول الدروس والمحاضرات",
    "player_progress": "مستوى إنجازك في المقرر:",
    "player_completed": "مكتمل",
    "player_play": "تشغيل المحاضرة الفيدوية",
    "player_pdf": "فتح مذكرة الدرس والملخص المكتبات",
    "player_pdf_document": "مذكرة كتابية وثيقة للتحصيل العلمي لـ",
    "player_no_pdf": "لا تتوفر مذكرة كتابية خاصة بهذا الشرح. يرجى التركيز في المحاضرة المرئية ومراجعة الاختبار.",
    "player_loading_pdf": "تحميل مراجعة الملخص والمذكرة الطافية...",
    "player_download_summary": "تحميل ملف المذكرة الملحقة بصيغة PDF",
    "player_mark_completed_full": "إكمال الدرس الحالي ومتابعة المسار",
    "player_lesson_completed": "تم إكمال هذا الدرس بنجاح!",
    "player_exam_btn": "التقديم للاختبار النهائي للدورة",
    "player_final_exam_board": "لوحة تقديم الامتحان والتقييم النهائي الشامل",
    "player_exam_desc": "يرجى قرابة التركيز والهدوء قبل الإجابة. يتكون هذا التقييم من أسئلة اختيار من متعدد تم تصميمها وصياغتها لقياس فهمك للمقرر بنسبة لا تقل عن 70٪ لإصدار شهادة الإنجاز.",
    "player_exam_info_answers": "الإجابة على",
    "player_exam_info_of": "من أصل",
    "player_exam_submit_bulletin": "تسليم ورقة الامتحان النهائي",
    "exam_passed_title": "ألف مبروك! لقد اجتزت الامتحان بنجاح",
    "exam_failed_title": "لم توفّق في تحقيق نسبة النجاح المطلوبة",
    "exam_passed_desc": "لقد بذلت مجهوداً رائعاً في دراسة مقررات هذا الدبلوم الشامل وفهم طرقه السليمة. تم توليد شهادة إتمام موثقة وحصرية باسمك الآن.",
    "exam_failed_desc": "حصلت على درجة أقل من 70٪. لا تقلق، يمكنك إعادة مراجعة المحاضرات والمواد المكتوبة والتقديم للاختبار النهائي مجدداً في أي وقت.",
    "player_exam_retry": "تقديم محاولة جديدة للاختبار",
    "player_exam_certificate_status": "تم إصدار الشهادة! يمكنك مشاهدتها في الجانب الأيسر للصفحة.",
    "player_exam_back_lessons": "العودة للمحاضرات والدروس",

    // Certificate Preview & Print
    "cert_certified_copy": "نسخة الطالب المعتمدة للطباعة",
    "cert_view_title": "عرض وثيقة إنجاز GCC Center الحصرية للطباعة",
    "cert_doc_title": "مستند الإنجاز والاعتماد التدريبي",
    "cert_statement_1": "تشهد إدارة الأكاديمية والمركز المشترك لتدريب الخليج بأن المتدرب(ة) القدير(ة):",
    "cert_statement_2": "قد أكمل بنجاح واقتدار ومثابرة كافة الساعات والتدريبات والمقررات التعليمية المنهجية للفصل الدراسي المتمثل في:",
    "cert_statement_3": "بمعدل نجاح نهائي متميز واجتياز تقييم لجنة العلوم المعتمدة بنسبة نجاح:",
    "cert_ref_id": "الرقم المرجعي المكنون والتوثيقي للشهادة:",
    "cert_accreditation": "الاعتماد والأختام الرسمية المعتمدة لـ GCC",
    "cert_date": "تاريخ الاعتماد والإصدار للشهادة:",
    "cert_print_btn": "طباعة وحفظ المستند الفوري بصيغة PDF",

    // Modals
    "about_title": "من نحن - المركز المشترك الخليجي (GCC Center)",
    "about_submit_home": "العودة للصفحة الرئيسية",
    "privacy_title": "سياسة الخصوصية وأمن بيانات المتدربين والمنخرطين",
    "privacy_submit_home": "لقد قرأت وموافق على السياسة",
    "welcome_message": "مرحباً بك في مركز التدريب المشترك GCC",
  },
  en: {
    // Brand & Header
    "brand_name": "GCC Center",
    "brand_sub": "Joint Training Center",
    "search_placeholder": "Search for a course or lesson...",
    "nav_home": "Home",
    "nav_about": "About Us",
    "nav_privacy": "Privacy Policy",
    "view_student": "View as Student",
    "admin_panel": "Admin Panel",
    "system_admin": "System Administrator",
    "student_role": "Student Trainee",
    "login_register": "Login / Register",
    "logout": "Logout",

    // Auth Modal
    "auth_student_login": "Student & Reader Login",
    "auth_fullName": "Student Full Name:",
    "auth_fullName_placeholder": "e.g., Saleh bin Muhammad Al-Rowaili",
    "auth_email": "Approved Login Email Address:",
    "auth_email_placeholder": "e.g., saleh@student.com",
    "auth_phone": "Student Mobile Number (for notifications):",
    "auth_phone_placeholder": "e.g., 0501234567",
    "auth_login_btn": "Login to Platform",
    "auth_register_btn": "Create Account & Profile",
    "auth_is_student": "Do not have an account?",
    "auth_is_student_action": "Register now as a new student in seconds",
    "auth_has_account": "Already have an account?",
    "auth_has_account_action": "Quick trainee login",
    "auth_admin_hint": "To login as System Administrator with full control, please use the email admin@gcc.com",
    "close": "Close",

    // Auth Form Labels
    "auth_fullname_label": "Your Full Legal Name (to appear accurately on your certificate):",
    "auth_fullname_placeholder": "Type your full name in English / Arabic...",
    "auth_email_label": "Student Email Address:",
    "auth_phone_label": "Active Mobile Number (with country code):",
    "auth_submit_register": "Create Account & Start Study",
    "auth_submit_login": "Instant Login to Platform",
    "auth_demo_prefix": "Or quick demo test options for Evaluation Panel / Assessors:",
    "auth_demo_student": "Enter Demo Student",
    "auth_demo_admin": "Enter Demo Administrator",
    "auth_toggle_register": "Don't have an account yet? Create student profile now",
    "auth_toggle_login": "Already have an account? Log in",

    // Footer
    "footer_description": "The leading Joint Center platform in empowering national and professional competencies by delivering vital sciences in various fields of safety, aviation, and modern quality management systems.",
    "footer_pages": "Useful Pages",
    "footer_contact": "Our Location & Contact",
    "footer_address": "Khamis Mushait - Abha, Kingdom of Saudi Arabia",
    "footer_rights": "All rights reserved to the Training Center.",
    "footer_heart": "Made with passion to empower tomorrow's skills",
    "footer_about_link": "About Us - Our Story & Vision",
    "footer_privacy_link": "Privacy Policy & Student Data Protection",

    // Unregistered Contact Screen
    "unreg_back": "Back to Catalog Overview",
    "unreg_badge": "Immediate activation request for new participants",
    "unreg_title": "Activate Course & Join Training Program",
    "unreg_subtitle": "Sorry, the program is not currently assigned or enabled for your account. Please complete your request details below for instant activation from the registrar.",
    "unreg_form_title": "Course Registration & Activation Form",
    "unreg_fullname_label": "Trainee Full Name:",
    "unreg_email_label": "Registered Login Email:",
    "unreg_phone_label": "Mobile phone for verification alerts:",
    "unreg_course_label": "Course or Diploma to Assign & Begin:",
    "unreg_notes_label": "Additional Notes for Registrar (Optional):",
    "unreg_notes_placeholder": "e.g., I would like to begin studying today and submit the final test to obtain the certificate...",
    "unreg_channels_title": "Direct Channels & Immediate Fulfillment",
    "unreg_channels_desc": "Once you submit your application below, your registration profile will be handled directly by our student affairs team for immediate activation.",
    "unreg_phone_contact": "Contact Number:",
    "unreg_email_contact": "Approved Custodian Email:",
    "unreg_working_hours": "Approval Check Timeframes:",
    "unreg_always_available": "Active 24 Hours a Day ⚡",
    "unreg_send_whatsapp": "Submit Request via Direct WhatsApp",
    "unreg_send_email": "Submit Request via Direct Email",
    "unreg_direct_call": "Directly Call Registrar Office",
    "unreg_footer_copy": "GCC Center © 2026 for Safety, Security and Gulf Course Quality Management.",

    // Hero Section
    "hero_badge": "GCC Regional Academic Accreditation for Year 2026",
    "hero_title": "Elevate Your Professional Career with",
    "hero_desc": "The premium professional training platform in the Arabian Gulf. We offer certified diplomas, active lectures, and modules in safety, quality systems, aeronautics, administrative accounting, and IT systems.",
    "hero_explore": "Explore Training Syllabi",
    "hero_register": "Initialize Student Account",
    "hero_cert_title": "Instant Accredited Certificates",
    "hero_cert_desc": "Secure your official Gulf-accredited document printed in outstanding resolution once you clear the final test.",
    "hero_job_title": "Job Market Alignment",
    "hero_job_desc": "Curriculum coordinates directly with recruitment criteria, regional audits, and Aramco guidelines.",
    "hero_materials_title": "Dynamic Media & Portfolios",
    "hero_materials_desc": "Unique diversity of lectures, presentation slides, supplemental guides, and interactive PDF summaries.",
    "hero_progress_title": "Proactive Progress Metrics",
    "hero_progress_desc": "Log completion rates, track views, and seamlessly resume from your previous position anytime.",
    
    // Recent Progress
    "recent_resume_label": "Continue Learning Path",
    "recent_resume_desc": "You have unfinished lessons in your assigned courses. Resume learning to obtain your credentials!",
    "recent_resume_btn": "Resume Current Lecture",

    // Catalog & Dashboard
    "categories_title": "Comprehensive Training Paths & Diplomas",
    "courses_title": "Certified Educational Syllabi & Specializations",
    "stats_lessons": "Specialized Lessons",
    "level_beginner": "Basic / Beginner",
    "level_intermediate": "Intermediate / Practitioner",
    "level_advanced": "Advanced / Expert",
    "enter_course": "Enter Classroom & Start Course",
    "request_access": "Request Path Activation",
    "badge_enrolled": "Enrolled & Activated",
    "search_no_results": "We didn't find any results matching your search query.",
    "dashboard_stats_courses": "Total Courses",
    "dashboard_stats_lessons": "Lectures & Lessons",
    "dashboard_stats_categories": "Specialties & Paths",
    "dashboard_stats_certificates": "Issued Certificates",

    "cat_title_head": "Training Sectors & Specialties",
    "cat_title_sub": "Select a training sector to filter and view specialist courses",
    "cat_all": "All Courses",
    "cat_all_sub": "active courses",
    "cat_sub_active": "paths active",
    "catalog_filter_results": "Programs listed under:",
    "catalog_all_title": "Complete Catalog of Diplomas & Training Programs",
    "catalog_desc": "Carefully tailored training levels designed to prepare the trainee for the field",
    "catalog_stats_prefix": "Showing",
    "catalog_stats_suffix": "educational courses",
    "course_level": "Level",
    "course_enrolled_progress": "Learning Progress",
    "course_percentage_done": "Completed",
    "course_qualified": "Certified Qualified",
    "course_instructor": "Instructor",
    "course_duration": "Duration",
    "course_btn_resume": "Resume Active Study",
    "course_btn_start": "Start Studying Lectures",
    "search_empty_title": "No courses found matching your query",
    "search_empty_desc": "Try selecting a different specialty or adjusting search terms.",

    // About Section
    "home_about_title": "GCC Accredited Institute for Progressing & Training (About Us)",
    "home_about_desc": "The Joint Gulf Council Institute (GCC Center) was incorporated to leverage professional opportunities for regional youth via modern, reliable training modules.",
    "home_about_col1_title": "Strategic Goals",
    "home_about_col1_desc": "Empowering professional labor forces adhering to stringent international criteria using a smart classroom interface blending streaming lectures with direct feedback.",
    "home_about_col2_title": "Official Recognitions",
    "home_about_col2_desc": "Our lectures are fully correlated with OSHA safety requirements, international ISO quality paradigms, and local vocational training bodies across the Gulf.",
    "home_about_col3_title": "Instruction Flow",
    "home_about_col3_desc": "Trainees proceed through three structural milestones: attend streaming explanations, satisfy comprehensive lesson quizzes, clear the final exam, and secure double-stamped certificates.",

    // Interactive Player
    "player_back_catalog": "Back to browse courses catalog & tracks",
    "player_curriculum": "Course Syllabus & Lecture Schedule",
    "player_progress": "Your Progress in this Course:",
    "player_completed": "Completed",
    "player_play": "Play Video Lecture",
    "player_pdf": "Read Notes & Written Summaries",
    "player_pdf_document": "Supplemental written notes for ",
    "player_no_pdf": "No written summary available for this lecture. Please focus on the video lecture and proceed to the final test.",
    "player_loading_pdf": "Loading outline and study materials...",
    "player_download_summary": "Download PDF study guide & summary",
    "player_mark_completed_full": "Complete Current Lesson & Proceed",
    "player_lesson_completed": "Lesson completed successfully!",
    "player_exam_btn": "Proceed to the Course Final Exam",
    "player_final_exam_board": "Final Examination & Assessment Board",
    "player_exam_desc": "Please review the guidelines carefully before submitting. This assessment consists of multiple-choice questions designed to measure your understanding. A passing score of at least 70% is required to issue your certified completion document.",
    "player_exam_info_answers": "Answered",
    "player_exam_info_of": "out of",
    "player_exam_submit_bulletin": "Submit Final Exam Sheet",
    "exam_passed_title": "Congratulations! You have passed the Exam!",
    "exam_failed_title": "Assessment Not Fully Passed",
    "exam_passed_desc": "You spent high quality effort studying this curriculum and understanding its practices. A secured official certificate has been generated under your name.",
    "exam_failed_desc": "Your final score was lower than 70%. Don't worry, you can always review the lessons, read summaries, and retake the final exam at any time.",
    "player_exam_retry": "Submit a New Attempt for the Test",
    "player_exam_certificate_status": "Certificate issued successfully! You can view it on the left panel of the classroom.",
    "player_exam_back_lessons": "Back to Course Syllabus & Lectures",

    // Certificate Preview & Print
    "cert_certified_copy": "Certified Student Copy for Printing",
    "cert_view_title": "Print & Download Certified GCC Center Document",
    "cert_doc_title": "Certificate of Training Achievement",
    "cert_statement_1": "The Management of the Joint Gulf Training Center hereby certifies that the distinguished trainee:",
    "cert_statement_2": "Has successfully and diligently completed all accredited hours, tasks, and instructional syllabi for the academic curriculum of:",
    "cert_statement_3": "With a distinguished final examination and assessment score of:",
    "cert_ref_id": "Document Reference & Authentication ID:",
    "cert_accreditation": "Official Accreditation Seal & Stamps area",
    "cert_date": "Certification & Issue Date:",
    "cert_print_btn": "Print & Capture Certificate as PDF",

    // Modals
    "about_title": "About Us - Joint Gulf Training Center (GCC Center)",
    "about_submit_home": "Back to Homepage",
    "privacy_title": "Privacy Policy & Student Data Protection",
    "welcome_message": "Welcome to GCC Joint Training Center",
    "privacy_submit_home": "I have read & accept the policy"
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('gcc_language');
    return (saved === 'en' || saved === 'ar') ? saved : 'ar';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('gcc_language', lang);
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    // Reflect language setting in root elements
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language, dir]);

  const t = (key: string): string => {
    return translations[language][key] || translations['ar'][key] || key;
  };

  const isAr = language === 'ar';
  const isEn = language === 'en';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isAr, isEn, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage should be used inside a LanguageProvider');
  }
  return context;
};
