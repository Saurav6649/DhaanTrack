import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { api } from '../../api/client.js';
import { Modal } from '../common/Modal.jsx';
import { Badge } from '../common/Badge.jsx';
import { Button } from '../common/Button.jsx';
import { LoadingSpinner } from '../common/LoadingSpinner.jsx';
import { Clock, Tractor, User, MapPin, Phone, IndianRupee, CreditCard, AlertTriangle } from 'lucide-react';

export const WorkDetailModal = ({ isOpen, onClose, sessionId }) => {
  const [reviewLoading, setReviewLoading] = useState(false);
  const { data, isLoading } = useSWR(
    sessionId ? `/api/work-sessions/${sessionId}` : null
  );
  const session = data?.workSession;

  const { data: paymentsData } = useSWR(
    sessionId ? `/api/payments/session/${sessionId}` : null
  );
  const payments = paymentsData?.payments || [];

  if (!isOpen) return null;

  const formatHours = (seconds = 0) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const targetAmount = session?.finalAmount > 0 ? session.finalAmount : (session?.estimatedAmount || 0);
  const remainingBalance = Math.max(0, targetAmount - (session?.totalPaidAmount || 0));

  const handleReviewDeletion = async (action) => {
    let rejectionReason = '';
    if (action === 'REJECT') {
      const reason = window.prompt('Enter rejection note for operator (optional):', 'Deletion request rejected.');
      if (reason === null) return;
      rejectionReason = reason;
    } else {
      const confirm = window.confirm(
        `Approve deletion for "${session.customerName}"? This session will be moved to the Recycle Bin.`
      );
      if (!confirm) return;
    }

    try {
      setReviewLoading(true);
      await api.post(`/api/work-sessions/${session._id}/review-deletion`, {
        action,
        rejectionReason,
      });

      await mutate((k) => typeof k === 'string' && k.startsWith('/api/work-sessions'));
      await mutate('/api/recycle-bin');
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to review deletion request.');
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Work Booking Details" maxWidth="max-w-2xl">
      {isLoading || !session ? (
        <LoadingSpinner label="Loading session details..." />
      ) : (
        <div className="space-y-5 text-sm">
          {/* Header Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
            <div>
              <span className="text-xs text-gray-400 block font-semibold uppercase">Booking ID</span>
              <span className="font-mono text-xs text-gray-700">{session._id}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge status={session.status} />
              <Badge status={session.paymentStatus} />
            </div>
          </div>

          {/* Deletion Request Review Banner */}
          {session.deletionRequest?.status === 'PENDING' && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-xs text-amber-950 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-extrabold text-sm text-amber-950">Operator Deletion Request Pending Review</h4>
                  <p className="text-amber-800 mt-0.5">
                    Requested by: <strong>{session.deletionRequest.requestedByName || session.userId?.name}</strong> on {session.deletionRequest.requestedAt ? new Date(session.deletionRequest.requestedAt).toLocaleString() : ''}
                  </p>
                  <p className="mt-1.5 p-2 bg-white/90 rounded-xl border border-amber-200 text-amber-900 font-medium">
                    Reason: "{session.deletionRequest.reason}"
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={reviewLoading}
                  onClick={() => handleReviewDeletion('REJECT')}
                  className="bg-white text-rose-700 hover:bg-rose-50 border-rose-200 font-semibold min-h-[36px]"
                >
                  Reject Request
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  isLoading={reviewLoading}
                  onClick={() => handleReviewDeletion('APPROVE')}
                  className="font-bold min-h-[36px]"
                >
                  Approve & Move to Recycle Bin
                </Button>
              </div>
            </div>
          )}

          {/* Grid Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Information */}
            <div className="p-4 rounded-xl border border-gray-100 bg-white space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-500" /> Customer Information
              </h4>
              <p className="text-base font-bold text-gray-900">{session.customerName}</p>
              <p className="text-gray-600 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" /> {session.customerMobile}
              </p>
              <p className="text-gray-600 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" /> {session.fieldLocation}
              </p>
              {(session.fieldAreaKatha > 0 || session.fieldAreaAcre > 0) && (
                <p className="text-xs text-gray-500 pt-1 border-t border-gray-50">
                  Land Area: {session.fieldAreaKatha || 0} Katha / {session.fieldAreaAcre || 0} Acre
                </p>
              )}
            </div>

            {/* Machine & Operator Details */}
            <div className="p-4 rounded-xl border border-gray-100 bg-white space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Tractor className="w-3.5 h-3.5 text-gray-500" /> Machine & Operator
              </h4>
              <p className="text-base font-bold text-gray-900">
                {session.machineId?.machineName} ({session.machineId?.machineNumber})
              </p>
              <p className="text-gray-600">Operator: {session.userId?.name || 'Unassigned'}</p>
              <p className="text-xs text-gray-500">
                Created By: {session.createdBy?.name} ({session.createdByRole})
              </p>
              <p className="text-xs text-gray-400">
                Created At: {new Date(session.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Time & Duration Details */}
          <div className="p-4 rounded-xl border border-gray-100 bg-white">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-2">
              <Clock className="w-3.5 h-3.5 text-gray-500" /> Timing & Working Duration
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-gray-50 p-2.5 rounded-lg">
                <span className="text-[11px] text-gray-400 block">Start Time</span>
                <span className="font-semibold text-gray-800 text-xs">
                  {session.startedAt ? new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                </span>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-lg">
                <span className="text-[11px] text-gray-400 block">End Time</span>
                <span className="font-semibold text-gray-800 text-xs">
                  {session.completedAt ? new Date(session.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                </span>
              </div>
              <div className="bg-brand-50 p-2.5 rounded-lg col-span-2">
                <span className="text-[11px] text-brand-700 block font-semibold">Total Duration</span>
                <span className="font-bold text-brand-900 text-sm">
                  {formatHours(session.totalWorkedSeconds)} ({(session.totalWorkedSeconds / 3600).toFixed(2)} hrs)
                </span>
              </div>
            </div>
          </div>

          {/* Financial Breakdown (Admin Visible) */}
          <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> Financial Settlement
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-xs text-gray-500 block">Customer Rate</span>
                <span className="font-bold text-gray-900">₹{session.customerRateSnapshot}/hr</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Final Billing</span>
                <span className="font-bold text-brand-700 text-base">₹{session.finalAmount || session.estimatedAmount}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Contractor Rate</span>
                <span className="font-bold text-amber-700">₹{session.contractorRateSnapshot || 0}/hr</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Contractor Cost</span>
                <span className="font-bold text-amber-800 text-base">₹{session.contractorAmount || 0}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-100/80 flex flex-wrap items-center justify-between text-xs">
              <div>
                <span className="text-gray-500">Advance Received: </span>
                <span className="font-bold text-gray-800">₹{session.advanceAmount || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">Total Paid: </span>
                <span className="font-bold text-emerald-700">₹{session.totalPaidAmount || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">Remaining Balance: </span>
                <span className={`font-bold ${remainingBalance > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  ₹{remainingBalance}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Receipts List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-2">
              <CreditCard className="w-3.5 h-3.5 text-gray-500" /> Payment History ({payments.length})
            </h4>
            {payments.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No customer payments recorded for this session yet.</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p._id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 text-xs">
                    <div>
                      <span className="font-bold text-gray-800">{p.paymentType} Payment: ₹{p.amount}</span>
                      <span className="text-gray-400 ml-2">via {p.paymentMode} {p.utrNumber ? `(UTR: ${p.utrNumber})` : ''}</span>
                    </div>
                    <span className="text-gray-400">{new Date(p.paymentDate).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
