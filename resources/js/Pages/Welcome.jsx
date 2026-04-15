import React, { useState, useEffect, useRef } from 'react';
import {
    Users, Clock, Calendar, DollarSign, Shield, BarChart3,
    CheckCircle, Award, FileText, Briefcase, UserCheck,
    TrendingUp, Globe, ArrowRight, Menu, X, Zap,
    ChevronUp, ChevronDown, Minus
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Hooks
───────────────────────────────────────────── */
function useScrollReveal(threshold = 0.15) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => setVisible(e.isIntersecting),
            { threshold }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return [ref, visible];
}

function useCounter(target, duration = 1600) {
    const [count, setCount] = useState(0);
    const [ref, visible] = useScrollReveal(0.5);
    useEffect(() => {
        if (!visible) { setCount(0); return; }
        let v = 0;
        const step = target / (duration / 16);
        const t = setInterval(() => {
            v += step;
            if (v >= target) { setCount(target); clearInterval(t); }
            else setCount(Math.floor(v));
        }, 16);
        return () => clearInterval(t);
    }, [visible, target, duration]);
    return [ref, count];
}

/* ─────────────────────────────────────────────
   Reveal component
───────────────────────────────────────────── */
function Reveal({ children, delay = 0, direction = 'up', className = '' }) {
    const [ref, visible] = useScrollReveal();
    const base = 'transition-all duration-700 ease-out';
    const dirs = {
        up:    visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0',
        left:  visible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0',
        right: visible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0',
        fade:  visible ? 'opacity-100 scale-100'     : 'opacity-0 scale-95',
    };
    return (
        <div ref={ref} className={`${base} ${dirs[direction]} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}>
            {children}
        </div>
    );
}

/* ─────────────────────────────────────────────
   Dashboard Mockup (hero visual)
───────────────────────────────────────────── */
function DashboardMockup() {
    const bars = [65, 82, 54, 90, 72, 88, 60];
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    return (
        <div className="relative w-full max-w-lg mx-auto"
            style={{ animation: 'floatY 4s ease-in-out infinite' }}>

            {/* Glow behind card */}
            <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-3xl scale-95" />

            {/* Main card */}
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl">

                {/* Card header */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <p className="text-white/50 text-xs uppercase tracking-widest font-medium">Overview</p>
                        <p className="text-white font-bold text-base">HR Dashboard</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-emerald-300 text-xs font-medium">Live</span>
                    </div>
                </div>

                {/* Stat pills row */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                        { label: 'Employees', value: '248', trend: 'up', delta: '+4' },
                        { label: 'On Leave',  value: '12',  trend: 'down', delta: '-2' },
                        { label: 'Payroll',   value: '₱2.4M', trend: 'up', delta: '+8%' },
                    ].map(s => (
                        <div key={s.label} className="bg-white/8 rounded-xl p-3 border border-white/10">
                            <p className="text-white/40 text-xs mb-1">{s.label}</p>
                            <p className="text-white font-bold text-sm">{s.value}</p>
                            <div className={`flex items-center gap-0.5 mt-0.5 text-xs font-medium ${s.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {s.trend === 'up' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                {s.delta}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Mini bar chart */}
                <div className="mb-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-white/60 text-xs font-medium">Attendance Rate</p>
                        <p className="text-indigo-300 text-xs font-bold">This Week</p>
                    </div>
                    <div className="flex items-end gap-1.5 h-14">
                        {bars.map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full rounded-t-md transition-all duration-700"
                                    style={{
                                        height: `${h}%`,
                                        background: i === 4
                                            ? 'linear-gradient(180deg,#818cf8,#6366f1)'
                                            : 'rgba(255,255,255,0.15)'
                                    }} />
                                <span className="text-white/30 text-xs">{days[i]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent activity list */}
                <div className="space-y-2">
                    {[
                        { name: 'Maria Santos',  action: 'Filed leave request',  time: '2m ago',  dot: 'bg-amber-400' },
                        { name: 'Juan Dela Cruz', action: 'Payslip generated',   time: '15m ago', dot: 'bg-emerald-400' },
                        { name: 'Ana Reyes',      action: 'Clock-in recorded',   time: '1h ago',  dot: 'bg-indigo-400' },
                    ].map(a => (
                        <div key={a.name} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5 border border-white/8">
                            <span className={`h-2 w-2 rounded-full flex-shrink-0 ${a.dot}`} />
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-semibold truncate">{a.name}</p>
                                <p className="text-white/40 text-xs truncate">{a.action}</p>
                            </div>
                            <span className="text-white/30 text-xs flex-shrink-0">{a.time}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Floating badge — top right */}
            <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl px-4 py-2.5 flex items-center gap-2 border border-gray-100"
                style={{ animation: 'floatY 3s ease-in-out 0.5s infinite' }}>
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-800">Payroll Processed</p>
                    <p className="text-xs text-gray-400">248 employees · ₱2.4M</p>
                </div>
            </div>

            {/* Floating badge — bottom left */}
            <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl px-4 py-2.5 flex items-center gap-2 border border-gray-100"
                style={{ animation: 'floatY 3.5s ease-in-out 1s infinite' }}>
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-800">100% BIR Compliant</p>
                    <p className="text-xs text-gray-400">All contributions filed</p>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
/* ─── Loading nav button ──────────────────────────────────────────────────── */
function NavBtn({ href, children, className = '', style }) {
    const [loading, setLoading] = useState(false);
    const handleClick = (e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => { window.location.href = href; }, 120);
    };
    return (
        <button onClick={handleClick} disabled={loading} style={style}
            className={`inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-80 disabled:cursor-default ${className}`}>
            {loading
                ? <svg className="h-4 w-4 animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                : children}
        </button>
    );
}

export default function Welcome({ auth, systemVersion }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', fn);
        return () => window.removeEventListener('scroll', fn);
    }, []);

    const features = [
        {
            icon: Users, title: 'Employee Management',
            desc: 'Centralize complete employee records, profiles, and lifecycle events in one unified platform.',
            gradient: 'from-indigo-500 to-blue-600',
            benefits: ['Employee profiles & history', 'Document management', 'Org chart & hierarchy'],
        },
        {
            icon: DollarSign, title: 'Payroll Processing',
            desc: 'Automated, accurate payroll computation with full compliance to Philippine labor laws.',
            gradient: 'from-emerald-500 to-teal-600',
            benefits: ['Auto tax & deduction calc', 'Digital payslips', 'SSS, PhilHealth, HDMF'],
        },
        {
            icon: Clock, title: 'Time & Attendance',
            desc: 'Biometric-integrated tracking with real-time overtime detection and shift management.',
            gradient: 'from-violet-500 to-purple-600',
            benefits: ['Biometric integration', 'Shift scheduling', 'Overtime detection'],
        },
        {
            icon: Calendar, title: 'Leave Management',
            desc: 'Self-service leave filing with automated approval workflows and real-time balance tracking.',
            gradient: 'from-rose-500 to-pink-600',
            benefits: ['Leave request & approval', 'Balance tracking', 'Holiday calendar'],
        },
        {
            icon: Award, title: 'Core HR Modules',
            desc: 'Manage promotions, transfers, disciplinary actions, resignations, and more.',
            gradient: 'from-amber-500 to-orange-600',
            benefits: ['Promotions & transfers', 'Complaints & warnings', 'Resignation tracking'],
        },
        {
            icon: BarChart3, title: 'Reports & Analytics',
            desc: 'Data-driven insights with exportable reports for strategic HR decision-making.',
            gradient: 'from-sky-500 to-cyan-600',
            benefits: ['Payroll summaries', 'Attendance reports', 'Export to Excel'],
        },
    ];

    const stats = [
        { value: 99, suffix: '%', label: 'Payroll Accuracy',   sub: 'Error-free computation' },
        { value: 10, suffix: 'x', label: 'Faster Processing',  sub: 'vs. manual methods' },
        { value: 100, suffix: '%', label: 'BIR Compliant',     sub: 'All contributions filed' },
        { value: 24, suffix: '/7', label: 'System Uptime',     sub: 'Always available' },
    ];

    const steps = [
        { num: '01', icon: UserCheck, title: 'Set Up Your Organization', desc: 'Configure departments, roles, and employee records in minutes with our guided setup wizard.' },
        { num: '02', icon: Clock,     title: 'Track Time & Attendance',  desc: 'Connect biometric devices or use manual entry. Attendance flows directly into payroll.' },
        { num: '03', icon: DollarSign, title: 'Run Payroll Automatically', desc: 'One click to generate accurate payslips with all deductions, benefits, and taxes computed.' },
    ];

    const modules = [
        { icon: UserCheck, label: 'Employee Portal',    color: 'text-indigo-600 bg-indigo-50' },
        { icon: FileText,  label: 'Payslip Generator', color: 'text-emerald-600 bg-emerald-50' },
        { icon: Briefcase, label: 'Core HR',            color: 'text-amber-600 bg-amber-50' },
        { icon: Shield,    label: 'Roles & Access',     color: 'text-rose-600 bg-rose-50' },
        { icon: Globe,     label: 'HR Calendar',        color: 'text-sky-600 bg-sky-50' },
        { icon: TrendingUp, label: 'Analytics',         color: 'text-violet-600 bg-violet-50' },
    ];

    return (
        <div className="min-h-screen bg-white text-gray-900 antialiased overflow-x-hidden">

            {/* ══════════════════════════════
                NAVBAR
            ══════════════════════════════ */}
            <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
                scrolled
                    ? 'bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-100'
                    : 'bg-transparent'
            }`}>
                <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <a href="/" className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <span className="text-xs font-black text-white tracking-tighter">EC</span>
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className={`text-base font-black tracking-tight transition-colors ${scrolled ? 'text-gray-900' : 'text-white'}`}>
                                EC HRIS
                            </span>
                            <span className={`text-xs transition-colors ${scrolled ? 'text-gray-400' : 'text-white/50'}`}>
                                Human Resource System
                            </span>
                        </div>
                    </a>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-6">
                        {['Features', 'How It Works', 'Modules'].map(link => (
                            <a key={link} href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                                className={`text-sm font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-indigo-600' : 'text-white/70 hover:text-white'}`}>
                                {link}
                            </a>
                        ))}
                        <div className="h-5 w-px bg-white/20 mx-1" />
                        {auth?.user ? (
                            <NavBtn href="/dashboard"
                                className={`px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25`}>
                                Dashboard <ArrowRight className="h-4 w-4" />
                            </NavBtn>
                        ) : (
                            <NavBtn href="/login"
                                className={`px-5 py-2.5 rounded-xl text-sm font-semibold ${
                                    scrolled
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/25'
                                        : 'bg-white/15 text-white hover:bg-white/25 border border-white/25 backdrop-blur-sm'
                                }`}>
                                Log In
                            </NavBtn>
                        )}
                    </nav>

                    {/* Mobile toggle */}
                    <button onClick={() => setMenuOpen(v => !v)}
                        className={`md:hidden p-2 rounded-lg transition-colors ${scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'}`}>
                        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>

                {/* Mobile menu */}
                <div className={`md:hidden transition-all duration-300 overflow-hidden ${menuOpen ? 'max-h-40' : 'max-h-0'}`}>
                    <div className="bg-white border-t border-gray-100 px-6 py-4 space-y-3">
                        {['Features', 'How It Works', 'Modules'].map(link => (
                            <a key={link} href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                                onClick={() => setMenuOpen(false)}
                                className="block text-sm text-gray-600 font-medium">
                                {link}
                            </a>
                        ))}
                        <NavBtn href={auth?.user ? '/dashboard' : '/login'}
                            className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm">
                            {auth?.user ? 'Dashboard' : 'Log In'}
                        </NavBtn>
                    </div>
                </div>
            </header>

            {/* ══════════════════════════════
                HERO — split layout
            ══════════════════════════════ */}
            <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-[#1e1b4b] to-[#2d1b69]">

                {/* Grid texture */}
                <div className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(rgba(99,102,241,0.12) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(99,102,241,0.12) 1px, transparent 1px)`,
                        backgroundSize: '72px 72px',
                    }} />

                {/* Radial glow */}
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-700/25 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-700/20 rounded-full blur-[100px] pointer-events-none" />

                {/* Subtle top border line */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

                <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-16 w-full">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">

                        {/* Left — copy */}
                        <div>
                            {/* Pill badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/25 text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-8"
                                style={{ animation: 'heroFadeDown 0.6s ease both' }}>
                                <Zap className="h-3.5 w-3.5" />
                                Human Resource Information System
                            </div>

                            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6"
                                style={{ animation: 'heroFadeUp 0.7s ease 0.1s both' }}>
                                Your Complete<br />
                                <span style={{
                                    background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c084fc 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}>
                                    HR Platform
                                </span>
                            </h1>

                            <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-lg"
                                style={{ animation: 'heroFadeUp 0.7s ease 0.2s both' }}>
                                Streamline every HR process — from hiring to payroll, attendance to performance — in one powerful, compliant, and easy-to-use system.
                            </p>

                            {/* CTAs */}
                            <div className="flex flex-wrap items-center gap-4 mb-12"
                                style={{ animation: 'heroFadeUp 0.7s ease 0.3s both' }}>
                                <NavBtn href={auth?.user ? '/dashboard' : '/login'}
                                    className="px-7 py-3.5 rounded-xl font-bold text-sm text-white hover:-translate-y-0.5"
                                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 8px 32px rgba(79,70,229,0.4)' }}>
                                    {auth?.user ? 'Open Dashboard' : 'Get Started'}
                                    <ArrowRight className="h-4 w-4" />
                                </NavBtn>
                            </div>

                            {/* Trust row */}
                            <div className="flex flex-wrap items-center gap-6"
                                style={{ animation: 'heroFadeUp 0.7s ease 0.4s both' }}>
                                {[
                                    'BIR Compliant',
                                    'SSS · PhilHealth · HDMF',
                                    'Biometric Ready',
                                ].map((t, i) => (
                                    <div key={t} className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                                        <div className="h-4 w-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                                            <CheckCircle className="h-2.5 w-2.5 text-emerald-400" />
                                        </div>
                                        {t}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right — dashboard mockup */}
                        <div style={{ animation: 'heroFadeLeft 0.9s ease 0.2s both' }}>
                            <DashboardMockup />
                        </div>
                    </div>
                </div>

                {/* Bottom fade */}
                <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            </section>

            {/* ══════════════════════════════
                STATS
            ══════════════════════════════ */}
            <section className="py-16 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                        {stats.map((s, i) => {
                            const [ref, count] = useCounter(s.value);
                            return (
                                <Reveal key={s.label} delay={i * 70} direction="up">
                                    <div ref={ref} className="bg-white px-8 py-8 text-center">
                                        <p className="text-4xl font-black text-gray-900 mb-1 tabular-nums">
                                            {count}{s.suffix}
                                        </p>
                                        <p className="text-sm font-bold text-gray-700 mb-0.5">{s.label}</p>
                                        <p className="text-xs text-gray-400">{s.sub}</p>
                                    </div>
                                </Reveal>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════
                FEATURES
            ══════════════════════════════ */}
            <section id="features" className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <Reveal direction="up">
                        <div className="text-center mb-16">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-widest border border-indigo-100 mb-4">
                                Features
                            </span>
                            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4 leading-tight">
                                Everything Your HR Team Needs
                            </h2>
                            <p className="max-w-xl mx-auto text-gray-500 text-lg leading-relaxed">
                                A complete suite of tools designed to simplify operations and keep you fully compliant.
                            </p>
                        </div>
                    </Reveal>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((f, i) => (
                            <Reveal key={f.title} delay={i * 70} direction="up">
                                <div className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-100/60 transition-all duration-300 hover:-translate-y-1.5 h-full flex flex-col cursor-default">
                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        <f.icon className="h-5 w-5 text-white" />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed mb-5 flex-1">{f.desc}</p>
                                    <ul className="space-y-2 pt-4 border-t border-gray-50">
                                        {f.benefits.map(b => (
                                            <li key={b} className="flex items-center gap-2.5 text-sm text-gray-600">
                                                <CheckCircle className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                                                {b}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════
                HOW IT WORKS
            ══════════════════════════════ */}
            <section id="how-it-works" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <Reveal direction="up">
                        <div className="text-center mb-16">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-violet-50 text-violet-600 text-xs font-bold uppercase tracking-widest border border-violet-100 mb-4">
                                How It Works
                            </span>
                            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4 leading-tight">
                                Up and Running in Minutes
                            </h2>
                            <p className="max-w-lg mx-auto text-gray-500 text-lg">
                                Three simple steps to transform how you manage your workforce.
                            </p>
                        </div>
                    </Reveal>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connector line */}
                        <div className="hidden md:block absolute top-10 left-1/6 right-1/6 h-px bg-gradient-to-r from-indigo-200 via-violet-200 to-indigo-200 pointer-events-none" style={{ left: '18%', right: '18%' }} />

                        {steps.map((s, i) => (
                            <Reveal key={s.num} delay={i * 120} direction="up">
                                <div className="relative text-center px-6">
                                    {/* Step number circle */}
                                    <div className="relative z-10 w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex flex-col items-center justify-center shadow-xl shadow-indigo-200">
                                        <span className="text-indigo-200 text-xs font-bold leading-none">{s.num}</span>
                                        <s.icon className="h-7 w-7 text-white mt-0.5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════
                MODULES
            ══════════════════════════════ */}
            <section id="modules" className="py-20 bg-gray-50 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <Reveal direction="up">
                        <div className="text-center mb-12">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-sky-50 text-sky-600 text-xs font-bold uppercase tracking-widest border border-sky-100 mb-4">
                                Modules
                            </span>
                            <h2 className="text-3xl lg:text-4xl font-black text-gray-900">All Integrated, All Connected</h2>
                        </div>
                    </Reveal>

                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                        {modules.map((m, i) => (
                            <Reveal key={m.label} delay={i * 50} direction="fade">
                                <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white border border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all duration-300 hover:-translate-y-1 group cursor-default">
                                    <div className={`p-3 rounded-xl ${m.color} transition-transform duration-300 group-hover:scale-110`}>
                                        <m.icon className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-600 text-center leading-tight group-hover:text-indigo-600 transition-colors">
                                        {m.label}
                                    </span>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════
                CTA BANNER
            ══════════════════════════════ */}
            <section className="py-28 relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#1e1b4b] to-[#2d1b69]">
                {/* Dot grid */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.07]"
                    style={{
                        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
                        backgroundSize: '28px 28px',
                    }} />

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-px inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

                <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
                    <Reveal direction="up">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/25 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6">
                            Get Started Today
                        </span>
                        <h2 className="text-4xl lg:text-5xl font-black text-white mb-5 leading-tight">
                            Ready to Modernize<br />Your HR Operations?
                        </h2>
                        <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                            Join organizations already using EC HRIS to manage their workforce smarter, faster, and with full compliance.
                        </p>
                        <NavBtn href={auth?.user ? '/dashboard' : '/login'}
                            className="px-8 py-4 rounded-xl bg-white text-indigo-700 font-bold text-sm hover:bg-indigo-50 shadow-2xl hover:-translate-y-0.5">
                            {auth?.user ? 'Open Dashboard' : 'Log in to EC HRIS'}
                            <ArrowRight className="h-4 w-4" />
                        </NavBtn>
                    </Reveal>
                </div>
            </section>

            {/* ══════════════════════════════
                FOOTER
            ══════════════════════════════ */}
            <footer className="bg-slate-950 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
                            <span className="text-xs font-black text-white">EC</span>
                        </div>
                        <div>
                            <span className="text-sm font-bold text-slate-300">EC HRIS</span>
                            {systemVersion && <span className="text-slate-600 text-xs ml-2">v{systemVersion}</span>}
                        </div>
                    </div>
                    <p className="text-slate-600 text-xs flex items-center gap-1.5">
                        © 2025 EC HRIS · Built with
                        <span className="text-rose-500 animate-pulse">♥</span>
                        by MRPA
                    </p>
                </div>
            </footer>

            {/* ── Keyframes ── */}
            <style>{`
                @keyframes heroFadeUp {
                    from { opacity: 0; transform: translateY(28px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes heroFadeDown {
                    from { opacity: 0; transform: translateY(-14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes heroFadeLeft {
                    from { opacity: 0; transform: translateX(40px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes floatY {
                    0%, 100% { transform: translateY(0px); }
                    50%       { transform: translateY(-10px); }
                }
            `}</style>
        </div>
    );
}
