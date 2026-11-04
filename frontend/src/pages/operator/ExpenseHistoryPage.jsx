import React, { useState } from 'react';
import useSWR from 'swr';
import { Card } from '../../components/common/Card.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { BackButton } from '../../components/common/BackButton.jsx';
import { Receipt, Calendar, IndianRupee, Fuel, Wrench, Utensils } from 'lucide-react';

export const ExpenseHistoryPage = () => {
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  const startOfMonth = `${selectedMonth}-01`;
  const endOfMonth = `${selectedMonth}-31`;

  const { data, isLoading } = useSWR(
    `/api/expenses?startDate=${startOfMonth}&endDate=${endOfMonth}`
  );
  const expenses = data?.expenses || [];

  const { data: totalsData } = useSWR('/api/expenses/totals');
  const dailyTotal = totalsData?.dailyTotal || 0;
  const monthlyTotal = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  return (
    <div className="space-y-6 pb-8">
      {/* Top Header with BackButton */}
      <div className="space-y-2">
        <BackButton to="/app/dashboard" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Operator Expense History</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Fuel bills, machine maintenance, food and daily operating costs
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-gray-200 shadow-xs self-start">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs sm:text-sm font-bold text-gray-800 bg-transparent focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Daily & Monthly Totals */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
            Today's Logged Total
          </span>
          <span className="text-2xl sm:text-3xl font-black text-rose-700 mt-1 block">
            ₹{dailyTotal}
          </span>
          <span className="text-[11px] text-gray-500 mt-0.5 block">For today</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
            Selected Month's Total
          </span>
          <span className="text-2xl sm:text-3xl font-black text-gray-900 mt-1 block">
            ₹{monthlyTotal}
          </span>
          <span className="text-[11px] text-gray-500 mt-0.5 block">For {selectedMonth}</span>
        </div>
      </div>

      {/* Expenses List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Monthly Expense Breakdown ({expenses.length})
        </h3>

        {isLoading ? (
          <LoadingSpinner label="Loading expense records..." />
        ) : expenses.length === 0 ? (
          <Card className="text-center py-10">
            <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-800">No Expenses Recorded for {selectedMonth}</p>
            <p className="text-xs text-gray-500 mt-0.5">Select another month to view historical expenditures.</p>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {expenses.map((e) => (
              <Card key={e._id} className="p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900">{e.category}</span>
                      <span className="text-[11px] text-gray-400">
                        {new Date(e.expenseDate).toLocaleDateString()}
                      </span>
                    </div>
                    {e.note && <p className="text-xs text-gray-600 mt-1">{e.note}</p>}
                    <span className="text-[11px] text-gray-400 block mt-1">
                      Logged by: You
                    </span>
                  </div>

                  <span className="text-base font-black text-rose-600">₹{e.amount}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
