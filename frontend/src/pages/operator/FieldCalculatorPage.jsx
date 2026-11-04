import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useSWR, { mutate } from 'swr';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client.js';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Alert } from '../../components/common/Alert.jsx';
import { BackButton } from '../../components/common/BackButton.jsx';
import {
  Calculator,
  Navigation,
  MapPin,
  Clock,
  IndianRupee,
  CalendarCheck,
  CheckCircle2,
  Sparkles,
  Tractor,
  Play,
  ListTodo,
  PlusCircle,
  AlertCircle,
} from 'lucide-react';

const schema = z.object({
  customerName: z.string().min(2, 'Customer name is required'),
  customerMobile: z.string().regex(/^\d{10}$/, 'Must be a 10-digit mobile number'),
  customerHourlyRate: z.coerce.number().positive('Customer rate must be greater than zero'),
  katha: z.coerce.number().min(0).default(0),
  acre: z.coerce.number().min(0).optional().default(0),
  fieldLocation: z.string().min(2, 'Field location is required'),
});

export const FieldCalculatorPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const machine = user?.assignedMachine;

  const { data: masterData } = useSWR('/api/master-data');
  const { data: activeData } = useSWR('/api/work-sessions/active');
  const activeSession = activeData?.activeSession;

  const kathaPerAcreFactor = masterData?.kathaPerAcre || 32;
  const machineCapacity = machine?.capacityPerHour || masterData?.machineCapacityPerHour || 1.0;
  const defaultRate = machine?.customerHourlyRate || 2500;

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState({ latitude: null, longitude: null });
  const [gpsAddressMsg, setGpsAddressMsg] = useState('');
  const [serverError, setServerError] = useState('');
  const [createdBooking, setCreatedBooking] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: '',
      customerMobile: '',
      customerHourlyRate: defaultRate,
      katha: '',
      acre: '',
      fieldLocation: '',
    },
  });

  useEffect(() => {
    if (machine?.customerHourlyRate) {
      setValue('customerHourlyRate', machine.customerHourlyRate);
    }
  }, [machine?.customerHourlyRate, setValue]);

  const enteredKatha = watch('katha');
  const enteredAcre = watch('acre');
  const enteredRate = watch('customerHourlyRate');
  const userRate = Number(enteredRate) > 0 ? Number(enteredRate) : 0;

  // Live Instant Frontend Preview
  let calculatedAcre = Number(enteredAcre) || 0;
  if (!calculatedAcre && Number(enteredKatha) > 0) {
    calculatedAcre = Number((Number(enteredKatha) / kathaPerAcreFactor).toFixed(4));
  }

  // Duration in hours & minutes: totalMinutes = (Land Area / Capacity) * 60
  const totalMinutes = calculatedAcre > 0 ? Math.round((calculatedAcre / machineCapacity) * 60) : 0;
  const estimatedHours = calculatedAcre > 0 ? Number((calculatedAcre / machineCapacity).toFixed(2)) : 0;
  const expectedCustomerAmount = userRate > 0 && totalMinutes > 0
    ? Math.round(((totalMinutes / 60) * userRate) * 100) / 100
    : 0;

  // Format Duration into clean hours and minutes (never display 0 hrs when under 1 hr)
  const formatDurationDisplay = (mins) => {
    if (!mins || mins <= 0) return '0 Minutes';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} Minute${m > 1 ? 's' : ''}`;
    if (m === 0) return `${h} Hour${h > 1 ? 's' : ''}`;
    return `${h} Hour${h > 1 ? 's' : ''} ${m} Minute${m > 1 ? 's' : ''}`;
  };

  const formattedWorkingTime = formatDurationDisplay(totalMinutes);

  // GPS Location Trigger
  const handleGetGPSLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setGpsAddressMsg('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGpsCoordinates({ latitude, longitude });
        const locString = `Field GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        setValue('fieldLocation', locString);
        setGpsAddressMsg(`Captured GPS coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        alert(`Could not fetch location: ${err.message}. Please enter manual field address.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const onSubmit = async (values) => {
    if (!machine) {
      setServerError('No machine assigned to your account. Please contact admin.');
      return;
    }

    try {
      setServerError('');
      const payload = {
        customerName: values.customerName,
        customerMobile: values.customerMobile,
        fieldLocation: values.fieldLocation,
        customerHourlyRate: Number(values.customerHourlyRate),
        fieldAreaKatha: Number(values.katha) || 0,
        fieldAreaAcre: calculatedAcre,
        locationCoordinates: gpsCoordinates,
      };

      const res = await api.post('/api/work-sessions', payload);
      await mutate((k) => typeof k === 'string' && k.startsWith('/api/work-sessions'));
      const newSession = res.data?.data?.workSession || res.data?.workSession;
      setCreatedBooking(newSession);
    } catch (err) {
      setServerError(err.message || 'Failed to create work booking.');
    }
  };

  const handleBookAnother = () => {
    setCreatedBooking(null);
    reset({
      customerName: '',
      customerMobile: '',
      customerHourlyRate: userRate || defaultRate,
      katha: '',
      acre: '',
      fieldLocation: '',
    });
    setGpsCoordinates({ latitude: null, longitude: null });
    setGpsAddressMsg('');
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Top Header with BackButton */}
      <div className="space-y-2">
        <BackButton to="/app/dashboard" />
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Field Estimate Calculator</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Calculate expected working duration and customer quote based on local land area
          </p>
        </div>
      </div>

      {!machine && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
          <Tractor className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold block">No Harvester Assigned</span>
            <span>
              You do not have a machine linked to your operator account. Please ask the administrator to assign a machine.
            </span>
          </div>
        </div>
      )}

      {serverError && <Alert type="error" message={serverError} />}

      {/* Success Booking Banner with Conflict-Aware Actions */}
      {createdBooking && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-emerald-950">Work Booking Created Successfully!</h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Customer: <span className="font-bold">{createdBooking.customerName}</span> ({createdBooking.customerMobile}) · Location: {createdBooking.fieldLocation}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-emerald-900 font-semibold">
                <span>Rate: ₹{createdBooking.customerRateSnapshot}/hr</span>
                <span>•</span>
                <span>Est. Duration: {formatDurationDisplay(Math.round(createdBooking.estimatedHours * 60))}</span>
                <span>•</span>
                <span>Est. Bill: ₹{createdBooking.estimatedAmount}</span>
              </div>
            </div>
          </div>

          {activeSession ? (
            <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-3 text-xs text-amber-950 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Machine currently in use:</span>
                <span>
                  Another session for customer <span className="font-bold">{activeSession.customerName}</span> is currently active ({activeSession.status}). Please pause or complete it before starting this new work.
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white/80 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-900">
              <span className="font-bold">Machine is available:</span> You can start this work timer now or manage it later from Today's Works.
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-emerald-200">
            {!activeSession ? (
              <Button
                variant="primary"
                size="md"
                className="font-bold flex-1 min-h-[44px]"
                onClick={() => navigate('/app/timer')}
              >
                <Play className="w-4 h-4 mr-1.5" /> Start Timer Now
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                className="font-bold flex-1 min-h-[44px]"
                onClick={() => navigate('/app/timer')}
              >
                <Clock className="w-4 h-4 mr-1.5" /> View Active Timer
              </Button>
            )}

            <Button
              variant="outline"
              size="md"
              className="font-semibold flex-1 min-h-[44px] bg-white"
              onClick={() => navigate('/app/today-works')}
            >
              <ListTodo className="w-4 h-4 mr-1.5" /> Today's Works Queue
            </Button>

            <Button
              variant="secondary"
              size="md"
              className="font-semibold min-h-[44px]"
              onClick={handleBookAnother}
            >
              <PlusCircle className="w-4 h-4 mr-1.5" /> Book Another Field
            </Button>
          </div>
        </div>
      )}

      {/* Calculator Calculation Result Preview Banner */}
      {!createdBooking && (
        <div className="bg-gradient-to-br from-emerald-600 to-brand-700 text-white rounded-3xl p-5 shadow-lg shadow-brand-600/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-100 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Live Estimate Preview
            </span>
            <span className="text-xs bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full font-bold">
              Rate: ₹{userRate || 0}/hr
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-brand-500/40">
            <div>
              <span className="text-xs text-brand-100 block">Estimated Working Time:</span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-white block">
                {formattedWorkingTime}
              </span>
              <span className="text-[11px] text-brand-200 block mt-0.5">
                {totalMinutes > 0 ? `${totalMinutes} Total Minutes (${estimatedHours} hrs · ${calculatedAcre} Acres)` : `0 Acres entered`}
              </span>
            </div>

            <div className="sm:text-right">
              <span className="text-xs text-brand-100 block">Expected Customer Amount:</span>
              <span className="text-2xl sm:text-3xl font-black text-white block">₹{expectedCustomerAmount}</span>
              <span className="text-[11px] text-brand-200 block mt-0.5">
                Calculated at ₹{userRate || 0}/hr
              </span>
            </div>
          </div>

          <p className="text-[11px] text-brand-100/80 mt-3 pt-2 border-t border-brand-500/30 italic">
            * Note: Estimate is calculated from {kathaPerAcreFactor} Katha/Acre and harvester capacity {machineCapacity} Acre/hr. Actual billing depends on final worked time.
          </p>
        </div>
      )}

      {/* Input Form */}
      {!createdBooking && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Card className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Name *</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Singh"
                {...register('customerName')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[44px]"
              />
              {errors.customerName && <p className="text-xs text-red-600 mt-1">{errors.customerName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Mobile Number *</label>
              <input
                type="tel"
                maxLength={10}
                placeholder="10-digit number"
                {...register('customerMobile')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[44px]"
              />
              {errors.customerMobile && <p className="text-xs text-red-600 mt-1">{errors.customerMobile.message}</p>}
            </div>

            {/* User-Entered Customer Rate Per Hour */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Customer Rate Per Hour (₹) *
                </label>
                <span className="text-[11px] text-brand-700 font-bold">
                  Machine Default: ₹{defaultRate}/hr
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 5000"
                  {...register('customerHourlyRate')}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-base font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[44px]"
                />
              </div>
              {errors.customerHourlyRate && (
                <p className="text-xs text-red-600 mt-1">{errors.customerHourlyRate.message}</p>
              )}
              <p className="text-[11px] text-gray-500 mt-1">
                Enter the custom hourly rate to charge this customer. Used for estimates, billing, and final balance.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Land Area (Katha)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 16 or 32"
                  {...register('katha')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-base font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Or Direct Acres
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 1.0"
                  {...register('acre')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-base font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            {/* Location with GPS Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700">Field Location *</label>
                <button
                  type="button"
                  onClick={handleGetGPSLocation}
                  disabled={gpsLoading}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-800 focus:outline-none min-h-[36px]"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  {gpsLoading ? 'Fetching GPS...' : 'Use Current GPS'}
                </button>
              </div>
              <input
                type="text"
                placeholder="Village, field sector or address"
                {...register('fieldLocation')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[44px]"
              />
              {gpsAddressMsg && <p className="text-xs text-brand-600 mt-1">{gpsAddressMsg}</p>}
              {errors.fieldLocation && <p className="text-xs text-red-600 mt-1">{errors.fieldLocation.message}</p>}
            </div>
          </Card>

          {/* Action Button */}
          <Button
            type="submit"
            size="xl"
            variant="primary"
            isLoading={isSubmitting}
            className="w-full font-bold shadow-lg shadow-brand-500/25 min-h-[48px]"
          >
            <CalendarCheck className="w-5 h-5 mr-2" /> Book Field & Create Work
          </Button>
        </form>
      )}
    </div>
  );
};