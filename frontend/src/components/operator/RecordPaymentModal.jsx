import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { mutate } from 'swr';
import { api } from '../../api/client.js';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { Alert } from '../common/Alert.jsx';
import { Badge } from '../common/Badge.jsx';
import { IndianRupee, CheckCircle2 } from 'lucide-react';

export const RecordPaymentModal = ({ isOpen, onClose, session }) => {
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const targetAmount = session?.finalAmount > 0 ? session.finalAmount : (session?.estimatedAmount || 0);
  const totalPaid = session?.totalPaidAmount || 0;
  const currentBalance = Math.max(0, Math.round((targetAmount - totalPaid) * 100) / 100);
  const isFullyPaid = targetAmount > 0 && currentBalance <= 0;

  const schema = z.object({
    workSessionId: z.string().min(1, 'Session is required'),
    paymentType: z.enum(['ADVANCE', 'PARTIAL', 'FINAL']),
    paymentMode: z.enum(['Cash', 'UPI', 'Bank Transfer', 'Other']),
    amount: z.coerce
      .number()
      .positive('Amount must be greater than zero')
      .refine(
        (val) => targetAmount <= 0 || val <= currentBalance + 0.01,
        { message: `Amount cannot exceed remaining balance of ₹${currentBalance}` }
      ),
    utrNumber: z.string().max(100).optional().default(''),
    paymentDate: z.string().optional(),
    notes: z.string().max(300).optional().default(''),
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      workSessionId: session?._id || '',
      paymentType: session?.status === 'PENDING' ? 'ADVANCE' : (currentBalance > 0 && currentBalance === targetAmount ? 'PARTIAL' : 'FINAL'),
      paymentMode: 'Cash',
      amount: currentBalance > 0 ? currentBalance : '',
      utrNumber: '',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const enteredAmount = watch('amount') || 0;
  const previewRemainingBalance = Math.max(0, Math.round((currentBalance - Number(enteredAmount)) * 100) / 100);

  const onSubmit = async (values) => {
    try {
      setServerError('');
      setSuccessMsg('');
      await api.post('/api/payments', {
        ...values,
        workSessionId: session._id,
      });

      await mutate((k) => typeof k === 'string' && k.startsWith('/api/work-sessions'));
      await mutate((k) => typeof k === 'string' && k.startsWith('/api/payments'));
      setSuccessMsg('Customer payment recorded successfully!');

      setTimeout(() => {
        setSuccessMsg('');
        reset();
        onClose();
      }, 1000);
    } catch (err) {
      setServerError(err.message || 'Failed to record payment.');
    }
  };

  if (!session) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Customer Payment"
      subtitle={`Customer: ${session.customerName} (${session.customerMobile})`}
    >
      {serverError && <Alert type="error" message={serverError} className="mb-4" />}
      {successMsg && <Alert type="success" message={successMsg} className="mb-4" />}

      {/* Customer Payment Summary Strip */}
      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-4 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Payment Summary</span>
          <Badge status={session.paymentStatus} />
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-200">
          <div>
            <span className="text-gray-400 block text-[11px]">Total Customer Bill:</span>
            <span className="font-extrabold text-gray-900 text-sm">₹{targetAmount}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[11px]">Total Received:</span>
            <span className="font-bold text-emerald-700 text-sm">₹{totalPaid}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[11px]">Remaining Balance:</span>
            <span className={`font-black text-sm ${currentBalance > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
              ₹{currentBalance}
            </span>
          </div>
        </div>
      </div>

      {isFullyPaid ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <p className="font-bold text-sm">Session Fully Paid</p>
          <p className="text-xs text-emerald-700">All customer dues (₹{targetAmount}) have been completely cleared.</p>
          <Button variant="secondary" onClick={onClose} className="mt-2 min-h-[44px]">
            Close
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Stage</label>
              <select
                {...register('paymentType')}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white min-h-[44px]"
              >
                <option value="ADVANCE">Advance (Initial)</option>
                <option value="PARTIAL">Partial Payment</option>
                <option value="FINAL">Final Settlement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Mode *</label>
              <select
                {...register('paymentMode')}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white min-h-[44px]"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700">Payment Amount (₹) *</label>
              {currentBalance > 0 && (
                <button
                  type="button"
                  onClick={() => reset({ ...watch(), amount: currentBalance })}
                  className="text-[11px] font-bold text-brand-700 hover:text-brand-800 focus:outline-none"
                >
                  Pay Full Balance (₹{currentBalance})
                </button>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                {...register('amount')}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-base font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[44px]"
              />
            </div>
            {errors.amount && <p className="text-xs text-red-600 mt-1">{errors.amount.message}</p>}
          </div>

          {/* Live Balance Remaining Preview */}
          <div className="p-3 bg-brand-50/70 rounded-xl border border-brand-100 flex items-center justify-between text-xs">
            <span className="text-brand-900 font-semibold">Remaining Balance After Payment:</span>
            <span className="text-sm font-black text-brand-700">₹{previewRemainingBalance}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">UTR / Transaction ID (Optional)</label>
              <input
                type="text"
                placeholder="e.g. UPI Ref / Cheque No"
                {...register('utrNumber')}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Date</label>
              <input
                type="date"
                {...register('paymentDate')}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Note (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Paid in cash at field"
              {...register('notes')}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[44px]"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3 border-t border-gray-100">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto min-h-[44px]">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full sm:w-auto font-bold min-h-[44px]"
            >
              Record Payment
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};