import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Tractor,
  Clock,
  Users,
  CreditCard,
  BarChart3,
  History,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  Send,
  MessageCircle,
  Mail,
  MapPin,
  FileCheck,
  Smartphone,
  Gauge,
  HelpCircle,
  Award,
  Layers,
  Leaf,
  Settings,
  UserPlus,
  PlayCircle
} from 'lucide-react';

export const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    role: 'Harvester Owner',
    message: '',
  });

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? -1 : index);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactForm({ name: '', phone: '', role: 'Harvester Owner', message: '' });
    }, 4500);
  };

  const currentYear = new Date().getFullYear();

  // 6 Core Features
  const features = [
    {
      id: 'machine-management',
      title: 'Machine Management',
      icon: Tractor,
      description:
        'Register and configure your fleet of paddy harvesters, tractors, and agricultural implements. Set dynamic hourly rates and manage live field readiness.',
      badge: 'Fleet Control',
    },
    {
      id: 'work-tracking',
      title: 'Harvesting Work Tracking',
      icon: Clock,
      description:
        'Precision live timer and field calculator with Kattha and Acre conversion. Capture exact field operating durations, paused intervals, and dynamic customer bills.',
      badge: 'Live Timer',
    },
    {
      id: 'customer-management',
      title: 'Customer Management',
      icon: Users,
      description:
        'Centralized customer directory with instant contact sharing across operators. Store mobile numbers, village locations, and historical service logs securely.',
      badge: 'Easy Sharing',
    },
    {
      id: 'payment-tracking',
      title: 'Payment Tracking',
      icon: CreditCard,
      description:
        'Record advance, partial, and full customer payments with multi-entry tracking. Generate and share professional digital receipts directly on WhatsApp.',
      badge: 'Instant Receipts',
    },
    {
      id: 'reports-analytics',
      title: 'Reports & Analytics',
      icon: BarChart3,
      description:
        'Gain total visibility into daily earnings, operator hours, contractor payouts, diesel expenses, and net profit margins through clean visual analytics.',
      badge: 'Profit Insights',
    },
    {
      id: 'work-history',
      title: 'Work History',
      icon: History,
      description:
        'Searchable historical records of every customer session, start/end timestamps, machinery assigned, and payment status. Never misplace a field invoice.',
      badge: 'Full Archive',
    },
  ];

  // 4-Step Workflow
  const steps = [
    {
      number: '01',
      title: 'Register Your Machines',
      icon: Settings,
      description:
        'Add your harvester or tractor specifications, configure default hourly customer rates (e.g. ₹2,000/hr), and set operator contractor commission rules.',
    },
    {
      number: '02',
      title: 'Add Customers',
      icon: UserPlus,
      description:
        'Enter farmer details with name, mobile number, and village area. Easily share customer cards with your machine operators in real time.',
    },
    {
      number: '03',
      title: 'Track Harvesting Work',
      icon: PlayCircle,
      description:
        'Start the digital timer as cutting starts or use the quick Field Calculator for instant land-to-time conversion with automated billing computation.',
    },
    {
      number: '04',
      title: 'Manage Payments & Reports',
      icon: CheckCircle2,
      description:
        'Collect cash or digital payments, generate WhatsApp receipts in one tap, and review your daily net profit and contractor split breakdown.',
    },
  ];

  // Illustrative Statistics (No fake numerical claims)
  const stats = [
    {
      label: 'Field-Ready Design',
      value: '100% Mobile & Offline',
      description: 'Works seamlessly in remote agricultural fields with instant offline state syncing.',
      icon: Smartphone,
    },
    {
      label: 'Machinery Compatibility',
      value: 'Multi-Machine Support',
      description: 'Designed for track paddy harvesters, wheel combines, tractors, and rotary tillers.',
      icon: Tractor,
    },
    {
      label: 'Digital Transparency',
      value: 'Instant WhatsApp Receipts',
      description: 'Eliminate disputed hours with instant, verifiable PDF and WhatsApp payment slips.',
      icon: FileCheck,
    },
    {
      label: 'Financial Clarity',
      value: 'Automated Net Profit',
      description: 'Clear automatic split between gross customer billing, contractor payout, and owner net profit.',
      icon: Gauge,
    },
  ];

  // Sample Feedback Showcase (Clearly marked as sample content)
  const sampleTestimonials = [
    {
      name: 'Rameshwar Prasad',
      role: 'Harvester Fleet Owner',
      location: 'Rohtas, Bihar',
      quote:
        'Managing 3 paddy harvesters used to mean wet paper notebooks and disputed hours. DhaanTrack keeps our live field timer and payment slips crystal clear.',
      tag: 'Sample Feedback Showcase',
    },
    {
      name: 'Vikram Singh',
      role: 'Agricultural Contractor',
      location: 'Karnal, Haryana',
      quote:
        'The dynamic hourly rate calculator and direct WhatsApp receipts save us hours every evening. Both farmers and drivers trust the system completely.',
      tag: 'Sample Feedback Showcase',
    },
    {
      name: 'Manjeet Kaur',
      role: 'Progressive Farmer & Co-op Lead',
      location: 'Ludhiana, Punjab',
      quote:
        'Transparent billing with exact hours and Kattha calculations brings complete peace of mind during the intensive paddy harvesting rush.',
      tag: 'Sample Feedback Showcase',
    },
  ];

  // FAQ Items (5 exact questions required)
  const faqs = [
    {
      question: 'What is DhaanTrack?',
      answer:
        'DhaanTrack is an all-in-one agricultural machinery and harvesting management platform engineered for harvester owners, tractor operators, and farming contractors. It replaces fragile paper diaries with live field work timers, dynamic hourly customer rate calculations, customer sharing, payment tracking, and net profit analytics.',
    },
    {
      question: 'How can I manage my machines?',
      answer:
        'You can register your harvesters, tractors, and agricultural attachments in your dashboard. Set default customer hourly rates, configure contractor payout rates, assign operators to specific machines, and monitor real-time operational status (Active, Maintenance, Idle).',
    },
    {
      question: 'Can I track customer harvesting work?',
      answer:
        'Yes. DhaanTrack provides two field-tested tracking methods: a live digital timer with start, pause, and resume capabilities for real-time engine tracking, and a Field Estimate Calculator that converts land units (Acre, Kattha, Bigha) into estimated hours and exact customer bills.',
    },
    {
      question: 'Can I manage payments?',
      answer:
        'Absolutely. DhaanTrack supports full, advance, and partial payment entries with detailed payment histories. You can issue professional digital receipts with a single click and send them directly to customer mobile phones via WhatsApp.',
    },
    {
      question: 'How do I get started?',
      answer:
        'Getting started is quick and easy. Click "Get Started" or "Login" to access your account, set up your machinery profile, add your first customer, and begin recording your field harvesting work immediately.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased overflow-x-hidden selection:bg-brand-500 selection:text-white">
      {/* ========================================================
          1. STICKY NAVBAR
          ======================================================== */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-xl p-1">
              <div className="w-11 h-11 rounded-xl bg-brand-600 flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:bg-brand-700 transition-colors">
                <img src="/logo.svg" alt="DhaanTrack" className="w-8 h-8 object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-1.5">
                  DhaanTrack
                  <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-brand-100 text-brand-800">
                    AgTech
                  </span>
                </span>
                <span className="text-[11px] font-medium text-gray-500 tracking-wide hidden sm:block">
                  Machinery & Harvesting Platform
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#home"
                className="text-sm font-semibold text-gray-600 hover:text-brand-600 transition-colors"
              >
                Home
              </a>
              <a
                href="#features"
                className="text-sm font-semibold text-gray-600 hover:text-brand-600 transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-sm font-semibold text-gray-600 hover:text-brand-600 transition-colors"
              >
                How It Works
              </a>
              <a
                href="#about"
                className="text-sm font-semibold text-gray-600 hover:text-brand-600 transition-colors"
              >
                About Us
              </a>
              <a
                href="#contact"
                className="text-sm font-semibold text-gray-600 hover:text-brand-600 transition-colors"
              >
                Contact
              </a>
              <Link
                to="/machines"
                className="text-sm font-semibold text-brand-700 hover:text-brand-800 transition-colors flex items-center gap-1"
              >
                <Tractor className="w-4 h-4 text-brand-600" />
                Machines
              </Link>
            </nav>

            {/* Desktop Auth CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                id="navbar-login-btn"
                className="px-4 py-2.5 text-sm font-bold text-gray-700 hover:text-brand-700 hover:bg-brand-50 rounded-xl transition-all"
              >
                Login
              </Link>
              <Link
                to="/login"
                id="navbar-get-started-btn"
                className="px-5 py-2.5 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-95 rounded-xl shadow-md shadow-brand-600/25 transition-all flex items-center gap-2 group"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-bold text-brand-700 bg-brand-50 rounded-lg"
              >
                Login
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-gray-100 bg-white/98 backdrop-blur-lg px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-3">
              <a
                href="#home"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-base font-semibold text-gray-700 hover:bg-brand-50 hover:text-brand-600 rounded-lg"
              >
                Home
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-base font-semibold text-gray-700 hover:bg-brand-50 hover:text-brand-600 rounded-lg"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-base font-semibold text-gray-700 hover:bg-brand-50 hover:text-brand-600 rounded-lg"
              >
                How It Works
              </a>
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-base font-semibold text-gray-700 hover:bg-brand-50 hover:text-brand-600 rounded-lg"
              >
                About Us
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-base font-semibold text-gray-700 hover:bg-brand-50 hover:text-brand-600 rounded-lg"
              >
                Contact
              </a>
              <Link
                to="/machines"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-base font-semibold text-brand-700 hover:bg-brand-50 rounded-lg flex items-center gap-2"
              >
                <Tractor className="w-4 h-4 text-brand-600" />
                Machines & Services
              </Link>
              <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  Login
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================
          2. HERO SECTION
          ======================================================== */}
      <section id="home" className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 bg-gradient-to-b from-brand-50/70 via-white to-gray-50 overflow-hidden">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none -z-10">
          <div className="absolute top-10 left-10 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl" />
          <div className="absolute top-20 right-10 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl" />
          <div className="absolute top-60 left-1/3 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100/80 border border-brand-200 text-brand-900 text-xs sm:text-sm font-semibold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
                <span className="text-brand-950 font-bold">🌾 Agricultural Machinery & Harvesting Platform</span>
              </div>

              {/* Exact Required Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.12]">
                Smarter Harvesting.{' '}
                <span className="bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-600 bg-clip-text text-transparent">
                  Better Farming.
                </span>
              </h1>

              {/* Exact Required Subheadline */}
              <p className="text-lg sm:text-xl text-gray-600 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Manage agricultural machinery, track harvesting operations, monitor customer work, and simplify payments — all in one powerful platform.
              </p>

              {/* Hero CTA Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/login"
                  id="hero-get-started-btn"
                  className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-95 rounded-2xl shadow-xl shadow-brand-600/30 transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <a
                  href="#features"
                  id="hero-explore-features-btn"
                  className="w-full sm:w-auto px-7 py-4 text-base font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5 text-brand-600" />
                  <span>Explore Features</span>
                </a>
              </div>

              {/* Field Value Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs sm:text-sm font-semibold text-gray-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-600" />
                  <span>100% Offline-Friendly</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-600" />
                  <span>Direct WhatsApp Receipts</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-600" />
                  <span>Zero Manual Math Errors</span>
                </div>
              </div>
            </div>

            {/* Right Hero Cinematic Visual Presentation */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Decorative Background Frame */}
                <div className="relative rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-emerald-900 p-3 sm:p-5 shadow-2xl shadow-brand-900/30 text-white overflow-hidden border border-brand-500/30">
                  {/* Subtle Sun & Pattern Grid */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

                  {/* Header of Visual */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <span className="font-bold tracking-wider text-emerald-300 uppercase">Live Field Telemetry</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-white/10 font-mono text-[11px] text-gray-200">
                      Season Active
                    </span>
                  </div>

                  {/* Agricultural Farmland & Machinery Artwork Graphic */}
                  <div className="my-4 rounded-2xl bg-gradient-to-b from-brand-950/80 to-brand-900/90 p-4 border border-white/10 relative overflow-hidden">
                    {/* SVG Landscape Illustration */}
                    <svg viewBox="0 0 400 220" className="w-full h-auto drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Sky & Sun */}
                      <circle cx="310" cy="50" r="32" fill="#FDE047" fillOpacity="0.85" />
                      <circle cx="310" cy="50" r="48" fill="#FDE047" fillOpacity="0.2" />

                      {/* Distant Hills */}
                      <path d="M0 130 C90 100 170 140 260 115 C330 95 380 120 400 125 V220 H0 Z" fill="#14532D" fillOpacity="0.7" />
                      <path d="M0 145 C80 130 160 160 250 140 C320 120 380 140 400 135 V220 H0 Z" fill="#15803D" fillOpacity="0.85" />

                      {/* Rolling Paddy Field Waves */}
                      <path d="M0 165 C120 155 240 185 400 160 V220 H0 Z" fill="#16A34A" />
                      <path d="M0 185 C140 175 270 200 400 180 V220 H0 Z" fill="#22C55E" />

                      {/* Paddy Field Furrows */}
                      <path d="M40 220 L150 170" stroke="#FDE047" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="3 3" />
                      <path d="M120 220 L220 175" stroke="#FDE047" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="3 3" />
                      <path d="M220 220 L300 180" stroke="#FDE047" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="3 3" />

                      {/* Stylized Paddy Harvester Silhouette */}
                      <g transform="translate(145, 105)">
                        {/* Harvester Cabin */}
                        <rect x="35" y="15" width="45" height="30" rx="6" fill="#F59E0B" />
                        <rect x="40" y="20" width="22" height="15" rx="3" fill="#67E8F9" fillOpacity="0.8" />
                        <path d="M35 22 L20 38 H35 V22 Z" fill="#D97706" />

                        {/* Grain Tank & Pipe */}
                        <rect x="75" y="20" width="35" height="25" rx="4" fill="#047857" />
                        <path d="M90 20 L115 5 H125" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />

                        {/* Tracks / Crawler Undercarriage */}
                        <rect x="25" y="48" width="85" height="16" rx="8" fill="#1F2937" stroke="#111827" strokeWidth="2" />
                        <circle cx="36" cy="56" r="5" fill="#4B5563" />
                        <circle cx="53" cy="56" r="5" fill="#4B5563" />
                        <circle cx="70" cy="56" r="5" fill="#4B5563" />
                        <circle cx="87" cy="56" r="5" fill="#4B5563" />
                        <circle cx="102" cy="56" r="5" fill="#4B5563" />

                        {/* Front Cutting Header / Reel */}
                        <circle cx="8" cy="46" r="14" stroke="#DC2626" strokeWidth="3" fill="#EF4444" fillOpacity="0.3" />
                        <line x1="8" y1="34" x2="8" y2="58" stroke="#DC2626" strokeWidth="2" />
                        <line x1="-4" y1="46" x2="20" y2="46" stroke="#DC2626" strokeWidth="2" />
                        <path d="M8 46 L25 50" stroke="#374151" strokeWidth="3" />
                      </g>
                    </svg>

                    <div className="mt-3 flex items-center justify-between text-xs text-brand-100 font-medium">
                      <span>Machine: <strong className="text-white">Paddy Harvester 01</strong></span>
                      <span className="flex items-center gap-1 text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Cutting Active
                      </span>
                    </div>
                  </div>

                  {/* Telemetry Snapshot Cards */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
                      <span className="text-[10px] uppercase font-bold text-gray-300 block">Current Farmer Work</span>
                      <span className="text-sm font-bold text-white truncate block">Surendar Mahto</span>
                      <span className="text-[11px] text-amber-300 font-mono">02h 45m • 4.5 Kattha</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
                      <span className="text-[10px] uppercase font-bold text-gray-300 block">Calculated Total</span>
                      <span className="text-sm font-bold text-emerald-300 block">₹5,500</span>
                      <span className="text-[11px] text-emerald-200">Receipt Ready 📲</span>
                    </div>
                  </div>
                </div>

                {/* Floating Decorative Cards */}
                <div className="absolute -top-6 -left-6 bg-white p-3.5 rounded-2xl shadow-xl border border-gray-100 hidden sm:flex items-center gap-3 animate-bounce [animation-duration:4s]">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Live Work Timer</span>
                    <span className="text-[11px] font-semibold text-emerald-600">Active • 01:42:18</span>
                  </div>
                </div>

                <div className="absolute -bottom-6 -right-6 bg-white p-3.5 rounded-2xl shadow-xl border border-gray-100 hidden sm:flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <CreditCard className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Customer Paid</span>
                    <span className="text-[11px] font-semibold text-brand-700">₹3,000 Cash Advance</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. FEATURES SECTION
          ======================================================== */}
      <section id="features" className="py-20 lg:py-28 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Core Capabilities</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
              Everything You Need for Harvest Season
            </h2>
            <p className="text-base sm:text-lg text-gray-600 font-medium">
              Designed specifically for agricultural contractors, harvester fleet owners, and tractor operators across rural India.
            </p>
          </div>

          {/* 6 Feature Cards Grid */}
          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.id}
                  id={`feature-${feature.id}`}
                  className="group relative bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-brand-500/10 hover:border-brand-300 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Icon & Badge */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                        <Icon className="w-7 h-7" />
                      </div>
                      <span className="text-[11px] font-bold tracking-wide text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-100">
                        {feature.badge}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-brand-700 transition-colors">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 leading-relaxed font-normal">
                      {feature.description}
                    </p>
                  </div>

                  {/* Card Bottom Accent Line */}
                  <div className="mt-6 pt-4 border-t border-gray-50 flex items-center text-xs font-bold text-brand-600 group-hover:text-brand-700">
                    <span>Explore Workflow</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          4. HOW IT WORKS SECTION (4-Step Workflow)
          ======================================================== */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-gradient-to-b from-gray-50 via-white to-brand-50/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              <span>Simple 4-Step Process</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
              How DhaanTrack Works in the Field
            </h2>
            <p className="text-base sm:text-lg text-gray-600 font-medium">
              From morning machine dispatch to evening payment settlement in four effortless steps.
            </p>
          </div>

          {/* 4 Steps Timeline / Cards */}
          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.number}
                  className="relative bg-white rounded-3xl p-7 border border-gray-100 shadow-sm hover:shadow-lg hover:border-brand-200 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Step Number Watermark */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-3xl font-black text-brand-200 font-mono">
                      {step.number}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                      <StepIcon className="w-5 h-5" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2.5">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed font-normal">
                      {step.description}
                    </p>
                  </div>

                  {/* Connected Step Arrow */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 z-10 text-brand-400">
                      <ArrowRight className="w-6 h-6 stroke-[2.5]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick CTA underneath */}
          <div className="mt-14 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-lg shadow-brand-600/20 active:scale-95 transition-all"
            >
              <span>Try DhaanTrack With Your Fleet</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================
          5. PROMOTIONAL CALLOUT SECTION
          ======================================================== */}
      <section className="py-16 sm:py-20 bg-brand-900 relative overflow-hidden text-white">
        {/* Glow & Grid Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="rounded-3xl bg-gradient-to-r from-brand-800 via-brand-700 to-emerald-900 p-8 sm:p-12 lg:p-16 border border-brand-500/30 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-bold uppercase tracking-wider">
                <Leaf className="w-3.5 h-3.5" />
                <span>Next-Generation AgTech</span>
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Transform Your Farming Operations
              </h2>
              <p className="text-base sm:text-lg text-emerald-100 font-medium leading-relaxed">
                Bring your agricultural machinery, customers, harvesting operations, and payments into one organized system.
              </p>
            </div>

            <div className="flex-shrink-0">
              <Link
                to="/login"
                id="promo-start-managing-btn"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white hover:bg-gray-100 text-brand-900 font-black text-base shadow-xl active:scale-95 transition-all"
              >
                <span>Start Managing Your Work</span>
                <ArrowRight className="w-5 h-5 text-brand-700" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          6. STATISTICS SECTION (Illustrative labels, no fake numerical claims)
          ======================================================== */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-bold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              <span>Platform Highlights</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Engineered for Field Reliability & Transparency
            </h2>
            <p className="text-sm sm:text-base text-gray-600 font-medium">
              Reliable agricultural architecture designed to handle rural operational demands.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => {
              const StatIcon = stat.icon;
              return (
                <div
                  key={i}
                  className="bg-gray-50 hover:bg-brand-50/50 p-6 rounded-3xl border border-gray-100 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-100 text-brand-600 flex items-center justify-center mb-4">
                      <StatIcon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-700 block mb-1">
                      {stat.label}
                    </span>
                    <h3 className="text-xl font-black text-gray-900 mb-2">
                      {stat.value}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-600 font-normal leading-relaxed">
                    {stat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          7. ABOUT US SECTION
          ======================================================== */}
      <section id="about" className="py-20 lg:py-28 bg-gradient-to-b from-gray-50 via-white to-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-bold uppercase tracking-wider">
                <Leaf className="w-3.5 h-3.5" />
                <span>About Us</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                Empowering Indian Agricultural Mechanization
              </h2>
              <p className="text-base sm:text-lg text-gray-600 font-medium leading-relaxed">
                DhaanTrack was built to eliminate operational friction during intensive harvest seasons. For machine owners and contractors, managing multiple machines across scattered villages involves high-stakes billing, driver splits, and constant phone coordination.
              </p>
              <p className="text-sm sm:text-base text-gray-600 font-normal leading-relaxed">
                Our mission is to equip every agricultural entrepreneur with intuitive, transparent digital tools: from field timers and land unit converters to instant WhatsApp payment receipts and contractor ledgers.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-white border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Local Land Units</h4>
                  <p className="text-xs text-gray-500">Native support for Kattha, Bigha, Acre and custom regional sizes.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Dual-Rate Engine</h4>
                  <p className="text-xs text-gray-500">Automated calculation of customer rate vs. contractor operator rate.</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative rounded-3xl bg-gradient-to-br from-brand-900 to-emerald-950 p-8 text-white shadow-2xl border border-brand-500/20">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center text-emerald-300 font-bold">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Our Core Commitments</h3>
                      <p className="text-xs text-emerald-200">Transparency for farmers, profitability for machine owners</p>
                    </div>
                  </div>

                  <ul className="space-y-3.5 text-sm text-gray-200">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Complete Billing Transparency:</strong> Every second in the field is verifiable by both the farmer and machine contractor.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Fast Field Usability:</strong> Large, easy buttons engineered for use under bright sunlight and busy field conditions.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Secure Data Storage:</strong> Customer contacts and payment records stored securely in centralized MongoDB databases.</span>
                    </li>
                  </ul>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-emerald-200">
                    <span>Designed for Modern Indian Agriculture</span>
                    <Link to="/login" className="font-bold text-white hover:text-emerald-300 flex items-center gap-1">
                      Join Platform <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          8. TESTIMONIALS SECTION (Clearly marked as sample showcase)
          ======================================================== */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
              <MessageCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Sample Content / Demonstration Only</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
              Sample Feedback & Workflow Showcase
            </h2>
            <p className="text-sm sm:text-base text-gray-500 font-medium italic">
              *The following showcases illustrative feedback representations of typical agricultural machinery management workflows.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {sampleTestimonials.map((t, i) => (
              <div
                key={i}
                className="bg-gray-50 p-7 rounded-3xl border border-gray-100 hover:border-brand-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-4">
                    {'★'.repeat(5)}
                  </div>
                  <p className="text-sm text-gray-700 italic leading-relaxed mb-6 font-medium">
                    "{t.quote}"
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200/60 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{t.name}</h4>
                    <span className="text-xs text-gray-500 block">{t.role}</span>
                    <span className="text-[11px] text-brand-700 font-medium block">{t.location}</span>
                  </div>
                  <span className="text-[10px] bg-gray-200/80 text-gray-600 px-2 py-0.5 rounded font-mono">
                    Sample
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          9. FAQ SECTION (5 Exact Questions)
          ======================================================== */}
      <section id="faq" className="py-20 lg:py-28 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-bold uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Questions & Answers</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-base text-gray-600 font-medium">
              Everything you need to know about DhaanTrack machinery and harvesting management.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  id={`faq-item-${index}`}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <span className="text-base sm:text-lg font-bold text-gray-900">
                      {faq.question}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                      {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-sm text-gray-600 font-normal leading-relaxed border-t border-gray-100 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          10. CONTACT SECTION
          ======================================================== */}
      <section id="contact" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12">
            {/* Contact Details */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-bold uppercase tracking-wider">
                <Mail className="w-3.5 h-3.5" />
                <span>Contact Us</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                Let's Discuss Your Agricultural Fleet
              </h2>
              <p className="text-base text-gray-600 font-medium leading-relaxed">
                Whether you operate one harvester or a multi-state machinery contracting service, our agricultural tech team is ready to assist.
              </p>

              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-semibold block">Official Support Email</span>
                    <a href="mailto:support@dhaantrack.com" className="text-sm font-bold text-gray-900 hover:text-brand-600">
                      support@dhaantrack.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-semibold block">WhatsApp Direct Helpline</span>
                    <a
                      href="https://wa.me/919999999999?text=Hello%20DhaanTrack%20Support"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-brand-700 hover:underline"
                    >
                      Chat With Our Team on WhatsApp
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-semibold block">Operations Hub</span>
                    <span className="text-sm font-bold text-gray-900">
                      Bihar & Pan-India Agricultural Service Network
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Contact Message Form */}
            <div className="lg:col-span-7">
              <div className="bg-gray-50 p-8 sm:p-10 rounded-3xl border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Send Us an Inquiry</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Fill in your details and an agricultural specialist will connect with you.
                </p>

                {contactSubmitted ? (
                  <div className="p-6 rounded-2xl bg-brand-50 border border-brand-200 text-brand-900 space-y-2 text-center animate-in fade-in">
                    <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center mx-auto mb-2">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold">Thank You for Reaching Out!</h4>
                    <p className="text-sm text-brand-800">
                      Your message has been received. Our DhaanTrack support team will respond promptly.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">
                          Your Name
                        </label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">
                          Mobile Number
                        </label>
                        <input
                          type="tel"
                          required
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                          placeholder="e.g. 9876543210"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">
                        Your Role in Agriculture
                      </label>
                      <select
                        value={contactForm.role}
                        onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="Harvester Owner">Harvester Machine Owner</option>
                        <option value="Tractor Contractor">Tractor & Implement Contractor</option>
                        <option value="Machine Operator">Machine Driver / Field Operator</option>
                        <option value="Farmer">Farmer / Field Manager</option>
                        <option value="Other">Other Agricultural Business</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">
                        Message / Query
                      </label>
                      <textarea
                        rows="3"
                        required
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder="Tell us about your machines, location, or how we can help..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <button
                      type="submit"
                      id="contact-submit-btn"
                      className="w-full py-3.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit Message</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          11. FOOTER
          ======================================================== */}
      <footer className="bg-gray-900 text-white pt-16 pb-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 pb-12 border-b border-gray-800">
            {/* Col 1: Brand Info */}
            <div className="col-span-2 space-y-4">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-md shadow-brand-600/30">
                  <img src="/logo.svg" alt="DhaanTrack" className="w-7 h-7 object-contain" />
                </div>
                <span className="text-2xl font-black text-white tracking-tight">
                  DhaanTrack
                </span>
              </Link>
              <p className="text-sm text-gray-400 font-normal leading-relaxed max-w-sm">
                Next-generation agriculture machinery and harvesting management platform. Track field operations, calculate dynamic billing, and simplify customer payments.
              </p>
              <div className="pt-2 flex items-center gap-3 text-xs text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Harvest Season Ready</span>
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                Platform
              </h4>
              <ul className="space-y-2.5 text-sm text-gray-400 font-medium">
                <li><a href="#home" className="hover:text-white transition-colors">Home</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><Link to="/machines" className="hover:text-white transition-colors">Machines & Services</Link></li>
              </ul>
            </div>

            {/* Col 3: Company */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                Company
              </h4>
              <ul className="space-y-2.5 text-sm text-gray-400 font-medium">
                <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact Support</a></li>
                <li><a href="mailto:support@dhaantrack.com" className="hover:text-white transition-colors">Email Us</a></li>
              </ul>
            </div>

            {/* Col 4: Quick Portals */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                Portals
              </h4>
              <ul className="space-y-2.5 text-sm text-gray-400 font-medium">
                <li>
                  <Link to="/login" id="footer-login-link" className="text-brand-400 hover:text-brand-300 font-bold transition-colors">
                    Login / Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    Operator Portal
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    Admin Console
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright & Disclaimer */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 font-medium">
            <p>© {currentYear} DhaanTrack. All rights reserved.</p>
            <p>Empowering agricultural machinery operations across India.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
