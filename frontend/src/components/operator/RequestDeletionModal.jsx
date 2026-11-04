import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { mutate } from 'swr';
import { api } from '../../api/client.js';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { Alert } from '../common/Alert.jsx';
import { Trash2, AlertTriangle } from 'lucide-react';

const schema = z.object({
  reason: z.string().trim().min(3, 'Reason must be at least 3 characters long').max(500, 'Reason cannot exceed 500 characters'),
});

export const RequestDeletionModal = ({ isOpen, onClose, session }) => {
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { reason: '' },
  });

  const onSubmit = async (values) => {
    try {
      setServerError('');
      setSuccessMsg('');
      await api.post(`/api/work-sessions/${session._id}/request-deletion`, {
        reason: values.reason,
      });

      await mutate((k) => typeof k === 'string' && k.startsWith('/api/work-sessions'));
      setSuccessMsg('Deletion request submitted to Administrator for review.');

      setTimeout(() => {
        setSuccessMsg('');
        reset();
        onClose();
      }, 1200);
    } catch (err) {
      setServerError(err.message || 'Failed to submit deletion request.');
    }
  };

  if (!session) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Work Session Deletion"
      subtitle={`Customer: ${session.customerName} (${session.fieldLocation})`}
    >
      {serverError && <Alert type="error" message={serverError} className="mb-4" />}
      {successMsg && <Alert type="success" message={successMsg} className="mb-4" />}

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 mb-4 space-y-1">
        <div className="flex items-center gap-2 font-bold text-amber-950">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Admin Approval Required</span>
        </div>
        <p className="text-amber-800 leading-relaxed">
          This work session is marked as completed and affects billing records. Operators cannot directly delete completed sessions. Submitting this request notifies the Administrator, who will review and approve or reject the deletion.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Reason for Deletion Request *
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Work entry was duplicated by mistake or customer canceled before field work started"
            {...register('reason')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
          {errors.reason && <p className="text-xs text-red-600 mt-1">{errors.reason.message}</p>}
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto min-h-[44px]">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            isLoading={isSubmitting}
            className="w-full sm:w-auto font-bold min-h-[44px]"
          >
            <Trash2 className="w-4 h-4 mr-1.5" /> Submit Deletion Request
          </Button>
        </div>
      </form>
    </Modal>
  );
};