import { Moon, Sun, Settings, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isShrunk, setIsShrunk] = useState(true); // Start as shrunk to be a hint button
  const componentRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (componentRef.current && !componentRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        // If menu closes, and no hover, start shrink timeout
        if (!componentRef.current.matches(':hover') && !hideTimeoutRef.current) {
          hideTimeoutRef.current = setTimeout(() => {
            setIsShrunk(true);
            hideTimeoutRef.current = null;
          }, 1000); // 1 second before shrinking after menu close
        }
      }
    };

    const handleMouseEnter = () => {
      setIsShrunk(false);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };

    const handleMouseLeave = () => {
      if (!isMenuOpen && !hideTimeoutRef.current) {
        hideTimeoutRef.current = setTimeout(() => {
          setIsShrunk(true);
          hideTimeoutRef.current = null;
        }, 1000); // 1 second before shrinking after mouse leave
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    const currentRef = componentRef.current;
    if (currentRef) {
      currentRef.addEventListener('mouseenter', handleMouseEnter);
      currentRef.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (currentRef) {
        currentRef.removeEventListener('mouseenter', handleMouseEnter);
        currentRef.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [componentRef, isMenuOpen]);

  return (
    <div 
      ref={componentRef} 
      className={`fixed bottom-28 z-50 transition-all duration-300 transform 
        ${isShrunk ? 'right-0 w-8 h-8 rounded-l-full pr-0.5' : 'right-8 w-14 h-14 rounded-full'}
        bg-white/80 dark:bg-gray-800/80 shadow-lg border border-gray-200 dark:border-gray-700
        hover:shadow-xl backdrop-blur-sm flex items-center justify-center cursor-pointer
      `}
    >
      <button
        onClick={() => {
          if (isShrunk) {
            setIsShrunk(false);
            if (hideTimeoutRef.current) {
              clearTimeout(hideTimeoutRef.current);
              hideTimeoutRef.current = null;
            }
          } else {
            setIsMenuOpen(!isMenuOpen);
          }
        }}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 w-full h-full flex items-center justify-center"
        title={t('theme_lang_toggle.toggle_menu', { defaultValue: 'Toggle Theme and Language Menu' })}
      >
        {isMenuOpen ? (
          <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        ) : isShrunk ? (
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        ) : (
          <Settings className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        )}
      </button>

      {isMenuOpen && (
        <div className="absolute bottom-full mb-2 right-0 w-48 bg-white/90 dark:bg-gray-800/90 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm overflow-hidden transform origin-bottom-right animate-fade-in-up">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('theme_lang_toggle.theme', { defaultValue: 'Theme' })}</h3>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-between w-full p-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
            >
              <span>{isDark ? t('theme_lang_toggle.light_mode', { defaultValue: 'Light Mode' }) : t('theme_lang_toggle.dark_mode', { defaultValue: 'Dark Mode' })}</span>
              {isDark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('theme_lang_toggle.language', { defaultValue: 'Language' })}</h3>
            <button
              onClick={() => changeLanguage('zh')}
              className={`flex items-center justify-between w-full p-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200 ${
                i18n.language?.startsWith('zh') ? 'bg-primary-500 text-white' : 'text-gray-700 dark:text-gray-200'
              }`}
            >
              <span>{t('lang.zh', { defaultValue: '中文' })}</span>
              {i18n.language?.startsWith('zh') && <ChevronRight className="w-4 h-4" />}
            </button>
            <button
              onClick={() => changeLanguage('en')}
              className={`mt-1 flex items-center justify-between w-full p-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200 ${
                i18n.language?.startsWith('en') ? 'bg-primary-500 text-white' : 'text-gray-700 dark:text-gray-200'
              }`}
            >
              <span>{t('lang.en', { defaultValue: 'English' })}</span>
              {i18n.language?.startsWith('en') && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 