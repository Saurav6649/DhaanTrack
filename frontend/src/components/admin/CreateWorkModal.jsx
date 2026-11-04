import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useSWR, { mutate } from 'swr';
import { api } from '../../api/client.js';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { Alert } from '../common/Alert.jsx';

const schema = z.object({
  customerName: z.string().min(2, 'Customer name is required'),
  customerMobile: z.string().regex(/^\d{10}$/, 'Must be a valid 10-digit mobile number'),
  fieldLocation: z.string().min(2, 'Field location is required'),
  machineId: z.string().min(1, 'Please select a machine'),
  customerHourlyRate: z.coerce.number().positive().optional(),
  fieldAreaKatha: z.coerce.number().min(0).optional().default(0),
  fieldAreaAcre: z.coerce.number().min(0).optional().default(0),
  notes: z.string().max(500).optional().default(''),
});

export const CreateWorkModal = ({ isOpen, onClose }) => {
  const { data: machinesData } = useSWR('/api/machines');
  const machines = machinesData?.machines || [];
  const [errorMsg, setErrorMsg] = useState('');

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
      setErrorMsg('');
      await api.post('/api/work-sessions', values);
      await mutate((key) => typeof key === 'string' && key.startsWith('/api/work-sessions'));
      reset();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create work booking.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Work Booking" subtitle="Schedule harvesting for a farmer">
      {errorMsg && <Alert type="error" message={errorMsg} className="mb-4" />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Name *</label>
          <input
            type="text"
            placeholder="Farmer's full name"
            {...register('customerName')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
          {errors.customerName && <p className="text-xs text-red-600 mt-1">{errors.customerName.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Mobile *</label>
            <input
              type="tel"
              maxLength={10}
              placeholder="10-digit number"
              {...register('customerMobile')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            {errors.customerMobile && <p className="text-xs text-red-600 mt-1">{errors.customerMobile.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assign Machine *</label>
            <select
              {...register('machineId')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
            >
              <option value="">Select Machine...</option>
              {machines.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.machineName} ({m.machineNumber}) - ₹{m.customerHourlyRate}/hr
                </option>
              ))}
            </select>
            {errors.machineId && <p className="text-xs text-red-600 mt-1">{errors.machineId.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Field Location *</label>
            <input
              type="text"
              placeholder="Village, Plot or landmark"
              {...register('fieldLocation')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            {errors.fieldLocation && <p className="text-xs text-red-600 mt-1">{errors.fieldLocation.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Rate Per Hour (₹)</label>
            <input
              type="number"
              step="any"
              placeholder="Auto from machine if blank"
              {...register('customerHourlyRate')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Field Area (Katha)</label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 20"
              {...register('fieldAreaKatha')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Field Area (Acre)</label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 1.5"
              {...register('fieldAreaAcre')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Notes / Special Instructions</label>
          <textarea
            rows={2}
            placeholder="Optional instructions..."
            {...register('notes')}
            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto min-h-[44px]">
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full sm:w-auto min-h-[44px]">
            Create Booking
          </Button>
        </div>
      </form>
    </Modal>
  );
};
