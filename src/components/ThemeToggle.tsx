import { Moon, Sun, ChevronRight } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useState, useEffect } from 'react';

export const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // 自动隐藏逻辑
  useEffect(() => {
    let hideTimeout: NodeJS.Timeout;

    const handleMouseMove = (e: MouseEvent) => {
      const button = document.querySelector('[data-theme-toggle]') as HTMLElement;
      const hintButton = document.querySelector('[data-theme-hint]') as HTMLElement;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const hintRect = hintButton?.getBoundingClientRect();
      const isNearButton = 
        e.clientX <= rect.right + 50 && 
        e.clientX >= rect.left - 50 && 
        e.clientY <= rect.bottom + 50 && 
        e.clientY >= rect.top - 50;
      
      const isNearHint = hintRect ? 
        e.clientX <= hintRect.right + 30 && 
        e.clientX >= hintRect.left - 30 && 
        e.clientY <= hintRect.bottom + 30 && 
        e.clientY >= hintRect.top - 30 : false;

      if (isNearButton || isNearHint || isHovered) {
        setIsVisible(true);
        clearTimeout(hideTimeout);
      } else {
        hideTimeout = setTimeout(() => {
          if (!isHovered) {
            setIsVisible(false);
          }
        }, 2000); // 2秒后自动隐藏
      }
    };

    // 只在非悬停状态下添加鼠标移动监听
    if (!isHovered) {
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(hideTimeout);
    };
  }, [isHovered]);

  return (
    <>
      {/* 主题切换按钮 */}
      <button
        data-theme-toggle
        onClick={toggleTheme}
        onMouseEnter={() => {
          setIsHovered(true);
          setIsVisible(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          // 延迟隐藏，给用户一些时间
          setTimeout(() => {
            if (!isHovered) {
              setIsVisible(false);
            }
          }, 1000);
        }}
        className={`fixed bottom-20 left-4 p-3 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 z-50 backdrop-blur-sm ${
          isVisible 
            ? 'translate-x-0 opacity-100' 
            : '-translate-x-12 opacity-0 hover:translate-x-0 hover:opacity-100'
        }`}
        title={isDark ? '切换到日间模式' : '切换到夜间模式'}
      >
        {isDark ? (
          <Sun className="w-6 h-6 text-yellow-500" />
        ) : (
          <Moon className="w-6 h-6 text-gray-600" />
        )}
      </button>

      {/* 半圆形提示按钮 - 只在主按钮隐藏时显示 */}
      <button
        data-theme-hint
        onClick={() => {
          setIsVisible(true);
          setIsHovered(true);
          // 点击提示按钮后，延迟重置悬停状态
          setTimeout(() => {
            setIsHovered(false);
          }, 2000);
        }}
        onMouseEnter={() => {
          setIsVisible(true);
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          // 延迟隐藏，给用户一些时间
          setTimeout(() => {
            if (!isHovered) {
              setIsVisible(false);
            }
          }, 1000);
        }}
        className={`fixed bottom-20 left-0 p-2 bg-gray-100/60 dark:bg-gray-700/60 shadow-md border border-gray-200 dark:border-gray-600 hover:bg-gray-200/80 dark:hover:bg-gray-600/80 transition-all duration-300 z-40 backdrop-blur-sm ${
          isVisible 
            ? 'translate-x-0 opacity-0 pointer-events-none' 
            : 'translate-x-0 opacity-100 pointer-events-auto'
        }`}
        style={{
          borderTopLeftRadius: '0',
          borderBottomLeftRadius: '0',
          borderTopRightRadius: '20px',
          borderBottomRightRadius: '20px',
        }}
        title="主题切换"
      >
        <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </button>
    </>
  );
}; 