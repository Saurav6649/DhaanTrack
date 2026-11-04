import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardHeader } from '../common/Card.jsx';

const COLORS = ['#16a34a', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];

export const AnalyticsCharts = ({ dailyOverview = [], expenseDistribution = [], revenueDistribution = [], profitMode = 'gross' }) => {
  return (
    <div className="space-y-6">
      {/* Daily Overview Chart */}
      <Card>
        <CardHeader
          title="Daily Work & Profit Overview"
          subtitle="Timeline of Customer Revenue, Contractor Share, Expenses, and Profit"
        />
        <div className="h-72 sm:h-80 w-full">
          {dailyOverview.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-400">
              No work session data recorded in this date range.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyOverview} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val, name) => [`₹${Number(val).toLocaleString()}`, name]}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="revenue" name="Customer Revenue" stroke="#16a34a" fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="contractor" name="Contractor Cost" stroke="#f59e0b" fill="#fef3c7" />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" fill="#fee2e2" />
                <Area
                  type="monotone"
                  dataKey={profitMode === 'net' ? 'netProfit' : 'grossProfit'}
                  name={profitMode === 'net' ? 'Net Profit' : 'Gross Profit'}
                  stroke="#8b5cf6"
                  fillOpacity={0.3}
                  fill="url(#colorProfit)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Grid of Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Distribution by Machine */}
        <Card>
          <CardHeader
            title="Revenue Distribution by Machine"
            subtitle="Customer billing performance per harvester"
          />
          <div className="h-64 w-full">
            {revenueDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                No revenue recorded in this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueDistribution} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="value" name="Revenue" fill="#16a34a" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Expense Distribution by Category */}
        <Card>
          <CardHeader
            title="Expense Distribution"
            subtitle="Fuel, maintenance and operational expense breakdown"
          />
          <div className="h-64 w-full flex items-center justify-center">
            {expenseDistribution.length === 0 ? (
              <div className="text-sm text-gray-400">No expenses recorded in this period.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {expenseDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val, name) => [`₹${Number(val).toLocaleString()}`, name]} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
