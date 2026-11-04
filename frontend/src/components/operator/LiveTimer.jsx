import React, { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { api } from '../../api/client.js';
import { Button } from '../common/Button.jsx';
import { Badge } from '../common/Badge.jsx';
import { Alert } from '../common/Alert.jsx';
import { Play, Pause, CheckCircle2, RotateCw, Clock, User, Phone, MapPin, IndianRupee } from 'lucide-react';

export const LiveTimer = ({ onCompleted }) => {
  // Fetch active session from MongoDB via SWR
  const { data, error, isLoading, mutate: revalidateActive } = useSWR(
    '/api/work-sessions/active',
    {
      refreshInterval: 5000, // Background sync every 5 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const activeSession = data?.activeSession || null;

  const [liveSeconds, setLiveSeconds] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Synchronize with backend liveWorkedSeconds
  useEffect(() => {
    if (!activeSession) {
      setLiveSeconds(0);
      return;
    }

    const baseSeconds = activeSession.liveWorkedSeconds || activeSession.totalWorkedSeconds || 0;
    const syncTime = Date.now();
    setLiveSeconds(baseSeconds);

    if (activeSession.status === 'IN_PROGRESS') {
      const interval = setInterval(() => {
        const delta = Math.floor((Date.now() - syncTime) / 1000);
        setLiveSeconds(baseSeconds + delta);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeSession]);

  const handleStart = async () => {
    if (!activeSession) return;
    try {
      setActionLoading(true);
      setActionError('');
      await api.post(`/api/work-sessions/${activeSession._id}/start`);
      await revalidateActive();
      await mutate((k) => typeof k === 'string' && k.startsWith('/api/work-sessions'));
    } catch (err) {
      setActionError(err.message || 'Failed to start session.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = async () => {
    if (!activeSession) return;
    try {
      setActionLoading(true);
      setActionError('');
      await api.post(`/api/work-sessions/${activeSession._id}/pause`);
      await revalidateActive();
      await mutate((k) => typeof k === 'string' && k.startsWith('/api/work-sessions'));
    } catch (err) {
      setActionError(err.message || 'Failed to pause session.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    if (!activeSession) return;
    try {
      setActionLoading(true);
      setActionError('');
      await api.post(`/api/work-sessions/${activeSession._id}/resume`);
      await revalidateActive();
      await mutate((k) => typeof k === 'string' && k.startsWith('/api/work-sessions'));
    } catch (err) {
      setActionError(err.message || 'Failed to resume session.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!activeSession) return;
    const confirm = window.confirm(
      `Are you sure you want to finish work for ${activeSession.customerName}? Final billing will be calculated.`
    );
    if (!confirm) return;

    try {
      setActionLoading(true);
      setActionError('');
      const res = await api.post(`/api/work-sessions/${activeSession._id}/complete`);
      await revalidateActive();
      await mutate((k) => typeof k === 'string' && k.startsWith('/api/work-sessions'));
      if (onCompleted) {
        onCompleted(res.data?.data?.workSession);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to complete session.');
    } finally {
      setActionLoading(false);
    }
  };

  // Format HH:MM:SS
  const formatTimer = (totalSec) => {
    const sec = Math.max(0, Math.floor(totalSec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return {
      hours: pad(h),
      minutes: pad(m),
      seconds: pad(s),
      decimalHours: sec > 0 ? Math.max(0.01, sec / 3600).toFixed(2) : '0.00',
    };
  };

  const timer = formatTimer(liveSeconds);

  if (!activeSession) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm text-center">
        <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">No Running Work Session</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
          Start a new booking or choose a pending work session to begin harvesting timer.
        </p>
      </div>
    );
  }

  const approxAmount = Math.round(((liveSeconds / 3600) * (activeSession.customerRateSnapshot || 0)) * 100) / 100;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-gray-100 shadow-lg shadow-gray-100/50 space-y-6">
      {actionError && <Alert type="error" message={actionError} />}

      {/* Top Customer Info Bar */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Current Work Session</span>
          <h2 className="text-lg sm:text-xl font-black text-gray-900 mt-0.5">{activeSession.customerName}</h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-gray-400" /> {activeSession.customerMobile}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" /> {activeSession.fieldLocation}
            </span>
          </div>
        </div>
        <Badge status={activeSession.status} className="shrink-0" />
      </div>

      {/* Live Prominent Timer Display */}
      <div className="py-4 text-center bg-gradient-to-b from-brand-50/60 to-white rounded-2xl border border-brand-100/80">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-700 block mb-1">
          {activeSession.status === 'PAUSED' ? 'TIMER PAUSED' : 'WORKING TIME'}
        </span>

        {/* Large Counter */}
        <div className="flex items-center justify-center font-mono font-black text-4xl sm:text-6xl tracking-tight text-gray-900 my-1 select-none">
          <span className="w-14 sm:w-24 text-center">{timer.hours}</span>
          <span className="text-brand-500 animate-pulse">:</span>
          <span className="w-14 sm:w-24 text-center">{timer.minutes}</span>
          <span className="text-brand-500 animate-pulse">:</span>
          <span className="w-14 sm:w-24 text-center text-brand-600">{timer.seconds}</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-semibold text-gray-600 mt-2 px-2 text-center">
          <span>{timer.decimalHours} Total Hours</span>
          <span>•</span>
          <span className="text-brand-700 font-bold">₹{activeSession.customerRateSnapshot}/hr Rate</span>
          <span>•</span>
          <span className="text-emerald-700 font-bold">₹{approxAmount} Live Total</span>
        </div>
      </div>

      {/* Large Operator Action Buttons */}
      <div className="space-y-3">
        {activeSession.status === 'IN_PROGRESS' ? (
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="xl"
              variant="secondary"
              isLoading={actionLoading}
              onClick={handlePause}
              className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300/60"
            >
              <Pause className="w-6 h-6 mr-1" /> Pause
            </Button>

            <Button
              size="xl"
              variant="primary"
              isLoading={actionLoading}
              onClick={handleComplete}
              className="bg-brand-600 hover:bg-brand-700"
            >
              <CheckCircle2 className="w-6 h-6 mr-1" /> Complete
            </Button>
          </div>
        ) : activeSession.status === 'PAUSED' ? (
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="xl"
              variant="primary"
              isLoading={actionLoading}
              onClick={handleResume}
              className="bg-brand-600 hover:bg-brand-700"
            >
              <Play className="w-6 h-6 mr-1" /> Resume
            </Button>

            <Button
              size="xl"
              variant="secondary"
              isLoading={actionLoading}
              onClick={handleComplete}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <CheckCircle2 className="w-6 h-6 mr-1" /> Complete
            </Button>
          </div>
        ) : (
          <Button
            size="xl"
            variant="primary"
            isLoading={actionLoading}
            onClick={handleStart}
            className="w-full text-xl py-4 bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/25"
          >
            <Play className="w-6 h-6 mr-2" /> Start Work
          </Button>
        )}
      </div>
    </div>
  );
};
