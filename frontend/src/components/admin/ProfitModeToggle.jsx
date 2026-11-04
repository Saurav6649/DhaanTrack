import React from 'react';
import { DollarSign, ShieldAlert, Sparkles } from 'lucide-react';

export const ProfitModeToggle = ({ mode, onChangeMode }) => {
  return (
    <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Profit Calculation Mode:</span>
          <span
            className={`text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-full ${
              mode === 'net'
                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            {mode === 'net' ? 'NET PROFIT (Expenses Deducted)' : 'GROSS PROFIT (Expenses Not Deducted)'}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {mode === 'net'
            ? 'Formula: Total Revenue - Contractor Amount - Deducted Expenses. Expense records remain untouched.'
            : 'Formula: Total Revenue - Contractor Amount. Expenses remain separately visible below.'}
        </p>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto shrink-0 gap-1">
        <button
          type="button"
          onClick={() => onChangeMode('gross')}
          className={`flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all min-h-[40px] ${
            mode === 'gross'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> Show Gross Profit
        </button>
        <button
          type="button"
          onClick={() => onChangeMode('net')}
          className={`flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all min-h-[40px] ${
            mode === 'net'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" /> Show Net Profit
        </button>
      </div>
    </div>
  );
};
