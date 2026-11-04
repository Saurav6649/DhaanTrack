import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { api } from '../../api/client.js';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { CreateWorkModal } from '../../components/admin/CreateWorkModal.jsx';
import { WorkDetailModal } from '../../components/admin/WorkDetailModal.jsx';
import {
  CalendarDays,
  Plus,
  Search,
  FileSpreadsheet,
  Eye,
  Filter,
  User,
  Phone,
  MapPin,
  Clock,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ListFilter,
} from 'lucide-react';

export const WorksPage = () => {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'deletion_requests'
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [createdByRole, setCreatedByRole] = useState('');
  const [advanceStatus, setAdvanceStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const queryParams = new URLSearchParams({
    ...(search && { search }),
    ...(status && { status }),
    ...(createdByRole && { createdByRole }),
    ...(advanceStatus && { advancePaymentStatus: advanceStatus }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  }).toString();

  const { data, isLoading } = useSWR(`/api/work-sessions?${queryParams}`);
  const sessions = data?.workSessions || [];

  // Fetch pending deletion requests
  const { data: deletionData, isLoading: deletionLoading } = useSWR('/api/work-sessions/deletion-requests');
  const deletionRequests = deletionData?.deletionRequests || [];

  const handleExportExcel = () => {
    window.open(`/api/reports/work/export?${queryParams}`, '_blank');
  };

  const formatHours = (seconds = 0) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const handleDeleteSession = async (session) => {
    const confirm = window.confirm(
      `Move work session for "${session.customerName}" (${session.fieldLocation}) to Recycle Bin? The record and payment history can be viewed or restored from the Recycle Bin.`
    );
    if (!confirm) return;

    try {
      await api.delete(`/api/work-sessions/${session._id}`);
      await mutate((key) => typeof key === 'string' && key.startsWith('/api/work-sessions'));
      await mutate('/api/recycle-bin');
    } catch (err) {
      alert(err.message || 'Failed to move work session to Recycle Bin.');
    }
  };

  const handleReviewDeletionRequest = async (session, action) => {
    let rejectionReason = '';
    if (action === 'REJECT') {
      const reason = window.prompt('Enter rejection reason for operator (optional):', 'Deletion request rejected.');
      if (reason === null) return;
      rejectionReason = reason;
    } else {
      const confirm = window.confirm(
        `Approve deletion for "${session.customerName}"? This session will be moved to the Recycle Bin.`
      );
      if (!confirm) return;
    }

    try {
      setActionLoadingId(session._id);
      await api.post(`/api/work-sessions/${session._id}/review-deletion`, {
        action,
        rejectionReason,
      });

      await mutate((key) => typeof key === 'string' && key.startsWith('/api/work-sessions'));
      await mutate('/api/recycle-bin');
    } catch (err) {
      alert(err.message || 'Failed to review deletion request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Bookings & Harvesting Works</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Monitor all farmer work sessions, live durations, payment statuses, and operators
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleExportExcel} className="min-h-[40px]">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 mr-1.5" /> Export Excel
          </Button>
          <Button variant="primary" onClick={() => setCreateModalOpen(true)} className="min-h-[40px] font-bold">
            <Plus className="w-4 h-4 mr-1.5" /> Create Work
          </Button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'all'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ListFilter className="w-4 h-4" /> All Work Sessions
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            {sessions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deletion_requests')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'deletion_requests'
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" /> Deletion Requests
          {deletionRequests.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black animate-pulse">
              {deletionRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* DELETION REQUESTS TAB */}
      {activeTab === 'deletion_requests' ? (
        <Card className="p-0 overflow-hidden">
          {deletionLoading ? (
            <LoadingSpinner label="Loading pending deletion requests..." />
          ) : deletionRequests.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm space-y-1">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-gray-800">No Pending Deletion Requests</p>
              <p className="text-xs text-gray-500">All work sessions are in good standing.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {deletionRequests.map((s) => (
                <div key={s._id} className="p-4 sm:p-5 hover:bg-gray-50/50 transition space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-gray-900 text-base">{s.customerName}</h3>
                        <Badge status={s.status} />
                        <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                          Deletion Requested
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" /> {s.customerMobile}
                        <span className="text-gray-300">·</span>
                        <MapPin className="w-3.5 h-3.5 text-gray-400" /> {s.fieldLocation}
                      </p>
                    </div>

                    <div className="text-xs text-gray-500 sm:text-right">
                      <span>Requested on {s.deletionRequest?.requestedAt ? new Date(s.deletionRequest.requestedAt).toLocaleString() : 'N/A'}</span>
                      <span className="block font-semibold text-gray-700">
                        By Operator: {s.deletionRequest?.requestedByName || s.userId?.name}
                      </span>
                    </div>
                  </div>

                  {/* Deletion Reason Card */}
                  <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3 text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-amber-800 block">Operator's Stated Reason:</span>
                    <p className="font-medium text-amber-950">"{s.deletionRequest?.reason}"</p>
                  </div>

                  {/* Work Financial and Duration Meta */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl">
                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold uppercase">Duration</span>
                      <span className="font-bold text-gray-900 font-mono">{formatHours(s.totalWorkedSeconds)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold uppercase">Total Bill</span>
                      <span className="font-bold text-brand-700">₹{s.finalAmount || s.estimatedAmount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold uppercase">Total Paid</span>
                      <span className="font-bold text-emerald-700">₹{s.totalPaidAmount || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold uppercase">Machine</span>
                      <span className="font-semibold text-gray-800 truncate block">{s.machineId?.machineName}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2.5 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedSessionId(s._id)}
                      className="text-xs font-bold min-h-[38px]"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" /> View Full Details
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoadingId === s._id}
                      onClick={() => handleReviewDeletionRequest(s, 'REJECT')}
                      className="text-xs font-semibold text-rose-700 hover:bg-rose-50 border-rose-200 min-h-[38px]"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Reject Request
                    </Button>

                    <Button
                      size="sm"
                      variant="danger"
                      isLoading={actionLoadingId === s._id}
                      onClick={() => handleReviewDeletionRequest(s, 'APPROVE')}
                      className="text-xs font-bold min-h-[38px]"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve & Move to Recycle Bin
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        /* ALL WORK SESSIONS TAB */
        <>
          {/* Filter Toolbar */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 tracking-wider">
              <Filter className="w-3.5 h-3.5" /> Search & Advanced Filters
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search customer, mobile, location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50/50 min-h-[40px]"
                />
              </div>

              {/* Status Filter */}
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white min-h-[40px]"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="PAUSED">Paused</option>
                <option value="COMPLETED">Completed</option>
              </select>

              {/* Created By Filter */}
              <select
                value={createdByRole}
                onChange={(e) => setCreatedByRole(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white min-h-[40px]"
              >
                <option value="">All Creators</option>
                <option value="ADMIN">Created by Admin</option>
                <option value="USER">Created by Operator</option>
              </select>

              {/* Advance Status Filter */}
              <select
                value={advanceStatus}
                onChange={(e) => setAdvanceStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white min-h-[40px]"
              >
                <option value="">Advance Status...</option>
                <option value="HAS_ADVANCE">Advance Received</option>
                <option value="NO_ADVANCE">No Advance</option>
              </select>

              {/* Date Picker Start */}
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white min-h-[40px]"
              />
            </div>
          </Card>

          {/* Bookings Table / Cards */}
          <Card className="p-0 overflow-hidden">
            {isLoading ? (
              <LoadingSpinner label="Fetching work sessions..." />
            ) : sessions.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                No work sessions match your filter criteria.
              </div>
            ) : (
              <>
                {/* Mobile View: Stacked Cards (< md) */}
                <div className="md:hidden divide-y divide-gray-100">
                  {sessions.map((s) => (
                    <div key={s._id} className="p-4 space-y-3 hover:bg-gray-50/50 transition">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm">{s.customerName}</h3>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-gray-400" /> {s.customerMobile}
                          </p>
                          <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-gray-400 shrink-0" /> {s.fieldLocation}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge status={s.status} />
                          {s.deletionRequest?.status === 'PENDING' && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                              Deletion Requested
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl">
                        <div>
                          <span className="text-[10px] text-gray-400 block font-semibold uppercase">Machine & Operator</span>
                          <span className="font-semibold text-gray-800 block truncate">
                            {s.machineId?.machineName} ({s.machineId?.machineNumber})
                          </span>
                          <span className="text-gray-500 text-[11px]">Op: {s.userId?.name || 'Unassigned'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block font-semibold uppercase">Working Duration</span>
                          <span className="font-mono font-bold text-gray-900 block">
                            {formatHours(s.totalWorkedSeconds)}
                          </span>
                          <span className="text-gray-500 text-[11px]">
                            Rate: ₹{s.customerRateSnapshot}/hr
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-gray-400">
                          Created: {new Date(s.createdAt).toLocaleDateString()} by {s.createdByRole === 'ADMIN' ? 'Admin' : s.createdBy?.name || 'Op'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedSessionId(s._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 min-h-[38px] transition"
                          >
                            <Eye className="w-3.5 h-3.5" /> Details
                          </button>
                          <button
                            onClick={() => handleDeleteSession(s)}
                            title="Move to Recycle Bin"
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl min-h-[38px] min-w-[38px] flex items-center justify-center transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View: Full Table (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Location</th>
                        <th className="py-3 px-4">Machine & Operator</th>
                        <th className="py-3 px-4">Duration</th>
                        <th className="py-3 px-4">Rate & Bill</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Created By</th>
                        <th className="py-3 px-4">Created At</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sessions.map((s) => (
                        <tr key={s._id} className="hover:bg-gray-50/50 transition-colors">
                          {/* Customer */}
                          <td className="py-3 px-4">
                            <span className="font-bold text-gray-900 block">{s.customerName}</span>
                            <span className="text-gray-400 text-xs flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {s.customerMobile}
                            </span>
                          </td>

                          {/* Location */}
                          <td className="py-3 px-4 text-gray-600 max-w-[160px] truncate">
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-gray-400 shrink-0" /> {s.fieldLocation}
                            </span>
                          </td>

                          {/* Machine & Operator */}
                          <td className="py-3 px-4">
                            <span className="font-semibold text-gray-800 block">
                              {s.machineId?.machineName} ({s.machineId?.machineNumber})
                            </span>
                            <span className="text-gray-400 text-xs">
                              Operator: {s.userId?.name || 'Unassigned'}
                            </span>
                          </td>

                          {/* Total Duration */}
                          <td className="py-3 px-4">
                            <span className="font-mono font-semibold text-gray-900">
                              {formatHours(s.totalWorkedSeconds)}
                            </span>
                            <span className="text-gray-400 block text-[11px]">
                              {(s.totalWorkedSeconds / 3600).toFixed(2)} hrs
                            </span>
                          </td>

                          {/* Rate & Bill */}
                          <td className="py-3 px-4">
                            <span className="font-bold text-brand-700 block text-xs">
                              ₹{s.finalAmount || s.estimatedAmount}
                            </span>
                            <span className="text-gray-400 text-[11px]">
                              ₹{s.customerRateSnapshot}/hr
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1 items-start">
                              <Badge status={s.status} />
                              {s.deletionRequest?.status === 'PENDING' && (
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                                  Deletion Req
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Created By */}
                          <td className="py-3 px-4 text-xs">
                            <span className="font-medium text-gray-800 block">
                              {s.createdByRole === 'ADMIN' ? 'Admin' : s.createdBy?.name || 'Operator'}
                            </span>
                            <span className="text-gray-400 uppercase text-[10px]">{s.createdByRole}</span>
                          </td>

                          {/* Created At */}
                          <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">
                            {new Date(s.createdAt).toLocaleDateString()}
                          </td>

                          {/* Action */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedSessionId(s._id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 transition min-h-[32px]"
                              >
                                <Eye className="w-3.5 h-3.5" /> Details
                              </button>
                              <button
                                onClick={() => handleDeleteSession(s)}
                                title="Move to Recycle Bin"
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg min-h-[32px] min-w-[32px] flex items-center justify-center transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        </>
      )}

      {/* Modals */}
      <CreateWorkModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} />
      <WorkDetailModal
        isOpen={!!selectedSessionId}
        sessionId={selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
      />
    </div>
  );
};