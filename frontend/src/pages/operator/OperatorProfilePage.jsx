import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { BackButton } from '../../components/common/BackButton.jsx';
import {
  User,
  Tractor,
  History,
  Receipt,
  LogOut,
  Phone,
  ShieldCheck,
  ChevronRight,
  Info,
} from 'lucide-react';

export const OperatorProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const machine = user?.assignedMachine;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Top Header with BackButton */}
      <div className="space-y-2">
        <BackButton to="/app/dashboard" />
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Operator Profile</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            View your operator identity, assigned harvester specs, and fast history shortcuts
          </p>
        </div>
      </div>

      {/* Profile Details Card */}
      <Card className="p-5">
        <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-brand-500/25">
            {user?.name?.charAt(0)?.toUpperCase() || 'O'}
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900">{user?.name}</h2>
            <p className="text-xs text-gray-400 font-mono">User ID: @{user?.userId}</p>
            <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-gray-400" /> {user?.mobile}
            </p>
          </div>
        </div>

        {/* Assigned Machine Info */}
        <div className="pt-4 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
            Assigned Harvesting Machine
          </span>
          {machine ? (
            <div className="bg-brand-50/60 p-3.5 rounded-2xl border border-brand-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Tractor className="w-6 h-6 text-brand-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{machine.machineName}</h4>
                  <p className="text-xs font-mono font-semibold text-brand-700">{machine.machineNumber}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Capacity: {machine.capacityPerHour || 1} Acre/hr
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-gray-900 block">₹{machine.customerHourlyRate}/hr</span>
                <span className="text-[10px] text-gray-500">Customer Rate</span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-500 italic flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-500 shrink-0" />
              <span>No machine currently assigned. Please ask your administrator to link a harvester.</span>
            </div>
          )}
        </div>
      </Card>

      {/* Account Security Notice */}
      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-3 text-xs text-gray-600">
        <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-gray-800 block">Account Security Managed by Admin</span>
          <span>
            To reset or change your operator account password, please contact your system administrator.
          </span>
        </div>
      </div>

      {/* Navigation Links to Work & Expense History */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          to="/app/history/work"
          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-brand-300 hover:shadow-md transition min-h-[48px]"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-gray-900 block">Work History</span>
              <span className="text-xs text-gray-400">View past harvesting projects</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300" />
        </Link>

        <Link
          to="/app/history/expense"
          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-brand-300 hover:shadow-md transition min-h-[48px]"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-gray-900 block">Expense History</span>
              <span className="text-xs text-gray-400">Monthly expense logs & food</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300" />
        </Link>
      </div>

      {/* Logout Button */}
      <Button
        size="lg"
        variant="secondary"
        onClick={handleLogout}
        className="w-full text-rose-600 hover:bg-rose-50 border border-rose-200/60 font-bold min-h-[44px]"
      >
        <LogOut className="w-4 h-4 mr-2" /> Sign Out from DhaanTrack
      </Button>
    </div>
  );
};
