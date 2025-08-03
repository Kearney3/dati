import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

interface ToastProps {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description?: string;
  show: boolean;
  onClose: () => void;
  duration?: number;
  id?: string;
}

export const Toast = ({ 
  type, 
  title, 
  description, 
  show, 
  onClose, 
  duration = 5000
}: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    if (show) {
      // 入场动画
      setIsEntering(true);
      setIsVisible(true);
      setIsExiting(false);
      
      // 入场动画完成后
      setTimeout(() => {
        setIsEntering(false);
      }, 300);
      
      // 自动关闭
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300); // 消失动画持续时间
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success-600 dark:text-success-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-warning-600 dark:text-warning-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-danger-600 dark:text-danger-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-info-600 dark:text-info-400" />;
      default:
        return <Info className="w-5 h-5 text-info-600 dark:text-info-400" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-white dark:bg-gray-800 border-success-200 dark:border-success-700 shadow-lg';
      case 'warning':
        return 'bg-white dark:bg-gray-800 border-warning-200 dark:border-warning-700 shadow-lg';
      case 'error':
        return 'bg-white dark:bg-gray-800 border-danger-200 dark:border-danger-700 shadow-lg';
      case 'info':
        return 'bg-white dark:bg-gray-800 border-info-200 dark:border-info-700 shadow-lg';
      default:
        return 'bg-white dark:bg-gray-800 border-info-200 dark:border-info-700 shadow-lg';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-success-800 dark:text-success-200';
      case 'warning':
        return 'text-warning-800 dark:text-warning-200';
      case 'error':
        return 'text-danger-800 dark:text-danger-200';
      case 'info':
        return 'text-info-800 dark:text-info-200';
      default:
        return 'text-info-800 dark:text-info-200';
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`card p-4 border-2 ${getStyles()} transform transition-all duration-300 ease-out ${
        isEntering 
          ? 'translate-x-full opacity-0 scale-95' 
          : isExiting 
            ? 'translate-x-full opacity-0 scale-95' 
            : 'translate-x-0 opacity-100 scale-100'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`text-sm font-semibold mb-1 ${getTextColor()}`}>
                {title}
              </h4>
              {description && (
                <p className={`text-xs leading-relaxed ${getTextColor()} opacity-90`}>
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="关闭"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 