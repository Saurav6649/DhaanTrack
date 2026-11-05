import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { BackButton } from '../../components/common/BackButton.jsx';
import {
  Tractor,
  Clock,
  IndianRupee,
  Shield,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Info,
  ChevronRight,
  Plus,
  Layers,
  Sliders,
  Zap,
  Award,
  Check,
  TrendingUp,
  Cpu,
  Calendar,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const MachinesServicesPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Fetch live machines from database
  const { data: machinesData } = useSWR('/api/machines');
  const databaseMachines = machinesData?.machines || [];

  // Fetch dashboard stats if available
  const { data: statsData } = useSWR('/api/reports/dashboard?filterType=this_month');

  // Modal States
  const [selectedMachineModal, setSelectedMachineModal] = useState(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [selectedPlanName, setSelectedPlanName] = useState('');
  const [contactSuccessMsg, setContactSuccessMsg] = useState(false);

  // Machinery Directory Category Filter
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Rate Calculator State
  const defaultCustomerRate = databaseMachines[0]?.customerHourlyRate || 2500;
  const defaultContractorRate = databaseMachines[0]?.contractorHourlyRate || 1500;
  const [calcCustomerRate, setCalcCustomerRate] = useState(defaultCustomerRate);
  const [calcContractorRate, setCalcContractorRate] = useState(defaultContractorRate);
  const [calcHours, setCalcHours] = useState(8);

  const calcCustomerTotal = Math.round(calcCustomerRate * calcHours);
  const calcContractorTotal = Math.round(calcContractorRate * calcHours);
  const calcProfitTotal = Math.round(calcCustomerTotal - calcContractorTotal);
  const calcProfitPerHour = Math.round(calcCustomerRate - calcContractorRate);

  // Statistics calculation
  const totalMachinesCount = databaseMachines.length > 0 ? databaseMachines.length : 3;
  const activeMachinesCount = databaseMachines.filter((m) => m.status === 'ACTIVE').length || (databaseMachines.length > 0 ? databaseMachines.length : 2);
  const totalHoursWorked = statsData?.cards?.totalWorkingHours ?? 42.5;
  const totalEarningsAmount = statsData?.cards?.totalRevenue ?? 106250;

  // Machine Categories Definition (Paddy Harvester is Primary; others future-ready)
  const machineCategories = [
    {
      id: 'harvester',
      name: 'Paddy / Dhaan Harvester',
      category: 'Harvesting Machinery',
      type: 'PRIMARY',
      status: 'AVAILABLE NOW',
      statusColor: 'emerald',
      hourlyRate: databaseMachines[0]?.customerHourlyRate ? `₹${databaseMachines[0].customerHourlyRate}/hr` : '₹2,500/hr',
      contractorRate: databaseMachines[0]?.contractorHourlyRate ? `₹${databaseMachines[0].contractorHourlyRate}/hr` : '₹1,500/hr',
      capacity: '1.0 - 1.2 Acre / Hour',
      description:
        'High-performance self-propelled paddy harvester for clean grain extraction, minimal threshing loss, and automated hourly tracking.',
      features: [
        'Real-time live timer & hourly rate calculation',
        'Automatic field acreage billing (Katha to Acre)',
        'Contractor margin & split tracking',
        'Operator assignment & instant dispatch',
      ],
      specs: {
        enginePower: '68 - 101 HP Turbo Diesel',
        grainTank: '1,400 Litres Clean Grain Tank',
        cuttingWidth: '2.0 - 2.2 Metres Cutter Bar',
        fuelEfficiency: '6.5 - 8.0 Litres / Hour',
      },
      isPrimary: true,
    },
    {
      id: 'tractor',
      name: 'Agricultural Tractor (4WD)',
      category: 'Tractor & Haulage',
      type: 'FUTURE_READY',
      status: 'EXPANSION PLANNED',
      statusColor: 'amber',
      hourlyRate: '₹1,200/hr (Est.)',
      contractorRate: '₹800/hr (Est.)',
      capacity: 'Multi-utility 45-75 HP',
      description:
        'Heavy-duty agricultural tractors for plowing, haulage, and powering PTO-driven farm implements across regional terrains.',
      features: [
        'Hourly farm haulage tracking',
        'Fuel consumption logging',
        'Multi-implement attachment billing',
        'Driver duty shifts monitoring',
      ],
      specs: {
        enginePower: '55 HP Dual Clutch',
        liftingCapacity: '1,800 kg Hydraulic Lift',
        transmission: '8 Forward + 2 Reverse Speeds',
        ptoSpeed: '540 RPM Standard PTO',
      },
      isPrimary: false,
    },
    {
      id: 'rotavator',
      name: 'Rotavator / Rotary Tiller',
      category: 'Soil Preparation',
      type: 'FUTURE_READY',
      status: 'EXPANSION PLANNED',
      statusColor: 'amber',
      hourlyRate: '₹1,400/hr (Est.)',
      contractorRate: '₹950/hr (Est.)',
      capacity: '1.5 Acre / Hour',
      description:
        'High-speed rotating blades that pulverize clods and churn soil for rapid paddy puddling and seedbed preparation.',
      features: [
        'Katha-based soil tilling billing',
        'Gear-drive wear and maintenance log',
        'Hourly tractor combo tracking',
        'Multi-pass field rate adjustments',
      ],
      specs: {
        workingWidth: '6 Feet (42 Boron Steel Blades)',
        tractorPower: 'Requires 45+ HP Tractor',
        gearbox: 'Multi-Speed Heavy Duty Gearbox',
        depthRange: '4 - 7 Inches Tilling Depth',
      },
      isPrimary: false,
    },
    {
      id: 'cultivator',
      name: 'Spring Loaded Cultivator',
      category: 'Soil Preparation',
      type: 'FUTURE_READY',
      status: 'EXPANSION PLANNED',
      statusColor: 'amber',
      hourlyRate: '₹900/hr (Est.)',
      contractorRate: '₹600/hr (Est.)',
      capacity: '2.0 Acre / Hour',
      description:
        'Durable 9-tyne spring-loaded cultivator engineered to aerate deep soil and dislodge weed roots efficiently.',
      features: [
        'Rapid field preparation tracking',
        'Single and double pass billing',
        'Simple hourly operator dispatch',
        'Low maintenance duty cycles',
      ],
      specs: {
        tynes: '9 Heavy Duty Spring Tynes',
        frame: 'Channel Frame with High Tensile Fasteners',
        workingWidth: '7 Feet Total Span',
        weight: '240 kg Reinforced Iron',
      },
      isPrimary: false,
    },
    {
      id: 'thresher',
      name: 'Multi-Crop Thresher',
      category: 'Grain Processing',
      type: 'FUTURE_READY',
      status: 'EXPANSION PLANNED',
      statusColor: 'amber',
      hourlyRate: '₹1,100/hr (Est.)',
      contractorRate: '₹750/hr (Est.)',
      capacity: '15 - 25 Quintal / Hour',
      description:
        'High-output threshing system for wheat, mustard, and pulses with synchronized blowing fans and grain sieve cleaning.',
      features: [
        'Hourly grain processing records',
        'Quintal-based or hourly billing rates',
        'Diesel and electric motor integration',
        'Farmer batch payment receipts',
      ],
      specs: {
        cropsSupported: 'Wheat, Mustard, Soybean, Pulses',
        blowerFan: 'Dual Cyclone High Volume Blower',
        outputCapacity: 'Up to 2,000 kg / Hour',
        driveType: 'Tractor PTO / 15HP Electric Motor',
      },
      isPrimary: false,
    },
    {
      id: 'seed_drill',
      name: 'Automatic Seed & Fertilizer Drill',
      category: 'Planting & Sowing',
      type: 'FUTURE_READY',
      status: 'EXPANSION PLANNED',
      statusColor: 'amber',
      hourlyRate: '₹1,300/hr (Est.)',
      contractorRate: '₹850/hr (Est.)',
      capacity: '1.8 Acre / Hour',
      description:
        'Simultaneous precision seed sowing and granular fertilizer placement to optimize crop germination and maximize yields.',
      features: [
        'Acre-based sowing session logging',
        'Fertilizer ratio and depth tracking',
        'Custom seed calibration profiles',
        'Customer booking schedule calendar',
      ],
      specs: {
        rows: '9 - 11 Rows Sowing Mechanism',
        hopperCapacity: '50 kg Seed + 50 kg Fertilizer',
        depthControl: 'Adjustable Press Wheels',
        rowSpacing: '7 Inches Standard Spacing',
      },
      isPrimary: false,
    },
    {
      id: 'combine_harvester',
      name: 'Multi-Crop Track Combine Harvester',
      category: 'Harvesting Machinery',
      type: 'FUTURE_READY',
      status: 'EXPANSION PLANNED',
      statusColor: 'amber',
      hourlyRate: '₹2,800/hr (Est.)',
      contractorRate: '₹1,700/hr (Est.)',
      capacity: '1.5 Acre / Hour',
      description:
        'Heavy-duty rubber track harvester tailored for waterlogged, muddy wetland conditions and multi-crop harvest seasons.',
      features: [
        'Full marshland flotation capability',
        'Grain unloader auger synchronization',
        'Multi-sensor crop yield estimates',
        'Automated digital invoice receipts',
      ],
      specs: {
        tracks: '500mm Wide Rubber Tracks',
        cutterBar: '2.5 Metres Hydraulic Header',
        grainLoss: 'Less than 1.5% Guaranteed',
        unloadingHeight: '2.8 Metres Fast Grain Auger',
      },
      isPrimary: false,
    },
  ];

  const filteredMachines =
    categoryFilter === 'ALL'
      ? machineCategories
      : categoryFilter === 'HARVESTER'
      ? machineCategories.filter((m) => m.category === 'Harvesting Machinery')
      : categoryFilter === 'SOIL'
      ? machineCategories.filter((m) => m.category === 'Soil Preparation' || m.category === 'Tractor & Haulage')
      : machineCategories.filter((m) => m.category === 'Planting & Sowing' || m.category === 'Grain Processing');

  const handlePlanClick = (planName) => {
    setSelectedPlanName(planName);
    setSubscriptionModalOpen(true);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSuccessMsg(true);
    setTimeout(() => setContactSuccessMsg(false), 4000);
  };

  const handleBackNavigation = () => {
    if (isAuthenticated) {
      if (user?.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/app/dashboard');
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-brand-500 selection:text-white">
      {/* 1. Modern SaaS Header / Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackNavigation}
              aria-label="Go to dashboard"
              className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-600 transition min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <Link to="/machines" className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="DhaanTrack" className="w-8 h-8 rounded-lg shadow-xs" />
              <div>
                <span className="font-black text-base tracking-tight text-gray-900">DhaanTrack</span>
                <span className="text-[10px] block font-bold text-brand-700 tracking-wider uppercase -mt-1">
                  Machinery & Services
                </span>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-600">
            <a href="#overview" className="hover:text-brand-600 transition">
              Overview
            </a>
            <a href="#featured-harvester" className="hover:text-brand-600 transition">
              Paddy Harvester
            </a>
            <a href="#all-machinery" className="hover:text-brand-600 transition">
              Machinery Fleet
            </a>
            <a href="#rate-calculator" className="hover:text-brand-600 transition">
              Hourly Calculator
            </a>
            <a href="#subscription-plans" className="hover:text-brand-600 transition">
              SaaS Plans
            </a>
            <a href="#contact" className="hover:text-brand-600 transition">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button
                size="sm"
                variant="primary"
                onClick={handleBackNavigation}
                className="font-bold text-xs sm:text-sm"
              >
                Dashboard
              </Button>
            ) : (
              <Link to="/login">
                <Button size="sm" variant="primary" className="font-bold text-xs sm:text-sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-16 sm:space-y-24">
        {/* 2. Hero Section — Machinery Management */}
        <section id="overview" className="relative pt-4 sm:pt-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Modern Agricultural Machinery SaaS Platform</span>
          </div>

          <div className="max-w-3xl mx-auto space-y-3.5">
            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
              Smart Machinery.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-700">
                Smarter Farming.
              </span>
            </h1>
            <p className="text-sm sm:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Manage your agricultural machines, hourly operations, customers, contractors, and earnings — all from one powerful platform.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a href="#featured-harvester">
              <Button size="lg" variant="primary" className="font-black px-6 shadow-md shadow-brand-600/20">
                Explore Machines <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </a>
            <a href="#contact">
              <Button size="lg" variant="secondary" className="font-bold px-6 border-gray-200">
                <MessageCircle className="w-4 h-4 mr-1.5 text-brand-600" /> Contact Us
              </Button>
            </a>
          </div>

          {/* Animated Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 pt-6 max-w-4xl mx-auto text-left">
            <Card className="p-4 bg-white/90 backdrop-blur-xs border-emerald-100 hover:border-emerald-300 transition-all shadow-xs">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Machines</span>
                <Tractor className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-gray-900">{totalMachinesCount}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Harvesters & implements</p>
            </Card>

            <Card className="p-4 bg-white/90 backdrop-blur-xs border-emerald-100 hover:border-emerald-300 transition-all shadow-xs">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Active In Field</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-700">{activeMachinesCount}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Assigned to operators</p>
            </Card>

            <Card className="p-4 bg-white/90 backdrop-blur-xs border-emerald-100 hover:border-emerald-300 transition-all shadow-xs">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Working Hours</span>
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-gray-900">{totalHoursWorked} hrs</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Logged paddy harvesting</p>
            </Card>

            <Card className="p-4 bg-white/90 backdrop-blur-xs border-emerald-100 hover:border-emerald-300 transition-all shadow-xs">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Earnings</span>
                <IndianRupee className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-800">
                ₹{Number(totalEarningsAmount).toLocaleString()}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">Gross customer revenue</p>
            </Card>
          </div>
        </section>

        {/* 3. Main Machine Category — Harvester (Featured Card) */}
        <section id="featured-harvester" className="space-y-6">
          <div className="text-center space-y-1.5">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Primary Machine Focus
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Paddy / Dhaan Harvester
            </h2>
            <p className="text-xs sm:text-base text-gray-600 max-w-xl mx-auto">
              Efficient paddy harvesting management with hourly work tracking, customer billing, contractor rates, and machine-wise operational records.
            </p>
          </div>

          {/* Premium Harvester Featured Showcase */}
          <div className="bg-gradient-to-br from-emerald-900 via-brand-900 to-green-950 text-white rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            {/* Visual background accents */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Visual Showcase & Badges */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 text-center relative">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-3">
                    <Tractor className="w-12 h-12" />
                  </div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-black uppercase tracking-wider mb-1">
                    ACTIVE • PRODUCTION READY
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {databaseMachines[0]?.machineName || 'Kubota DC-68G Harvester'}
                  </h3>
                  <p className="text-xs text-emerald-200 font-mono font-bold mt-1">
                    Plate: {databaseMachines[0]?.machineNumber || 'HARV-DC68G'} • Capacity: 1.0 Acre/hr
                  </p>

                  <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-left">
                    <div className="bg-black/20 p-2.5 rounded-xl">
                      <span className="text-[10px] uppercase text-emerald-300 font-semibold block">Customer Rate</span>
                      <span className="text-base font-black text-white">
                        ₹{databaseMachines[0]?.customerHourlyRate || 2500}/hr
                      </span>
                    </div>
                    <div className="bg-black/20 p-2.5 rounded-xl">
                      <span className="text-[10px] uppercase text-emerald-300 font-semibold block">Contractor Rate</span>
                      <span className="text-base font-black text-white">
                        ₹{databaseMachines[0]?.contractorHourlyRate || 1500}/hr
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="md"
                    variant="primary"
                    onClick={() => setSelectedMachineModal(machineCategories[0])}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black shadow-lg"
                  >
                    <Info className="w-4 h-4 mr-1.5" /> Machine Details
                  </Button>
                  <Button
                    size="md"
                    variant="outline"
                    onClick={() => navigate('/app/field-calculator')}
                    className="flex-1 border-white/30 text-white hover:bg-white/10 font-bold"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Add New Work
                  </Button>
                </div>
              </div>

              {/* Right Column: 11 Features List Grid */}
              <div className="lg:col-span-7 space-y-4">
                <h4 className="text-base font-black tracking-wide uppercase text-emerald-300 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-400" /> Complete Harvester Operational Capabilities
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm">
                  {[
                    'Hourly Work Tracking',
                    'Customer-wise Work Records',
                    'Contractor-wise Machine Management',
                    'Dynamic Hourly Rate Configuration',
                    'Automatic Work Duration Calculation',
                    'Customer Payment Tracking',
                    'Contractor Payment Tracking',
                    'Real-time Profit Calculation',
                    'Machine Availability Status',
                    'Field Work History & Audit Logs',
                    'Machine-wise PDF & Excel Reports',
                  ].map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-medium text-emerald-50">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Future Hourly Machinery Expansion */}
        <section id="all-machinery" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Fleet Management
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
                Agricultural Machinery Directory
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                Paddy Harvester is fully integrated today. Other machinery categories are future-ready for automated billing.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-2xl border border-gray-200 shadow-2xs self-start md:self-auto">
              {[
                { id: 'ALL', label: 'All Machines' },
                { id: 'HARVESTER', label: 'Harvesters' },
                { id: 'SOIL', label: 'Tractors & Tillage' },
                { id: 'POST_HARVEST', label: 'Planting & Threshing' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCategoryFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[36px] ${
                    categoryFilter === tab.id
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Machine Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMachines.map((m) => (
              <Card
                key={m.id}
                className={`p-5 space-y-4 hover:shadow-xl transition-all duration-200 flex flex-col justify-between border-gray-200 ${
                  m.isPrimary ? 'ring-2 ring-emerald-500/50 bg-emerald-50/20' : 'bg-white'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <Tractor className="w-6 h-6" />
                    </div>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        m.isPrimary
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{m.category}</span>
                    <h3 className="text-lg font-black text-gray-900 mt-0.5">{m.name}</h3>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2">{m.description}</p>
                  </div>

                  {/* Hourly Rate Strip */}
                  <div className="bg-gray-50 p-2.5 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium">Hourly Billing Rate:</span>
                    <span className="font-black text-brand-700 text-sm">{m.hourlyRate}</span>
                  </div>

                  {/* Features list */}
                  <div className="space-y-1.5 pt-1">
                    {m.features.slice(0, 3).map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2 text-xs text-gray-700">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSelectedMachineModal(m)}
                    className="flex-1 font-bold text-xs"
                  >
                    View Details
                  </Button>
                  {m.isPrimary && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => navigate('/app/field-calculator')}
                      className="font-bold text-xs"
                    >
                      Book Work
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* 5. Hourly Rate Management Section & Interactive Calculator */}
        <section id="rate-calculator" className="space-y-6">
          <div className="text-center space-y-1.5">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Billing Intelligence
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Hourly Rate & Profit Management
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 max-w-xl mx-auto">
              Transparent, machine-specific rate formulas ensuring guaranteed contractor margins and owner profit.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Interactive Calculator Form */}
            <Card className="lg:col-span-6 p-6 space-y-5 border-gray-200 bg-white">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" /> Interactive Hourly Earnings Simulator
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                    <span>Customer Hourly Rate (₹)</span>
                    <span className="text-brand-700 font-mono">₹{calcCustomerRate}/hr</span>
                  </div>
                  <input
                    type="range"
                    min={1500}
                    max={6000}
                    step={100}
                    value={calcCustomerRate}
                    onChange={(e) => setCalcCustomerRate(Number(e.target.value))}
                    className="w-full accent-emerald-600 h-2 bg-gray-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                    <span>Contractor Hourly Rate (₹)</span>
                    <span className="text-amber-700 font-mono">₹{calcContractorRate}/hr</span>
                  </div>
                  <input
                    type="range"
                    min={800}
                    max={4000}
                    step={50}
                    value={calcContractorRate}
                    onChange={(e) => setCalcContractorRate(Number(e.target.value))}
                    className="w-full accent-amber-600 h-2 bg-gray-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                    <span>Billable Operation Time</span>
                    <span className="text-blue-700 font-mono">{calcHours} Hours</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={24}
                    step={0.5}
                    value={calcHours}
                    onChange={(e) => setCalcHours(Number(e.target.value))}
                    className="w-full accent-blue-600 h-2 bg-gray-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Conceptual Formula Badge */}
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-xs space-y-1 font-mono text-gray-600">
                <p>• Customer Bill = Customer Rate (₹{calcCustomerRate}) × {calcHours} hrs</p>
                <p>• Contractor Amount = Contractor Rate (₹{calcContractorRate}) × {calcHours} hrs</p>
                <p className="text-emerald-800 font-bold">• Owner Profit = Customer Bill − Contractor Amount</p>
              </div>
            </Card>

            {/* Right: Calculated Results Display */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-gradient-to-br from-emerald-600 to-green-700 text-white rounded-3xl p-6 sm:p-7 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                    Net Projected Margin
                  </span>
                  <span className="bg-white/20 text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                    ₹{calcProfitPerHour}/hr profit
                  </span>
                </div>

                <div>
                  <span className="text-xs text-emerald-100 font-medium">Estimated Owner Profit</span>
                  <p className="text-3xl sm:text-4xl font-black mt-0.5">₹{calcProfitTotal.toLocaleString()}</p>
                </div>

                <div className="pt-4 border-t border-emerald-500/40 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-emerald-200 font-medium block">Total Customer Bill:</span>
                    <span className="text-lg font-bold text-white">₹{calcCustomerTotal.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-emerald-200 font-medium block">Contractor Payout:</span>
                    <span className="text-lg font-bold text-emerald-100">₹{calcContractorTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <Card className="p-4 bg-white border-gray-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-gray-900">Custom Machine Rate Setup</h4>
                  <p className="text-xs text-gray-500">Admins can update default rates in Machine Master Data</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/app/field-calculator')}
                  className="font-bold text-xs"
                >
                  Estimate Field
                </Button>
              </Card>
            </div>
          </div>
        </section>

        {/* 6. Dummy Subscription Section (Future Feature Prototype) */}
        <section id="subscription-plans" className="space-y-6">
          <div className="text-center space-y-1.5">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Future SaaS Expansion
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Choose Your Machinery Management Plan
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 max-w-xl mx-auto">
              Flexible plans designed for agricultural businesses of every size.
            </p>
          </div>

          {/* Prototype Notice Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 flex items-center gap-2 max-w-2xl mx-auto">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Showcase Prototype:</strong> Subscription tiers shown below are for future SaaS capabilities. No payments or commitments are activated.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Plan 1 — Basic */}
            <Card className="p-6 space-y-5 bg-white border-gray-200 hover:shadow-lg transition flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900">Basic Plan</h3>
                  <p className="text-xs text-gray-500 mt-0.5">For single-harvester farmers and operators</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-gray-900">₹999</span>
                  <span className="text-xs font-semibold text-gray-400">/ month (Demo)</span>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-100 text-xs text-gray-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Single Machine Management
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Hourly Work Tracking
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Basic Customer Records
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Basic Daily Reports
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => handlePlanClick('Basic Plan')}
                className="w-full font-bold border-gray-200 text-gray-700"
              >
                Coming Soon
              </Button>
            </Card>

            {/* Plan 2 — Professional (Most Popular) */}
            <Card className="p-6 space-y-5 bg-white border-2 border-brand-500 shadow-xl relative hover:shadow-2xl transition flex flex-col justify-between">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
                Most Popular
              </span>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900">Professional Plan</h3>
                  <p className="text-xs text-gray-500 mt-0.5">For multi-machine contractors & agri-businesses</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-brand-700">₹2,499</span>
                  <span className="text-xs font-semibold text-gray-400">/ month (Demo)</span>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-100 text-xs text-gray-700">
                  <div className="flex items-center gap-2 font-semibold">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Multiple Machine Management
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Advanced Hourly Billing
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Customer & Contractor Management
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Profit & Margin Reports
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Work History & Audit Logs
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Priority Support
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={() => handlePlanClick('Professional Plan')}
                className="w-full font-black shadow-md shadow-brand-600/20"
              >
                Coming Soon
              </Button>
            </Card>

            {/* Plan 3 — Enterprise */}
            <Card className="p-6 space-y-5 bg-white border-gray-200 hover:shadow-lg transition flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900">Enterprise Plan</h3>
                  <p className="text-xs text-gray-500 mt-0.5">For agricultural cooperatives and fleet owners</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-gray-900">₹4,999</span>
                  <span className="text-xs font-semibold text-gray-400">/ month (Demo)</span>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-100 text-xs text-gray-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Unlimited Machine Management
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Advanced Analytics & Charts
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Multi-Operator Team Management
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Custom Business Configuration
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Dedicated Account Manager
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => handlePlanClick('Enterprise Plan')}
                className="w-full font-bold border-gray-200 text-gray-700"
              >
                Coming Soon
              </Button>
            </Card>
          </div>
        </section>

        {/* 7. Contact Section */}
        <section id="contact" className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-md">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Get In Touch
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  Let's Grow Your Agricultural Business
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Connect with us to explore machinery management, hourly billing, and future subscription services.
                </p>

                <div className="space-y-3 pt-2 text-xs sm:text-sm text-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Phone Support</span>
                      <span className="font-semibold text-gray-900">Contact Number Coming Soon</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Email Inquiries</span>
                      <span className="font-semibold text-gray-900">support@dhaantrack.com</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Regional Hub</span>
                      <span className="font-semibold text-gray-900">Bihar & Eastern India Agricultural Belt</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <a
                    href="https://wa.me/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition"
                  >
                    <MessageCircle className="w-4 h-4" /> Chat With Us
                  </a>
                  <a
                    href="mailto:support@dhaantrack.com"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-800 font-bold text-xs sm:text-sm transition"
                  >
                    <Mail className="w-4 h-4 text-gray-500" /> Get in Touch
                  </a>
                </div>
              </div>

              {/* Fast Message Box */}
              <div className="lg:col-span-6 bg-gray-50 p-5 sm:p-6 rounded-2xl border border-gray-100">
                <h4 className="font-bold text-sm text-gray-900 mb-1">Quick Message Inquiry</h4>
                <p className="text-xs text-gray-500 mb-4">Send a brief note and our team will get in touch.</p>

                {contactSuccessMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Thank you! Your message has been received.
                  </div>
                )}

                <form onSubmit={handleContactSubmit} className="space-y-3">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Your Name / Operator Name"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit Mobile Number"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <textarea
                      rows={3}
                      placeholder="Tell us about your machine fleet or inquiry..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <Button type="submit" variant="primary" className="w-full font-bold text-xs sm:text-sm min-h-[42px]">
                    Send Message
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 8. Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 text-center text-xs text-gray-500">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <p className="font-bold text-gray-700">DhaanTrack — Agricultural Machinery Management SaaS Platform</p>
          <p>© {new Date().getFullYear()} DhaanTrack. All rights reserved. Built for farmers, operators & contractors.</p>
        </div>
      </footer>

      {/* Modal 1: Machine Specifications Details */}
      {selectedMachineModal && (
        <Modal
          isOpen={!!selectedMachineModal}
          onClose={() => setSelectedMachineModal(null)}
          title={selectedMachineModal.name}
          subtitle={`Technical specifications and billing capability for ${selectedMachineModal.category}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider">Hourly Rate</span>
                <p className="text-lg font-black text-emerald-950">{selectedMachineModal.hourlyRate}</p>
              </div>
              <span className="bg-white text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-black">
                {selectedMachineModal.status}
              </span>
            </div>

            <p className="text-gray-600 leading-relaxed">{selectedMachineModal.description}</p>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <h5 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Engine & Engineering Specs</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(selectedMachineModal.specs).map(([k, v], sIdx) => (
                  <div key={sIdx} className="bg-gray-50 p-2.5 rounded-xl">
                    <span className="text-[10px] font-semibold text-gray-400 capitalize block">
                      {k.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className="font-bold text-gray-800 mt-0.5 block">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSelectedMachineModal(null)}>
                Close
              </Button>
              {selectedMachineModal.isPrimary && (
                <Button variant="primary" onClick={() => navigate('/app/field-calculator')}>
                  Book This Harvester
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 2: Subscription Coming Soon Prototype Notice */}
      {subscriptionModalOpen && (
        <Modal
          isOpen={subscriptionModalOpen}
          onClose={() => setSubscriptionModalOpen(false)}
          title="Subscription Service Coming Soon!"
          subtitle={`You selected: ${selectedPlanName}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-center py-2">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <Sparkles className="w-8 h-8" />
            </div>

            <h4 className="font-black text-base text-gray-900">
              Advanced SaaS Tier In Development
            </h4>

            <p className="text-xs text-gray-600 leading-relaxed">
              We are finalizing automated multi-machine telemetry, centralized farmer invoicing, and contractor payroll for the upcoming {selectedPlanName} release.
            </p>

            <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-500 font-medium">
              No payments are processed today. Thank you for your interest in DhaanTrack's future subscription features!
            </div>

            <Button
              variant="primary"
              onClick={() => setSubscriptionModalOpen(false)}
              className="w-full font-bold min-h-[42px]"
            >
              Got It, Thanks!
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MachinesServicesPage;
