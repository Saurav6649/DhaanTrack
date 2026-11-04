import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client.js';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { Alert } from '../../components/common/Alert.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { BackButton } from '../../components/common/BackButton.jsx';
import { Receipt, Plus, Edit2, Calendar, IndianRupee, Fuel, Wrench, Utensils, Users, Truck, Trash2 } from 'lucide-react';

const expenseSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  note: z.string().max(300).optional().default(''),
  expenseDate: z.string().optional(),
});

export const OperatorExpensesPage = () => {
  const { user } = useAuth();
  const machine = user?.assignedMachine;

  // Expenses for this operator
  const { data: expensesData, isLoading } = useSWR('/api/expenses');
  const expenses = expensesData?.expenses || [];

  // Daily & Monthly Totals for this operator
  const { data: totalsData } = useSWR('/api/expenses/totals');
  const dailyTotal = totalsData?.dailyTotal || 0;
  const monthlyTotal = totalsData?.monthlyTotal || 0;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: 'Diesel / Fuel',
      amount: '',
      note: '',
      expenseDate: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (values) => {
    try {
      setServerError('');
      if (editingExpense) {
        await api.patch(`/api/expenses/${editingExpense._id}`, values);
      } else {
        await api.post('/api/expenses', values);
      }

      await mutate('/api/expenses');
      await mutate('/api/expenses/totals');
      setModalOpen(false);
      setEditingExpense(null);
      reset();
    } catch (err) {
      setServerError(err.message || 'Failed to save expense.');
    }
  };

  const handleEdit = (exp) => {
    setEditingExpense(exp);
    reset({
      category: exp.category,
      amount: exp.amount,
      note: exp.note || '',
      expenseDate: exp.expenseDate ? exp.expenseDate.split('T')[0] : '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (e) => {
    const confirm = window.confirm(
      `Move expense of ₹${e.amount} (${e.category}) to Recycle Bin?`
    );
    if (!confirm) return;

    try {
      await api.delete(`/api/expenses/${e._id}`);
      await mutate('/api/expenses');
      await mutate('/api/expenses/totals');
      await mutate('/api/recycle-bin');
    } catch (err) {
      alert(err.message || 'Failed to delete expense.');
    }
  };

  const categories = [
    'Diesel / Fuel',
    'Repair / Maintenance',
    'Driver / Operator Food',
    'Worker Expense',
    'Transportation',
    'Other',
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Top Header with BackButton */}
      <div className="space-y-2">
        <BackButton to="/app/dashboard" />
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Operator Expenses</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Log fuel, repairs, and daily food expenses for machine {machine?.machineNumber}
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => {
              setEditingExpense(null);
              reset({
                category: 'Diesel / Fuel',
                amount: '',
                note: '',
                expenseDate: new Date().toISOString().split('T')[0],
              });
              setModalOpen(true);
            }}
            className="font-bold shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Expense
          </Button>
        </div>
      </div>

      {/* Daily & Monthly Total Cards */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
            Today's Expenses
          </span>
          <span className="text-2xl sm:text-3xl font-black text-rose-700 mt-1 block">
            ₹{dailyTotal}
          </span>
          <span className="text-[11px] text-gray-500 mt-0.5 block">Logged today</span>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
            This Month's Total
          </span>
          <span className="text-2xl sm:text-3xl font-black text-gray-900 mt-1 block">
            ₹{monthlyTotal}
          </span>
          <span className="text-[11px] text-gray-500 mt-0.5 block">Cumulative monthly</span>
        </div>
      </div>

      {/* Expenses History List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Your Recorded Expenses ({expenses.length})
        </h3>

        {isLoading ? (
          <LoadingSpinner label="Loading your expenses..." />
        ) : expenses.length === 0 ? (
          <Card className="text-center py-10">
            <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-800">No Expenses Recorded</p>
            <p className="text-xs text-gray-500 mt-0.5 mb-3">Click "Add Expense" to log fuel or repair bills.</p>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {expenses.map((e) => (
              <Card key={e._id} className="p-3.5 sm:p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900">{e.category}</span>
                      {e.isUpdated && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200"
                          title={`Updated on ${e.updatedAt ? new Date(e.updatedAt).toLocaleString() : ''}`}
                        >
                          Updated
                        </span>
                      )}
                      <span className="text-[11px] text-gray-400">
                        {new Date(e.expenseDate).toLocaleDateString()}
                      </span>
                    </div>
                    {e.note && <p className="text-xs text-gray-600 mt-1">{e.note}</p>}
                    <span className="text-[11px] text-gray-400 block mt-1">
                      Machine: {machine?.machineName || 'Assigned'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-base font-black text-rose-600">₹{e.amount}</span>
                    <button
                      onClick={() => handleEdit(e)}
                      title="Edit Expense"
                      className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(e)}
                      title="Move to Recycle Bin"
                      className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingExpense(null);
        }}
        title={editingExpense ? 'Edit Expense' : 'Log New Machine Expense'}
        subtitle={`Machine: ${machine?.machineName || 'Your assigned machine'}`}
      >
        {serverError && <Alert type="error" message={serverError} className="mb-4" />}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Expense Category *</label>
            <select
              {...register('category')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white font-medium"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Expense Amount (₹) *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                type="number"
                step="any"
                placeholder="e.g. 1200"
                {...register('amount')}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-base font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            {errors.amount && <p className="text-xs text-red-600 mt-1">{errors.amount.message}</p>}
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
            <label className="block text-xs font-semibold text-gray-700 mb-1">Note / Description</label>
            <input
              type="text"
              placeholder="e.g. 20 Litres Diesel at HP bunk"
              {...register('note')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={() => {
                setModalOpen(false);
                setEditingExpense(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting} className="font-bold">
              {editingExpense ? 'Save Changes' : 'Record Expense'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
