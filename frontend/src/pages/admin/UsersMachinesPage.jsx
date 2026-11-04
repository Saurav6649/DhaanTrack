import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useSWR, { mutate } from 'swr';
import { api } from '../../api/client.js';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { Alert } from '../../components/common/Alert.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { UserMachineModal } from '../../components/admin/UserMachineModal.jsx';
import { MachineModal } from '../../components/admin/MachineModal.jsx';
import { ResetPasswordModal } from '../../components/admin/ResetPasswordModal.jsx';
import { CustomerModal } from '../../components/common/CustomerModal.jsx';
import { ShareCustomerModal } from '../../components/common/ShareCustomerModal.jsx';
import {
  Users,
  Tractor,
  Plus,
  KeyRound,
  Ban,
  CheckCircle,
  ExternalLink,
  Edit2,
  Trash2,
  Eye,
  Clock,
  IndianRupee,
  Layers,
  Sparkles,
  Phone,
  MapPin,
  Share2,
  Copy,
  Check,
  Search,
  User,
  ArrowUpDown,
  Filter,
  Award,
} from 'lucide-react';

export const UsersMachinesPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Active view tab: 'users' (Operators & Metrics) | 'machines' (Harvester Machines CRUD) | 'customers'
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'users');

  // SWR data
  const { data: usersData, isLoading: usersLoading } = useSWR('/api/users/combined');
  const users = usersData?.users || [];

  const { data: machinesData, isLoading: machinesLoading } = useSWR('/api/machines');
  const machines = machinesData?.machines || [];

  // Customer filter & sorting states
  const [customerSearch, setCustomerSearch] = useState(searchParams.get('search') || '');
  const [priorityFilter, setPriorityFilter] = useState('all'); // 'all' | 'HIGH' | 'MEDIUM' | 'LOW'
  const [customerSortBy, setCustomerSortBy] = useState('acreage_desc'); // 'acreage_desc' | 'priority_desc' | 'recently_added'

  const customerQueryParams = new URLSearchParams({
    sortBy: customerSortBy,
    ...(priorityFilter !== 'all' && { priority: priorityFilter }),
    ...(customerSearch.trim() && { search: customerSearch.trim() }),
  }).toString();

  const { data: customersData, isLoading: customersLoading, mutate: mutateCustomers } = useSWR(`/api/customers?${customerQueryParams}`);
  const customers = customersData?.customers || customersData?.data?.customers || (Array.isArray(customersData) ? customersData : []);

  // Modals state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [machineModalOpen, setMachineModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [selectedUserForReset, setSelectedUserForReset] = useState(null);
  const [selectedMachineForEdit, setSelectedMachineForEdit] = useState(null);
  const [selectedCustomerForEdit, setSelectedCustomerForEdit] = useState(null);
  const [selectedCustomerForShare, setSelectedCustomerForShare] = useState(null);
  const [viewMachineDetails, setViewMachineDetails] = useState(null);

  // Customer copy feedback
  const [copiedId, setCopiedId] = useState(null);

  // Alerts
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const handleCopyMobile = async (mobile, id) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(mobile);
      } else {
        const ta = document.createElement('textarea');
        ta.value = mobile;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Delete customer (move to Recycle Bin - Admin Only)
  const handleDeleteCustomer = async (cust) => {
    const confirm = window.confirm(
      `Move customer "${cust.customerName}" (${cust.mobileNumber}) to Recycle Bin? You can restore it anytime.`
    );
    if (!confirm) return;

    try {
      await api.delete(`/api/customers/${cust._id}`);
      await mutateCustomers();
      await mutate('/api/customers');
      await mutate((k) => typeof k === 'string' && k.startsWith('/api/customers'));
      await mutate('/api/recycle-bin');
      await mutate((k) => typeof k === 'string' && k.startsWith('/api/recycle-bin'));
      setFeedback({
        type: 'success',
        text: `Customer "${cust.customerName}" moved to Recycle Bin successfully.`,
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete customer.' });
    }
  };

  // Toggle user status
  const handleToggleStatus = async (user) => {
    const confirm = window.confirm(
      `Are you sure you want to ${user.status === 'ACTIVE' ? 'DISABLE' : 'ACTIVATE'} ${user.name}?`
    );
    if (!confirm) return;

    try {
      await api.patch(`/api/users/${user._id}/toggle-status`);
      await mutate('/api/users/combined');
      setFeedback({ type: 'success', text: `Status for ${user.name} changed successfully.` });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to change user status.' });
    }
  };

  // Delete user (move to Recycle Bin)
  const handleDeleteUser = async (user) => {
    const confirm = window.confirm(
      `Move operator "${user.name}" (@${user.userId}) to Recycle Bin? They will be unassigned from their machine.`
    );
    if (!confirm) return;

    try {
      await api.delete(`/api/users/${user._id}`);
      await mutate('/api/users/combined');
      await mutate('/api/machines');
      await mutate('/api/recycle-bin');
      setFeedback({
        type: 'success',
        text: `Operator "${user.name}" moved to Recycle Bin. You can restore or permanently delete them from the Recycle Bin.`,
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete user.' });
    }
  };

  // Delete machine (move to Recycle Bin)
  const handleDeleteMachine = async (machine) => {
    const confirm = window.confirm(
      `Move machine "${machine.machineName}" (${machine.machineNumber}) to Recycle Bin? Any assigned operator will be unlinked.`
    );
    if (!confirm) return;

    try {
      await api.delete(`/api/machines/${machine._id}`);
      await mutate('/api/machines');
      await mutate('/api/users/combined');
      await mutate('/api/recycle-bin');
      setFeedback({
        type: 'success',
        text: `Machine "${machine.machineName}" moved to Recycle Bin. Historical work records retain rate snapshots.`,
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete machine.' });
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return (
      (c.customerName || '').toLowerCase().includes(q) ||
      (c.mobileNumber || '').includes(q) ||
      (c.localArea || '').toLowerCase().includes(q) ||
      (c.remark || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Users & Machines Management</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Combined control center for machine operators, harvester machines, and daily metrics
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedCustomerForEdit(null);
              setCustomerModalOpen(true);
            }}
            className="flex-1 sm:flex-none font-bold text-emerald-700 border-emerald-600 hover:bg-emerald-50"
          >
            <User className="w-4 h-4 mr-1.5 text-emerald-600" /> Add Customer
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setSelectedMachineForEdit(null);
              setMachineModalOpen(true);
            }}
            className="flex-1 sm:flex-none font-bold"
          >
            <Tractor className="w-4 h-4 mr-1.5 text-brand-600" /> Add Machine
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setSelectedUserForEdit(null);
              setUserModalOpen(true);
            }}
            className="flex-1 sm:flex-none font-bold"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add User
          </Button>
        </div>
      </div>

      {feedback.text && (
        <Alert
          type={feedback.type}
          message={feedback.text}
          onClose={() => setFeedback({ type: '', text: '' })}
        />
      )}

      {/* Segmented View Tabs */}
      <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[40px] ${
            activeTab === 'users'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Operators & Performance ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('machines')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[40px] ${
            activeTab === 'machines'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Tractor className="w-4 h-4 text-brand-600" />
          <span>Harvester Machines ({machines.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[40px] ${
            activeTab === 'customers'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <User className="w-4 h-4 text-emerald-600" />
          <span>Customers & Leads ({customers.length})</span>
        </button>
      </div>

      {/* TAB 1: OPERATORS & PERFORMANCE */}
      {activeTab === 'users' && (
        <Card className="p-0 overflow-hidden">
          {usersLoading ? (
            <LoadingSpinner label="Compiling users, machine assignments and today's operational stats..." />
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              No operators found. Click "Add User" to register your first harvester operator.
            </div>
          ) : (
            <>
              {/* Mobile View: Stacked Cards (< md) */}
              <div className="md:hidden divide-y divide-gray-100">
                {users.map((u) => (
                  <div key={u._id} className="p-4 space-y-3 hover:bg-gray-50/50 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div
                          onClick={() => navigate(`/admin/users-machines/${u._id}`)}
                          className="font-bold text-gray-900 text-base cursor-pointer hover:text-brand-600 flex items-center gap-1.5"
                        >
                          {u.name}
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-500 font-mono">@{u.userId} • {u.mobile}</p>
                      </div>
                      <Badge status={u.status} />
                    </div>

                    {/* Machine */}
                    <div className="text-xs bg-gray-50 p-2.5 rounded-xl">
                      <span className="text-[10px] text-gray-400 block font-semibold uppercase">Assigned Machine</span>
                      {u.assignedMachine ? (
                        <span className="font-semibold text-gray-900 block mt-0.5">
                          {u.assignedMachine.machineName} ({u.assignedMachine.machineNumber}) • ₹{u.assignedMachine.customerHourlyRate}/hr
                        </span>
                      ) : (
                        <span className="text-gray-400 italic block mt-0.5">Unassigned</span>
                      )}
                    </div>

                    {/* 4-Stat Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-50 p-2 rounded-xl">
                        <span className="text-[10px] text-gray-400 block font-semibold uppercase">Today's Hours</span>
                        <span className="font-mono font-bold text-gray-900 text-sm">{u.todayStats?.workingHours || 0} hrs</span>
                      </div>
                      <div className="bg-emerald-50 p-2 rounded-xl">
                        <span className="text-[10px] text-emerald-700 block font-semibold uppercase">Today's Revenue</span>
                        <span className="font-bold text-emerald-800 text-sm">₹{u.todayStats?.revenue || 0}</span>
                      </div>
                      <div className="bg-rose-50 p-2 rounded-xl">
                        <span className="text-[10px] text-rose-700 block font-semibold uppercase">Today's Expenses</span>
                        <span className="font-bold text-rose-700 text-sm">₹{u.todayStats?.expenses || 0}</span>
                      </div>
                      <div className="bg-blue-50 p-2 rounded-xl">
                        <span className="text-[10px] text-blue-700 block font-semibold uppercase">Today's Profit</span>
                        <span className="font-bold text-blue-800 text-sm">₹{u.todayStats?.grossProfit || 0}</span>
                      </div>
                    </div>

                    {/* Mobile Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <button
                        onClick={() => navigate(`/admin/users-machines/${u._id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 min-h-[38px] transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Performance
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedUserForEdit(u);
                            setUserModalOpen(true);
                          }}
                          aria-label="Edit User"
                          title="Edit User"
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl min-h-[38px] min-w-[38px] flex items-center justify-center transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedUserForReset(u)}
                          aria-label="Reset Password"
                          title="Reset Password"
                          className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl min-h-[38px] min-w-[38px] flex items-center justify-center transition"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        {u.role !== 'ADMIN' && (
                          <>
                            <button
                              onClick={() => handleToggleStatus(u)}
                              aria-label={u.status === 'ACTIVE' ? 'Disable Account' : 'Activate Account'}
                              title={u.status === 'ACTIVE' ? 'Disable Account' : 'Activate Account'}
                              className={`p-2 rounded-xl min-h-[38px] min-w-[38px] flex items-center justify-center transition ${
                                u.status === 'ACTIVE'
                                  ? 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              aria-label="Delete User"
                              title="Move User to Recycle Bin"
                              className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl min-h-[38px] min-w-[38px] flex items-center justify-center transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
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
                      <th className="py-3 px-4">User Name</th>
                      <th className="py-3 px-4">User ID</th>
                      <th className="py-3 px-4">Mobile Number</th>
                      <th className="py-3 px-4">Assigned Machine</th>
                      <th className="py-3 px-4 text-center">Today's Hours</th>
                      <th className="py-3 px-4 text-right">Today's Revenue</th>
                      <th className="py-3 px-4 text-right">Today's Expenses</th>
                      <th className="py-3 px-4 text-right">Today's Profit</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div
                            onClick={() => navigate(`/admin/users-machines/${u._id}`)}
                            className="font-bold text-gray-900 cursor-pointer hover:text-brand-600 flex items-center gap-1.5"
                          >
                            {u.name}
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          </div>
                          <span className="text-gray-400 text-[11px] uppercase font-semibold">{u.role}</span>
                        </td>

                        <td className="py-3 px-4 font-mono text-gray-600">@{u.userId}</td>
                        <td className="py-3 px-4 text-gray-600">{u.mobile}</td>

                        <td className="py-3 px-4">
                          {u.assignedMachine ? (
                            <div
                              onClick={() => navigate(`/admin/users-machines/${u._id}`)}
                              className="cursor-pointer hover:text-brand-700"
                            >
                              <span className="font-semibold text-gray-900 block">
                                {u.assignedMachine.machineName}
                              </span>
                              <span className="text-xs text-brand-600 font-medium">
                                {u.assignedMachine.machineNumber} • ₹{u.assignedMachine.customerHourlyRate}/hr
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-xs">Unassigned</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-bold text-gray-900">
                          {u.todayStats?.workingHours || 0} hrs
                        </td>

                        <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                          ₹{u.todayStats?.revenue || 0}
                        </td>

                        <td className="py-3 px-4 text-right font-medium text-rose-600">
                          ₹{u.todayStats?.expenses || 0}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <span
                            className={`font-bold ${
                              (u.todayStats?.grossProfit || 0) >= 0 ? 'text-emerald-700' : 'text-red-600'
                            }`}
                          >
                            ₹{u.todayStats?.grossProfit || 0}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <Badge status={u.status} />
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => navigate(`/admin/users-machines/${u._id}`)}
                              title="View Performance Details"
                              className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedUserForEdit(u);
                                setUserModalOpen(true);
                              }}
                              title="Edit User"
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setSelectedUserForReset(u)}
                              title="Reset Password"
                              className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            {u.role !== 'ADMIN' && (
                              <>
                                <button
                                  onClick={() => handleToggleStatus(u)}
                                  title={u.status === 'ACTIVE' ? 'Disable Account' : 'Activate Account'}
                                  className={`p-1.5 rounded-lg transition ${
                                    u.status === 'ACTIVE'
                                      ? 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                                      : 'text-emerald-600 hover:bg-emerald-50'
                                  }`}
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  title="Move User to Recycle Bin"
                                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
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
      )}

      {/* TAB 2: HARVESTER MACHINES (COMPLETE CRUD) */}
      {activeTab === 'machines' && (
        <Card className="p-0 overflow-hidden">
          {machinesLoading ? (
            <LoadingSpinner label="Fetching harvester machines list..." />
          ) : machines.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Tractor className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="font-bold text-gray-800 text-base">No Harvester Machines Found</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Click "Add Machine" to configure a new harvester.</p>
              <Button variant="primary" onClick={() => setMachineModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Add Machine
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile View: Stacked Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {machines.map((m) => (
                  <div key={m._id} className="p-4 space-y-3 hover:bg-gray-50/50 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-gray-900 text-base flex items-center gap-1.5">
                          <Tractor className="w-4 h-4 text-brand-600" />
                          {m.machineName}
                        </h4>
                        <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                          {m.machineNumber}
                        </span>
                      </div>
                      <Badge status={m.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold uppercase">Customer Rate</span>
                        <span className="font-bold text-gray-900">₹{m.customerHourlyRate}/hr</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold uppercase">Contractor Rate</span>
                        <span className="font-bold text-gray-900">₹{m.contractorHourlyRate}/hr</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold uppercase">Capacity</span>
                        <span className="font-bold text-gray-900">{m.capacityPerHour} Acre/hr</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold uppercase">Assigned Operator</span>
                        <span className="font-bold text-gray-900">
                          {m.assignedUser?.name || 'Unassigned'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setViewMachineDetails(m)}
                        className="text-xs font-bold text-gray-600"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View Specs
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSelectedMachineForEdit(m);
                          setMachineModalOpen(true);
                        }}
                        className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit Machine
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteMachine(m)}
                        className="text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View: Full Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Machine Name</th>
                      <th className="py-3 px-4">Number / Plate</th>
                      <th className="py-3 px-4 text-center">Capacity (Acre/Hr)</th>
                      <th className="py-3 px-4 text-right">Customer Rate</th>
                      <th className="py-3 px-4 text-right">Contractor Rate</th>
                      <th className="py-3 px-4">Assigned Operator</th>
                      <th className="py-3 px-4">Contractor</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {machines.map((m) => (
                      <tr key={m._id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-gray-900 block flex items-center gap-1.5">
                            <Tractor className="w-4 h-4 text-brand-600 shrink-0" />
                            {m.machineName}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-brand-700">{m.machineNumber}</td>

                        <td className="py-3 px-4 text-center font-bold text-gray-800">
                          {m.capacityPerHour} acre/hr
                        </td>

                        <td className="py-3 px-4 text-right font-bold text-gray-900">
                          ₹{m.customerHourlyRate}/hr
                        </td>

                        <td className="py-3 px-4 text-right font-semibold text-gray-600">
                          ₹{m.contractorHourlyRate}/hr
                        </td>

                        <td className="py-3 px-4">
                          {m.assignedUser ? (
                            <span className="font-medium text-gray-900 block">
                              {m.assignedUser.name} <span className="text-gray-400 text-xs">(@{m.assignedUser.userId})</span>
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-xs">Unassigned</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-gray-600">
                          {m.contractorId ? m.contractorId.name : <span className="text-gray-400 italic text-xs">None</span>}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <Badge status={m.status} />
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewMachineDetails(m)}
                              title="View Specs & Details"
                              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedMachineForEdit(m);
                                setMachineModalOpen(true);
                              }}
                              title="Edit Machine"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMachine(m)}
                              title="Move Machine to Recycle Bin"
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
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
      )}

      {/* TAB 3: CUSTOMERS & LEADS */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          {/* Controls: Search, Priority Filter, Sorting, Add Button */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customers by name, phone, village, or remark..."
                  className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
                {customerSearch && (
                  <button
                    type="button"
                    onClick={() => setCustomerSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Sorting Dropdown & Add Customer */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-xl text-xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="text-gray-500 font-semibold hidden sm:inline">Sort:</span>
                  <select
                    value={customerSortBy}
                    onChange={(e) => setCustomerSortBy(e.target.value)}
                    className="bg-transparent font-bold text-gray-800 focus:outline-none cursor-pointer"
                  >
                    <option value="acreage_desc">Highest Acreage First</option>
                    <option value="priority_desc">Highest Priority First</option>
                    <option value="recently_added">Recently Added</option>
                  </select>
                </div>

                <Button
                  variant="primary"
                  onClick={() => {
                    setSelectedCustomerForEdit(null);
                    setCustomerModalOpen(true);
                  }}
                  className="font-bold whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white min-h-[40px]"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Add Customer
                </Button>
              </div>
            </div>

            {/* Priority Filter Pills */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100 overflow-x-auto text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Priority:
              </span>
              <button
                type="button"
                onClick={() => setPriorityFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  priorityFilter === 'all'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Priorities
              </button>
              <button
                type="button"
                onClick={() => setPriorityFilter('HIGH')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  priorityFilter === 'HIGH'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                High (≥ 5 Acre)
              </button>
              <button
                type="button"
                onClick={() => setPriorityFilter('MEDIUM')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  priorityFilter === 'MEDIUM'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Medium (2-5 Acre)
              </button>
              <button
                type="button"
                onClick={() => setPriorityFilter('LOW')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  priorityFilter === 'LOW'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Low (&lt; 2 Acre)
              </button>
            </div>
          </div>

          <Card className="p-0 overflow-hidden">
            {customersLoading ? (
              <LoadingSpinner label="Fetching central customer database and ranking..." />
            ) : customers.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="font-bold text-gray-800 text-base">
                  {customerSearch ? 'No Customers Match Your Search' : 'No Customer Records Found'}
                </p>
                <p className="text-xs text-gray-400 mt-1 mb-4">
                  {customerSearch
                    ? 'Try searching with a different name or number.'
                    : 'Add a new customer to keep contacts organized and shared with operators.'}
                </p>
                {!customerSearch && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setSelectedCustomerForEdit(null);
                      setCustomerModalOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Add First Customer
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile View: Stacked Cards */}
                <div className="md:hidden divide-y divide-gray-100">
                  {customers.map((c, idx) => {
                    const isCopied = copiedId === c._id;
                    const sharedCount = (c.sharedWith || []).length;
                    const rankNum = c.rank || idx + 1;
                    const priorityBadge =
                      c.priority === 'HIGH'
                        ? 'bg-rose-100 text-rose-800 border-rose-200'
                        : c.priority === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200';

                    return (
                      <div key={c._id} className="p-4 space-y-3 hover:bg-gray-50/50 transition">
                        {/* Top: Rank, Name, Priority */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <span className="w-7 h-7 rounded-xl bg-gray-900 text-white font-mono font-black text-xs flex items-center justify-center shrink-0">
                              #{rankNum}
                            </span>
                            <div>
                              <h4 className="font-bold text-gray-900 text-base flex items-center gap-1.5">
                                {c.customerName}
                              </h4>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                {c.localArea}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${priorityBadge}`}>
                              {c.priority || 'LOW'}
                            </span>
                            <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {c.landAreaAcres || 1.0} Acre
                            </span>
                          </div>
                        </div>

                        {/* Mobile Number Row */}
                        <div className="flex items-center justify-between text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          <span className="text-gray-500 font-mono font-bold text-sm">{c.mobileNumber}</span>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${c.mobileNumber}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700"
                            >
                              <Phone className="w-3 h-3" /> Call
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopyMobile(c.mobileNumber, c._id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-gray-700 bg-white border border-gray-200"
                            >
                              {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{isCopied ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>

                        {c.remark && (
                          <p className="text-xs text-gray-600 italic bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                            "{c.remark}"
                          </p>
                        )}

                        {/* Shared With & Created By info */}
                        <div className="text-xs space-y-1.5 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-400">Added By:</span>
                            <span className="font-semibold text-gray-700">
                              {c.createdBy?.name || 'Admin'}
                            </span>
                          </div>
                          <div className="flex items-start justify-between text-[11px] gap-2">
                            <span className="text-gray-400 shrink-0">Shared With:</span>
                            <div className="flex flex-wrap gap-1 justify-end">
                              {sharedCount === 0 ? (
                                <span className="text-gray-400 italic">None</span>
                              ) : (
                                (c.sharedWith || []).map((u) => (
                                  <span
                                    key={u._id || u}
                                    className="px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 font-semibold text-[10px]"
                                  >
                                    {u.name || u.userId || 'Operator'}
                                  </span>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons Footer */}
                        <div className="flex items-center justify-end pt-2 border-t border-gray-100 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomerForShare(c);
                              setShareModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100"
                          >
                            <Share2 className="w-3.5 h-3.5" /> Share
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomerForEdit(c);
                              setCustomerModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(c)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-3 text-center w-14">Rank</th>
                        <th className="py-3 px-4">Customer Name</th>
                        <th className="py-3 px-4">Mobile Number</th>
                        <th className="py-3 px-4">Local Area</th>
                        <th className="py-3 px-4 text-center">Khet Area (Acre)</th>
                        <th className="py-3 px-4 text-center">Priority</th>
                        <th className="py-3 px-4">Remark</th>
                        <th className="py-3 px-4">Created By</th>
                        <th className="py-3 px-4">Shared With</th>
                        <th className="py-3 px-4">Created Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {customers.map((c, idx) => {
                        const isCopied = copiedId === c._id;
                        const rankNum = c.rank || idx + 1;
                        const priorityBadge =
                          c.priority === 'HIGH'
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : c.priority === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200';

                        return (
                          <tr key={c._id} className="hover:bg-gray-50/60 transition">
                            {/* Rank */}
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`inline-flex items-center justify-center font-mono font-black text-xs w-7 h-7 rounded-xl ${
                                  rankNum === 1
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : rankNum === 2
                                    ? 'bg-gray-400 text-white'
                                    : rankNum === 3
                                    ? 'bg-amber-700 text-white'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                #{rankNum}
                              </span>
                            </td>

                            {/* Customer Name */}
                            <td className="py-3 px-4 font-bold text-gray-900 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                                  {c.customerName?.charAt(0)?.toUpperCase()}
                                </div>
                                <span>{c.customerName}</span>
                              </div>
                            </td>

                            {/* Mobile Number */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-gray-800 text-sm">
                                  {c.mobileNumber}
                                </span>
                                <a
                                  href={`tel:${c.mobileNumber}`}
                                  title="Call directly"
                                  className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleCopyMobile(c.mobileNumber, c._id)}
                                  title="Copy phone number"
                                  className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                                >
                                  {isCopied ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* Local Area */}
                            <td className="py-3 px-4 text-gray-700">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span>{c.localArea}</span>
                              </div>
                            </td>

                            {/* Khet Area (Acre) */}
                            <td className="py-3 px-4 text-center">
                              <span className="font-mono font-black text-gray-900 text-sm bg-gray-100 px-2.5 py-1 rounded-xl">
                                {c.landAreaAcres || 1.0} Acre
                              </span>
                            </td>

                            {/* Priority */}
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-block text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${priorityBadge}`}>
                                {c.priority || 'LOW'}
                              </span>
                            </td>

                            {/* Remark */}
                            <td className="py-3 px-4 text-gray-500 max-w-xs truncate">
                              {c.remark ? (
                                <span title={c.remark}>"{c.remark}"</span>
                              ) : (
                                <span className="text-gray-300 italic">—</span>
                              )}
                            </td>

                            {/* Created By */}
                            <td className="py-3 px-4 text-gray-600">
                              <div>
                                <span className="font-semibold text-gray-800 block">
                                  {c.createdBy?.name || 'Admin'}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono">
                                  @{c.createdBy?.userId || 'admin'}
                                </span>
                              </div>
                            </td>

                            {/* Shared With */}
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {(c.sharedWith || []).length === 0 ? (
                                  <span className="text-gray-400 italic text-[11px]">Not shared</span>
                                ) : (
                                  (c.sharedWith || []).map((u) => (
                                    <span
                                      key={u._id || u}
                                      className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-100"
                                    >
                                      {u.name || u.userId || 'Operator'}
                                    </span>
                                  ))
                                )}
                              </div>
                            </td>

                            {/* Created Date */}
                            <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                              {new Date(c.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCustomerForShare(c);
                                    setShareModalOpen(true);
                                  }}
                                  title="Share with operators"
                                  className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition"
                                >
                                  <Share2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCustomerForEdit(c);
                                    setCustomerModalOpen(true);
                                  }}
                                  title="Edit customer"
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomer(c)}
                                  title="Move to Recycle Bin (Admin only)"
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Machine Details Modal */}
      {viewMachineDetails && (
        <Modal
          isOpen={!!viewMachineDetails}
          onClose={() => setViewMachineDetails(null)}
          title={`Machine Specifications: ${viewMachineDetails.machineName}`}
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="bg-brand-50 p-4 rounded-2xl border border-brand-200 flex items-start gap-3">
              <Tractor className="w-6 h-6 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-brand-950 text-base">{viewMachineDetails.machineName}</h4>
                <p className="text-xs text-brand-700 font-mono font-bold mt-0.5">
                  Plate / Number: {viewMachineDetails.machineNumber}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
              <div>
                <span className="text-[11px] font-bold uppercase text-gray-400 block">Customer Billing Rate</span>
                <span className="font-black text-gray-900 text-base">₹{viewMachineDetails.customerHourlyRate}/hr</span>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-gray-400 block">Contractor Hourly Rate</span>
                <span className="font-black text-gray-900 text-base">₹{viewMachineDetails.contractorHourlyRate}/hr</span>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-gray-400 block">Harvesting Capacity</span>
                <span className="font-bold text-gray-800">{viewMachineDetails.capacityPerHour} Acre / Hour</span>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-gray-400 block">Operational Status</span>
                <Badge status={viewMachineDetails.status} />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-gray-400 block">Assigned Operator</span>
                <span className="font-bold text-gray-800">
                  {viewMachineDetails.assignedUser ? `${viewMachineDetails.assignedUser.name} (@${viewMachineDetails.assignedUser.userId})` : 'Unassigned'}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-gray-400 block">Linked Contractor</span>
                <span className="font-bold text-gray-800">
                  {viewMachineDetails.contractorId ? viewMachineDetails.contractorId.name : 'None'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <Button
                variant="primary"
                onClick={() => {
                  setSelectedMachineForEdit(viewMachineDetails);
                  setViewMachineDetails(null);
                  setMachineModalOpen(true);
                }}
                className="flex-1 font-bold"
              >
                <Edit2 className="w-4 h-4 mr-1.5" /> Edit This Machine
              </Button>
              <Button variant="secondary" onClick={() => setViewMachineDetails(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modals */}
      <UserMachineModal
        isOpen={userModalOpen}
        user={selectedUserForEdit}
        onClose={() => {
          setUserModalOpen(false);
          setSelectedUserForEdit(null);
        }}
      />
      <MachineModal
        isOpen={machineModalOpen}
        machine={selectedMachineForEdit}
        onClose={() => {
          setMachineModalOpen(false);
          setSelectedMachineForEdit(null);
        }}
      />
      <ResetPasswordModal
        isOpen={!!selectedUserForReset}
        user={selectedUserForReset}
        onClose={() => setSelectedUserForReset(null)}
      />
      <CustomerModal
        isOpen={customerModalOpen}
        customer={selectedCustomerForEdit}
        onClose={() => {
          setCustomerModalOpen(false);
          setSelectedCustomerForEdit(null);
        }}
        onSuccess={(msg) => setFeedback({ type: 'success', text: msg })}
      />
      <ShareCustomerModal
        isOpen={shareModalOpen}
        customer={selectedCustomerForShare}
        onClose={() => {
          setShareModalOpen(false);
          setSelectedCustomerForShare(null);
        }}
        onSuccess={(msg) => setFeedback({ type: 'success', text: msg })}
      />
    </div>
  );
};
