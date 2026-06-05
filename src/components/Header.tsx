/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BookOpen, 
  User, 
  LogOut, 
  Search, 
  GraduationCap, 
  Settings, 
  Menu, 
  X,
  UserCheck
} from 'lucide-react';
import { User as UserType } from '../types';

interface HeaderProps {
  currentUser: UserType | null;
  onLogout: () => void;
  onOpenLogin: () => void;
  onToggleAdminView: (isAdmin: boolean) => void;
  isAdminView: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onNavigateHome: () => void;
  onOpenPrivacy: () => void;
  onOpenAbout: () => void;
}

export default function Header({
  currentUser,
  onLogout,
  onOpenLogin,
  onToggleAdminView,
  isAdminView,
  searchQuery,
  setSearchQuery,
  onNavigateHome,
  onOpenPrivacy,
  onOpenAbout
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900 text-white shadow-md border-b border-slate-800" id="app-header">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={onNavigateHome} id="brand-logo">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold text-lg shadow-inner shadow-amber-300">
              GCC
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-white font-sans">
                GCC center
              </span>
              <span className="text-[10px] text-slate-400">
                المركز المشترك للتدريب
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-6" id="header-search-container">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="ابحث عن دورة أو محاضرة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-slate-800/80 pl-4 pr-11 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-slate-800 border border-slate-700/50 transition-all text-right"
                id="search-input"
              />
              <Search className="absolute right-4 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Navigation Links - Desktop */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium" id="desktop-nav">
            <button 
              onClick={onNavigateHome}
              className={`hover:text-amber-400 transition-colors py-1 ${!isAdminView ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-300'}`}
              id="nav-home-btn"
            >
              الرئيسية
            </button>
            <button 
              onClick={onOpenAbout}
              className="text-slate-300 hover:text-amber-400 transition-colors py-1"
              id="nav-about-btn"
            >
              من نحن
            </button>
            <button 
              onClick={onOpenPrivacy}
              className="text-slate-300 hover:text-amber-400 transition-colors py-1"
              id="nav-privacy-btn"
            >
              سياسة الخصوصية
            </button>
          </nav>

          {/* Right Controls & User Info */}
          <div className="hidden md:flex items-center gap-4" id="header-user-controls">
            {currentUser ? (
              <div className="flex items-center gap-3">
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => onToggleAdminView(!isAdminView)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
                      isAdminView 
                        ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' 
                        : 'bg-slate-800 hover:bg-slate-750 text-amber-500 border border-amber-500/20'
                    }`}
                    title={isAdminView ? "العودة للطلاب" : "دخول الإدارة"}
                    id="toggle-admin-btn"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span>{isAdminView ? 'مشاهدة كطالب' : 'لوحة الإدارة'}</span>
                  </button>
                )}

                <div className="flex flex-col items-end text-xs">
                  <span className="font-bold text-slate-250 flex items-center gap-1">
                    {currentUser.name}
                    {currentUser.role === 'admin' ? (
                      <span className="bg-rose-500/20 text-rose-300 text-[9px] px-1.5 py-0.5 rounded-full font-normal border border-rose-500/30">
                        مدير النظام
                      </span>
                    ) : (
                      <span className="bg-amber-500/20 text-amber-300 text-[9px] px-1.5 py-0.5 rounded-full font-normal border border-amber-500/30">
                        طالب متدرب
                      </span>
                    )}
                  </span>
                  <span className="text-slate-400 text-[10px]">{currentUser.email}</span>
                </div>

                <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400" id="avatar">
                  {currentUser.role === 'admin' ? <UserCheck className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
                </div>

                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="تسجيل الخروج"
                  id="logout-btn"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"
                id="login-btn-header"
              >
                <User className="h-4 w-4" />
                <span>تسجيل الدخول / التسجيل</span>
              </button>
            )}
          </div>

          {/* Hamburger Mobile Menu */}
          <div className="md:hidden flex items-center gap-2" id="mobile-menu-control">
            {currentUser && (
              <div className="h-8 w-8 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center">
                {currentUser.role === 'admin' ? <UserCheck className="h-4.5 w-4.5" /> : <GraduationCap className="h-4.5 w-4.5" />}
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white"
              id="hamburger-btn"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-4 space-y-3" id="mobile-menu">
          {/* Mobile Search */}
          <div className="relative w-full" id="mobile-search">
            <input
              type="text"
              placeholder="ابحث عن دورة أو محاضرة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-slate-800 pl-4 pr-11 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-right"
              id="mobile-search-input"
            />
            <Search className="absolute right-4 top-2.5 h-4 w-4 text-slate-400" />
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-center pt-2">
            <button
              onClick={() => {
                onNavigateHome();
                setMobileMenuOpen(false);
              }}
              className="bg-slate-800 rounded-lg p-2 text-amber-400"
              id="mob-nav-home"
            >
              الرئيسية
            </button>
            <button
              onClick={() => {
                onOpenAbout();
                setMobileMenuOpen(false);
              }}
              className="bg-slate-800 rounded-lg p-2 text-slate-300"
              id="mob-nav-about"
            >
              من نحن
            </button>
            <button
              onClick={() => {
                onOpenPrivacy();
                setMobileMenuOpen(false);
              }}
              className="bg-slate-800 rounded-lg p-2 text-slate-300"
              id="mob-nav-privacy"
            >
              الخصوصية
            </button>
          </div>

          {/* User operations on Mobile */}
          <div className="pt-2 border-t border-slate-800" id="mobile-user-panel">
            {currentUser ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs bg-slate-850 p-2 rounded-lg">
                  <div className="text-right">
                    <p className="font-bold text-slate-200">{currentUser.name}</p>
                    <p className="text-slate-400 text-[10px]">{currentUser.email}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    currentUser.role === 'admin' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {currentUser.role === 'admin' ? 'مدير' : 'طالب'}
                  </span>
                </div>

                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      onToggleAdminView(!isAdminView);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm bg-amber-500 text-slate-950 font-bold"
                    id="mob-toggle-admin"
                  >
                    <Settings className="h-4 w-4" />
                    <span>{isAdminView ? 'مساق الطلاب' : 'لوحة الإدارة للتحكم'}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm bg-rose-500/10 text-rose-450 hover:bg-rose-500/20 border border-rose-500/20 font-bold"
                  id="mob-logout"
                >
                  <LogOut className="h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenLogin();
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-amber-500 text-slate-950 py-2.5 rounded-lg text-sm font-bold shadow-md flex items-center justify-center gap-2"
                id="mob-login"
              >
                <User className="h-4 w-4" />
                <span>تسجيل الدخول للمنصة</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
