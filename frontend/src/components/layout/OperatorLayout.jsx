import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  User,
  LogOut,
  Tractor,
  Home,
  Clock,
  Calculator,
  CalendarCheck,
  History,
  Receipt,
  CreditCard,
  ChevronDown,
  Plus,
} from 'lucide-react';

export const OperatorLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const machine = user?.assignedMachine;

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-xs">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Brand & Machine */}
          <Link to="/app/dashboard" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="DhaanTrack" className="w-8 h-8 rounded-lg shadow-xs" />
            <div>
              <span className="font-extrabold text-base tracking-tight text-gray-900">DhaanTrack</span>
              {machine && (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-brand-700 bg-brand-50 px-1.5 py-0.2 rounded">
                  <Tractor className="w-3 h-3 text-brand-600" />
                  <span className="truncate max-w-[120px]">{machine.machineNumber || machine.machineName}</span>
                </div>
              )}
            </div>
          </Link>

          {/* Top-Right Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              aria-label="Operator menu"
              className="flex items-center gap-1.5 p-1 rounded-full hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[44px] min-w-[44px] justify-center"
            >
              <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {/* Profile Dropdown */}
            {profileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/10 backdrop-blur-2xs"
                  onClick={() => setProfileMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">ID: {user?.userId}</p>
                    {machine && (
                      <p className="text-xs text-brand-700 font-semibold mt-1 truncate">
                        {machine.machineName} ({machine.machineNumber})
                      </p>
                    )}
                  </div>

                  <div className="py-1 text-sm">
                    <Link
                      to="/app/dashboard"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 min-h-[44px] active:bg-gray-100 transition"
                    >
                      <Home className="w-4 h-4 text-gray-400 shrink-0" /> Dashboard
                    </Link>
                    <Link
                      to="/app/timer"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 min-h-[44px] active:bg-gray-100 transition"
                    >
                      <Clock className="w-4 h-4 text-brand-600 shrink-0" /> Active Work Timer
                    </Link>
                    <Link
                      to="/app/history/work"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 min-h-[44px] active:bg-gray-100 transition"
                    >
                      <History className="w-4 h-4 text-gray-400 shrink-0" /> Work History
                    </Link>
                    <Link
                      to="/app/history/expense"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 min-h-[44px] active:bg-gray-100 transition"
                    >
                      <Receipt className="w-4 h-4 text-gray-400 shrink-0" /> Expense History
                    </Link>
                    <Link
                      to="/app/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 min-h-[44px] active:bg-gray-100 transition"
                    >
                      <User className="w-4 h-4 text-gray-400 shrink-0" /> Operator Profile
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 min-h-[44px] active:bg-rose-100 transition font-semibold"
                    >
                      <LogOut className="w-4 h-4 shrink-0" /> Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container - Mobile Centered Light UI */}
      <main className="flex-1 max-w-xl w-full mx-auto p-3.5 sm:p-5 overflow-x-hidden relative">
        <Outlet />
      </main>

      {/* Floating Quick Action Button: + New Work FAB */}
      {location.pathname !== '/app/field-calculator' && (
        <Link
          to="/app/field-calculator"
          aria-label="Create new harvesting work"
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-30 inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-black px-4 py-3 rounded-full shadow-lg shadow-brand-600/35 transition-all text-xs sm:text-sm min-h-[46px] select-none"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span>+ New Work</span>
        </Link>
      )}
    </div>
  );
};
