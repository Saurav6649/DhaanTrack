import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export const Alert = ({ type = 'info', title, message, className = '' }) => {
  const configs = {
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    },
  };

  const config = configs[type] || configs.info;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${config.bg} ${className}`}>
      {config.icon}
      <div className="text-sm">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        {message && <p className="opacity-90">{message}</p>}
      </div>
    </div>
  );
};
