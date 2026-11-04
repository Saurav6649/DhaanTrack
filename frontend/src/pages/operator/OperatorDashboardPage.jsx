import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
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
} from 'lucide-react';

export const OperatorDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch today's work sessions for this operator
  const today = new Date().toISOString().split('T')[0];
  const { data: worksData, isLoading: worksLoading } = useSWR(`/api/work-sessions?startDate=${today}`);
  const sessions = worksData?.workSessions || [];

  // Active work session check
  const { data: activeData } = useSWR('/api/work-sessions/active', { refreshInterval: 6000 });
  const activeSession = activeData?.activeSession;

  const machine = user?.assignedMachine;

  // Compute today's operational stats
  const totalWorkedSeconds = sessions.reduce((acc, s) => acc + (s.totalWorkedSeconds || 0), 0);
  const totalHours = Number((totalWorkedSeconds / 3600).toFixed(2));
  const runningSessions = sessions.filter((s) => s.status === 'IN_PROGRESS' || s.status === 'PAUSED');
  const pendingSessions = sessions.filter((s) => s.status === 'PENDING');
  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED');

  const formatHours = (seconds = 0) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-5 pb-8">
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
          <span className="text-xl font-mono font-black text-white">{totalHours} hrs</span>
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
        </div>
      </div>

      {/* 4. Today's Work Summary Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Today's Works ({sessions.length})
          </h3>
          <Link to="/app/today-works" className="text-xs font-bold text-brand-600 hover:underline">
            View All Cards
          </Link>
        </div>

        {worksLoading ? (
          <LoadingSpinner label="Loading today's jobs..." />
        ) : sessions.length === 0 ? (
          <Card className="text-center py-8">
            <CalendarCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-800">No Harvesting Jobs Scheduled Today</p>
            <p className="text-xs text-gray-500 mt-0.5 mb-4">Use the Field Calculator to book farmer lands</p>
            <Button size="sm" variant="primary" onClick={() => navigate('/app/field-calculator')}>
              <Plus className="w-4 h-4 mr-1" /> New Booking
            </Button>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {sessions.map((s) => (
              <Card key={s._id} className="p-3.5 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{s.customerName}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-gray-400" /> {s.fieldLocation}
                    </p>
                  </div>
                  <Badge status={s.status} />
                </div>

                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="font-mono text-gray-600">
                    Duration: <strong className="text-gray-900">{formatHours(s.totalWorkedSeconds)}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge status={s.paymentStatus} />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate('/app/timer')}
                      className="px-2 py-1 text-brand-700"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
