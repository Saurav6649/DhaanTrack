import React, { useState } from 'react';
import useSWR from 'swr';
import { getApiUrl } from '../../services/api.js';
import { Card, CardHeader } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { DateFilterSelector } from '../../components/common/DateFilterSelector.jsx';
import { ProfitModeToggle } from '../../components/admin/ProfitModeToggle.jsx';
import { AnalyticsCharts } from '../../components/admin/AnalyticsCharts.jsx';
import {
  FolderKanban,
  Clock,
  IndianRupee,
  HardHat,
  Receipt,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle,
  PlayCircle,
  Clock3,
  CreditCard,
  AlertCircle,
} from 'lucide-react';

export const DashboardPage = () => {
  const [filterType, setFilterType] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [profitMode, setProfitMode] = useState('gross'); // 'gross' | 'net'

  const queryParams = new URLSearchParams({
    filterType,
    profitMode,
    ...(customStart && { customStart }),
    ...(customEnd && { customEnd }),
  }).toString();

  const { data, isLoading } = useSWR(`/api/reports/dashboard?${queryParams}`);
  const stats = data;

  const handleExportExcel = () => {
    const exportUrl = getApiUrl(`/reports/work/export?${queryParams}`);
    window.open(exportUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Date Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin Executive Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Real-time paddy harvesting operations, revenue, contractor costs and profit analysis
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={handleExportExcel} className="font-semibold text-xs sm:text-sm">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 mr-1.5" /> Export Excel
          </Button>
        </div>
      </div>

      {/* Date Filter & Profit Mode Controls */}
      <div className="flex flex-col gap-4">
        <DateFilterSelector
          filterType={filterType}
          onChangeFilterType={setFilterType}
          customStart={customStart}
          customEnd={customEnd}
          onChangeCustomStart={setCustomStart}
          onChangeCustomEnd={setCustomEnd}
        />

        <ProfitModeToggle mode={profitMode} onChangeMode={setProfitMode} />
      </div>

      {isLoading || !stats ? (
        <LoadingSpinner label="Compiling business intelligence and calculations..." />
      ) : (
        <>
          {/* Main KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Total Projects */}
            <Card className="border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Projects</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <FolderKanban className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">{stats.cards.totalProjects}</p>
              <p className="text-xs text-gray-500 mt-1">Booked harvesting jobs</p>
            </Card>

            {/* Total Working Hours */}
            <Card className="border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Working Hours</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">{stats.cards.totalWorkingHours} hrs</p>
              <p className="text-xs text-gray-500 mt-1">Machine operation time</p>
            </Card>

            {/* Customer Revenue */}
            <Card className="border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Customer Revenue</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">
                ₹{Number(stats.cards.totalCustomerRevenue).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total farmer billings</p>
            </Card>

            {/* Contractor Amount */}
            <Card className="border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Contractor Cost</span>
                <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                  <HardHat className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-orange-700 mt-2">
                ₹{Number(stats.cards.totalContractorAmount).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Agreed contractor payouts</p>
            </Card>
          </div>

          {/* Secondary Row: Expenses & Profit Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {/* Total Expenses */}
            <Card className="border-l-4 border-l-rose-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Expenses</span>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-rose-700 mt-2">
                ₹{Number(stats.cards.totalExpenses).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Diesel, repairs, operator food</p>
            </Card>

            {/* Gross Profit */}
            <Card
              className={`border-l-4 ${
                profitMode === 'gross'
                  ? 'border-l-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                  : 'border-l-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Gross Profit</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-800 mt-2">
                ₹{Number(stats.cards.grossProfit).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Revenue - Contractor Amount</p>
            </Card>

            {/* Net Profit */}
            <Card
              className={`border-l-4 ${
                profitMode === 'net'
                  ? 'border-l-purple-600 ring-2 ring-purple-500/20 bg-purple-50/20'
                  : 'border-l-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Net Profit</span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-purple-800 mt-2">
                ₹{Number(stats.cards.netProfit).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Revenue - Contractor - Expenses</p>
            </Card>
          </div>

          {/* Quick Operational Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
              <PlayCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[11px] text-gray-400 block font-semibold">Running</span>
                <span className="text-lg font-bold text-gray-900">{stats.quickSummary.runningWorks}</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <span className="text-[11px] text-gray-400 block font-semibold">Completed</span>
                <span className="text-lg font-bold text-gray-900">{stats.quickSummary.completedWorks}</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
              <Clock3 className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="text-[11px] text-gray-400 block font-semibold">Pending</span>
                <span className="text-lg font-bold text-gray-900">{stats.quickSummary.pendingWorks}</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-purple-600 shrink-0" />
              <div>
                <span className="text-[11px] text-gray-400 block font-semibold">Advance Received</span>
                <span className="text-sm font-bold text-purple-800">
                  ₹{Number(stats.quickSummary.totalAdvanceReceived).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <span className="text-[11px] text-gray-400 block font-semibold">Customer Due</span>
                <span className="text-sm font-bold text-rose-700">
                  ₹{Number(stats.quickSummary.totalRemainingCustomerBalance).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Recharts Analytics */}
          <AnalyticsCharts
            dailyOverview={stats.charts.dailyOverview}
            expenseDistribution={stats.charts.expenseDistribution}
            revenueDistribution={stats.charts.revenueDistribution}
            profitMode={profitMode}
          />
        </>
      )}
    </div>
  );
};
