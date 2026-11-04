import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useSWR, { mutate } from 'swr';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';
import { Alert } from './Alert.jsx';
import {
  User,
  Phone,
  MapPin,
  FileText,
  Share2,
  Check,
  Search,
  Layers,
  Sparkles,
  Award,
} from 'lucide-react';

const customerValidationSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, 'Customer name must be at least 2 characters')
    .max(120, 'Customer name too long'),
  mobileNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits'),
  localArea: z
    .string()
    .trim()
    .min(2, 'Local Area / Village must be at least 2 characters')
    .max(200, 'Local Area / Village too long'),
  landAreaAcres: z.coerce
    .number({ invalid_type_error: 'Khet ka Area (Acre) is required' })
    .min(0.1, 'Land area must be at least 0.1 Acre'),
  remark: z.string().trim().max(500, 'Remark cannot exceed 500 characters').optional().default(''),
});

export const CustomerModal = ({ isOpen, onClose, customer = null, onSuccess }) => {
  const { user: currentUser } = useAuth();
  const isEditing = Boolean(customer);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch shareable users
  const { data: usersData, isLoading: usersLoading } = useSWR(
    isOpen ? '/api/customers/shareable-users' : null,
    { revalidateOnFocus: true, revalidateOnMount: true }
  );

  const rawUsers = usersData?.users || usersData?.data?.users || (Array.isArray(usersData) ? usersData : []);
  const currentId = currentUser?._id ? String(currentUser._id) : (currentUser?.id ? String(currentUser.id) : '');
  const currentUserId = currentUser?.userId ? String(currentUser.userId).toLowerCase() : '';

  const availableUsers = rawUsers.filter((u) => {
    const uId = u._id ? String(u._id) : (u.id ? String(u.id) : '');
    const uUserId = u.userId ? String(u.userId).toLowerCase() : '';
    if (currentId && uId === currentId) return false;
    if (currentUserId && uUserId === currentUserId) return false;
    return true;
  });

  const displayedUsers = availableUsers.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.userId || '').toLowerCase().includes(q) ||
      (u.mobile || '').includes(q)
    );
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(customerValidationSchema),
    defaultValues: {
      customerName: '',
      mobileNumber: '',
      localArea: '',
      landAreaAcres: 1.0,
      remark: '',
    },
  });

  const watchedLandArea = watch('landAreaAcres');
  const previewPriority = (() => {
    const num = Number(watchedLandArea);
    if (!num || isNaN(num)) return null;
    if (num >= 5) return { label: 'HIGH PRIORITY (5+ Acre)', color: 'bg-rose-100 text-rose-800 border-rose-200' };
    if (num >= 2) return { label: 'MEDIUM PRIORITY (2-5 Acre)', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    return { label: 'LOW PRIORITY (< 2 Acre)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  })();

  useEffect(() => {
    if (customer) {
      reset({
        customerName: customer.customerName || '',
        mobileNumber: customer.mobileNumber || '',
        localArea: customer.localArea || '',
        landAreaAcres: customer.landAreaAcres !== undefined ? customer.landAreaAcres : 1.0,
        remark: customer.remark || '',
      });
      const sharedIds = (customer.sharedWith || []).map((u) =>
        typeof u === 'object' && u !== null ? u._id : u
      );
      setSelectedUserIds(sharedIds);
    } else {
      reset({
        customerName: '',
        mobileNumber: '',
        localArea: '',
        landAreaAcres: 1.0,
        remark: '',
      });
      setSelectedUserIds([]);
    }
    setUserSearch('');
    setServerError('');
  }, [customer, reset, isOpen]);

  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const onSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      setServerError('');

      const payload = {
        ...values,
        landAreaAcres: Number(values.landAreaAcres),
        shareWithUsers: selectedUserIds,
      };

      if (isEditing) {
        await api.patch(`/api/customers/${customer._id}`, payload);
      } else {
        await api.post('/api/customers', payload);
      }

      await mutate('/api/customers');
      await mutate((key) => typeof key === 'string' && key.startsWith('/api/customers'));
      await mutate('/api/notifications');
      await mutate((key) => typeof key === 'string' && key.startsWith('/api/notifications'));

      if (onSuccess) {
        onSuccess(isEditing ? 'Customer details updated successfully.' : 'Customer saved and shared successfully.');
      }
      onClose();
    } catch (err) {
      setServerError(err.message || 'Failed to save customer record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Customer' : 'Add New Customer'}
      subtitle={
        isEditing
          ? 'Update customer details, land acreage, and team sharing'
          : 'Save customer details centrally and optionally share with team operators'
      }
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <Alert type="error" message={serverError} onClose={() => setServerError('')} />
        )}

        {/* Customer Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
            Customer Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="e.g. Ramesh Patel"
              {...register('customerName')}
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm font-semibold transition ${
                errors.customerName
                  ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-gray-200 focus:border-brand-500 focus:ring-brand-500'
              }`}
            />
          </div>
          {errors.customerName && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.customerName.message}</p>
          )}
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
            Mobile Number <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Phone className="w-4 h-4" />
            </div>
            <input
              type="tel"
              maxLength={10}
              placeholder="10-digit mobile number"
              {...register('mobileNumber')}
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm font-mono font-semibold transition ${
                errors.mobileNumber
                  ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-gray-200 focus:border-brand-500 focus:ring-brand-500'
              }`}
            />
          </div>
          {errors.mobileNumber && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.mobileNumber.message}</p>
          )}
        </div>

        {/* Local Area / Village */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
            Local Area / Village <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="e.g. Rampur, Plot No. 4"
              {...register('localArea')}
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm font-semibold transition ${
                errors.localArea
                  ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-gray-200 focus:border-brand-500 focus:ring-brand-500'
              }`}
            />
          </div>
          {errors.localArea && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.localArea.message}</p>
          )}
        </div>

        {/* Khet ka Area (Acre) & Automatic Priority */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Khet ka Area (Acre) <span className="text-rose-500">*</span>
            </label>
            {previewPriority && (
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${previewPriority.color}`}
              >
                {previewPriority.label}
              </span>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Layers className="w-4 h-4 text-emerald-600" />
            </div>
            <input
              type="number"
              step="0.1"
              min="0.1"
              placeholder="e.g. 5.5"
              {...register('landAreaAcres')}
              className={`w-full pl-10 pr-16 py-2.5 rounded-xl border text-sm font-mono font-bold transition ${
                errors.landAreaAcres
                  ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-gray-200 focus:border-brand-500 focus:ring-brand-500'
              }`}
            />
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-gray-400">
              Acre
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Priority is calculated automatically: High (≥ 5 Acre), Medium (2 - 5 Acre), Low (&lt; 2 Acre).
          </p>
          {errors.landAreaAcres && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.landAreaAcres.message}</p>
          )}
        </div>

        {/* Remark */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
            Remark <span className="text-gray-400 font-normal lowercase">(optional)</span>
          </label>
          <div className="relative">
            <textarea
              rows={2}
              placeholder="e.g. Needs harvester for wheat cutting next week"
              {...register('remark')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:border-brand-500 focus:ring-brand-500 resize-none transition"
            />
          </div>
          {errors.remark && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.remark.message}</p>
          )}
        </div>

        {/* Share With Users (Searchable Multi-select) */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-brand-600" />
              Share With Users
            </label>
            <span className="text-xs text-brand-600 font-bold">
              {selectedUserIds.length} selected
            </span>
          </div>

          {/* User Search Input */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search operators by name or User ID..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="border border-gray-200 rounded-2xl p-2 max-h-40 overflow-y-auto space-y-1 bg-gray-50/60">
            {usersLoading ? (
              <p className="text-xs text-gray-400 py-3 text-center">Loading operators...</p>
            ) : availableUsers.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center">No other active users found.</p>
            ) : displayedUsers.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center">No operators match "{userSearch}"</p>
            ) : (
              displayedUsers.map((u) => {
                const isSelected = selectedUserIds.includes(u._id);
                return (
                  <div
                    key={u._id}
                    onClick={() => toggleUserSelection(u._id)}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs transition select-none ${
                      isSelected
                        ? 'bg-brand-50 border border-brand-200 text-brand-900 font-semibold'
                        : 'bg-white hover:bg-gray-100/80 border border-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                          isSelected
                            ? 'bg-brand-600 border-brand-600 text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{u.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">@{u.userId}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                      {u.role}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="flex-1 font-bold"
          >
            {isEditing ? 'Save Changes' : 'Save & Share Customer'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
            className="font-medium"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};
