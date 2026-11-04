import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../api/client.js';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { Alert } from '../common/Alert.jsx';

const schema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const ResetPasswordModal = ({ isOpen, onClose, user = null }) => {
  const [serverMsg, setServerMsg] = useState('');
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values) => {
    try {
      setServerError('');
      setServerMsg('');
      const res = await api.post(`/api/users/${user._id}/reset-password`, values);
      setServerMsg(res.data?.message || 'Password reset successfully.');
      reset();
      setTimeout(() => {
        setServerMsg('');
        onClose();
      }, 1500);
    } catch (err) {
      setServerError(err.message || 'Failed to reset password.');
    }
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reset Password for ${user.name}`}
      subtitle={`User ID: @${user.userId}`}
    >
      {serverError && <Alert type="error" message={serverError} className="mb-4" />}
      {serverMsg && <Alert type="success" message={serverMsg} className="mb-4" />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">New Password *</label>
          <input
            type="password"
            placeholder="Minimum 8 characters"
            {...register('newPassword')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
          {errors.newPassword && <p className="text-xs text-red-600 mt-1">{errors.newPassword.message}</p>}
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto min-h-[44px]">
            Cancel
          </Button>
          <Button type="submit" variant="danger" isLoading={isSubmitting} className="w-full sm:w-auto min-h-[44px]">
            Confirm Reset
          </Button>
        </div>
      </form>
    </Modal>
  );
};
