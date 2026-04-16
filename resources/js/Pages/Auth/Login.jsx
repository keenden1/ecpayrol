import React, { useState, useEffect } from 'react';
import {
    CheckCircle, AlertCircle, Eye, EyeOff,
    Users, Clock, DollarSign, Shield, ArrowRight, Zap
} from 'lucide-react';

/* ─── Brand Panel features list ── */
const brandFeatures = [
    { icon: Users,      label: 'Employee Management',  sub: 'Centralized HR records' },
    { icon: DollarSign, label: 'Payroll Processing',   sub: 'BIR & statutory compliant' },
    { icon: Clock,      label: 'Time & Attendance',    sub: 'Biometric integration' },
    { icon: Shield,     label: 'Roles & Access',       sub: 'Granular permissions' },
];

const Login = () => {
    const [formData, setFormData]   = useState({ email: '', password: '', remember: false });
    const [errors, setErrors]       = useState({});
    const [processing, setProcessing]   = useState(false);
    const [status, setStatus]           = useState('');
    const [showPass, setShowPass]       = useState(false);
    const [mounted, setMounted]         = useState(false);
    const [forgotLoading, setForgotLoading]     = useState(false);
    const [registerLoading, setRegisterLoading] = useState(false);

    useEffect(() => {
        setMounted(true);
        const flashStatus = document.querySelector('meta[name="status"]')?.getAttribute('content');
        if (flashStatus) setStatus(flashStatus);
        const loginSuccess = sessionStorage.getItem('loginSuccess');
        if (loginSuccess) { setStatus('Successfully logged in!'); sessionStorage.removeItem('loginSuccess'); }
    }, []);

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const validateForm = () => {
        const errs = {};
        if (!formData.email)                   errs.email    = 'Email is required';
        else if (!validateEmail(formData.email)) errs.email  = 'Please enter a valid email address';
        if (!formData.password)                errs.password = 'Password is required';
        return errs;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Show spinner immediately — let the browser paint it before we run anything
        setProcessing(true);
        setErrors({});
        setStatus('');

        requestAnimationFrame(() => {
            setTimeout(async () => {
                const errs = validateForm();
                if (Object.keys(errs).length) {
                    setErrors(errs);
                    setProcessing(false);
                    return;
                }

                const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                try {
                    const response = await fetch('/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'X-CSRF-TOKEN': token,
                        },
                        body: JSON.stringify({
                            email: formData.email,
                            password: formData.password,
                            remember: formData.remember ? 1 : 0,
                        }),
                    });

                    if (response.ok) {
                        sessionStorage.setItem('loginSuccess', '1');
                        // Navigate to wherever the server redirected us (role-based dashboard)
                        window.location.href = response.url || '/dashboard';
                        return;
                    }

                    const data = await response.json().catch(() => null);
                    if (response.status === 422 && data?.errors) {
                        const mapped = {};
                        Object.entries(data.errors).forEach(([f, m]) => {
                            mapped[f] = Array.isArray(m) ? m[0] : m;
                        });
                        setErrors(mapped);
                    } else if (response.status === 419) {
                        setErrors({ submit: 'Session expired. Please refresh and try again.' });
                    } else {
                        setErrors({ submit: data?.message || 'These credentials do not match our records.' });
                    }
                } catch {
                    setErrors({ submit: 'A network error occurred. Please check your connection.' });
                } finally {
                    setProcessing(false);
                }
            }, 50); // 50ms — enough for React to flush + browser to paint the spinner
        });
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    };

    return (
        <div className="min-h-screen flex bg-white overflow-hidden">

            {/* ══════════════════════════════
                LEFT — Brand Panel
            ══════════════════════════════ */}
            <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-slate-900 via-[#1e1b4b] to-[#2d1b69]">

                {/* Grid texture */}
                <div className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(rgba(99,102,241,0.12) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(99,102,241,0.12) 1px, transparent 1px)`,
                        backgroundSize: '56px 56px',
                    }} />

                {/* Glow blobs */}
                <div className="absolute top-0 right-0 w-[480px] h-[480px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[360px] h-[360px] bg-violet-700/15 rounded-full blur-[80px] pointer-events-none" />

                {/* Top line accent */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

                {/* Logo */}
                <div className={`relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                    <a href="/" className="inline-flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
                            <span className="text-sm font-black text-white tracking-tighter">EC</span>
                        </div>
                        <div>
                            <p className="text-white font-black text-lg leading-none">EC HRIS</p>
                            <p className="text-indigo-300/70 text-xs leading-none mt-0.5">Human Resource System</p>
                        </div>
                    </a>
                </div>

                {/* Center copy */}
                <div className={`relative z-10 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/25 text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-6">
                        <Zap className="h-3 w-3" />
                        Complete HR Platform
                    </div>

                    <h2 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-4">
                        Manage Your<br />
                        <span style={{
                            background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c084fc 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            Workforce Smarter
                        </span>
                    </h2>
                    <p className="text-slate-400 text-base leading-relaxed mb-10 max-w-sm">
                        From payroll to attendance, leave to performance — everything your HR team needs in one place.
                    </p>

                    {/* Feature list */}
                    <div className="space-y-4">
                        {brandFeatures.map((f, i) => (
                            <div key={f.label}
                                className={`flex items-center gap-4 transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                                style={{ transitionDelay: `${200 + i * 80}ms` }}>
                                <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                                    <f.icon className="h-4.5 w-4.5 text-indigo-300" style={{ height: '1.125rem', width: '1.125rem' }} />
                                </div>
                                <div>
                                    <p className="text-white text-sm font-semibold leading-none mb-0.5">{f.label}</p>
                                    <p className="text-slate-400 text-xs">{f.sub}</p>
                                </div>
                                <CheckCircle className="h-4 w-4 text-emerald-400 ml-auto flex-shrink-0" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom trust badges */}
                <div className={`relative z-10 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="flex items-center gap-3 flex-wrap">
                        {['BIR Compliant', 'SSS · PhilHealth · HDMF', 'Biometric Ready'].map(t => (
                            <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 border border-white/10 text-slate-300 text-xs font-medium">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                {t}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════
                RIGHT — Login Form
            ══════════════════════════════ */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 py-12 bg-gray-50 relative overflow-hidden">

                {/* Subtle background pattern */}
                <div className="absolute inset-0 pointer-events-none opacity-40"
                    style={{
                        backgroundImage: `radial-gradient(circle, #e0e7ff 1px, transparent 1px)`,
                        backgroundSize: '32px 32px',
                    }} />

                {/* Mobile logo */}
                <div className="lg:hidden mb-8 flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg">
                        <span className="text-xs font-black text-white">EC</span>
                    </div>
                    <span className="text-lg font-black text-gray-900">EC HRIS</span>
                </div>

                {/* Form card */}
                <div className={`relative z-10 w-full max-w-md transition-all duration-700 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

                    {/* Card */}
                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/80 border border-gray-100 p-8">

                        {/* Heading */}
                        <div className="mb-8">
                            <h1 className="text-2xl font-black text-gray-900 mb-1">Welcome back</h1>
                            <p className="text-gray-400 text-sm">Sign in to your EC HRIS account</p>
                        </div>

                        {/* Status message */}
                        {status && (
                            <div className="mb-5 flex items-start gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
                                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>{status}</span>
                            </div>
                        )}

                        {/* Submit error */}
                        {errors.submit && (
                            <div className="mb-5 flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>{errors.submit}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5" noValidate>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@company.com"
                                    autoComplete="username"
                                    autoFocus
                                    className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-900 placeholder-gray-300 bg-white transition-all duration-200 outline-none
                                        ${errors.email
                                            ? 'border-red-300 ring-2 ring-red-100 focus:border-red-400'
                                            : 'border-gray-200 hover:border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
                                        }`}
                                />
                                {errors.email && (
                                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />{errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label htmlFor="password" className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Password
                                    </label>
                                    <button
                                        type="button"
                                        disabled={forgotLoading}
                                        onClick={() => {
                                            setForgotLoading(true);
                                            setTimeout(() => { window.location.href = '/forgot-password'; }, 80);
                                        }}
                                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors disabled:opacity-70">
                                        {forgotLoading
                                            ? <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                                            : 'Forgot password?'}
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPass ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        className={`w-full px-4 py-3 pr-11 rounded-xl border text-sm text-gray-900 placeholder-gray-300 bg-white transition-all duration-200 outline-none
                                            ${errors.password
                                                ? 'border-red-300 ring-2 ring-red-100 focus:border-red-400'
                                                : 'border-gray-200 hover:border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5">
                                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />{errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Remember me */}
                            <div className="flex items-center gap-3">
                                <div className="relative flex-shrink-0">
                                    <input
                                        type="checkbox"
                                        id="remember"
                                        name="remember"
                                        checked={formData.remember}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <label htmlFor="remember"
                                        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border-2 border-gray-200 bg-white peer-checked:border-indigo-600 peer-checked:bg-indigo-600 transition-all duration-150">
                                        <CheckCircle className="h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" style={{ display: formData.remember ? 'block' : 'none' }} />
                                        {formData.remember && <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    </label>
                                </div>
                                <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer select-none">
                                    Keep me signed in for 30 days
                                </label>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="group w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                                style={{
                                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                    boxShadow: processing ? 'none' : '0 6px 24px rgba(79,70,229,0.35)',
                                    opacity: processing ? 0.85 : 1,
                                }}
                            >
                                {processing ? (
                                    <>
                                        <svg className="h-4 w-4 animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                                        </svg>
                                        Signing in…
                                    </>
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Register link */}
                        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                            <p className="text-sm text-gray-400">
                                New employee?{' '}
                                <button
                                    type="button"
                                    disabled={registerLoading}
                                    onClick={() => {
                                        setRegisterLoading(true);
                                        setTimeout(() => { window.location.href = route('employee.register'); }, 80);
                                    }}
                                    className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors disabled:opacity-70">
                                    {registerLoading
                                        ? <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                                        : null}
                                    Register your account
                                </button>
                            </p>
                        </div>
                    </div>

                    {/* Below card note */}
                    <p className="mt-6 text-center text-xs text-gray-400">
                        Protected by enterprise-grade security. Your data is safe.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
