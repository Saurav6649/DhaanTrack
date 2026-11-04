import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { mutate } from 'swr';
import { api } from '../../api/client.js';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { Alert } from '../common/Alert.jsx';

const schema = z.object({
  name: z.string().min(2, 'Contractor name is required'),
  mobile: z.string().regex(/^\d{10}$/, 'Must be a 10-digit mobile number'),
  paymentRate: z.coerce.number().min(0, 'Payment rate cannot be negative').default(0),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const ContractorModal = ({ isOpen, onClose, contractor = null }) => {
  const isEditing = !!contractor;
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: contractor || {
      name: '',
      mobile: '',
      paymentRate: 0,
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (contractor) {
      reset(contractor);
    } else {
      reset({ name: '', mobile: '', paymentRate: 0, status: 'ACTIVE' });
    }
    setServerError('');
  }, [contractor, reset, isOpen]);

  const onSubmit = async (values) => {
    try {
      setServerError('');
      if (isEditing) {
        await api.patch(`/api/contractors/${contractor._id}`, values);
      } else {
        await api.post('/api/contractors', values);
      }

      await mutate('/api/contractors');
      onClose();
    } catch (err) {
      setServerError(err.message || 'Contractor operation failed.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Contractor: ${contractor?.name}` : 'Add New Contractor'}
      subtitle="Manage external machine contractor profiles and agreed hourly rates"
    >
      {serverError && <Alert type="error" message={serverError} className="mb-4" />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Contractor Name *</label>
          <input
            type="text"
            placeholder="Contractor full name"
            {...register('name')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number *</label>
            <input
              type="tel"
              maxLength={10}
              placeholder="10-digit number"
              {...register('mobile')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            {errors.mobile && <p className="text-xs text-red-600 mt-1">{errors.mobile.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Default Rate (₹/Hr)</label>
            <input
              type="number"
              step="any"
              placeholder="1500"
              {...register('paymentRate')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            {errors.paymentRate && <p className="text-xs text-red-600 mt-1">{errors.paymentRate.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
          <select
            {...register('status')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto min-h-[44px]">
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full sm:w-auto min-h-[44px]">
            {isEditing ? 'Save Changes' : 'Create Contractor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
