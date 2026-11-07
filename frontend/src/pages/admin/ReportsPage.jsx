import React, { useState } from 'react';
import useSWR from 'swr';
import { getApiUrl } from '../../services/api.js';
import { Card, CardHeader } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { DateFilterSelector } from '../../components/common/DateFilterSelector.jsx';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  FileSpreadsheet,
  Download,
  Filter,
  BarChart3,
  Calendar,
  Layers,
  TrendingUp,
  Clock,
  IndianRupee,
  HardHat,
  Receipt,
  CheckCircle,
  Tractor,
  User,
  Tag,
  RefreshCw,
} from 'lucide-react';

const EXPENSE_CATEGORIES = [
  'Diesel / Fuel',
  'Repair / Maintenance',
  'Driver / Operator Food',
  'Worker Expense',
  'Transportation',
  'Other',
];

export const ReportsPage = () => {
  const [reportType, setReportType] = useState('work');
  const [filterType, setFilterType] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [userId, setUserId] = useState('');
  const [machineId, setMachineId] = useState('');
  const [category, setCategory] = useState('');

  const reportOptions = [
    { id: 'work', label: 'Work Report', desc: 'All bookings, fields, durations & billing' },
    { id: 'revenue', label: 'Revenue Report', desc: 'Customer billing breakdown and timeline' },
    { id: 'contractor', label: 'Contractor Report', desc: 'Contractor payouts and machine associations' },
    { id: 'expense', label: 'Expense Report', desc: 'Diesel, food, maintenance breakdown' },
    { id: 'profit', label: 'Gross & Net Profit Report', desc: 'Gross and Net profit performance' },
    { id: 'user_wise', label: 'User-wise Report', desc: 'Operator working hours, revenues and expenses' },
    { id: 'machine_wise', label: 'Machine-wise Report', desc: 'Harvester capacity, hours and profits' },
    { id: 'payment', label: 'Customer Payment Report', desc: 'All incoming customer receipts and modes' },
    { id: 'advance_payment', label: 'Advance Payment Report', desc: 'Pre-harvesting advance payments received' },
    { id: 'outstanding_balance', label: 'Outstanding Balance Report', desc: 'Pending balances owed by farmers' },
  ];

  // Fetch dropdown data for machines and users
  const { data: usersData } = useSWR('/api/users/combined');
  const operators = usersData?.users?.filter((u) => u.role === 'USER') || [];

  const { data: machinesData } = useSWR('/api/machines');
  const machines = machinesData?.machines || [];

  // Query parameters for reports and stats
  const queryParams = new URLSearchParams({
    filterType,
    ...(customStart && { customStart }),
    ...(customEnd && { customEnd }),
    ...(userId && { userId }),
    ...(machineId && { machineId }),
    ...(category && { category }),
  }).toString();

  // Fetch Dashboard Summary Stats for KPI cards and trend chart
  const { data: statsData, isLoading: isStatsLoading } = useSWR(
    `/api/reports/dashboard?${queryParams}`
  );
  const stats = statsData;
  const cards = stats?.cards;
  const dailyOverview = stats?.charts?.dailyOverview || [];

  // Fetch tabular report preview data
  const { data: reportData, isLoading: isReportLoading } = useSWR(
    `/api/reports/${reportType}?${queryParams}`
  );
  const columns = reportData?.columns || [];
  const rows = reportData?.rows || [];

  const handleExportExcel = () => {
    window.open(getApiUrl(`/reports/${reportType}/export?${queryParams}`), '_blank');
  };

  const handleResetFilters = () => {
    setUserId('');
    setMachineId('');
    setCategory('');
  };

  const hasAdvancedFilters = !!(userId || machineId || category);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Reports & Business Analytics</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Download production Excel sheets with formula security, view KPI summaries, and analyze trend charts
          </p>
        </div>

        <Button variant="primary" onClick={handleExportExcel} className="font-bold w-full sm:w-auto">
          <Download className="w-4 h-4 mr-1.5 shrink-0 text-white" />
          <span>Download Excel ({reportOptions.find((r) => r.id === reportType)?.label})</span>
        </Button>
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

      {/* Advanced Filters Toolbar */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 tracking-wider">
            <Filter className="w-3.5 h-3.5 text-brand-600" /> Advanced Filters
          </div>
          {hasAdvancedFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-brand-600 hover:text-brand-800 font-semibold inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Operator / User Dropdown */}
          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1">
              Filter by Operator
            </label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">All Operators</option>
              {operators.map((op) => (
                <option key={op._id} value={op._id}>
                  {op.name} (@{op.userId})
                </option>
              ))}
            </select>
          </div>

          {/* Machine Dropdown */}
          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1">
              Filter by Machine
            </label>
            <select
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">All Harvesters</option>
              {machines.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.machineName} ({m.machineNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Expense Category Dropdown */}
          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1">
              Expense Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">All Expense Categories</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* KPI Summary Cards */}
      {isStatsLoading || !cards ? (
        <LoadingSpinner label="Compiling summary calculations..." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Total Revenue */}
          <Card className="border-l-4 border-l-emerald-500 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Total Revenue</span>
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <IndianRupee className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-black text-gray-900 mt-1">₹{cards.totalCustomerRevenue?.toLocaleString()}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{cards.totalProjects} jobs</p>
          </Card>

          {/* Working Hours */}
          <Card className="border-l-4 border-l-amber-500 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Total Hours</span>
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-black text-gray-900 mt-1">{cards.totalWorkingHours} hrs</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Harvesting duration</p>
          </Card>

          {/* Contractor Cost */}
          <Card className="border-l-4 border-l-orange-500 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Contractor Cost</span>
              <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
                <HardHat className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-black text-gray-900 mt-1">₹{cards.totalContractorAmount?.toLocaleString()}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Machine payout share</p>
          </Card>

          {/* Expenses */}
          <Card className="border-l-4 border-l-rose-500 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Total Expenses</span>
              <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <Receipt className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-black text-gray-900 mt-1">₹{cards.totalExpenses?.toLocaleString()}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Fuel & maintenance</p>
          </Card>

          {/* Gross Profit */}
          <Card className="border-l-4 border-l-brand-500 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Gross Profit</span>
              <div className="p-1.5 bg-brand-50 text-brand-600 rounded-lg">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-black text-brand-700 mt-1">₹{cards.grossProfit?.toLocaleString()}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Revenue - Contractor</p>
          </Card>

          {/* Net Profit */}
          <Card className="border-l-4 border-l-purple-500 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Net Profit</span>
              <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                <CheckCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-black text-purple-700 mt-1">₹{cards.netProfit?.toLocaleString()}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">After all expenses</p>
          </Card>
        </div>
      )}

      {/* Interactive Trend Chart */}
      <Card>
        <CardHeader
          title="Daily Financial & Operational Trend"
          subtitle="Timeline of Customer Revenue, Contractor Share, Operational Expenses, and Net Profit"
        />
        <div className="h-72 sm:h-80 w-full mt-2">
          {dailyOverview.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-400">
              No operational records match the selected date range and filters.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyOverview} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReportRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorReportNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val, name) => [`₹${Number(val).toLocaleString()}`, name]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#16a34a"
                  fillOpacity={1}
                  fill="url(#colorReportRevenue)"
                />
                <Area
                  type="monotone"
                  dataKey="contractor"
                  name="Contractor Share"
                  stroke="#f59e0b"
                  fill="#fef3c7"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#ef4444"
                  fill="#fee2e2"
                />
                <Area
                  type="monotone"
                  dataKey="netProfit"
                  name="Net Profit"
                  stroke="#8b5cf6"
                  fillOpacity={0.5}
                  fill="url(#colorReportNet)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Report Selection Tabs / Pills */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-xs">
        <label className="text-xs font-bold uppercase text-gray-400 block tracking-wider mb-2">
          Select Report Category
        </label>
        <div className="flex flex-wrap gap-2">
          {reportOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setReportType(opt.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all min-h-[38px] ${
                reportType === opt.id
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Table Preview */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">
              {reportData?.sheetName || 'Report Preview'}
            </h3>
            <p className="text-xs text-gray-400">
              {rows.length} records found for selected period and filters
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 mr-1" /> Save as .xlsx
          </Button>
        </div>

        {isReportLoading ? (
          <LoadingSpinner label="Compiling report data and formulas..." />
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            No records found for {reportOptions.find((r) => r.id === reportType)?.label} in this date range.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-white shadow-xs z-10">
                <tr className="bg-brand-50/80 border-b border-brand-100 text-brand-950 font-bold uppercase tracking-wider text-[11px]">
                  {columns.map((col) => (
                    <th key={col.key} className="py-3 px-4 whitespace-nowrap">
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                    {columns.map((col) => (
                      <td key={col.key} className="py-2.5 px-4 whitespace-nowrap text-gray-700">
                        {String(row[col.key] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
