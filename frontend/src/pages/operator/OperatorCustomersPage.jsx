import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import useSWR, { mutate } from 'swr';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Alert } from '../../components/common/Alert.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { CustomerModal } from '../../components/common/CustomerModal.jsx';
import { ShareCustomerModal } from '../../components/common/ShareCustomerModal.jsx';
import {
  Users,
  User,
  Plus,
  Phone,
  MapPin,
  Share2,
  Copy,
  Check,
  Search,
  Edit2,
  ArrowUpDown,
  Filter,
  Layers,
} from 'lucide-react';

export const OperatorCustomersPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'my' | 'shared'
  const [priorityFilter, setPriorityFilter] = useState('all'); // 'all' | 'HIGH' | 'MEDIUM' | 'LOW'
  const [sortBy, setSortBy] = useState('acreage_desc'); // 'acreage_desc' | 'priority_desc' | 'recently_added'
  const [copiedId, setCopiedId] = useState(null);

  // Modals state
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedCustomerForEdit, setSelectedCustomerForEdit] = useState(null);
  const [selectedCustomerForShare, setSelectedCustomerForShare] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // SWR fetch customers with backend filters
  const queryParams = new URLSearchParams({
    sortBy,
    ...(priorityFilter !== 'all' && { priority: priorityFilter }),
    ...(searchQuery.trim() && { search: searchQuery.trim() }),
  }).toString();

  const { data: customersData, isLoading } = useSWR(`/api/customers?${queryParams}`);
  const customers = customersData?.customers || customersData?.data?.customers || (Array.isArray(customersData) ? customersData : []);

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

  // Filter customers by tab (my vs shared)
  const currentUserId = user?._id ? String(user._id) : '';
  const displayedCustomers = customers.filter((c) => {
    const creatorId = typeof c.createdBy === 'object' && c.createdBy !== null ? String(c.createdBy._id) : String(c.createdBy);
    const isCreatedByMe = currentUserId && creatorId === currentUserId;
    const isSharedWithMe = (c.sharedWith || []).some((u) => {
      const uId = typeof u === 'object' && u !== null ? String(u._id) : String(u);
      return uId === currentUserId;
    });

    if (filterTab === 'my' && !isCreatedByMe) return false;
    if (filterTab === 'shared' && !isSharedWithMe) return false;
    return true;
  });

  return (
    <div className="space-y-4 pb-12">
      {/* Page Title & Add Button */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Customers & Leads
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Central contacts directory & operator sharing
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setSelectedCustomerForEdit(null);
            setCustomerModalOpen(true);
          }}
          className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white min-h-[42px] shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Customer
        </Button>
      </div>

      {feedback.text && (
        <Alert
          type={feedback.type}
          message={feedback.text}
          onClose={() => setFeedback({ type: '', text: '' })}
        />
      )}

      {/* Search & Sort Bar */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, village, remark..."
              className="w-full pl-10 pr-12 py-2.5 rounded-2xl border border-gray-200 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-2 rounded-2xl text-xs shadow-2xs shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-bold text-gray-800 focus:outline-none cursor-pointer text-xs"
            >
              <option value="acreage_desc">Highest Acreage First</option>
              <option value="priority_desc">Highest Priority First</option>
              <option value="recently_added">Recently Added</option>
            </select>
          </div>
        </div>

        {/* Priority Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-0.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Priority:
          </span>
          <button
            type="button"
            onClick={() => setPriorityFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition text-xs whitespace-nowrap ${
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
            className={`px-2.5 py-1 rounded-lg font-bold transition text-xs whitespace-nowrap ${
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
            className={`px-2.5 py-1 rounded-lg font-bold transition text-xs whitespace-nowrap ${
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
            className={`px-2.5 py-1 rounded-lg font-bold transition text-xs whitespace-nowrap ${
              priorityFilter === 'LOW'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Low (&lt; 2 Acre)
          </button>
        </div>

        {/* Access Tab Filters */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl w-fit text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterTab === 'all'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            All Accessible ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('my')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterTab === 'my'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Added by Me
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('shared')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterTab === 'shared'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Shared with Me
          </button>
        </div>
      </div>

      {/* Customer Cards List */}
      <div className="space-y-3">
        {isLoading ? (
          <LoadingSpinner label="Loading customer contacts..." />
        ) : displayedCustomers.length === 0 ? (
          <div className="py-16 text-center text-gray-400 bg-white rounded-3xl border border-gray-100 p-6">
            <User className="w-12 h-12 text-gray-200 mx-auto mb-2" />
            <p className="font-bold text-gray-700 text-base">
              {searchQuery ? 'No Customers Match Search' : 'No Customers Found'}
            </p>
            <p className="text-xs text-gray-400 mt-1 mb-4">
              {searchQuery
                ? 'Try a different search term.'
                : 'Click "Add Customer" to save customer details and share with your team.'}
            </p>
            {!searchQuery && (
              <Button
                variant="primary"
                onClick={() => {
                  setSelectedCustomerForEdit(null);
                  setCustomerModalOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Customer
              </Button>
            )}
          </div>
        ) : (
          displayedCustomers.map((c, idx) => {
            const isCopied = copiedId === c._id;
            const sharedCount = (c.sharedWith || []).length;
            const creatorId = typeof c.createdBy === 'object' && c.createdBy !== null ? String(c.createdBy._id) : String(c.createdBy);
            const isCreatedByMe = currentUserId && creatorId === currentUserId;
            const rankNum = c.rank || idx + 1;
            const priorityBadge =
              c.priority === 'HIGH'
                ? 'bg-rose-100 text-rose-800 border-rose-200'
                : c.priority === 'MEDIUM'
                ? 'bg-amber-100 text-amber-800 border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border-emerald-200';

            return (
              <div
                key={c._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3 hover:border-gray-200 transition"
              >
                {/* Header: Rank, Name, Priority, Acreage */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="w-7 h-7 rounded-xl bg-gray-900 text-white font-mono font-black text-xs flex items-center justify-center shrink-0">
                      #{rankNum}
                    </span>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base flex items-center gap-1.5">
                        {c.customerName}
                      </h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{c.localArea}</span>
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
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopyMobile(c.mobileNumber, c._id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-200"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Remark */}
                {c.remark && (
                  <p className="text-xs text-gray-600 italic bg-gray-50 p-2.5 rounded-xl border border-gray-100/80">
                    "{c.remark}"
                  </p>
                )}

                {/* Meta details: Created by & Shared with */}
                <div className="text-[11px] bg-gray-50/70 p-2.5 rounded-xl space-y-1 text-gray-500 border border-gray-100/60">
                  <div className="flex items-center justify-between">
                    <span>Added By:</span>
                    <span className="font-semibold text-gray-700">
                      {isCreatedByMe ? 'You' : c.createdBy?.name || 'Admin'}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="shrink-0">Shared With:</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {sharedCount === 0 ? (
                        <span className="text-gray-400 italic">None</span>
                      ) : (
                        (c.sharedWith || []).map((u) => (
                          <span
                            key={u._id || u}
                            className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold text-[10px]"
                          >
                            {String(u._id || u) === currentUserId ? 'You' : u.name || u.userId || 'Operator'}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons Footer */}
                <div className="flex items-center justify-end pt-2 border-t border-gray-100 gap-2">
                  {/* Share Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomerForShare(c);
                      setShareModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 transition min-h-[38px]"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>

                  {/* Edit Button (Permitted for Operators and Admins) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomerForEdit(c);
                      setCustomerModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition min-h-[38px]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
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
