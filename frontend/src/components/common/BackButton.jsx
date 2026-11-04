import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const BackButton = ({ to, label = 'Back', className = '' }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/app/dashboard');
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-600 hover:text-gray-900 active:scale-95 transition-all px-2.5 py-1.5 rounded-xl hover:bg-gray-100 min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-brand-500/40 select-none ${className}`}
      aria-label="Go back to previous screen"
    >
      <ArrowLeft className="w-4 h-4 text-gray-700 shrink-0" />
      <span>{label}</span>
    </button>
  );
};
