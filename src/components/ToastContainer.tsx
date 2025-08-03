import { Toast } from './Toast';

interface ToastItem {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemoveToast: (id: string) => void;
}

export const ToastContainer = ({ toasts, onRemoveToast }: ToastContainerProps) => {
  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div className="space-y-3">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className="transform transition-all duration-300 ease-out"
            style={{
              transform: `translateY(${index * 20}px)`,
              zIndex: 1000 - index
            }}
          >
            <Toast
              id={toast.id}
              type={toast.type}
              title={toast.title}
              description={toast.description}
              show={true}
              onClose={() => onRemoveToast(toast.id)}
              duration={toast.duration}
            />
          </div>
        ))}
      </div>
    </div>
  );
}; 