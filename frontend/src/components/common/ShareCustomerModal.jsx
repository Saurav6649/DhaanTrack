import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';
import { Alert } from './Alert.jsx';
import { Share2, Check, User, Phone, MapPin, CheckCircle2, Search, Layers, Award } from 'lucide-react';

export const ShareCustomerModal = ({ isOpen, onClose, customer, onSuccess }) => {
  const { user: currentUser } = useAuth();
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Fetch shareable users
  const { data: usersData, isLoading: usersLoading } = useSWR(
    isOpen ? '/api/customers/shareable-users' : null,
    { revalidateOnFocus: true, revalidateOnMount: true }
  );

  if (!customer) return null;

  // Already shared user IDs
  const alreadySharedIds = (customer.sharedWith || []).map((u) =>
    typeof u === 'object' && u !== null ? String(u._id) : String(u)
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

  const toggleUser = (userId) => {
    const idStr = String(userId);
    if (alreadySharedIds.includes(idStr)) return; // already shared
    setSelectedUserIds((prev) =>
      prev.includes(idStr) ? prev.filter((id) => id !== idStr) : [...prev, idStr]
    );
  };

  const handleShare = async () => {
    if (selectedUserIds.length === 0) {
      setServerError('Please select at least one operator to share with.');
      return;
    }

    try {
      setIsSubmitting(true);
      setServerError('');

      await api.post(`/api/customers/${customer._id}/share`, {
        userIds: selectedUserIds,
      });

      await mutate('/api/customers');
      await mutate((key) => typeof key === 'string' && key.startsWith('/api/customers'));
      await mutate('/api/notifications');
      await mutate((key) => typeof key === 'string' && key.startsWith('/api/notifications'));

      if (onSuccess) {
        onSuccess(`Customer shared with ${selectedUserIds.length} user(s).`);
      }
      setSelectedUserIds([]);
      setUserSearch('');
      onClose();
    } catch (err) {
      setServerError(err.message || 'Failed to share customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityColor =
    customer.priority === 'HIGH'
      ? 'bg-rose-100 text-rose-800 border-rose-200'
      : customer.priority === 'MEDIUM'
      ? 'bg-amber-100 text-amber-800 border-amber-200'
      : 'bg-emerald-100 text-emerald-800 border-emerald-200';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Customer Details"
      subtitle={`Share ${customer.customerName}'s contact details with other operators`}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {serverError && (
          <Alert type="error" message={serverError} onClose={() => setServerError('')} />
        )}

        {/* Customer Mini Card */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-600" />
              {customer.customerName}
            </span>
            <span className="text-xs font-mono font-bold text-gray-700 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              {customer.mobileNumber}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{customer.localArea}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">
                {customer.landAreaAcres || 1.0} Acre
              </span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${priorityColor}`}>
                {customer.priority || 'LOW'}
              </span>
            </div>
          </div>

          {customer.remark && (
            <p className="text-xs text-gray-600 italic bg-white p-2 rounded-xl border border-gray-100">
              "{customer.remark}"
            </p>
          )}
        </div>

        {/* Select Users to Share */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-brand-600" />
              Select Operators to Share With
            </label>
            <span className="text-xs text-brand-600 font-bold">
              {selectedUserIds.length} new selected
            </span>
          </div>

          {/* Search Box */}
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

          <div className="border border-gray-200 rounded-2xl p-2 max-h-56 overflow-y-auto space-y-1.5 bg-gray-50/60">
            {usersLoading ? (
              <p className="text-xs text-gray-400 py-4 text-center">Loading operators list...</p>
            ) : availableUsers.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No other operators available.</p>
            ) : displayedUsers.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No operators match "{userSearch}"</p>
            ) : (
              displayedUsers.map((u) => {
                const uIdStr = String(u._id);
                const isAlreadyShared = alreadySharedIds.includes(uIdStr);
                const isSelected = selectedUserIds.includes(uIdStr);

                return (
                  <div
                    key={u._id}
                    onClick={() => !isAlreadyShared && toggleUser(u._id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition select-none ${
                      isAlreadyShared
                        ? 'bg-emerald-50/60 border border-emerald-100 text-emerald-800 opacity-80 cursor-default'
                        : isSelected
                        ? 'bg-brand-50 border border-brand-200 text-brand-900 font-semibold cursor-pointer shadow-xs'
                        : 'bg-white hover:bg-gray-100/80 border border-gray-100 text-gray-700 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isAlreadyShared ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition shrink-0 ${
                            isSelected
                              ? 'bg-brand-600 border-brand-600 text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      )}
                      <div className="truncate">
                        <span className="font-semibold">{u.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono ml-1.5">@{u.userId}</span>
                      </div>
                    </div>

                    <div>
                      {isAlreadyShared ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                          Already Shared
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-500 uppercase px-1.5 py-0.5 rounded bg-gray-100">
                          {u.role}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
          <Button
            type="button"
            variant="primary"
            onClick={handleShare}
            isLoading={isSubmitting}
            disabled={selectedUserIds.length === 0 || isSubmitting}
            className="flex-1 font-bold"
          >
            <Share2 className="w-4 h-4 mr-1.5" />
            Share With Selected ({selectedUserIds.length})
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
      </div>
    </Modal>
  );
};
