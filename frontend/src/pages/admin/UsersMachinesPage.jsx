import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';

export const UsersMachinesPage = () => {
  const navigate = useNavigate();

  // Active view tab: 'users' (Operators & Metrics) | 'machines' (Harvester Machines CRUD)
  const [activeTab, setActiveTab] = useState('users');

  // SWR data
  const { data: usersData, isLoading: usersLoading } = useSWR('/api/users/combined');
  const users = usersData?.users || [];

  const { data: machinesData, isLoading: machinesLoading } = useSWR('/api/machines');
  const machines = machinesData?.machines || [];

  // Modals state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [machineModalOpen, setMachineModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [selectedUserForReset, setSelectedUserForReset] = useState(null);
  const [selectedMachineForEdit, setSelectedMachineForEdit] = useState(null);
  const [viewMachineDetails, setViewMachineDetails] = useState(null);

  // Alerts
  const [feedback, setFeedback] = useState({ type: '', text: '' });

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

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
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
      <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl w-fit">
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
    </div>
  );
};
