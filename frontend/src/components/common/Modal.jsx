import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />

        {/* Modal Window */}
        <div
          className={`relative transform rounded-2xl sm:rounded-3xl bg-white text-left shadow-2xl transition-all my-auto sm:my-8 w-full ${maxWidth} p-4 sm:p-6 border border-gray-100 z-10 max-h-[92vh] flex flex-col`}
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-gray-100 shrink-0 gap-3">
            <div className="min-w-0 pr-2">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{title}</h3>
              {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-2">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-xl p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="mt-3 sm:mt-4 overflow-y-auto flex-1 pr-0.5">{children}</div>
        </div>
      </div>
    </div>
  );
};
