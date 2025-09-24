import React, { useEffect, useState } from 'react';
import { useLocalization } from '../LocalizationContext';

interface ToastProps {
  toast: { id: number; message: string; onUndo?: () => void } | null;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useLocalization();

  useEffect(() => {
    if (toast) {
      setIsVisible(true);
      if (!toast.onUndo) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          // Allow animation to finish before calling onClose
          setTimeout(onClose, 300); 
        }, 3000);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div
      className={`fixed top-24 right-4 md:right-8 w-auto max-w-sm p-4 rounded-lg shadow-lg bg-gray-700 text-white z-50 transition-all duration-300 ease-in-out ${
        isVisible ? 'transform translate-x-0 opacity-100' : 'transform translate-x-full opacity-0'
      }`}
      role="alert"
    >
      <div className="flex items-center justify-between">
        <p className="mr-4">{toast.message}</p>
        {toast.onUndo ? (
          <button
            onClick={toast.onUndo}
            className="px-3 py-1 text-sm font-semibold bg-blue-600 rounded hover:bg-blue-500 flex-shrink-0"
          >
            {t('buttons.undo')}
          </button>
        ) : (
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        )}
      </div>
    </div>
  );
};

export default Toast;