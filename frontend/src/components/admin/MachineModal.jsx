import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useSWR, { mutate } from 'swr';
import { api } from '../../api/client.js';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { Alert } from '../common/Alert.jsx';

const schema = z.object({
  machineName: z.string().min(1, 'Machine name is required'),
  machineNumber: z.string().min(1, 'Machine number / plate is required').toUpperCase(),
  capacityPerHour: z.coerce.number().positive('Capacity must be greater than zero').default(1.0),
  customerHourlyRate: z.coerce.number().min(0, 'Customer rate cannot be negative'),
  contractorHourlyRate: z.coerce.number().min(0, 'Contractor rate cannot be negative'),
  contractorId: z.string().optional().nullable(),
  assignedUser: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE']).default('ACTIVE'),
});

export const MachineModal = ({ isOpen, onClose, machine = null }) => {
  const isEditing = !!machine;
  const { data: contractorsData } = useSWR('/api/contractors');
  const contractors = contractorsData?.contractors || [];
  const { data: usersData } = useSWR('/api/users/combined');
  const operators = (usersData?.users || []).filter((u) => u.role === 'USER');
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: machine || {
      machineName: '',
      machineNumber: '',
      capacityPerHour: 1.0,
      customerHourlyRate: 2500,
      contractorHourlyRate: 1500,
      contractorId: '',
      assignedUser: '',
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (machine) {
      reset({
        machineName: machine.machineName,
        machineNumber: machine.machineNumber,
        capacityPerHour: machine.capacityPerHour,
        customerHourlyRate: machine.customerHourlyRate,
        contractorHourlyRate: machine.contractorHourlyRate,
        contractorId: machine.contractorId?._id || machine.contractorId || '',
        assignedUser: machine.assignedUser?._id || machine.assignedUser || '',
        status: machine.status || 'ACTIVE',
      });
    } else {
      reset({
        machineName: '',
        machineNumber: '',
        capacityPerHour: 1.0,
        customerHourlyRate: 2500,
        contractorHourlyRate: 1500,
        contractorId: '',
        assignedUser: '',
        status: 'ACTIVE',
      });
    }
    setServerError('');
  }, [machine, reset, isOpen]);

  const onSubmit = async (values) => {
    try {
      setServerError('');
      const payload = {
        ...values,
        contractorId: values.contractorId || null,
      };

      if (isEditing) {
        await api.patch(`/api/machines/${machine._id}`, payload);
      } else {
        await api.post('/api/machines', payload);
      }

      await mutate('/api/machines');
      await mutate('/api/users/combined');
      onClose();
    } catch (err) {
      setServerError(err.message || 'Machine operation failed.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Machine: ${machine?.machineName}` : 'Add New Harvester Machine'}
      subtitle="Configure harvester capacity, rates, and contractor link"
    >
      {serverError && <Alert type="error" message={serverError} className="mb-4" />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Machine Name *</label>
            <input
              type="text"
              placeholder="e.g. Kubota DC-68G"
              {...register('machineName')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            {errors.machineName && <p className="text-xs text-red-600 mt-1">{errors.machineName.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Machine Number / Plate *</label>
            <input
              type="text"
              placeholder="e.g. HARV-01"
              {...register('machineNumber')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none uppercase"
            />
            {errors.machineNumber && <p className="text-xs text-red-600 mt-1">{errors.machineNumber.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Capacity (Acre/Hr) *</label>
            <input
              type="number"
              step="0.1"
              placeholder="1.0"
              {...register('capacityPerHour')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            {errors.capacityPerHour && <p className="text-xs text-red-600 mt-1">{errors.capacityPerHour.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Rate (₹/Hr) *</label>
            <input
              type="number"
              step="any"
              placeholder="2500"
              {...register('customerHourlyRate')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            {errors.customerHourlyRate && <p className="text-xs text-red-600 mt-1">{errors.customerHourlyRate.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Contractor Rate (₹/Hr) *</label>
            <input
              type="number"
              step="any"
              placeholder="1500"
              {...register('contractorHourlyRate')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            {errors.contractorHourlyRate && <p className="text-xs text-red-600 mt-1">{errors.contractorHourlyRate.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Contractor</label>
            <select
              {...register('contractorId')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
            >
              <option value="">No Contractor Linked</option>
              {contractors.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.mobile}) - ₹{c.paymentRate}/hr
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Operator</label>
            <select
              {...register('assignedUser')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
            >
              <option value="">No Operator Assigned</option>
              {operators.map((op) => (
                <option key={op._id} value={op._id}>
                  {op.name} (@{op.userId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
            <select
              {...register('status')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto min-h-[44px]">
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full sm:w-auto min-h-[44px]">
            {isEditing ? 'Save Changes' : 'Create Machine'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
