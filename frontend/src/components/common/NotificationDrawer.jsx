import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { api } from '../../api/client.js';
import {
  Bell,
  X,
  Phone,
  Copy,
  Check,
  CheckCheck,
  MapPin,
  User,
  Calendar,
  Clock,
  ExternalLink,
  Share2,
} from 'lucide-react';

export const NotificationDrawer = ({ isOpen, onClose, onSelectCustomer }) => {
  const [copyFeedback, setCopyFeedback] = useState({});
  const [markingAllRead, setMarkingAllRead] = useState(false);

  // Fetch in-app notifications
  const { data: notifData, isLoading } = useSWR(
    isOpen ? '/api/notifications' : null,
    { refreshInterval: isOpen ? 8000 : 0 }
  );

  const notifications = notifData?.notifications || notifData?.data?.notifications || [];
  const unreadCount = notifData?.unreadCount ?? notifData?.data?.unreadCount ?? 0;

  if (!isOpen) return null;

  // Copy mobile number to clipboard
  const handleCopy = async (mobile, id) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(mobile);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = mobile;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopyFeedback((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setCopyFeedback((prev) => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  // Mark single notification as read
  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      await mutate('/api/notifications');
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      setMarkingAllRead(true);
      await api.post('/api/notifications/mark-all-read');
      await mutate('/api/notifications');
    } catch (err) {
      console.error('Failed to mark all notifications read', err);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-gray-100">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h2 className="font-black text-gray-900 text-base">Notifications</h2>
                <p className="text-xs text-gray-500">
                  {unreadCount > 0 ? `${unreadCount} unread update(s)` : 'All caught up'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markingAllRead}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 transition min-h-[36px]"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark All Read</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List of Notifications */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-3 sm:p-4 space-y-3">
            {isLoading ? (
              <div className="py-16 text-center text-gray-400 text-sm">
                <p className="font-semibold">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="font-bold text-gray-700 text-sm">No Notifications Yet</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                  When other team members or admin share customer contacts with you, they will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const customerData = n.customer || {};
                const metadata = n.metadata || {};
                const customerName = customerData.customerName || metadata.customerName || 'Customer';
                const mobileNumber = customerData.mobileNumber || metadata.mobileNumber;
                const localArea = customerData.localArea || metadata.localArea;
                const landAreaAcres = customerData.landAreaAcres || metadata.landAreaAcres;
                const priority = customerData.priority || metadata.priority;
                const remark = customerData.remark || metadata.remark;
                const isCopied = copyFeedback[n._id];

                return (
                  <div
                    key={n._id}
                    className={`p-3.5 rounded-2xl transition border ${
                      !n.isRead
                        ? 'bg-blue-50/40 border-blue-200/80 shadow-xs'
                        : 'bg-white border-gray-100 hover:bg-gray-50/60'
                    }`}
                  >
                    {/* Top Row: Sender & Timestamp */}
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-gray-900">
                        <Share2 className="w-3.5 h-3.5 text-brand-600" />
                        <span>{n.sender?.name || 'A teammate'}</span>
                        <span className="text-[11px] font-normal text-gray-500">shared a lead</span>
                      </div>
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">
                        {formatDate(n.createdAt)}
                      </span>
                    </div>

                    {/* Customer Snippet Box */}
                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs space-y-2 mt-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-black text-gray-900 text-sm">{customerName}</p>
                            {priority && (
                              <span
                                className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${
                                  priority === 'HIGH'
                                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                                    : priority === 'MEDIUM'
                                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                }`}
                              >
                                {priority}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                            {localArea && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                                <span className="truncate">{localArea}</span>
                              </span>
                            )}
                            {landAreaAcres && (
                              <span className="font-bold text-gray-700 bg-gray-50 px-1.5 py-0.2 rounded border border-gray-200 text-[10px]">
                                {landAreaAcres} Acre
                              </span>
                            )}
                          </div>
                        </div>

                        {mobileNumber && (
                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-gray-800 block">
                              {mobileNumber}
                            </span>
                          </div>
                        )}
                      </div>

                      {remark && (
                        <p className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded-lg border border-gray-100/60">
                          "{remark}"
                        </p>
                      )}

                      {/* Quick Action Buttons for Notification */}
                      <div className="pt-2 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                        {/* View Customer Record */}
                        <button
                          type="button"
                          onClick={() => {
                            if (!n.isRead) handleMarkAsRead(n._id);
                            if (onSelectCustomer) {
                              onSelectCustomer(n.customer || n.metadata);
                            }
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 transition min-h-[34px]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Customer</span>
                        </button>

                        {mobileNumber && (
                          <>
                            {/* Direct Call */}
                            <a
                              href={`tel:${mobileNumber}`}
                              onClick={() => !n.isRead && handleMarkAsRead(n._id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition min-h-[34px] shadow-2xs"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Call</span>
                            </a>

                            {/* Copy Number */}
                            <button
                              type="button"
                              onClick={() => handleCopy(mobileNumber, n._id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition min-h-[34px]"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700 font-bold">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-gray-500" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </>
                        )}

                        {/* Mark As Read */}
                        {!n.isRead && (
                          <button
                            type="button"
                            onClick={() => handleMarkAsRead(n._id)}
                            className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark read</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
