import { Moon, Sun } from 'lucide-react';
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
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const isNearButton = 
        e.clientX <= rect.right + 50 && 
        e.clientX >= rect.left - 50 && 
        e.clientY <= rect.bottom + 50 && 
        e.clientY >= rect.top - 50;

      if (isNearButton || isHovered) {
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
      className={`fixed bottom-20 left-4 p-3 rounded-lg bg-white/80 dark:bg-gray-800/80 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 z-50 backdrop-blur-sm ${
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
  );
}; 