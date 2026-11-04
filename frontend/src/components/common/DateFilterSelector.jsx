import React from 'react';
import { Calendar } from 'lucide-react';

export const DateFilterSelector = ({
  filterType,
  onChangeFilterType,
  customStart,
  customEnd,
  onChangeCustomStart,
  onChangeCustomEnd,
  className = '',
}) => {
  const options = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'last_7_days', label: 'Last 7 Days' },
    { id: 'this_month', label: 'This Month' },
    { id: 'custom', label: 'Custom Range' },
  ];

  return (
    <div className={`flex flex-wrap items-center gap-2 max-w-full ${className}`}>
      <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto max-w-full scrollbar-none gap-0.5 shrink-0">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChangeFilterType(opt.id)}
            className={`whitespace-nowrap px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all min-h-[36px] flex items-center ${
              filterType === opt.id
                ? 'bg-white text-gray-900 shadow-sm font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filterType === 'custom' && (
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm w-full sm:w-auto">
          <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="date"
            value={customStart || ''}
            onChange={(e) => onChangeCustomStart(e.target.value)}
            className="text-xs sm:text-sm text-gray-700 bg-transparent border-none focus:outline-none flex-1"
          />
          <span className="text-gray-400 text-xs">to</span>
          <input
            type="date"
            value={customEnd || ''}
            onChange={(e) => onChangeCustomEnd(e.target.value)}
            className="text-xs sm:text-sm text-gray-700 bg-transparent border-none focus:outline-none flex-1"
          />
        </div>
      )}
    </div>
  );
};
