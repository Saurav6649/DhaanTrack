import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { api } from '../../api/client.js';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { Alert } from '../../components/common/Alert.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import {
  Trash2,
  RotateCcw,
  Search,
  AlertTriangle,
  CheckSquare,
  Square,
  Eye,
  Filter,
  Calendar,
  User,
  Tractor,
  History,
  Receipt,
  CreditCard,
  ShieldAlert,
} from 'lucide-react';

export const RecycleBinPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]); // array of id
  const [viewDetailsItem, setViewDetailsItem] = useState(null);

  // Confirmation Modals State
  const [confirmDeleteSelectedOpen, setConfirmDeleteSelectedOpen] = useState(false);
  const [confirmDeleteCategoryOpen, setConfirmDeleteCategoryOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  // SWR data fetch
  const queryParams = new URLSearchParams({
    category: selectedCategory,
    ...(searchQuery && { search: searchQuery.trim() }),
  }).toString();

  const { data, isLoading } = useSWR(`/api/recycle-bin?${queryParams}`);
  const items = data?.items || [];
  const categoryCounts = data?.categoryCounts || {
    all: 0,
    users: 0,
    machines: 0,
    works: 0,
    expenses: 0,
    payments: 0,
  };

  const categories = [
    { id: 'all', label: 'All Records', count: categoryCounts.all },
    { id: 'users', label: 'Users', count: categoryCounts.users },
    { id: 'machines', label: 'Machines', count: categoryCounts.machines },
    { id: 'works', label: 'Work History', count: categoryCounts.works },
    { id: 'expenses', label: 'Expenses', count: categoryCounts.expenses },
    { id: 'payments', label: 'Payments', count: categoryCounts.payments },
  ];

  // Selection logic
  const isAllSelected = items.length > 0 && selectedIds.length === items.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i) => i._id));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Restore Action
  const handleRestore = async (item) => {
    try {
      setActionLoading(true);
      setFeedbackMsg({ type: '', text: '' });
      await api.post(`/api/recycle-bin/restore/${item.category}/${item._id}`);
      setSelectedIds((prev) => prev.filter((id) => id !== item._id));
      setFeedbackMsg({
        type: 'success',
        text: `Restored ${item.categoryLabel} record "${item.name}" successfully.`,
      });
      await mutate((k) => typeof k === 'string' && k.startsWith('/api/recycle-bin'));
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to restore record.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Permanently Delete Selected
  const handlePermanentDeleteSelected = async () => {
    try {
      setActionLoading(true);
      setFeedbackMsg({ type: '', text: '' });

      const selectedObjects = items
        .filter((i) => selectedIds.includes(i._id))
        .map((i) => ({ module: i.category, id: i._id }));

      await api.delete('/api/recycle-bin/permanent-batch', {
        data: { items: selectedObjects },
      });

      setSelectedIds([]);
      setConfirmDeleteSelectedOpen(false);
      setFeedbackMsg({
        type: 'success',
        text: `Permanently removed ${selectedObjects.length} record(s). This action cannot be undone.`,
      });
      await mutate((k) => typeof k === 'string' && k.startsWith('/api/recycle-bin'));
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to delete selected records.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Permanently Delete All in Category
  const handlePermanentDeleteCategory = async () => {
    try {
      setActionLoading(true);
      setFeedbackMsg({ type: '', text: '' });

      await api.delete(`/api/recycle-bin/permanent-category/${selectedCategory}`);

      setSelectedIds([]);
      setConfirmDeleteCategoryOpen(false);
      setFeedbackMsg({
        type: 'success',
        text: `Permanently deleted all soft-deleted records in category "${selectedCategory.toUpperCase()}".`,
      });
      await mutate((k) => typeof k === 'string' && k.startsWith('/api/recycle-bin'));
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to delete category records.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                Deleted Records / Recycle Bin
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Safely manage, restore, or permanently remove deleted records across all modules
              </p>
            </div>
          </div>
        </div>

        {/* Global Category-wise Delete Button */}
        {categoryCounts[selectedCategory] > 0 && (
          <Button
            variant="danger"
            onClick={() => setConfirmDeleteCategoryOpen(true)}
            className="w-full sm:w-auto font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
          >
            <ShieldAlert className="w-4 h-4 mr-1.5 shrink-0" />
            Empty {selectedCategory === 'all' ? 'Entire Recycle Bin' : `${categories.find((c) => c.id === selectedCategory)?.label}`}
          </Button>
        )}
      </div>

      {feedbackMsg.text && (
        <Alert
          type={feedbackMsg.type}
          message={feedbackMsg.text}
          onClose={() => setFeedbackMsg({ type: '', text: '' })}
        />
      )}

      {/* Category Tabs */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-xs">
        <label className="text-xs font-bold uppercase text-gray-400 block tracking-wider mb-2">
          Category-Wise Filter
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedIds([]);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/20'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Batch Actions Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search deleted records by title, identifier, deleted by..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
          />
        </div>

        {/* Batch Selection & Permanent Delete Actions */}
        <div className="flex items-center justify-between md:justify-end gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
          <button
            type="button"
            onClick={handleToggleSelectAll}
            disabled={items.length === 0}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 min-h-[44px]"
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 text-rose-600" />
            ) : (
              <Square className="w-4 h-4 text-gray-400" />
            )}
            <span>Select All ({items.length})</span>
          </button>

          <Button
            variant="danger"
            disabled={selectedIds.length === 0}
            onClick={() => setConfirmDeleteSelectedOpen(true)}
            className="font-bold whitespace-nowrap bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white min-h-[44px]"
          >
            <Trash2 className="w-4 h-4 mr-1.5" /> Permanently Delete Selected ({selectedIds.length})
          </Button>
        </div>
      </div>

      {/* Deleted Records List */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <LoadingSpinner label="Fetching deleted records..." />
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Trash2 className="w-12 h-12 text-gray-200 mx-auto mb-2" />
            <p className="font-bold text-gray-700 text-base">Recycle Bin is Empty</p>
            <p className="text-xs text-gray-400 mt-1">
              No soft-deleted records found for category "{categories.find((c) => c.id === selectedCategory)?.label}".
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-rose-50/70 border-b border-rose-100 text-rose-950 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleToggleSelectAll}
                        className="rounded border-gray-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">Record Name / Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Identifier / Summary</th>
                    <th className="py-3 px-4">Deleted By</th>
                    <th className="py-3 px-4">Deleted Date / Time</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => {
                    const isSelected = selectedIds.includes(item._id);
                    return (
                      <tr
                        key={item._id}
                        className={`transition-colors ${
                          isSelected ? 'bg-rose-50/40' : 'hover:bg-gray-50/60'
                        }`}
                      >
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectOne(item._id)}
                            className="rounded border-gray-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-gray-900 block text-sm">{item.name}</span>
                          <span className="text-[11px] text-gray-400 font-mono">{item.identifier}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800 border border-gray-200">
                            {item.categoryLabel}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{item.details}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-gray-800 block">{item.deletedByName}</span>
                          <span className="text-[10px] text-gray-400 uppercase font-bold">
                            {item.deletedByRole}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                          {new Date(item.deletedAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setViewDetailsItem(item)}
                              title="View Details"
                              className="px-2 py-1 text-gray-600 hover:text-gray-900"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleRestore(item)}
                              isLoading={actionLoading}
                              title="Restore Record"
                              className="px-2.5 py-1 text-brand-700 bg-brand-50 hover:bg-brand-100 border-brand-200"
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restore
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards View */}
            <div className="md:hidden divide-y divide-gray-100">
              {items.map((item) => {
                const isSelected = selectedIds.includes(item._id);
                return (
                  <div
                    key={item._id}
                    className={`p-4 space-y-3 transition-colors ${
                      isSelected ? 'bg-rose-50/50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(item._id)}
                          className="rounded border-gray-300 text-rose-600 focus:ring-rose-500 w-5 h-5 cursor-pointer shrink-0"
                        />
                        <div>
                          <span className="font-bold text-sm text-gray-900 block">{item.name}</span>
                          <span className="text-xs text-gray-400 font-mono">{item.identifier}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200 shrink-0">
                        {item.categoryLabel}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                      {item.details}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                      <span>Deleted by: <strong className="text-gray-700">{item.deletedByName}</strong></span>
                      <span>{new Date(item.deletedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setViewDetailsItem(item)}
                        className="flex-1 text-xs text-gray-700 font-bold"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRestore(item)}
                        isLoading={actionLoading}
                        className="flex-1 text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 border-brand-200"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restore
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* 1. Modal: View Details */}
      {viewDetailsItem && (
        <Modal
          isOpen={!!viewDetailsItem}
          onClose={() => setViewDetailsItem(null)}
          title="Deleted Record Details"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 flex items-start gap-3">
              <Trash2 className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-rose-950 text-base">{viewDetailsItem.name}</h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  Original Module: <strong>{viewDetailsItem.categoryLabel}</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
              <div>
                <span className="text-[11px] font-bold uppercase text-gray-400 block">Record ID</span>
                <span className="font-mono font-bold text-gray-800">{viewDetailsItem._id}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-gray-400 block">Identifier</span>
                <span className="font-mono font-bold text-gray-800">{viewDetailsItem.identifier}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-gray-400 block">Deleted By</span>
                <span className="font-bold text-gray-800">
                  {viewDetailsItem.deletedByName} ({viewDetailsItem.deletedByRole})
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-gray-400 block">Deleted Date</span>
                <span className="font-bold text-gray-800">
                  {new Date(viewDetailsItem.deletedAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase text-gray-400 block mb-1">
                Summary / Snapshot
              </span>
              <div className="bg-white p-3 rounded-xl border border-gray-200 text-gray-700">
                {viewDetailsItem.details}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <Button
                variant="primary"
                onClick={() => {
                  handleRestore(viewDetailsItem);
                  setViewDetailsItem(null);
                }}
                className="flex-1 font-bold bg-brand-600 hover:bg-brand-700"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" /> Restore This Record
              </Button>
              <Button variant="secondary" onClick={() => setViewDetailsItem(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 2. Modal: Confirm Permanent Delete Selected */}
      {confirmDeleteSelectedOpen && (
        <Modal
          isOpen={confirmDeleteSelectedOpen}
          onClose={() => setConfirmDeleteSelectedOpen(false)}
          title="Permanently Delete Selected Records?"
        >
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-black text-rose-950 text-base">Warning: Permanent Deletion</h4>
                <p className="text-xs text-rose-800">
                  You are about to permanently delete{' '}
                  <strong>{selectedIds.length} record(s)</strong> from the database.
                </p>
                <p className="text-xs font-bold text-rose-900 mt-1">
                  This action CANNOT be undone and data cannot be recovered.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <Button
                variant="danger"
                isLoading={actionLoading}
                onClick={handlePermanentDeleteSelected}
                className="flex-1 font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Yes, Permanently Delete Selected
              </Button>
              <Button
                variant="secondary"
                disabled={actionLoading}
                onClick={() => setConfirmDeleteSelectedOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 3. Modal: Confirm Permanent Delete All in Category */}
      {confirmDeleteCategoryOpen && (
        <Modal
          isOpen={confirmDeleteCategoryOpen}
          onClose={() => setConfirmDeleteCategoryOpen(false)}
          title="Empty Category from Recycle Bin?"
        >
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-black text-rose-950 text-base">Permanent Category Removal</h4>
                <p className="text-xs text-rose-800">
                  You are about to permanently remove ALL soft-deleted records in category:{' '}
                  <strong className="uppercase">"{selectedCategory}"</strong>.
                </p>
                <p className="text-xs font-bold text-rose-900 mt-1">
                  All documents will be permanently purged from the database. This action CANNOT be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <Button
                variant="danger"
                isLoading={actionLoading}
                onClick={handlePermanentDeleteCategory}
                className="flex-1 font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Yes, Empty Category Permanently
              </Button>
              <Button
                variant="secondary"
                disabled={actionLoading}
                onClick={() => setConfirmDeleteCategoryOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
