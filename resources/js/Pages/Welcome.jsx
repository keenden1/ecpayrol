import React, { useState, useEffect, useRef } from 'react';
import {
    Users, Clock, Calendar, DollarSign, Shield, BarChart3,
    CheckCircle, Award, FileText, Briefcase, UserCheck,
    TrendingUp, Globe, ArrowRight, Menu, X,
    ChevronUp, ChevronDown,
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
            ([e]) => { if (e.isIntersecting) setVisible(true); },
            { threshold }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return [ref, visible];
}

function useCounter(target, duration = 1800) {
    const [count, setCount] = useState(0);
    const [ref, visible] = useScrollReveal(0.5);
    useEffect(() => {
        if (!visible) return;
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
   Reveal wrapper
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
   Animated background blobs
───────────────────────────────────────────── */
function HeroBg() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Dot grid */}
            <div className="absolute inset-0 opacity-[0.35]"
                style={{
                    backgroundImage: `radial-gradient(circle, #0D2E6E22 1px, transparent 1px)`,
                    backgroundSize: '32px 32px',
                }} />
            {/* Soft blobs */}
            <div className="blob blob-1" />
            <div className="blob blob-2" />
            <div className="blob blob-3" />
            {/* Corner arcs */}
            <svg className="absolute top-0 right-0 w-[480px] opacity-10" viewBox="0 0 480 480" fill="none">
                <circle cx="480" cy="0" r="320" stroke="#0D2E6E" strokeWidth="60" fill="none"/>
                <circle cx="480" cy="0" r="200" stroke="#22C55E" strokeWidth="30" fill="none"/>
            </svg>
            <svg className="absolute bottom-0 left-0 w-[360px] opacity-10" viewBox="0 0 360 360" fill="none">
                <circle cx="0" cy="360" r="260" stroke="#0D2E6E" strokeWidth="50" fill="none"/>
            </svg>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Dashboard Mockup
───────────────────────────────────────────── */
function DashboardMockup() {
    const bars = [65, 82, 54, 90, 72, 88, 60];
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    return (
        <div className="relative w-full max-w-lg mx-auto" style={{ animation: 'floatY 5s ease-in-out infinite' }}>
            {/* Subtle shadow behind */}
            <div className="absolute inset-0 translate-y-6 scale-95 bg-navy-900/20 rounded-2xl blur-2xl opacity-40" />

            {/* Main card */}
            <div className="relative bg-white border border-gray-200 rounded-2xl p-5 shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-widest font-medium">Overview</p>
                        <p className="text-gray-800 font-bold text-base">HR Dashboard</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-emerald-700 text-xs font-medium">Live</span>
                    </div>
                </div>

                {/* Stat pills */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                        { label: 'Employees', value: '248', trend: 'up',   delta: '+4' },
                        { label: 'On Leave',  value: '12',  trend: 'down', delta: '-2' },
                        { label: 'Payroll',   value: '₱2.4M', trend: 'up', delta: '+8%' },
                    ].map(s => (
                        <div key={s.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                            <p className="text-gray-400 text-xs mb-1">{s.label}</p>
                            <p className="text-gray-800 font-bold text-sm">{s.value}</p>
                            <div className={`flex items-center gap-0.5 mt-0.5 text-xs font-medium ${s.trend === 'up' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {s.trend === 'up' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                {s.delta}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bar chart */}
                <div className="mb-5 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-gray-500 text-xs font-medium">Attendance Rate</p>
                        <p className="text-[#0D2E6E] text-xs font-bold">This Week</p>
                    </div>
                    <div className="flex items-end gap-1.5 h-14">
                        {bars.map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full rounded-t-sm transition-all duration-700"
                                    style={{
                                        height: `${h}%`,
                                        background: i === 4 ? '#0D2E6E' : i === 2 ? '#22C55E' : '#DBEAFE',
                                    }} />
                                <span className="text-gray-400 text-xs">{days[i]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Activity */}
                <div className="space-y-2">
                    {[
                        { name: 'Maria Santos',   action: 'Filed leave request', time: '2m ago',  dot: 'bg-amber-400' },
                        { name: 'Juan Dela Cruz', action: 'Payslip generated',   time: '15m ago', dot: 'bg-emerald-500' },
                        { name: 'Ana Reyes',      action: 'Clock-in recorded',   time: '1h ago',  dot: 'bg-[#0D2E6E]' },
                    ].map(a => (
                        <div key={a.name} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                            <span className={`h-2 w-2 rounded-full flex-shrink-0 ${a.dot}`} />
                            <div className="flex-1 min-w-0">
                                <p className="text-gray-800 text-xs font-semibold truncate">{a.name}</p>
                                <p className="text-gray-400 text-xs truncate">{a.action}</p>
                            </div>
                            <span className="text-gray-400 text-xs flex-shrink-0">{a.time}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Badge top-right */}
            <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-2 border border-gray-200"
                style={{ animation: 'floatY 4s ease-in-out 0.5s infinite' }}>
                <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-800">Payroll Processed</p>
                    <p className="text-xs text-gray-400">248 employees · ₱2.4M</p>
                </div>
            </div>

            {/* Badge bottom-left */}
            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-2 border border-gray-200"
                style={{ animation: 'floatY 4.5s ease-in-out 1s infinite' }}>
                <div className="h-8 w-8 rounded-lg bg-[#0D2E6E] flex items-center justify-center">
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
   Nav button with loading state
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
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
            color: 'text-[#0D2E6E] bg-blue-50',
            benefits: ['Employee profiles & history', 'Document management', 'Org chart & hierarchy'],
        },
        {
            icon: DollarSign, title: 'Payroll Processing',
            desc: 'Automated, accurate payroll computation with full compliance to Philippine labor laws.',
            color: 'text-emerald-700 bg-emerald-50',
            benefits: ['Auto tax & deduction calc', 'Digital payslips', 'SSS, PhilHealth, HDMF'],
        },
        {
            icon: Clock, title: 'Time & Attendance',
            desc: 'Biometric-integrated tracking with real-time overtime detection and shift management.',
            color: 'text-violet-700 bg-violet-50',
            benefits: ['Biometric integration', 'Shift scheduling', 'Overtime detection'],
        },
        {
            icon: Calendar, title: 'Leave Management',
            desc: 'Self-service leave filing with automated approval workflows and real-time balance tracking.',
            color: 'text-rose-700 bg-rose-50',
            benefits: ['Leave request & approval', 'Balance tracking', 'Holiday calendar'],
        },
        {
            icon: Award, title: 'Core HR Modules',
            desc: 'Manage promotions, transfers, disciplinary actions, resignations, and more.',
            color: 'text-amber-700 bg-amber-50',
            benefits: ['Promotions & transfers', 'Complaints & warnings', 'Resignation tracking'],
        },
        {
            icon: BarChart3, title: 'Reports & Analytics',
            desc: 'Data-driven insights with exportable reports for strategic HR decision-making.',
            color: 'text-sky-700 bg-sky-50',
            benefits: ['Payroll summaries', 'Attendance reports', 'Export to Excel'],
        },
    ];

    const stats = [
        { value: 99,  suffix: '%',  label: 'Payroll Accuracy',   sub: 'Error-free computation' },
        { value: 10,  suffix: 'x',  label: 'Faster Processing',  sub: 'vs. manual methods' },
        { value: 100, suffix: '%',  label: 'BIR Compliant',      sub: 'All contributions filed' },
        { value: 24,  suffix: '/7', label: 'System Uptime',      sub: 'Always available' },
    ];

    const steps = [
        { num: '01', icon: UserCheck,   title: 'Set Up Your Organization',  desc: 'Configure departments, roles, and employee records in minutes with our guided setup wizard.' },
        { num: '02', icon: Clock,       title: 'Track Time & Attendance',   desc: 'Connect biometric devices or use manual entry. Attendance flows directly into payroll.' },
        { num: '03', icon: DollarSign,  title: 'Run Payroll Automatically', desc: 'One click to generate accurate payslips with all deductions, benefits, and taxes computed.' },
    ];

    const modules = [
        { icon: UserCheck,  label: 'Employee Portal',   color: 'text-[#0D2E6E] bg-blue-50' },
        { icon: FileText,   label: 'Payslip Generator', color: 'text-emerald-700 bg-emerald-50' },
        { icon: Briefcase,  label: 'Core HR',           color: 'text-amber-700 bg-amber-50' },
        { icon: Shield,     label: 'Roles & Access',    color: 'text-rose-700 bg-rose-50' },
        { icon: Globe,      label: 'HR Calendar',       color: 'text-sky-700 bg-sky-50' },
        { icon: TrendingUp, label: 'Analytics',         color: 'text-violet-700 bg-violet-50' },
    ];

    return (
        <div className="min-h-screen bg-white text-gray-900 antialiased overflow-x-hidden">

            {/* ══════════════════════════════
                NAVBAR
            ══════════════════════════════ */}
            <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
                scrolled ? 'bg-white shadow-md border-b border-gray-200' : 'bg-white/90 backdrop-blur-md border-b border-gray-200/60'
            }`}>
                <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <a href="/" className="flex items-center gap-2">
                        <img src="/image/logo.png" alt="Eljin Corp" className="h-9 w-auto object-contain" />
                    </a>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-6">
                        {['Features', 'How It Works', 'Modules'].map(link => (
                            <a key={link} href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                                className="text-sm font-medium text-gray-600 hover:text-[#0D2E6E] transition-colors">
                                {link}
                            </a>
                        ))}
                        <div className="h-5 w-px bg-gray-200 mx-1" />
                        {auth?.user ? (
                            <NavBtn href="/employee/dashboard"
                                className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#0D2E6E] hover:bg-[#0a2257] text-white shadow-sm">
                                Dashboard <ArrowRight className="h-4 w-4" />
                            </NavBtn>
                        ) : (
                            <NavBtn href="/login"
                                className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#0D2E6E] hover:bg-[#0a2257] text-white shadow-sm">
                                Log In
                            </NavBtn>
                        )}
                    </nav>

                    {/* Mobile toggle */}
                    <button onClick={() => setMenuOpen(v => !v)}
                        className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100">
                        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>

                {/* Mobile menu */}
                <div className={`md:hidden transition-all duration-300 overflow-hidden ${menuOpen ? 'max-h-56' : 'max-h-0'}`}>
                    <div className="bg-white border-t border-gray-100 px-6 py-4 space-y-3">
                        {['Features', 'How It Works', 'Modules'].map(link => (
                            <a key={link} href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                                onClick={() => setMenuOpen(false)}
                                className="block text-sm text-gray-600 font-medium hover:text-[#0D2E6E]">
                                {link}
                            </a>
                        ))}
                        <NavBtn href={auth?.user ? '/employee/dashboard' : '/login'}
                            className="w-full px-4 py-2.5 rounded-lg bg-[#0D2E6E] text-white font-semibold text-sm">
                            {auth?.user ? 'Dashboard' : 'Log In'}
                        </NavBtn>
                    </div>
                </div>
            </header>

            {/* ══════════════════════════════
                HERO
            ══════════════════════════════ */}
            <section className="relative min-h-screen flex items-center overflow-hidden hero-bg pt-16">
                <HeroBg />

                <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-20 w-full">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">

                        {/* Left — copy */}
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#0D2E6E]/20 text-[#0D2E6E] text-xs font-semibold uppercase tracking-widest mb-8 shadow-sm"
                                style={{ animation: 'fadeDown 0.6s ease both' }}>
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                Human Resource Information System
                            </div>

                            <h1 className="text-5xl lg:text-6xl font-black text-[#0D2E6E] leading-[1.05] tracking-tight mb-6"
                                style={{ animation: 'fadeUp 0.7s ease 0.1s both' }}>
                                Your Complete<br />
                                <span className="text-green-600">HR Platform</span>
                            </h1>

                            <p className="text-gray-500 text-lg leading-relaxed mb-10 max-w-lg"
                                style={{ animation: 'fadeUp 0.7s ease 0.2s both' }}>
                                Streamline every HR process — from hiring to payroll, attendance to performance — in one powerful, compliant, and easy-to-use system.
                            </p>

                            <div className="flex flex-wrap items-center gap-4 mb-12"
                                style={{ animation: 'fadeUp 0.7s ease 0.3s both' }}>
                                <NavBtn href={auth?.user ? '/employee/dashboard' : '/login'}
                                    className="px-7 py-3.5 rounded-lg font-bold text-sm text-white bg-[#0D2E6E] hover:bg-[#0a2257] shadow-lg shadow-[#0D2E6E]/20 hover:-translate-y-0.5 transition-all">
                                    {auth?.user ? 'Open Dashboard' : 'Get Started'}
                                    <ArrowRight className="h-4 w-4" />
                                </NavBtn>
                            </div>

                            <div className="flex flex-wrap items-center gap-6"
                                style={{ animation: 'fadeUp 0.7s ease 0.4s both' }}>
                                {['BIR Compliant', 'SSS · PhilHealth · HDMF', 'Biometric Ready'].map(t => (
                                    <div key={t} className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                        {t}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right — mockup */}
                        <div style={{ animation: 'fadeLeft 0.9s ease 0.2s both' }}>
                            <DashboardMockup />
                        </div>
                    </div>
                </div>

                {/* Bottom fade to white */}
                <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            </section>

            {/* ══════════════════════════════
                STATS
            ══════════════════════════════ */}
            <section className="py-16 bg-white border-y border-gray-200">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-200 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        {stats.map((s, i) => {
                            const [ref, count] = useCounter(s.value);
                            return (
                                <Reveal key={s.label} delay={i * 80} direction="up">
                                    <div ref={ref} className="bg-white px-8 py-8 text-center hover:bg-blue-50/40 transition-colors">
                                        <p className="text-4xl font-black text-[#0D2E6E] mb-1 tabular-nums">
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
            <section id="features" className="py-24 features-bg relative overflow-hidden">
                {/* decorative arc */}
                <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full border-[40px] border-[#0D2E6E]/5 pointer-events-none" />
                <div className="absolute -left-16 bottom-10 w-64 h-64 rounded-full border-[30px] border-green-500/5 pointer-events-none" />

                <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
                    <Reveal direction="up">
                        <div className="text-center mb-16">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-[#0D2E6E]/8 text-[#0D2E6E] text-xs font-bold uppercase tracking-widest border border-[#0D2E6E]/15 mb-4">
                                Features
                            </span>
                            <h2 className="text-4xl font-black text-gray-900 mb-4 leading-tight">
                                Everything Your HR Team Needs
                            </h2>
                            <p className="max-w-xl mx-auto text-gray-500 text-lg leading-relaxed">
                                A complete suite of tools designed to simplify operations and keep you fully compliant.
                            </p>
                        </div>
                    </Reveal>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((f, i) => (
                            <Reveal key={f.title} delay={i * 80} direction="up">
                                <div className="group bg-white rounded-xl p-6 border border-gray-200 hover:border-[#0D2E6E]/30 hover:shadow-xl hover:shadow-[#0D2E6E]/8 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col cursor-default">
                                    <div className={`w-11 h-11 rounded-lg ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                                        <f.icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed mb-5 flex-1">{f.desc}</p>
                                    <ul className="space-y-2 pt-4 border-t border-gray-100">
                                        {f.benefits.map(b => (
                                            <li key={b} className="flex items-center gap-2.5 text-sm text-gray-600">
                                                <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
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
            <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
                {/* Diagonal stripe bg */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
                    style={{
                        backgroundImage: `repeating-linear-gradient(
                            -45deg,
                            #0D2E6E,
                            #0D2E6E 2px,
                            transparent 2px,
                            transparent 24px
                        )`,
                    }} />

                <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
                    <Reveal direction="up">
                        <div className="text-center mb-16">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-bold uppercase tracking-widest border border-green-100 mb-4">
                                How It Works
                            </span>
                            <h2 className="text-4xl font-black text-gray-900 mb-4 leading-tight">
                                Up and Running in Minutes
                            </h2>
                            <p className="max-w-lg mx-auto text-gray-500 text-lg">
                                Three simple steps to transform how you manage your workforce.
                            </p>
                        </div>
                    </Reveal>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        <div className="hidden md:block absolute top-10 h-px bg-gradient-to-r from-[#0D2E6E]/20 via-green-400/40 to-[#0D2E6E]/20 pointer-events-none" style={{ left: '18%', right: '18%' }} />
                        {steps.map((s, i) => (
                            <Reveal key={s.num} delay={i * 130} direction="up">
                                <div className="relative text-center px-6">
                                    <div className="relative z-10 w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#0D2E6E] flex flex-col items-center justify-center shadow-xl shadow-[#0D2E6E]/25 group-hover:scale-105 transition-transform">
                                        <span className="text-blue-300 text-xs font-bold leading-none">{s.num}</span>
                                        <s.icon className="h-7 w-7 text-white mt-0.5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════
                MODULES
            ══════════════════════════════ */}
            <section id="modules" className="py-20 modules-bg relative overflow-hidden border-t border-gray-200">
                <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-green-400/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
                    <Reveal direction="up">
                        <div className="text-center mb-12">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-sky-50 text-sky-700 text-xs font-bold uppercase tracking-widest border border-sky-100 mb-4">
                                Modules
                            </span>
                            <h2 className="text-3xl font-black text-gray-900">All Integrated, All Connected</h2>
                        </div>
                    </Reveal>

                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                        {modules.map((m, i) => (
                            <Reveal key={m.label} delay={i * 60} direction="fade">
                                <div className="flex flex-col items-center gap-3 p-5 rounded-xl bg-white border border-gray-200 hover:border-[#0D2E6E]/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-default">
                                    <div className={`p-3 rounded-lg ${m.color} group-hover:scale-110 transition-transform duration-300`}>
                                        <m.icon className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-600 text-center leading-tight group-hover:text-[#0D2E6E] transition-colors">
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
            <section className="py-24 cta-bg relative overflow-hidden">
                {/* Dot grid overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-10"
                    style={{
                        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)`,
                        backgroundSize: '28px 28px',
                    }} />
                {/* Arc decoration */}
                <svg className="absolute right-0 top-1/2 -translate-y-1/2 h-full opacity-10" viewBox="0 0 300 600" fill="none">
                    <circle cx="300" cy="300" r="240" stroke="white" strokeWidth="60"/>
                    <circle cx="300" cy="300" r="150" stroke="#22C55E" strokeWidth="30"/>
                </svg>

                <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
                    <Reveal direction="up">
                        <div className="flex justify-center mb-6">
                            <span className="text-white/70 text-sm font-bold uppercase tracking-[0.3em]">HRIS</span>
                        </div>
                        <h2 className="text-4xl font-black text-white mb-5 leading-tight">
                            Ready to Modernize<br />Your HR Operations?
                        </h2>
                        <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                            Join organizations already using EC HRIS to manage their workforce smarter, faster, and with full compliance.
                        </p>
                        <NavBtn href={auth?.user ? '/employee/dashboard' : '/login'}
                            className="px-8 py-3.5 rounded-lg bg-white text-[#0D2E6E] font-bold text-sm hover:bg-blue-50 shadow-lg hover:-translate-y-0.5 transition-all">
                            {auth?.user ? 'Open Dashboard' : 'Log in to EC HRIS'}
                            <ArrowRight className="h-4 w-4" />
                        </NavBtn>
                    </Reveal>
                </div>
            </section>

            {/* ══════════════════════════════
                FOOTER
            ══════════════════════════════ */}
            <footer className="bg-[#0a1e47] border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-white/60 text-sm font-bold uppercase tracking-[0.3em]">HRIS</span>
                        {systemVersion && <span className="text-gray-500 text-xs">v{systemVersion}</span>}
                    </div>
                    <p className="text-gray-500 text-xs">
                        © 2025 EC HRIS
                    </p>
                </div>
            </footer>

            {/* ── Global styles ── */}
            <style>{`
                /* Hero background */
                .hero-bg {
                    background: linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 40%, #F8FAFC 70%, #EFF6FF 100%);
                }
                /* Features section */
                .features-bg {
                    background: linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 100%);
                }
                /* Modules section */
                .modules-bg {
                    background: linear-gradient(180deg, #F0FDF4 0%, #F8FAFC 100%);
                }
                /* CTA section */
                .cta-bg {
                    background: linear-gradient(135deg, #0D2E6E 0%, #0a3d62 50%, #0D2E6E 100%);
                }

                /* Animated blobs */
                .blob {
                    position: absolute;
                    border-radius: 9999px;
                    filter: blur(80px);
                    opacity: 0.18;
                    pointer-events: none;
                }
                .blob-1 {
                    width: 500px; height: 500px;
                    background: #0D2E6E;
                    top: -100px; left: -100px;
                    animation: blobDrift1 12s ease-in-out infinite;
                }
                .blob-2 {
                    width: 400px; height: 400px;
                    background: #22C55E;
                    bottom: -80px; right: 10%;
                    animation: blobDrift2 15s ease-in-out infinite;
                }
                .blob-3 {
                    width: 300px; height: 300px;
                    background: #0D2E6E;
                    top: 40%; left: 40%;
                    animation: blobDrift3 10s ease-in-out infinite;
                }

                /* Keyframes */
                @keyframes blobDrift1 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33%      { transform: translate(60px, 40px) scale(1.08); }
                    66%      { transform: translate(-30px, 60px) scale(0.95); }
                }
                @keyframes blobDrift2 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50%      { transform: translate(-50px, -40px) scale(1.1); }
                }
                @keyframes blobDrift3 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    40%      { transform: translate(30px, -50px) scale(1.05); }
                    80%      { transform: translate(-20px, 20px) scale(0.95); }
                }
                @keyframes floatY {
                    0%, 100% { transform: translateY(0px); }
                    50%      { transform: translateY(-10px); }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(28px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeDown {
                    from { opacity: 0; transform: translateY(-14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeLeft {
                    from { opacity: 0; transform: translateX(40px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    );
}
