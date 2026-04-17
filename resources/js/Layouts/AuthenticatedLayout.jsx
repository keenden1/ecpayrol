import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/Components/Sidebar';
import { Link, useForm, usePage } from '@inertiajs/react';
import {
    Menu, X, LogOut, User, Bell,
    ChevronDown, RefreshCw, CheckCircle, XCircle, ChevronUp, Users, XOctagon
} from 'lucide-react';

// ── Background Sync Tracker ──────────────────────────────────────────────────
function BgSyncTracker() {
    const loadJobs = () => {
        try { return JSON.parse(localStorage.getItem('bgSyncJobs') || '[]'); }
        catch { return []; }
    };

    const [jobs, setJobs]           = useState(() => loadJobs());
    const [collapsed, setCollapsed] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const pollRef                   = useRef(null);

    const saveJobs = (j) => localStorage.setItem('bgSyncJobs', JSON.stringify(j));

    const pollJobs = async () => {
        const stored = loadJobs();
        if (!stored.length) { setJobs([]); return; }

        const updated = await Promise.all(stored.map(async (job) => {
            if (job.status === 'completed' || job.status === 'failed') return job;
            try {
                const res  = await fetch(`/biometric-devices/sync-raw-status/${job.logId}`, { headers: { Accept: 'application/json' } });
                const data = await res.json();
                if (data.status === 'completed' || data.status === 'failed') {
                    window.dispatchEvent(new CustomEvent('bgSyncJobCompleted', { detail: { deviceId: job.deviceId, status: data.status } }));
                }
                return { ...job, status: data.status, stage: data.current_stage, totalLogs: data.total_logs, error: data.error_message, fetchTime: data.fetch_time };
            } catch { return job; }
        }));

        setJobs(updated);
        const now    = Date.now();
        const pruned = updated
            .filter(j => !(j.status === 'completed' || j.status === 'failed') || !j.doneAt || (now - j.doneAt) < 8000)
            .map(j    => ((j.status === 'completed' || j.status === 'failed') && !j.doneAt) ? { ...j, doneAt: now } : j);
        saveJobs(pruned);
        if (!pruned.length) setJobs([]);
    };

    useEffect(() => {
        pollJobs();
        pollRef.current = setInterval(pollJobs, 3000);
        const onAdded   = () => pollJobs();
        window.addEventListener('bgSyncJobAdded', onAdded);
        return () => { clearInterval(pollRef.current); window.removeEventListener('bgSyncJobAdded', onAdded); };
    }, []);

    const cancelAll = async () => {
        const running = jobs.filter(j => j.status !== 'completed' && j.status !== 'failed');
        if (!running.length) return;
        setCancelling(true);
        try {
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            await fetch('/biometric-devices/cancel-syncs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrf },
                body: JSON.stringify({ log_ids: running.map(j => j.logId) }),
            });
        } catch {}
        // Remove all running jobs from localStorage tracker
        const kept = jobs.filter(j => j.status === 'completed' || j.status === 'failed');
        saveJobs(kept);
        setJobs(kept);
        setCancelling(false);
    };

    if (!jobs.length) return null;

    const runningCount = jobs.filter(j => j.status !== 'completed' && j.status !== 'failed').length;

    return (
        <div className="fixed bottom-4 right-4 z-50 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3 text-indigo-500" /> Background Sync
                    {runningCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">{runningCount}</span>
                    )}
                </span>
                <div className="flex items-center gap-1.5">
                    {runningCount > 0 && (
                        <button
                            onClick={cancelAll}
                            disabled={cancelling}
                            title="Cancel all running syncs"
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                            <XOctagon className="w-3 h-3" />
                            <span>Cancel All</span>
                        </button>
                    )}
                    <button onClick={() => setCollapsed(c => !c)} className="text-gray-400 hover:text-gray-600">
                        <ChevronUp className={`w-3.5 h-3.5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>
            {!collapsed && (
                <ul className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                    {jobs.map(job => (
                        <li key={job.logId} className="px-3 py-2 flex items-start gap-2">
                            <div className="mt-0.5 flex-shrink-0">
                                {job.status === 'completed' ? <CheckCircle className="w-4 h-4 text-green-500" />
                                 : job.status === 'failed'  ? <XCircle className="w-4 h-4 text-red-500" />
                                 : <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-800 truncate">{job.deviceName}</p>
                                <p className="text-xs text-gray-500 truncate">
                                    {job.status === 'completed' ? `Done — ${job.totalLogs ?? 0} logs cached`
                                     : job.status === 'failed'  ? (job.error || 'Sync failed')
                                     : (job.stage || 'Starting...')}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// ── Logout Confirmation Modal ────────────────────────────────────────────────
function LogoutModal({ onCancel, onConfirm, processing }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

            {/* Dialog */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-modal-in">
                {/* Icon */}
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mx-auto mb-4">
                    <LogOut className="h-6 w-6 text-red-500" />
                </div>

                <h2 className="text-lg font-black text-gray-900 text-center mb-1">Sign Out</h2>
                <p className="text-sm text-gray-500 text-center mb-6">
                    Are you sure you want to sign out of your account?
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={processing}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                        {processing
                            ? <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                            : <LogOut className="h-4 w-4" />}
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Layout ──────────────────────────────────────────────────────────────
export default function AuthenticatedLayout({ children }) {
    const [sidebarOpen, setSidebarOpen]       = useState(false);
    const [isCollapsed, setIsCollapsed]       = useState(false);
    const [userMenuOpen, setUserMenuOpen]     = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const userMenuRef                         = useRef(null);
    const { auth }                            = usePage().props;
    const { post, processing }                = useForm();

    // Close user menu on outside click
    useEffect(() => {
        const handler = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    if (!auth?.user) return null;

    const initials = auth.user.name
        ? auth.user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : '?';

    return (
        <div className="min-h-screen bg-gray-50">

            {/* ══════════════════════════════════════
                TOP NAVBAR — fixed, full width, z-40
            ══════════════════════════════════════ */}
            <header className={`fixed top-0 right-0 z-40 h-16 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 gap-4 shadow-sm transition-all duration-300 ${isCollapsed ? 'left-0 lg:left-[4.5rem]' : 'left-0 lg:left-64'}`}>

                {/* Mobile hamburger */}
                <button
                    onClick={() => setSidebarOpen(v => !v)}
                    className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                >
                    {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>

                {/* Logo — visible on mobile, hidden on desktop (sidebar has it) */}
                <div className="flex items-center gap-2.5 lg:hidden">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md">
                        <span className="text-xs font-black text-white">EC</span>
                    </div>
                    <span className="text-sm font-black text-gray-900">EC HRIS</span>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Right side */}
                <div className="flex items-center gap-2">

                    {/* Bell */}
                    <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                        <Bell size={18} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                    </button>

                    {/* User menu */}
                    <div className="relative" ref={userMenuRef}>
                        <button
                            onClick={() => setUserMenuOpen(v => !v)}
                            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0 shadow-md">
                                {auth.user.photo_path
                                    ? <img src={`/storage/${auth.user.photo_path}`} alt={auth.user.name} className="w-full h-full object-cover" />
                                    : initials}
                            </div>
                            <div className="hidden sm:block text-left">
                                <p className="text-sm font-semibold text-gray-800 leading-none">{auth.user.name}</p>
                                <p className="text-xs text-gray-400 leading-none mt-0.5">
                                    {auth.user.roles?.[0]?.name ?? 'User'}
                                </p>
                            </div>
                            <ChevronDown size={14} className={`text-gray-400 transition-transform hidden sm:block ${userMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {userMenuOpen && (
                            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 overflow-hidden z-50">
                                {/* User info header */}
                                <div className="px-4 py-3 border-b border-gray-100 mb-1">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{auth.user.name}</p>
                                    <p className="text-xs text-gray-400 truncate">{auth.user.email}</p>
                                </div>
                                <Link
                                    href={route('profile.edit')}
                                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                    onClick={() => setUserMenuOpen(false)}
                                >
                                    <User size={15} /> Profile
                                </Link>
                                {auth.user.role_slug === 'superadmin' && (
                                    <Link
                                        href={route('manage.users')}
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                        onClick={() => setUserMenuOpen(false)}
                                    >
                                        <Users size={15} /> Staff / Users
                                    </Link>
                                )}
                                <div className="border-t border-gray-100 mt-1 pt-1">
                                    <button
                                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                        onClick={() => { setUserMenuOpen(false); setShowLogoutModal(true); }}
                                    >
                                        <LogOut size={15} /> Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* ══════════════════════════════════════
                SIDEBAR — starts BELOW the navbar
            ══════════════════════════════════════ */}
            <Sidebar
                open={sidebarOpen}
                setOpen={setSidebarOpen}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                user={auth.user}
            />

            {/* ══════════════════════════════════════
                MAIN CONTENT — offset top + left
            ══════════════════════════════════════ */}
            <div className={`transition-all duration-300 pt-16 overflow-x-hidden ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
                <main className="p-4 min-h-[calc(100vh-4rem)]">
                    {children}
                </main>
            </div>

            <BgSyncTracker />

            {/* Logout confirmation modal */}
            {showLogoutModal && (
                <LogoutModal
                    onCancel={() => setShowLogoutModal(false)}
                    onConfirm={() => post(route('logout'))}
                    processing={processing}
                />
            )}

            <style>{`
                @keyframes modal-in {
                    from { opacity: 0; transform: scale(0.93) translateY(8px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-modal-in { animation: modal-in 0.2s ease both; }
            `}</style>
        </div>
    );
}
