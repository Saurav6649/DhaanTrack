import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { api } from '../../api/client.js';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { ExpenseModal } from '../../components/admin/ExpenseModal.jsx';
import { Receipt, Plus, Search, FileSpreadsheet, Edit2, Filter, Tractor, User, Trash2 } from 'lucide-react';

export const ExpensesPage = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [machineId, setMachineId] = useState('');
  const [userId, setUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const { data: machinesData } = useSWR('/api/machines');
  const machines = machinesData?.machines || [];

  const { data: usersData } = useSWR('/api/users/combined');
  const users = usersData?.users || [];

  const queryParams = new URLSearchParams({
    ...(search && { search }),
    ...(category && { category }),
    ...(machineId && { machineId }),
    ...(userId && { userId }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  }).toString();

  const { data, isLoading } = useSWR(`/api/expenses?${queryParams}`);
  const expenses = data?.expenses || [];

  const totalExpenseSum = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  const handleExportExcel = () => {
    window.open(`/api/reports/expense/export?${queryParams}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Expense Management</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Log, categorize and monitor fuel, repairs, and daily operational expenditures
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 mr-1.5" /> Export Excel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setSelectedExpense(null);
              setModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Expense
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 tracking-wider">
            <Filter className="w-3.5 h-3.5" /> Filter Expenses
          </div>
          <div className="text-xs font-bold text-gray-700">
            Total Filtered: <span className="text-rose-600 font-black">₹{totalExpenseSum.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50/50"
            />
          </div>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">All Categories</option>
            <option value="Diesel / Fuel">Diesel / Fuel</option>
            <option value="Repair / Maintenance">Repair / Maintenance</option>
            <option value="Driver / Operator Food">Driver / Operator Food</option>
            <option value="Worker Expense">Worker Expense</option>
            <option value="Transportation">Transportation</option>
            <option value="Other">Other</option>
          </select>

          {/* Machine Filter */}
          <select
            value={machineId}
            onChange={(e) => setMachineId(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">All Machines</option>
            {machines.map((m) => (
              <option key={m._id} value={m._id}>
                {m.machineName} ({m.machineNumber})
              </option>
            ))}
          </select>

          {/* User Filter */}
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">Logged By (All Users)</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} (@{u.userId})
              </option>
            ))}
          </select>

          {/* Date Picker */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>
      </Card>

      {/* Expenses Table */}
      {/* Expenses Table / Cards */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <LoadingSpinner label="Compiling expense logs..." />
        ) : expenses.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No expense records found.</div>
        ) : (
          <>
            {/* Mobile View: Stacked Cards (< md) */}
            <div className="md:hidden divide-y divide-gray-100">
              {expenses.map((e) => (
                <div key={e._id} className="p-4 space-y-2.5 hover:bg-gray-50/50 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-gray-900 text-sm block">{e.category}</span>
                      <span className="text-xs text-gray-400">{new Date(e.expenseDate).toLocaleDateString()}</span>
                    </div>
                    <span className="text-base font-black text-rose-600">₹{e.amount}</span>
                  </div>

                  <div className="text-xs bg-gray-50 p-2.5 rounded-xl space-y-1">
                    <div>
                      <span className="text-[10px] text-gray-400 font-semibold uppercase block">Machine</span>
                      <span className="text-gray-800 font-medium">
                        {e.machineId ? `${e.machineId.machineName} (${e.machineId.machineNumber})` : 'General / Business'}
                      </span>
                    </div>
                    {e.note && (
                      <div>
                        <span className="text-[10px] text-gray-400 font-semibold uppercase block">Note</span>
                        <span className="text-gray-700">{e.note}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        Logged by: <span className="font-semibold text-gray-800">{e.createdByRole === 'ADMIN' ? 'Admin' : e.createdBy?.name || 'Operator'}</span>
                      </span>
                      {e.isUpdated && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200"
                          title={`Updated by ${e.updatedByName || 'Admin'} (${e.updatedByRole || 'ADMIN'}) on ${e.updatedAt ? new Date(e.updatedAt).toLocaleString() : ''}`}
                        >
                          Updated
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedExpense(e);
                          setModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 min-h-[38px] transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(`Move expense of ₹${e.amount} (${e.category}) to Recycle Bin?`)) {
                            await api.delete(`/api/expenses/${e._id}`);
                            await mutate((k) => typeof k === 'string' && k.startsWith('/api/expenses'));
                            await mutate('/api/recycle-bin');
                          }
                        }}
                        title="Move to Recycle Bin"
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg min-h-[38px] min-w-[38px] flex items-center justify-center transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Full Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Machine</th>
                    <th className="py-3 px-4">Work / Note</th>
                    <th className="py-3 px-4">Logged By</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.map((e) => (
                    <tr key={e._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        {new Date(e.expenseDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">{e.category}</td>
                      <td className="py-3 px-4 font-black text-rose-600">₹{e.amount}</td>
                      <td className="py-3 px-4 text-gray-700">
                        {e.machineId ? `${e.machineId.machineName} (${e.machineId.machineNumber})` : 'General'}
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-[200px] truncate">
                        {e.note || (e.workSessionId ? `For: ${e.workSessionId.customerName}` : '-')}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span className="font-semibold text-gray-800 block">
                          {e.createdByRole === 'ADMIN' ? 'Admin' : e.createdBy?.name || 'Operator'}
                        </span>
                        <span className="text-gray-400 uppercase text-[10px]">{e.createdByRole}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {e.isUpdated ? (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-block"
                            title={`Updated by ${e.updatedByName || 'Admin'} (${e.updatedByRole || 'ADMIN'}) on ${e.updatedAt ? new Date(e.updatedAt).toLocaleString() : ''}`}
                          >
                            Updated
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedExpense(e);
                              setModalOpen(true);
                            }}
                            title="Edit Expense"
                            className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm(`Move expense of ₹${e.amount} (${e.category}) to Recycle Bin?`)) {
                                await api.delete(`/api/expenses/${e._id}`);
                                await mutate((k) => typeof k === 'string' && k.startsWith('/api/expenses'));
                                await mutate('/api/recycle-bin');
                              }
                            }}
                            title="Move to Recycle Bin"
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Modal */}
      <ExpenseModal
        isOpen={modalOpen}
        expense={selectedExpense}
        onClose={() => {
          setModalOpen(false);
          setSelectedExpense(null);
        }}
      />
    </div>
  );
};
