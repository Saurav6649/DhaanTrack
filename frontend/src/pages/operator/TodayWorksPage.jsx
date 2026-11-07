import React, { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { api } from '../../api/client.js';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { RecordPaymentModal } from '../../components/operator/RecordPaymentModal.jsx';
import { RequestDeletionModal } from '../../components/operator/RequestDeletionModal.jsx';
import { BackButton } from '../../components/common/BackButton.jsx';
import {
  formatRunningDuration,
  formatStartTime,
  formatCreatedDate,
} from '../../utils/formatters.js';
import {
  CalendarDays,
  Clock,
  IndianRupee,
  Phone,
  MapPin,
  Tractor,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Trash2,
  AlertCircle,
  Clock3,
} from 'lucide-react';

export const TodayWorksPage = () => {
  const today = new Date().toISOString().split('T')[0];
  const { data, isLoading } = useSWR(`/api/work-sessions?startDate=${today}`, { refreshInterval: 5000 });
  const sessions = data?.workSessions || [];

  const { data: activeData } = useSWR('/api/work-sessions/active', { refreshInterval: 5000 });
  const activeSession = activeData?.activeSession;

  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const [selectedSessionForPayment, setSelectedSessionForPayment] = useState(null);
  const [selectedSessionForDeletion, setSelectedSessionForDeletion] = useState(null);
  const [expandedSessionId, setExpandedSessionId] = useState(null);

  const getSessionDuration = (s) => {
    if (!s) return 0;
    const sessionObj = activeSession && String(activeSession._id) === String(s._id) ? { ...s, ...activeSession } : s;
    const baseSeconds = Number(sessionObj.totalWorkedSeconds) || 0;
    if (sessionObj.status === 'IN_PROGRESS' && sessionObj.lastResumeTime) {
      const liveDelta = Math.max(0, Math.floor((nowMs - new Date(sessionObj.lastResumeTime).getTime()) / 1000));
      return baseSeconds + liveDelta;
    }
    return baseSeconds;
  };

  const handleDeleteUnstarted = async (session) => {
    const confirm = window.confirm(
      `Delete unstarted work session for "${session.customerName}"? This record will be moved to the Recycle Bin.`
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

  return (
    <div className="space-y-5 pb-8">
      {/* Top Header with BackButton */}
      <div className="space-y-2">
        <BackButton to="/app/dashboard" />
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Today's Work Cards</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            All harvesting sessions booked, ongoing, and completed today with payment tracking
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner label="Loading today's harvesting works..." />
      ) : sessions.length === 0 ? (
        <Card className="text-center py-12">
          <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-gray-800">No Works Logged Today</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            New bookings created today will appear here as live cards.
          </p>
        </Card>
      ) : (
        <div className="space-y-3.5">
          {sessions.map((s) => {
            const isExpanded = expandedSessionId === s._id;
            const targetAmount = s.finalAmount > 0 ? s.finalAmount : (s.estimatedAmount || 0);
            const totalPaid = s.totalPaidAmount || 0;
            const remainingBalance = Math.max(0, Math.round((targetAmount - totalPaid) * 100) / 100);

            const isPendingDeletion = s.deletionRequest?.status === 'PENDING';
            const isRejectedDeletion = s.deletionRequest?.status === 'REJECTED';

            return (
              <Card
                key={s._id}
                className="p-4 sm:p-5 hover:shadow-md transition space-y-3 border-gray-200"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900">{s.customerName}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" /> {s.customerMobile}
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" /> {s.fieldLocation}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge status={s.status} />
                    {s.status === 'PENDING' ? (
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
                      <Badge status={s.paymentStatus} />
                    )}
                  </div>
                </div>

                {/* Deletion Request Notice Banner if requested */}
                {isPendingDeletion && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 flex items-start gap-2">
                    <Clock3 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Deletion Request Pending Admin Review</span>
                      <span className="text-amber-800">Reason: "{s.deletionRequest?.reason}"</span>
                    </div>
                  </div>
                )}

                {isRejectedDeletion && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-xs text-rose-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Deletion Request Rejected by Admin</span>
                      <span className="text-rose-800">Admin Note: "{s.deletionRequest?.rejectionReason}"</span>
                    </div>
                  </div>
                )}

                {/* Customer Payment Summary Strip */}
                <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-100 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Customer Payment Summary
                    </span>
                    <span className="text-[11px] font-semibold text-brand-700">
                      Rate: ₹{s.customerRateSnapshot}/hr
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-200/70">
                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold uppercase">Total Bill</span>
                      <span className="font-black text-gray-900 text-sm">₹{targetAmount}</span>
                      <span className="text-[10px] text-gray-400 block">
                        {s.finalAmount > 0 ? 'Final' : 'Estimate'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold uppercase">Received</span>
                      <span className="font-extrabold text-emerald-700 text-sm">₹{totalPaid}</span>
                      <span className="text-[10px] text-gray-400 block">
                        {s.advanceAmount > 0 ? `(Adv ₹${s.advanceAmount})` : 'All entries'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold uppercase">Remaining Due</span>
                      <span className={`font-black text-sm ${remainingBalance > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                        ₹{remainingBalance}
                      </span>
                      <span className="text-[10px] text-gray-400 block">
                        {remainingBalance <= 0 && targetAmount > 0 ? 'Fully Paid' : 'Outstanding'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timing & Work Meta */}
                <div className="flex flex-wrap items-center justify-between text-xs text-gray-600 pt-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>Duration: <strong className="text-gray-900">{formatRunningDuration(getSessionDuration(s))}</strong></span>
                    {s.startedAt && (
                      <span className="text-gray-500 font-medium ml-1">
                        • Start Time: <strong className="text-gray-800">{formatStartTime(s.startedAt)}</strong>
                      </span>
                    )}
                  </div>
                  {s.fieldAreaKatha > 0 && (
                    <span className="text-gray-500">
                      Land: {s.fieldAreaKatha} Katha ({s.fieldAreaAcre || 0} Acres)
                    </span>
                  )}
                </div>

                {/* Card Action Toolbar */}
                <div className="pt-2.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedSessionId(isExpanded ? null : s._id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700 min-h-[36px]"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" /> Less Info
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" /> Detailed Timestamps
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Add Payment Button - Always available across all stages */}
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setSelectedSessionForPayment(s)}
                      className="font-bold min-h-[40px]"
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1.5" /> + Add Payment
                    </Button>

                    {/* Deletion Actions according to Scenario Rules */}
                    {s.status === 'PENDING' && (s.totalWorkedSeconds || 0) === 0 ? (
                      /* Scenario A: Unstarted / Pending -> Direct soft-delete */
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteUnstarted(s)}
                        className="text-xs font-semibold text-rose-600 hover:bg-rose-50 min-h-[40px]"
                        title="Delete unstarted session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    ) : s.status === 'COMPLETED' ? (
                      /* Scenario C: Completed -> Request deletion workflow */
                      isPendingDeletion ? (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                          Deletion Pending
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedSessionForDeletion(s)}
                          className="text-xs font-semibold text-rose-600 hover:bg-rose-50 min-h-[40px]"
                          title="Request deletion from admin"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Request Delete
                        </Button>
                      )
                    ) : (
                      /* Scenario B: Started / In-Progress / Paused -> Cannot delete */
                      <span className="text-[11px] text-gray-400 italic">Active</span>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-2 bg-gray-50/50 p-3 rounded-xl">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-400 block">Start Time:</span>
                        <span className="font-semibold text-gray-800">
                          {s.startedAt ? new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Not started'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Completion Time:</span>
                        <span className="font-semibold text-gray-800">
                          {s.completedAt ? new Date(s.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'In progress'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Machine:</span>
                        <span className="font-semibold text-gray-800">{s.machineId?.machineName} ({s.machineId?.machineNumber})</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Booking Date:</span>
                        <span className="font-semibold text-gray-800">{new Date(s.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Record Payment Modal */}
      {selectedSessionForPayment && (
        <RecordPaymentModal
          isOpen={!!selectedSessionForPayment}
          session={selectedSessionForPayment}
          onClose={() => setSelectedSessionForPayment(null)}
        />
      )}

      {/* Request Deletion Modal for Completed Works */}
      {selectedSessionForDeletion && (
        <RequestDeletionModal
          isOpen={!!selectedSessionForDeletion}
          session={selectedSessionForDeletion}
          onClose={() => setSelectedSessionForDeletion(null)}
        />
      )}
    </div>
  );
};