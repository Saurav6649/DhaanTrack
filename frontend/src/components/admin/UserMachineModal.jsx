import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useSWR, { mutate } from 'swr';
import { api } from '../../api/client.js';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { Alert } from '../common/Alert.jsx';

const createSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  userId: z.string().min(3, 'User ID must be at least 3 characters').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  mobile: z.string().regex(/^\d{10}$/, 'Must be a 10-digit mobile number'),
  assignedMachine: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE'),
});

const editSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  mobile: z.string().regex(/^\d{10}$/, 'Must be a 10-digit mobile number'),
  assignedMachine: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'DISABLED']),
});

export const UserMachineModal = ({ isOpen, onClose, user = null }) => {
  const isEditing = !!user;
  const { data: machinesData } = useSWR('/api/machines');
  const machines = machinesData?.machines || [];
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(isEditing ? editSchema : createSchema),
    defaultValues: user
      ? {
          name: user.name,
          mobile: user.mobile,
          assignedMachine: user.assignedMachine?._id || '',
          status: user.status || 'ACTIVE',
        }
      : {
          name: '',
          userId: '',
          password: '',
          mobile: '',
          assignedMachine: '',
          status: 'ACTIVE',
        },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        mobile: user.mobile,
        assignedMachine: user.assignedMachine?._id || '',
        status: user.status || 'ACTIVE',
      });
    } else {
      reset({
        name: '',
        userId: '',
        password: '',
        mobile: '',
        assignedMachine: '',
        status: 'ACTIVE',
      });
    }
    setServerError('');
  }, [user, reset, isOpen]);

  const onSubmit = async (values) => {
    try {
      setServerError('');
      const payload = {
        ...values,
        assignedMachine: values.assignedMachine || null,
      };

      if (isEditing) {
        await api.patch(`/api/users/${user._id}`, payload);
      } else {
        await api.post('/api/users', payload);
      }

      await mutate('/api/users/combined');
      await mutate('/api/machines');
      await mutate('/api/customers/shareable-users');
      onClose();
    } catch (err) {
      setServerError(err.message || 'Operation failed.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit User: ${user?.name}` : 'Add New Operator / User'}
      subtitle="Operators can be assigned to manage a specific harvester"
    >
      {serverError && <Alert type="error" message={serverError} className="mb-4" />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
          <input
            type="text"
            placeholder="Operator's full name"
            {...register('name')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
        </div>

        {!isEditing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">User ID *</label>
              <input
                type="text"
                placeholder="Unique login ID"
                {...register('userId')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none lowercase"
              />
              {errors.userId && <p className="text-xs text-red-600 mt-1">{errors.userId.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Password *</label>
              <input
                type="password"
                placeholder="Min 8 characters"
                {...register('password')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
            </div>
          </div>
        )}

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
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Machine</label>
            <select
              {...register('assignedMachine')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
            >
              <option value="">No Machine Assigned</option>
              {machines.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.machineName} ({m.machineNumber})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Account Status</label>
          <select
            {...register('status')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
          >
            <option value="ACTIVE">ACTIVE (Can log in)</option>
            <option value="DISABLED">DISABLED (Login blocked)</option>
          </select>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto min-h-[44px]">
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full sm:w-auto min-h-[44px]">
            {isEditing ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
