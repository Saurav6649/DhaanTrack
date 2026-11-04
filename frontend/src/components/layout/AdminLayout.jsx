import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  HardHat,
  Receipt,
  FileSpreadsheet,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Bookings / Works', path: '/admin/works', icon: CalendarDays },
    { label: 'Users & Machines', path: '/admin/users-machines', icon: Users },
    { label: 'Contractors', path: '/admin/contractors', icon: HardHat },
    { label: 'Expenses', path: '/admin/expenses', icon: Receipt },
    { label: 'Reports & Export', path: '/admin/reports', icon: FileSpreadsheet },
    { label: 'Master Data', path: '/admin/master-data', icon: Settings },
    { label: 'Recycle Bin', path: '/admin/recycle-bin', icon: Trash2 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between bg-white px-4 py-2.5 border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="DhaanTrack" className="w-8 h-8 rounded-lg shadow-xs" />
          <span className="font-bold text-gray-900 tracking-tight">DhaanTrack</span>
          <span className="text-[10px] bg-brand-100 text-brand-800 font-bold px-1.5 py-0.5 rounded">ADMIN</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle navigation drawer"
          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition focus:outline-none"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay on mobile */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-xs transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } h-screen`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="DhaanTrack" className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl shadow-xs" />
            <div>
              <span className="font-extrabold text-gray-900 leading-none text-base sm:text-lg block">DhaanTrack</span>
              <p className="text-[11px] sm:text-xs text-gray-400 mt-1 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-600" /> Admin Workspace
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
            className="md:hidden p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-40" />
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-gray-200/60 shadow-xs mb-2">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-[11px] text-gray-400 truncate">@{user?.userId}</p>
            </div>
            <span className="shrink-0 text-[10px] bg-brand-100 text-brand-800 font-bold px-1.5 py-0.5 rounded">
              ADMIN
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
