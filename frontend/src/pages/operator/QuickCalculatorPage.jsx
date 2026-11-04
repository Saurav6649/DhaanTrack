import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client.js';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Alert } from '../../components/common/Alert.jsx';
import { BackButton } from '../../components/common/BackButton.jsx';
import { Timer, Clock, IndianRupee, Sparkles, CheckCircle, ArrowRight } from 'lucide-react';

export const QuickCalculatorPage = () => {
  const { user } = useAuth();
  const machine = user?.assignedMachine;
  const defaultRate = machine?.customerHourlyRate || 2500;

  const [activeMethod, setActiveMethod] = useState('minutes'); // 'minutes' | 'time'

  // Method 1: Minutes
  const [totalMinutes, setTotalMinutes] = useState(60);
  const [minutesHourlyRate, setMinutesHourlyRate] = useState(defaultRate);
  const [method1Amount, setMethod1Amount] = useState(defaultRate);

  // Method 2: Start / End Time
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:30');
  const [timeHourlyRate, setTimeHourlyRate] = useState(defaultRate);
  const [timeDiffFormatted, setTimeDiffFormatted] = useState('2h 30m');
  const [timeDiffHours, setTimeDiffHours] = useState(2.5);
  const [method2Amount, setMethod2Amount] = useState(0);

  // Method 1 calculation effect
  useEffect(() => {
    const mins = Number(totalMinutes) || 0;
    const rate = Number(minutesHourlyRate) || 0;
    const amt = Math.round(((mins / 60) * rate) * 100) / 100;
    setMethod1Amount(amt);
  }, [totalMinutes, minutesHourlyRate]);

  // Method 2 calculation effect (Instant with midnight crossing support)
  useEffect(() => {
    if (!startTime || !endTime) return;
    try {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);

      if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return;

      let startTotal = startH * 60 + startM;
      let endTotal = endH * 60 + endM;

      // Midnight crossing check: e.g. 23:00 to 01:30
      if (endTotal < startTotal) {
        endTotal += 24 * 60;
      }

      const diffMin = endTotal - startTotal;
      const hours = Number((diffMin / 60).toFixed(2));
      const hPart = Math.floor(diffMin / 60);
      const mPart = diffMin % 60;

      setTimeDiffFormatted(`${hPart}h ${mPart}m`);
      setTimeDiffHours(hours);

      const rate = Number(timeHourlyRate) || 0;
      const amt = Math.round(((diffMin / 60) * rate) * 100) / 100;
      setMethod2Amount(amt);
    } catch (e) {
      // Ignore intermediate typing errors
    }
  }, [startTime, endTime, timeHourlyRate]);

  return (
    <div className="space-y-6 pb-8">
      {/* Top Header with BackButton */}
      <div className="space-y-2">
        <BackButton to="/app/dashboard" />
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Quick Time & Billing Calculator</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Fast on-the-spot customer billing calculation using total minutes or clock times
          </p>
        </div>
      </div>

      {/* Method Selection Tabs */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveMethod('minutes')}
          className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all text-center ${
            activeMethod === 'minutes'
              ? 'bg-white text-brand-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Method 1: Total Minutes
        </button>
        <button
          type="button"
          onClick={() => setActiveMethod('time')}
          className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all text-center ${
            activeMethod === 'time'
              ? 'bg-white text-brand-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Method 2: Start / End Time
        </button>
      </div>

      {/* Method 1: Minutes */}
      {activeMethod === 'minutes' && (
        <div className="space-y-5">
          {/* Amount Display Result Banner */}
          <div className="bg-gradient-to-br from-brand-600 to-emerald-700 text-white rounded-3xl p-6 text-center shadow-lg shadow-brand-600/20">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-200 block mb-1">
              Customer Total Amount
            </span>
            <div className="text-4xl sm:text-5xl font-black tracking-tight text-white my-1">
              ₹{method1Amount}
            </div>
            <p className="text-xs text-brand-100 font-medium mt-1">
              For {totalMinutes} Minutes ({Number((totalMinutes / 60).toFixed(2))} Hours) at ₹{minutesHourlyRate}/hr
            </p>
          </div>

          <Card className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Total Worked Minutes *</label>
              <input
                type="number"
                min={1}
                value={totalMinutes}
                onChange={(e) => setTotalMinutes(e.target.value)}
                placeholder="e.g. 75"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xl font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            {/* Quick Pill Shortcuts */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[30, 45, 60, 90, 120, 150, 180].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTotalMinutes(m)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    Number(totalMinutes) === m
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {m} mins ({m / 60}h)
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Hourly Rate (₹/Hr) *</label>
              <input
                type="number"
                value={minutesHourlyRate}
                onChange={(e) => setMinutesHourlyRate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-base font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </Card>
        </div>
      )}

      {/* Method 2: Start / End Time */}
      {activeMethod === 'time' && (
        <div className="space-y-5">
          {/* Result Banner */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 text-center shadow-lg shadow-blue-600/20">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200 block mb-1">
              Calculated Duration & Bill
            </span>
            <div className="text-4xl sm:text-5xl font-black tracking-tight text-white my-1">
              ₹{method2Amount}
            </div>
            <div className="flex items-center justify-center gap-3 text-xs text-blue-100 font-semibold mt-1">
              <span>Duration: {timeDiffFormatted}</span>
              <span>•</span>
              <span>{timeDiffHours} Hours</span>
              <span>•</span>
              <span>₹{timeHourlyRate}/hr</span>
            </div>
          </div>

          <Card className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Start Time *</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-base font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">End Time *</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-base font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-center justify-between text-xs text-blue-900">
              <span className="font-medium">Calculated Time Elapsed:</span>
              <span className="font-bold text-sm">{timeDiffFormatted} ({timeDiffHours} hrs)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Rate (₹/Hr) *</label>
              <input
                type="number"
                value={timeHourlyRate}
                onChange={(e) => setTimeHourlyRate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-base font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <p className="text-[11px] text-gray-400 italic">
              * Supports midnight crossing automatically (e.g. 10:30 PM to 01:00 AM next day).
            </p>
          </Card>
        </div>
      )}
    </div>
  );
};
