import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-20 left-4 p-3 rounded-lg bg-white/80 dark:bg-gray-800/80 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200 z-50 backdrop-blur-sm"
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