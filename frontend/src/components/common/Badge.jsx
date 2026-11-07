import React from 'react';

export const Badge = ({ status, className = '' }) => {
  const styles = {
    // Work Statuses
    IN_PROGRESS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PAUSED: 'bg-amber-50 text-amber-700 border-amber-200',
    COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200',
    PENDING: 'bg-gray-100 text-gray-700 border-gray-200',
    NOT_STARTED: 'bg-amber-50 text-amber-700 border-amber-200',

    // Payment Statuses
    PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ADVANCE_PAID: 'bg-purple-50 text-purple-700 border-purple-200',
    PARTIALLY_PAID: 'bg-amber-50 text-amber-700 border-amber-200',
    UNPAID: 'bg-rose-50 text-rose-700 border-rose-200',

    // Account & Machine Statuses
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    DISABLED: 'bg-rose-50 text-rose-700 border-rose-200',
    INACTIVE: 'bg-gray-100 text-gray-700 border-gray-200',
    MAINTENANCE: 'bg-amber-50 text-amber-700 border-amber-200',

    // Roles
    ADMIN: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    USER: 'bg-teal-50 text-teal-700 border-teal-200',
  };

  const labels = {
    IN_PROGRESS: 'Running',
    PAUSED: 'Paused',
    COMPLETED: 'Completed',
    PENDING: 'Pending',
    NOT_STARTED: 'Not Started',
    PAID: 'Fully Paid',
    ADVANCE_PAID: 'Advance Paid',
    PARTIALLY_PAID: 'Partially Paid',
    UNPAID: 'Unpaid',
    ACTIVE: 'Active',
    DISABLED: 'Disabled',
    INACTIVE: 'Inactive',
    MAINTENANCE: 'Maintenance',
    ADMIN: 'Admin',
    USER: 'Operator',
  };

  const key = String(status || '').toUpperCase();
  const style = styles[key] || 'bg-gray-50 text-gray-700 border-gray-200';
  const label = labels[key] || status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {label}
    </span>
  );
};
