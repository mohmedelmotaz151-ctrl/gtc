/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Info, MapPin, Mail, Phone, Heart } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface FooterProps {
  onOpenPrivacy: () => void;
  onOpenAbout: () => void;
}

export default function Footer({ onOpenPrivacy, onOpenAbout }: FooterProps) {
  const { t, isAr } = useLanguage();

  return (
    <footer className={`bg-slate-900 text-slate-400 mt-auto border-t border-slate-800 font-sans ${isAr ? 'text-right' : 'text-left'}`} id="app-footer">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800">
          
          {/* Column 1 - Brand Summary */}
          <div className="flex flex-col space-y-4" id="footer-col-about">
            <div className={`flex items-center gap-3 ${isAr ? 'justify-start' : 'justify-start'}`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-bold text-base shadow-inner">
                GCC
              </div>
              <span className="font-extrabold text-lg text-white">
                {t('brand_name')}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 font-normal">
              {t('footer_description')}
            </p>
          </div>

          {/* Column 2 - Quick Information */}
          <div className="flex flex-col space-y-4" id="footer-col-links">
            <h3 className="font-semibold text-white text-sm tracking-wider">{t('footer_pages')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button 
                  onClick={onOpenAbout} 
                  className="hover:text-amber-400 transition-colors flex items-center gap-2"
                  id="foot-link-about"
                >
                  <Info className="h-4.5 w-4.5 text-amber-500/80" />
                  <span>{t('footer_about_link')}</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={onOpenPrivacy} 
                  className="hover:text-amber-400 transition-colors flex items-center gap-2"
                  id="foot-link-privacy"
                >
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-500/80" />
                  <span>{t('footer_privacy_link')}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3 - Contacts */}
          <div className="flex flex-col space-y-4" id="footer-col-contacts">
            <h3 className="font-semibold text-white text-sm tracking-wider">{t('footer_contact')}</h3>
            <div className="space-y-2 text-sm font-normal">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-amber-500/80 shrink-0" />
                <span>{t('footer_address')}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                <span>support@gcc-center.com</span>
              </p>
              <p className={`flex items-center gap-2 ${isAr ? 'justify-end text-left' : 'justify-start text-right'}`}>
                <span dir="ltr">0552232752</span>
                <Phone className="h-4 w-4 text-slate-400 shrink-0" />
              </p>
            </div>
          </div>

        </div>

        {/* Closing details */}
        <div className={`flex flex-col sm:flex-row items-center justify-between pt-8 text-xs text-slate-500 font-medium ${isAr ? 'sm:flex-row' : 'sm:flex-row-reverse'}`} id="footer-credits">
          <p>© 2026 {t('brand_name')}. {t('footer_rights')}</p>
          <p className="flex items-center gap-1 mt-4 sm:mt-0">
            <span>{t('footer_heart')}</span>
            <Heart className="h-3 w-3 text-rose-500 fill-rose-550" />
          </p>
        </div>
      </div>
    </footer>
  );
}

