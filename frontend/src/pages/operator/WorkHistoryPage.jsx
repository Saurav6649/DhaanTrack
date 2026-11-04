import React, { useState } from 'react';
import useSWR from 'swr';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { BackButton } from '../../components/common/BackButton.jsx';
import { RecordPaymentModal } from '../../components/operator/RecordPaymentModal.jsx';
import { RequestDeletionModal } from '../../components/operator/RequestDeletionModal.jsx';
import {
  History,
  Calendar,
  Phone,
  MapPin,
  Clock,
  IndianRupee,
  CreditCard,
  Trash2,
  AlertCircle,
  Clock3,
} from 'lucide-react';

export const WorkHistoryPage = () => {
  // Current month default: YYYY-MM
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  const startOfMonth = `${selectedMonth}-01`;
  const endOfMonth = `${selectedMonth}-31`;

  const { data, isLoading } = useSWR(
    `/api/work-sessions?startDate=${startOfMonth}&endDate=${endOfMonth}`
  );
  const sessions = data?.workSessions || [];

  const [selectedSessionForPayment, setSelectedSessionForPayment] = useState(null);
  const [selectedSessionForDeletion, setSelectedSessionForDeletion] = useState(null);

  const completedProjects = sessions.filter((s) => s.status === 'COMPLETED').length;
  const totalWorkedSeconds = sessions.reduce((acc, s) => acc + (s.totalWorkedSeconds || 0), 0);
  const totalHours = Number((totalWorkedSeconds / 3600).toFixed(2));
  const totalCustomerAmount = sessions.reduce((acc, s) => acc + (s.finalAmount || s.estimatedAmount || 0), 0);
  const totalReceived = sessions.reduce((acc, s) => acc + (s.totalPaidAmount || 0), 0);
  const remainingBalance = Math.max(0, Math.round((totalCustomerAmount - totalReceived) * 100) / 100);

  const formatHours = (seconds = 0) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Top Header with BackButton */}
      <div className="space-y-2">
        <BackButton to="/app/dashboard" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Operator Work History</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Review your harvesting hours, completed fields, and billing receipts
            </p>
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-gray-200 shadow-xs self-start">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs sm:text-sm font-bold text-gray-800 bg-transparent focus:outline-none min-h-[36px]"
            />
          </div>
        </div>
      </div>

      {/* Aggregate Performance Cards (Strictly No Contractor Split or Admin Profit) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
            Completed Fields
          </span>
          <span className="text-2xl font-black text-gray-900 mt-1 block">{completedProjects}</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
            Total Working Hours
          </span>
          <span className="text-2xl font-black text-gray-900 mt-1 block">{totalHours} hrs</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
            Total Customer Bill
          </span>
          <span className="text-2xl font-black text-brand-700 mt-1 block">₹{totalCustomerAmount}</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
            Balance Due
          </span>
          <span className={`text-2xl font-black mt-1 block ${remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
            ₹{remainingBalance}
          </span>
        </div>
      </div>

      {/* Work Sessions List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Individual Work Records ({sessions.length})
        </h3>

        {isLoading ? (
          <LoadingSpinner label="Loading monthly work sessions..." />
        ) : sessions.length === 0 ? (
          <Card className="text-center py-10">
            <History className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-800">No Works Found for {selectedMonth}</p>
            <p className="text-xs text-gray-500 mt-0.5">Select another month or record new work sessions.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => {
              const target = s.finalAmount > 0 ? s.finalAmount : (s.estimatedAmount || 0);
              const paid = s.totalPaidAmount || 0;
              const bal = Math.max(0, Math.round((target - paid) * 100) / 100);
              const isPendingDeletion = s.deletionRequest?.status === 'PENDING';
              const isRejectedDeletion = s.deletionRequest?.status === 'REJECTED';

              return (
                <Card key={s._id} className="p-4 hover:shadow-md transition space-y-3 border-gray-200">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-extrabold text-base text-gray-900">{s.customerName}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" /> {s.customerMobile}
                      </p>
                      <p className="text-xs text-gray-600 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" /> {s.fieldLocation}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge status={s.status} />
                      <Badge status={s.paymentStatus} />
                    </div>
                  </div>

                  {/* Deletion Request Notice Banner */}
                  {isPendingDeletion && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 flex items-start gap-2">
                      <Clock3 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Deletion Request Under Review</span>
                        <span className="text-amber-800">Reason: "{s.deletionRequest?.reason}"</span>
                      </div>
                    </div>
                  )}

                  {isRejectedDeletion && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-xs text-rose-900 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Deletion Request Rejected</span>
                        <span className="text-rose-800">Admin Reason: "{s.deletionRequest?.rejectionReason}"</span>
                      </div>
                    </div>
                  )}

                  {/* Payment & Duration Strip */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block font-semibold">Duration</span>
                      <span className="font-mono font-bold text-gray-900 block">
                        {formatHours(s.totalWorkedSeconds)}
                      </span>
                      <span className="text-[10px] text-gray-400 block">
                        {(s.totalWorkedSeconds / 3600).toFixed(2)} hrs
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block font-semibold">Total Bill</span>
                      <span className="font-bold text-brand-700 block text-sm">₹{target}</span>
                      <span className="text-[10px] text-gray-400 block">
                        Paid: ₹{paid}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block font-semibold">Due Balance</span>
                      <span className={`font-black block text-sm ${bal > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                        ₹{bal}
                      </span>
                      <span className="text-[10px] text-gray-400 block">
                        {bal <= 0 ? 'Clear' : 'Remaining'}
                      </span>
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className="pt-2 border-t border-gray-50 text-[11px] text-gray-400 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span>Date: {new Date(s.createdAt).toLocaleDateString()}</span>
                      <span className="mx-1.5">·</span>
                      <span>Rate: ₹{s.customerRateSnapshot}/hr</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setSelectedSessionForPayment(s)}
                        className="font-bold min-h-[38px]"
                      >
                        <CreditCard className="w-3.5 h-3.5 mr-1" /> + Add Payment
                      </Button>

                      {s.status === 'COMPLETED' && !isPendingDeletion && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedSessionForDeletion(s)}
                          className="text-xs font-semibold text-rose-600 hover:bg-rose-50 min-h-[38px]"
                          title="Request work deletion"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Request Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {selectedSessionForPayment && (
        <RecordPaymentModal
          isOpen={!!selectedSessionForPayment}
          session={selectedSessionForPayment}
          onClose={() => setSelectedSessionForPayment(null)}
        />
      )}

      {/* Request Deletion Modal */}
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