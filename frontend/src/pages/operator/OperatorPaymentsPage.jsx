import React, { useState } from 'react';
import useSWR from 'swr';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { RecordPaymentModal } from '../../components/operator/RecordPaymentModal.jsx';
import { BackButton } from '../../components/common/BackButton.jsx';
import { CreditCard, IndianRupee, CheckCircle, Phone, MapPin, ChevronRight, AlertCircle } from 'lucide-react';

export const OperatorPaymentsPage = () => {
  // Customer Payment Receipts must display ONLY work records whose actual work status is COMPLETED
  const { data, isLoading } = useSWR('/api/work-sessions?status=COMPLETED');
  const rawSessions = data?.workSessions || [];
  const sessions = rawSessions.filter((s) => s.status === 'COMPLETED');

  const [selectedSession, setSelectedSession] = useState(null);

  return (
    <div className="space-y-5 pb-8">
      {/* Top Header with BackButton */}
      <div className="space-y-2">
        <BackButton to="/app/dashboard" />
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Customer Payment Receipts</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Record cash, UPI, or advance payments and track customer balance dues
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner label="Loading customer payment records..." />
      ) : sessions.length === 0 ? (
        <Card className="text-center py-12">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-gray-800">No Completed Work Sessions Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            Customer Payment Receipts only displays completed work records. When a field harvesting session is finished, it will appear here for receipt generation and balance settlement.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const targetAmount = s.finalAmount > 0 ? s.finalAmount : (s.estimatedAmount || 0);
            const totalPaid = s.totalPaidAmount || 0;
            const remaining = Math.max(0, targetAmount - totalPaid);

            return (
              <Card key={s._id} className="p-4 sm:p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900">{s.customerName}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" /> {s.customerMobile}
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" /> {s.fieldLocation}
                    </p>
                  </div>
                  <Badge status={s.paymentStatus} />
                </div>

                <div className="mt-3.5 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-gray-50 p-2.5 rounded-xl">
                    <span className="text-[10px] text-gray-400 block font-semibold uppercase">Total Bill</span>
                    <span className="font-black text-gray-900 text-sm">₹{targetAmount}</span>
                  </div>

                  <div className="bg-emerald-50 p-2.5 rounded-xl">
                    <span className="text-[10px] text-emerald-700 block font-semibold uppercase">Paid So Far</span>
                    <span className="font-black text-emerald-800 text-sm">₹{totalPaid}</span>
                  </div>

                  <div className={`p-2.5 rounded-xl ${remaining > 0 ? 'bg-rose-50 text-rose-800' : 'bg-gray-50 text-gray-600'}`}>
                    <span className="text-[10px] block font-semibold uppercase opacity-70">Remaining Due</span>
                    <span className={`font-black text-sm ${remaining > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                      ₹{remaining}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setSelectedSession(s)}
                    className="font-bold"
                  >
                    <CreditCard className="w-4 h-4 mr-1.5" /> Record Payment
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {selectedSession && (
        <RecordPaymentModal
          isOpen={!!selectedSession}
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
};
