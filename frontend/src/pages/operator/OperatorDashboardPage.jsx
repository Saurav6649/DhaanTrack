import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import {
  formatMachineWorkingHours,
  formatRunningDuration,
  formatStartTime,
  formatCreatedDate,
} from '../../utils/formatters.js';
import {
  Tractor,
  Clock,
  PlayCircle,
  CheckCircle2,
  CalendarCheck,
  Calculator,
  Timer,
  Receipt,
  CreditCard,
  Plus,
  Phone,
  MapPin,
  ChevronRight,
  Sparkles,
  Users,
} from 'lucide-react';

export const OperatorDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Local ticker for live duration synchronization
  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch today's work sessions for this operator
  const today = new Date().toISOString().split('T')[0];
  const { data: worksData, isLoading: worksLoading } = useSWR(`/api/work-sessions?startDate=${today}`, {
    refreshInterval: 5000,
  });
  // Active work session check
  const { data: activeData } = useSWR('/api/work-sessions/active', { refreshInterval: 5000 });
  const activeSession = activeData?.activeSession;

  const rawSessions = worksData?.workSessions || [];
  // Ensure active running session is always guaranteed to be present in sessions
  const sessions = activeSession && !rawSessions.some((s) => String(s._id) === String(activeSession._id))
    ? [activeSession, ...rawSessions]
    : rawSessions;

  const machine = user?.assignedMachine;

  // Helper to compute exact live duration for any session (running, paused, or completed)
  const getSessionDuration = (s) => {
    if (!s) return 0;
    // Prefer activeSession data if this session is the active one
    const sessionObj = activeSession && String(activeSession._id) === String(s._id) ? { ...s, ...activeSession } : s;
    const baseSeconds = Number(sessionObj.totalWorkedSeconds) || 0;
    if (sessionObj.status === 'IN_PROGRESS' && sessionObj.lastResumeTime) {
      const liveDelta = Math.max(0, Math.floor((nowMs - new Date(sessionObj.lastResumeTime).getTime()) / 1000));
      return baseSeconds + liveDelta;
    }
    return baseSeconds;
  };

  // Compute today's operational stats across all recorded sessions for the machine
  const totalWorkedSeconds = sessions.reduce((acc, s) => acc + getSessionDuration(s), 0);
  const runningSessions = sessions.filter((s) => s.status === 'IN_PROGRESS' || s.status === 'PAUSED');
  const pendingSessions = sessions.filter((s) => s.status === 'PENDING');
  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED');

  // Filter Today's Works to ONLY active works (Pending, Running / In-Progress). Completed works are excluded.
  const activeWorks = sessions.filter((work) => {
    const st = work.status?.toUpperCase();
    return st === 'PENDING' || st === 'IN_PROGRESS' || st === 'PAUSED';
  });

  const formatHours = (seconds = 0) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const handleOpenWorkDetails = (session, e) => {
    // If clicked on an interactive nested button or link other than the navigation arrow, stop card navigation
    if (e?.target?.closest('button:not([data-nav-arrow]), a:not([data-nav-arrow]), input, select')) {
      return;
    }
    navigate('/app/timer');
  };

  return (
    <div className="space-y-5 pb-28 sm:pb-32">
      {/* 1. Assigned Machine Header Card */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-3xl p-5 shadow-lg shadow-brand-600/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-100 flex items-center gap-1">
              <Tractor className="w-3.5 h-3.5" /> Assigned Harvester Machine
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-0.5 tracking-tight">
              {machine ? machine.machineName : 'No Machine Assigned'}
            </h2>
            {machine && (
              <p className="text-sm text-brand-100 font-mono font-bold mt-0.5">
                {machine.machineNumber} • ₹{machine.customerHourlyRate}/hr Rate
              </p>
            )}
          </div>
          <div className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-white self-start sm:self-auto">
            Operator: {user?.name}
          </div>
        </div>

        {/* Today's Working Hours Banner */}
        <div className="mt-4 pt-3.5 border-t border-brand-500/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-200" />
            <span className="text-xs text-brand-100 font-medium">Today's Total Working Hours:</span>
          </div>
          <span className="text-xl font-mono font-black text-white" data-testid="today-working-hours">
            {formatMachineWorkingHours(totalWorkedSeconds)}
          </span>
        </div>
      </div>

      {/* 2. Active Session Alert (if running) */}
      {activeSession && (
        <div
          onClick={() => navigate('/app/timer')}
          className="bg-amber-50 border-2 border-amber-400/80 rounded-2xl p-4 shadow-sm cursor-pointer hover:bg-amber-100/60 transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center animate-pulse">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                Session In Progress
              </span>
              <p className="font-bold text-gray-900 text-sm">{activeSession.customerName}</p>
              <p className="text-xs text-gray-600">{activeSession.fieldLocation}</p>
            </div>
          </div>
          <Button size="sm" variant="primary" className="bg-amber-600 hover:bg-amber-700">
            Open Timer
          </Button>
        </div>
      )}

      {/* 3. Quick Action Grid (Large Buttons) */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/app/field-calculator"
            className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-brand-300 hover:shadow-md transition text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <Calculator className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm text-gray-900">Field Estimate</span>
            <span className="text-[11px] text-gray-400 mt-0.5">Katha to Acre billing</span>
          </Link>

          <Link
            to="/app/quick-calculator"
            className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-brand-300 hover:shadow-md transition text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <Timer className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm text-gray-900">Quick Calculator</span>
            <span className="text-[11px] text-gray-400 mt-0.5">Minutes & time billing</span>
          </Link>

          <Link
            to="/app/expenses"
            className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-brand-300 hover:shadow-md transition text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <Receipt className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm text-gray-900">Add Expense</span>
            <span className="text-[11px] text-gray-400 mt-0.5">Diesel, food, repairs</span>
          </Link>

          <Link
            to="/app/payments"
            className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-brand-300 hover:shadow-md transition text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <CreditCard className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm text-gray-900">Record Payment</span>
            <span className="text-[11px] text-gray-400 mt-0.5">Advance & settlement</span>
          </Link>

          <Link
            to="/app/customers"
            className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-emerald-300 hover:shadow-md transition text-center group col-span-2 sm:col-span-1"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <Users className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm text-gray-900">Customers & Leads</span>
            <span className="text-[11px] text-gray-400 mt-0.5">Directory & user sharing</span>
          </Link>
        </div>
      </div>

      {/* 4. Today's Work Summary Overview (ONLY Pending & Running / In-Progress works) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Today's Works ({activeWorks.length})
          </h3>
          <Link to="/app/today-works" className="text-xs font-bold text-brand-600 hover:underline">
            View All Cards
          </Link>
        </div>

        {worksLoading ? (
          <LoadingSpinner label="Loading today's active jobs..." />
        ) : activeWorks.length === 0 ? (
          <Card className="text-center py-8">
            <CalendarCheck className="w-10 h-10 text-brand-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-800">No Active Works Today</p>
            <p className="text-xs text-gray-500 mt-0.5 mb-4">
              All completed jobs are safely preserved in View All Cards. Use the Field Calculator to book new works.
            </p>
            <Button size="sm" variant="primary" onClick={() => navigate('/app/field-calculator')}>
              <Plus className="w-4 h-4 mr-1" /> New Work
            </Button>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {activeWorks.map((s) => {
              const sessionObj = activeSession && String(activeSession._id) === String(s._id) ? { ...s, ...activeSession } : s;
              const isPending = sessionObj.status === 'PENDING';
              const duration = getSessionDuration(sessionObj);
              const startTimeFormatted = sessionObj.startedAt ? formatStartTime(sessionObj.startedAt) : null;

              return (
                <div
                  key={s._id}
                  role="button"
                  tabIndex={0}
                  aria-label={`View work details for ${s.customerName}`}
                  onClick={(e) => handleOpenWorkDetails(s, e)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenWorkDetails(s, e);
                    }
                  }}
                  className="group relative bg-white rounded-2xl border border-gray-100 p-4 shadow-xs hover:border-brand-400 hover:shadow-md hover:bg-emerald-50/10 active:scale-[0.99] transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 select-none space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 group-hover:text-brand-800 transition-colors">
                        {s.customerName}
                      </h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" /> {s.fieldLocation}
                      </p>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Badge status={sessionObj.status} />
                    </div>
                  </div>

                  {/* Start Time for Running / Started Sessions */}
                  {startTimeFormatted && (
                    <div className="text-xs text-gray-600 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                      <span>Start Time: <strong className="text-gray-900 font-bold">{startTimeFormatted}</strong></span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="font-mono text-gray-600">
                      Duration: <strong className="text-gray-900">{formatRunningDuration(duration)}</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      <div onClick={(e) => e.stopPropagation()}>
                        {isPending ? (
                          <div className="flex flex-col items-end">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full mr-1 bg-current opacity-70"></span>
                              Not Started
                            </span>
                            <span className="text-[10px] text-gray-400 mt-0.5 font-medium">
                              Created: {formatCreatedDate(s.createdAt)}
                            </span>
                          </div>
                        ) : (
                          <Badge status={sessionObj.paymentStatus} />
                        )}
                      </div>
                      {/* Visual Navigation Arrow Indicator */}
                      <span
                        data-nav-arrow="true"
                        className="p-1.5 rounded-lg text-brand-700 bg-brand-50 group-hover:bg-brand-600 group-hover:text-white transition-all duration-150 inline-flex items-center justify-center"
                        title="View Details"
                        aria-hidden="true"
                      >
                        <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
