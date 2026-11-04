import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ label = 'Loading...', size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center text-gray-500 ${className}`}>
      <Loader2 className={`${sizes[size] || sizes.md} animate-spin text-brand-600 mb-2`} />
      {label && <p className="text-sm font-medium">{label}</p>}
    </div>
  );
};
