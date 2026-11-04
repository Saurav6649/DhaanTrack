import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR, { mutate } from 'swr';
import api, { getApiUrl } from '../../services/api.js';
import { Card, CardHeader } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { DateFilterSelector } from '../../components/common/DateFilterSelector.jsx';
import {
  ArrowLeft,
  FileSpreadsheet,
  Tractor,
  User,
  Phone,
  Clock,
  IndianRupee,
  Receipt,
  CheckCircle2,
  Calendar,
  History,
  CreditCard,
  Trash2,
} from 'lucide-react';

export const UserMachineDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [filterType, setFilterType] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [activeTab, setActiveTab] = useState('work'); // 'work' | 'expenses' | 'payments'

  const queryParams = new URLSearchParams({
    filterType,
    ...(customStart && { startDate: customStart }),
    ...(customEnd && { endDate: customEnd }),
  }).toString();

  const { data, isLoading } = useSWR(`/api/users/${id}/details?${queryParams}`);
  const user = data?.user;
  const machine = data?.machine;
  const cards = data?.cards;
  const workHistory = data?.workHistory || [];
  const expenseHistory = data?.expenseHistory || [];
  const paymentHistory = data?.paymentHistory || [];

  const handleExportExcel = () => {
    window.open(getApiUrl(`/reports/user_wise/export?userId=${id}&${queryParams}`), '_blank');
  };

  const formatHours = (seconds = 0) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const handleDeleteSession = async (session) => {
    const confirm = window.confirm(
      `Move work session for "${session.customerName}" to Recycle Bin?`
    );
    if (!confirm) return;

    try {
      await api.delete(`/api/work-sessions/${session._id}`);
      await mutate((key) => typeof key === 'string' && key.includes('/api/users/'));
      await mutate('/api/recycle-bin');
    } catch (err) {
      alert(err.message || 'Failed to move work session to Recycle Bin.');
    }
  };

  const handleDeleteExpense = async (expense) => {
    const confirm = window.confirm(
      `Move expense of ₹${expense.amount} (${expense.category}) to Recycle Bin?`
    );
    if (!confirm) return;

    try {
      await api.delete(`/api/expenses/${expense._id}`);
      await mutate((key) => typeof key === 'string' && key.includes('/api/users/'));
      await mutate('/api/recycle-bin');
    } catch (err) {
      alert(err.message || 'Failed to move expense to Recycle Bin.');
    }
  };

  const handleDeletePayment = async (payment) => {
    const confirm = window.confirm(
      `Move payment receipt of ₹${payment.amount} to Recycle Bin? The associated work session balance will automatically recalculate.`
    );
    if (!confirm) return;

    try {
      await api.delete(`/api/payments/${payment._id}`);
      await mutate((key) => typeof key === 'string' && key.includes('/api/users/'));
      await mutate('/api/recycle-bin');
    } catch (err) {
      alert(err.message || 'Failed to move payment to Recycle Bin.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/users-machines')}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {user?.name || 'Operator Profile & Machine Details'}
            </h1>
            <p className="text-xs text-gray-500">
              User ID: @{user?.userId} • Mobile: {user?.mobile}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 mr-1.5" /> Export Excel
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <DateFilterSelector
        filterType={filterType}
        onChangeFilterType={setFilterType}
        customStart={customStart}
        customEnd={customEnd}
        onChangeCustomStart={setCustomStart}
        onChangeCustomEnd={setCustomEnd}
      />

      {isLoading || !cards ? (
        <LoadingSpinner label="Fetching performance data, sessions and payment histories..." />
      ) : (
        <>
          {/* Machine & Operator Details Header Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Operator Card */}
            <Card className="bg-gradient-to-br from-white to-gray-50/50">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 font-black text-lg flex items-center justify-center">
                    {user?.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{user?.name}</h3>
                    <p className="text-xs text-gray-500">@{user?.userId}</p>
                    <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gray-400" /> {user?.mobile}
                    </p>
                  </div>
                </div>
                <Badge status={user?.status} />
              </div>
            </Card>

            {/* Machine Card */}
            <Card className="bg-gradient-to-br from-white to-gray-50/50">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Tractor className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">
                      {machine ? machine.machineName : 'No Machine Assigned'}
                    </h3>
                    {machine && (
                      <p className="text-xs text-brand-700 font-semibold font-mono">
                        {machine.machineNumber}
                      </p>
                    )}
                    {machine && (
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span>Rate: ₹{machine.customerHourlyRate}/hr</span>
                        <span>•</span>
                        <span>Capacity: {machine.capacityPerHour} Ac/hr</span>
                      </div>
                    )}
                  </div>
                </div>
                {machine && <Badge status={machine.status} />}
              </div>
            </Card>
          </div>

          {/* 7 KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* Total Projects */}
            <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">Projects</span>
              <span className="text-xl font-black text-gray-900 mt-1 block">{cards.totalProjects}</span>
            </div>

            {/* Total Hours */}
            <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">Working Hours</span>
              <span className="text-xl font-black text-gray-900 mt-1 block">{cards.totalWorkingHours}h</span>
            </div>

            {/* Total Revenue */}
            <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">Revenue</span>
              <span className="text-xl font-black text-emerald-700 mt-1 block">₹{cards.totalRevenue}</span>
            </div>

            {/* Contractor Amount */}
            <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">Contractor</span>
              <span className="text-xl font-black text-orange-700 mt-1 block">₹{cards.totalContractorAmount}</span>
            </div>

            {/* Total Expenses */}
            <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">Expenses</span>
              <span className="text-xl font-black text-rose-700 mt-1 block">₹{cards.totalExpenses}</span>
            </div>

            {/* Gross Profit */}
            <div className="bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-xs bg-emerald-50/20">
              <span className="text-[10px] font-bold uppercase text-emerald-800 block tracking-wider">Gross Profit</span>
              <span className="text-xl font-black text-emerald-800 mt-1 block">₹{cards.totalGrossProfit}</span>
            </div>

            {/* Net Profit */}
            <div className="bg-white p-3.5 rounded-2xl border border-purple-100 shadow-xs bg-purple-50/20 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase text-purple-800 block tracking-wider">Net Profit</span>
              <span className="text-xl font-black text-purple-800 mt-1 block">₹{cards.totalNetProfit}</span>
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-none max-w-full">
            <button
              onClick={() => setActiveTab('work')}
              className={`whitespace-nowrap py-3 px-4 sm:px-5 text-xs sm:text-sm font-bold border-b-2 min-h-[44px] transition-all ${
                activeTab === 'work'
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Work History ({workHistory.length})
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`whitespace-nowrap py-3 px-4 sm:px-5 text-xs sm:text-sm font-bold border-b-2 min-h-[44px] transition-all ${
                activeTab === 'expenses'
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Expense History ({expenseHistory.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`whitespace-nowrap py-3 px-4 sm:px-5 text-xs sm:text-sm font-bold border-b-2 min-h-[44px] transition-all ${
                activeTab === 'payments'
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Payment History ({paymentHistory.length})
            </button>
          </div>

          {/* Tab 1: Work History */}
          {activeTab === 'work' && (
            <Card className="p-0 overflow-hidden">
              {workHistory.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">No work sessions in this period.</div>
              ) : (
                <>
                  {/* Mobile Stacked Cards */}
                  <div className="md:hidden divide-y divide-gray-100">
                    {workHistory.map((w) => (
                      <div key={w._id} className="p-4 space-y-2 hover:bg-gray-50/50">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-gray-900 text-sm block">{w.customerName}</span>
                            <span className="text-xs text-gray-500">{w.fieldLocation}</span>
                          </div>
                          <Badge status={w.status} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl">
                          <div>
                            <span className="text-[10px] text-gray-400 font-semibold uppercase block">Duration</span>
                            <span className="font-mono font-bold text-gray-900">{formatHours(w.totalWorkedSeconds)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 font-semibold uppercase block">Final Bill</span>
                            <span className="font-bold text-emerald-700">₹{w.finalAmount || w.estimatedAmount}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                          <span>Payment: <Badge status={w.paymentStatus} /></span>
                          <div className="flex items-center gap-2">
                            <span>{new Date(w.createdAt).toLocaleDateString()}</span>
                            <button
                              onClick={() => handleDeleteSession(w)}
                              title="Move to Recycle Bin"
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg min-h-[32px] min-w-[32px] flex items-center justify-center transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Full Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 font-semibold text-[11px] uppercase border-b border-gray-100">
                          <th className="py-3 px-4">Customer</th>
                          <th className="py-3 px-4">Location</th>
                          <th className="py-3 px-4">Duration</th>
                          <th className="py-3 px-4">Final Amount</th>
                          <th className="py-3 px-4">Contractor Share</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Payment</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {workHistory.map((w) => (
                          <tr key={w._id} className="hover:bg-gray-50/50">
                            <td className="py-3 px-4 font-bold text-gray-900">{w.customerName}</td>
                            <td className="py-3 px-4 text-gray-600">{w.fieldLocation}</td>
                            <td className="py-3 px-4 font-mono font-semibold">{formatHours(w.totalWorkedSeconds)}</td>
                            <td className="py-3 px-4 font-bold text-emerald-700">₹{w.finalAmount || w.estimatedAmount}</td>
                            <td className="py-3 px-4 text-orange-700">₹{w.contractorAmount || 0}</td>
                            <td className="py-3 px-4"><Badge status={w.status} /></td>
                            <td className="py-3 px-4"><Badge status={w.paymentStatus} /></td>
                            <td className="py-3 px-4 text-gray-500">{new Date(w.createdAt).toLocaleDateString()}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteSession(w)}
                                title="Move to Recycle Bin"
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg min-h-[32px] min-w-[32px] inline-flex items-center justify-center transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </Card>
          )}

          {/* Tab 2: Expense History */}
          {activeTab === 'expenses' && (
            <Card className="p-0 overflow-hidden">
              {expenseHistory.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">No expenses recorded in this period.</div>
              ) : (
                <>
                  {/* Mobile Stacked Cards */}
                  <div className="md:hidden divide-y divide-gray-100">
                    {expenseHistory.map((e) => (
                      <div key={e._id} className="p-4 space-y-1.5 hover:bg-gray-50/50">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-gray-900">{e.category}</span>
                          <span className="font-black text-rose-600">₹{e.amount}</span>
                        </div>
                        {e.note && <p className="text-xs text-gray-600">{e.note}</p>}
                        <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                          <span>By: {e.createdBy?.name || 'Operator'}</span>
                          <div className="flex items-center gap-2">
                            <span>{new Date(e.expenseDate).toLocaleDateString()}</span>
                            <button
                              onClick={() => handleDeleteExpense(e)}
                              title="Move to Recycle Bin"
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg min-h-[32px] min-w-[32px] flex items-center justify-center transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Full Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 font-semibold text-[11px] uppercase border-b border-gray-100">
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Note</th>
                          <th className="py-3 px-4">Created By</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {expenseHistory.map((e) => (
                          <tr key={e._id} className="hover:bg-gray-50/50">
                            <td className="py-3 px-4 font-semibold text-gray-900">{e.category}</td>
                            <td className="py-3 px-4 font-bold text-rose-600">₹{e.amount}</td>
                            <td className="py-3 px-4 text-gray-600">{e.note || '-'}</td>
                            <td className="py-3 px-4 text-gray-600">{e.createdBy?.name || 'Unknown'}</td>
                            <td className="py-3 px-4 text-gray-500">{new Date(e.expenseDate).toLocaleDateString()}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteExpense(e)}
                                title="Move to Recycle Bin"
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg min-h-[32px] min-w-[32px] inline-flex items-center justify-center transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </Card>
          )}

          {/* Tab 3: Customer Payment History */}
          {activeTab === 'payments' && (
            <Card className="p-0 overflow-hidden">
              {paymentHistory.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">No customer payments recorded in this period.</div>
              ) : (
                <>
                  {/* Mobile Stacked Cards */}
                  <div className="md:hidden divide-y divide-gray-100">
                    {paymentHistory.map((p) => (
                      <div key={p._id} className="p-4 space-y-1.5 hover:bg-gray-50/50">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-gray-900">{p.paymentType} • {p.paymentMode}</span>
                          <span className="font-black text-emerald-700">₹{p.amount}</span>
                        </div>
                        {p.utrNumber && <p className="text-xs font-mono text-gray-500">Ref: {p.utrNumber}</p>}
                        <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                          <span>Received by: {p.receivedBy?.name || 'Operator'}</span>
                          <div className="flex items-center gap-2">
                            <span>{new Date(p.paymentDate).toLocaleDateString()}</span>
                            <button
                              onClick={() => handleDeletePayment(p)}
                              title="Move to Recycle Bin"
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg min-h-[32px] min-w-[32px] flex items-center justify-center transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Full Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 font-semibold text-[11px] uppercase border-b border-gray-100">
                          <th className="py-3 px-4">Payment Type</th>
                          <th className="py-3 px-4">Mode</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">UTR / Ref</th>
                          <th className="py-3 px-4">Received By</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paymentHistory.map((p) => (
                          <tr key={p._id} className="hover:bg-gray-50/50">
                            <td className="py-3 px-4 font-bold text-gray-900">{p.paymentType}</td>
                            <td className="py-3 px-4 text-gray-700">{p.paymentMode}</td>
                            <td className="py-3 px-4 font-bold text-emerald-700">₹{p.amount}</td>
                            <td className="py-3 px-4 font-mono text-gray-500">{p.utrNumber || '-'}</td>
                            <td className="py-3 px-4 text-gray-700">{p.receivedBy?.name || 'Operator'}</td>
                            <td className="py-3 px-4 text-gray-500">{new Date(p.paymentDate).toLocaleDateString()}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeletePayment(p)}
                                title="Move to Recycle Bin"
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg min-h-[32px] min-w-[32px] inline-flex items-center justify-center transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
};
