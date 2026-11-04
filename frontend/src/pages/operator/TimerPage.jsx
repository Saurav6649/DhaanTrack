import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR, { mutate } from 'swr';
import { api } from '../../api/client.js';
import { LiveTimer } from '../../components/operator/LiveTimer.jsx';
import { RecordPaymentModal } from '../../components/operator/RecordPaymentModal.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { BackButton } from '../../components/common/BackButton.jsx';
import { Alert } from '../../components/common/Alert.jsx';
import {
  Clock,
  Play,
  Plus,
  Phone,
  MapPin,
  CheckCircle,
  IndianRupee,
  AlertTriangle,
  Trash2,
  CreditCard,
} from 'lucide-react';

export const TimerPage = () => {
  const navigate = useNavigate();

  // Active session
  const { data: activeData } = useSWR('/api/work-sessions/active', { refreshInterval: 5000 });
  const activeSession = activeData?.activeSession;

  // Pending sessions for operator
  const { data: pendingData, isLoading } = useSWR('/api/work-sessions?status=PENDING');
  const pendingSessions = pendingData?.workSessions || [];

  const [completedSession, setCompletedSession] = useState(null);
  const [paymentSession, setPaymentSession] = useState(null);
  const [startLoadingId, setStartLoadingId] = useState(null);
  const [conflictError, setConflictError] = useState('');

  const formatDurationClean = (seconds = 0) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s (${(seconds / 3600).toFixed(2)} hrs)`;
    if (m > 0) return `${m}m ${s}s (${Math.max(0.01, seconds / 3600).toFixed(2)} hrs)`;
    return `${s}s (${Math.max(0.01, seconds / 3600).toFixed(2)} hrs)`;
  };

  const handleStartPending = async (session) => {
    if (activeSession) {
      setConflictError(
        `Another work session for customer "${activeSession.customerName}" is currently active on this machine. Please pause or complete it before starting a new timer session.`
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setConflictError('');
      setStartLoadingId(session._id);
      await api.post(`/api/work-sessions/${session._id}/start`);
      await mutate('/api/work-sessions/active');
      await mutate((k) => typeof k === 'string' && k.startsWith('/api/work-sessions'));
    } catch (err) {
      setConflictError(err.message || 'Failed to start session.');
    } finally {
      setStartLoadingId(null);
    }
  };

  const handleDeletePending = async (session) => {
    const confirm = window.confirm(
      `Delete unstarted booking for customer "${session.customerName}"? This record will be moved to the Recycle Bin.`
    );
    if (!confirm) return;

    try {
      await api.delete(`/api/work-sessions/${session._id}`);
      await mutate((k) => typeof k === 'string' && k.startsWith('/api/work-sessions'));
      await mutate('/api/recycle-bin');
    } catch (err) {
      alert(err.message || 'Failed to delete work session.');
    }
  };

  const handleWorkCompleted = (session) => {
    setCompletedSession(session);
    setPaymentSession(session);
  };

  return (
    <div className="space-y-6">
      {/* Top Header with BackButton */}
      <div className="space-y-2">
        <BackButton to="/app/dashboard" />
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Active Work Timer</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time harvest time tracking. Persists across refresh, phone calls and reloads.
          </p>
        </div>
      </div>

      {conflictError && (
        <Alert
          type="error"
          message={conflictError}
          onClose={() => setConflictError('')}
        />
      )}

      {/* Prominent Live Timer */}
      <LiveTimer onCompleted={handleWorkCompleted} />

      {/* Completion Modal / Card Alert */}
      {completedSession && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-emerald-950">Work Completed Successfully!</h3>
              <p className="text-xs text-emerald-800">Customer: {completedSession.customerName}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Total Worked Duration:</span>
              <span className="font-bold text-gray-900">
                {formatDurationClean(completedSession.totalWorkedSeconds)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Hourly Rate Applied:</span>
              <span className="font-semibold text-gray-900">₹{completedSession.customerRateSnapshot}/hr</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 text-base font-black">
              <span className="text-emerald-900">Final Customer Bill:</span>
              <span className="text-emerald-700 text-lg">₹{completedSession.finalAmount}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="lg"
              variant="primary"
              className="flex-1 font-bold min-h-[44px]"
              onClick={() => setPaymentSession(completedSession)}
            >
              <IndianRupee className="w-5 h-5 mr-1" /> Record Customer Payment
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="min-h-[44px]"
              onClick={() => setCompletedSession(null)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Pending Scheduled Bookings (Start, Advance Payment, or Delete) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Pending Scheduled Works ({pendingSessions.length})
          </h3>
          <Button size="sm" variant="outline" onClick={() => navigate('/app/field-calculator')} className="min-h-[36px]">
            <Plus className="w-3.5 h-3.5 mr-1" /> Book New Field
          </Button>
        </div>

        {isLoading ? (
          <LoadingSpinner label="Loading pending bookings..." />
        ) : pendingSessions.length === 0 ? (
          <Card className="text-center py-8">
            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-800">No Pending Works Available</p>
            <p className="text-xs text-gray-500 mt-0.5 mb-3">
              Use the Field Calculator to create an estimate and start work.
            </p>
            <Button size="sm" variant="primary" onClick={() => navigate('/app/field-calculator')} className="min-h-[40px]">
              Open Field Calculator
            </Button>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {pendingSessions.map((s) => {
              const target = s.finalAmount > 0 ? s.finalAmount : (s.estimatedAmount || 0);
              const paid = s.totalPaidAmount || 0;
              const bal = Math.max(0, target - paid);

              return (
                <Card key={s._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{s.customerName}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-gray-400" /> {s.customerMobile}
                      </p>
                      <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400" /> {s.fieldLocation}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-[11px] font-bold text-brand-800 bg-brand-50 px-2 py-0.5 rounded">
                          Rate: ₹{s.customerRateSnapshot}/hr
                        </span>
                        {s.fieldAreaKatha > 0 && (
                          <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                            {s.fieldAreaKatha} Katha (~{s.estimatedHours} hrs est.)
                          </span>
                        )}
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          Est. Bill: ₹{target}
                        </span>
                      </div>
                    </div>

                    <Badge status={s.paymentStatus} />
                  </div>

                  {/* Payment Summary & Action Strip */}
                  <div className="pt-2.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs">
                      <span className="text-gray-500">Paid: </span>
                      <span className="font-bold text-emerald-700">₹{paid}</span>
                      <span className="text-gray-400 mx-1.5">·</span>
                      <span className="text-gray-500">Bal: </span>
                      <span className={`font-bold ${bal > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>₹{bal}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPaymentSession(s)}
                        className="text-xs font-semibold text-brand-700 hover:bg-brand-50 min-h-[36px]"
                      >
                        <CreditCard className="w-3.5 h-3.5 mr-1" /> Advance
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeletePending(s)}
                        className="text-xs font-semibold text-rose-600 hover:bg-rose-50 min-h-[36px]"
                        title="Delete unstarted booking"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="primary"
                        isLoading={startLoadingId === s._id}
                        onClick={() => handleStartPending(s)}
                        className="font-bold shrink-0 bg-brand-600 hover:bg-brand-700 min-h-[36px]"
                      >
                        <Play className="w-3.5 h-3.5 mr-1" /> Start
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {paymentSession && (
        <RecordPaymentModal
          isOpen={!!paymentSession}
          session={paymentSession}
          onClose={() => setPaymentSession(null)}
        />
      )}
    </div>
  );
};