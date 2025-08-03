import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface StatusBannerProps {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description?: string;
  className?: string;
}

export const StatusBanner = ({ type, title, description, className = '' }: StatusBannerProps) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />;
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-warning-600 dark:text-warning-400" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-danger-600 dark:text-danger-400" />;
      case 'info':
        return <Info className="w-6 h-6 text-info-600 dark:text-info-400" />;
      default:
        return <Info className="w-6 h-6 text-info-600 dark:text-info-400" />;
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

  return (
    <div className={`card p-6 border-2 ${getStyles()} ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`text-lg font-semibold mb-2 ${getTextColor()}`}>
            {title}
          </h4>
          {description && (
            <p className={`text-base leading-relaxed ${getTextColor()} opacity-90`}>
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}; 