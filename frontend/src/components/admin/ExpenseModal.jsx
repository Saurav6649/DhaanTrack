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
  machineId: z.string().min(1, 'Machine is required'),
  category: z.string().min(1, 'Expense category is required'),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  note: z.string().max(300).optional().default(''),
  expenseDate: z.string().optional(),
});

export const ExpenseModal = ({ isOpen, onClose, expense = null }) => {
  const isEditing = !!expense;
  const { data: machinesData } = useSWR('/api/machines');
  const machines = machinesData?.machines || [];
  const { data: masterData } = useSWR('/api/master-data');
  const categories = masterData?.expenseCategories || [
    'Diesel / Fuel',
    'Repair / Maintenance',
    'Driver / Operator Food',
    'Worker Expense',
    'Transportation',
    'Other',
  ];

  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: expense
      ? {
          machineId: expense.machineId?._id || expense.machineId || '',
          category: expense.category,
          amount: expense.amount,
          note: expense.note || '',
          expenseDate: expense.expenseDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        }
      : {
          machineId: '',
          category: 'Diesel / Fuel',
          amount: '',
          note: '',
          expenseDate: new Date().toISOString().split('T')[0],
        },
  });

  useEffect(() => {
    if (expense) {
      reset({
        machineId: expense.machineId?._id || expense.machineId || '',
        category: expense.category,
        amount: expense.amount,
        note: expense.note || '',
        expenseDate: expense.expenseDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      });
    } else {
      reset({
        machineId: '',
        category: 'Diesel / Fuel',
        amount: '',
        note: '',
        expenseDate: new Date().toISOString().split('T')[0],
      });
    }
    setServerError('');
  }, [expense, reset, isOpen]);

  const onSubmit = async (values) => {
    try {
      setServerError('');
      if (isEditing) {
        await api.patch(`/api/expenses/${expense._id}`, values);
      } else {
        await api.post('/api/expenses', values);
      }

      await mutate((key) => typeof key === 'string' && key.startsWith('/api/expenses'));
      await mutate((key) => typeof key === 'string' && key.startsWith('/api/reports/dashboard'));
      onClose();
    } catch (err) {
      setServerError(err.message || 'Expense operation failed.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Expense Record' : 'Record Operating Expense'}
      subtitle="Track fuel, repairs, driver food, and machine operational costs"
    >
      {serverError && <Alert type="error" message={serverError} className="mb-4" />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Target Machine *</label>
          <select
            {...register('machineId')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
          >
            <option value="">Select Machine...</option>
            {machines.map((m) => (
              <option key={m._id} value={m._id}>
                {m.machineName} ({m.machineNumber})
              </option>
            ))}
          </select>
          {errors.machineId && <p className="text-xs text-red-600 mt-1">{errors.machineId.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Expense Category *</label>
            <select
              {...register('category')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Amount (₹) *</label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 1500"
              {...register('amount')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            {errors.amount && <p className="text-xs text-red-600 mt-1">{errors.amount.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Expense Date</label>
          <input
            type="date"
            {...register('expenseDate')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Description / Note</label>
          <input
            type="text"
            placeholder="e.g. 25 Litres Diesel, grease, etc."
            {...register('note')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto min-h-[44px]">
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full sm:w-auto min-h-[44px]">
            {isEditing ? 'Save Changes' : 'Record Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
