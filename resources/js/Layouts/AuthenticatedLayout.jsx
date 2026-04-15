import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/Components/Sidebar';
import { Link, usePage } from '@inertiajs/react';
import { Menu, X, LogOut, User, Bell, ChevronDown, RefreshCw, CheckCircle, XCircle, ChevronUp } from 'lucide-react';

// ── Background Sync Tracker ──────────────────────────────────────────────────
function BgSyncTracker() {
    const loadJobs = () => {
        try {
            return JSON.parse(localStorage.getItem('bgSyncJobs') || '[]');
        } catch { return []; }
    };

    // Initialize synchronously from localStorage so pill shows immediately on any page
    const [jobs, setJobs] = useState(() => loadJobs());
    const [collapsed, setCollapsed] = useState(false);
    const pollRef = useRef(null);

    const saveJobs = (jobs) => {
        localStorage.setItem('bgSyncJobs', JSON.stringify(jobs));
    };

    const pollJobs = async () => {
        const stored = loadJobs();
        if (stored.length === 0) { setJobs([]); return; }

        const updated = await Promise.all(stored.map(async (job) => {
            // Already terminal — keep for display, don't re-poll
            if (job.status === 'completed' || job.status === 'failed') return job;
            try {
                const res = await fetch(`/biometric-devices/sync-raw-status/${job.logId}`, {
                    headers: { Accept: 'application/json' },
                });
                const data = await res.json();
                
                // If it just finished, dispatch a refresh event
                if (data.status === 'completed' || data.status === 'failed') {
                    window.dispatchEvent(new CustomEvent('bgSyncJobCompleted', { 
                        detail: { deviceId: job.deviceId, status: data.status } 
                    }));
                }

                return { ...job, status: data.status, stage: data.current_stage, totalLogs: data.total_logs, error: data.error_message, fetchTime: data.fetch_time };
            } catch {
                return job;
            }
        }));

        setJobs(updated);

        // Persist terminal jobs for a short time then remove
        const now = Date.now();
        const pruned = updated.filter(j => {
            if (j.status === 'completed' || j.status === 'failed') {
                return !j.doneAt || (now - j.doneAt) < 8000;
            }
            return true;
        }).map(j => {
            if ((j.status === 'completed' || j.status === 'failed') && !j.doneAt) {
                return { ...j, doneAt: now };
            }
            return j;
        });

        saveJobs(pruned);
        if (pruned.length === 0) setJobs([]);
    };

    useEffect(() => {
        pollJobs();
        pollRef.current = setInterval(pollJobs, 3000);

        const onJobAdded = () => { pollJobs(); };
        window.addEventListener('bgSyncJobAdded', onJobAdded);

        return () => {
            clearInterval(pollRef.current);
            window.removeEventListener('bgSyncJobAdded', onJobAdded);
        };
    }, []);

    if (jobs.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3 text-indigo-500" />
                    Background Sync
                </span>
                <button onClick={() => setCollapsed(c => !c)} className="text-gray-400 hover:text-gray-600">
                    <ChevronUp className={`w-3.5 h-3.5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Job list */}
            {!collapsed && (
                <ul className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                    {jobs.map(job => (
                        <li key={job.logId} className="px-3 py-2 flex items-start gap-2">
                            <div className="mt-0.5 flex-shrink-0">
                                {job.status === 'completed'
                                    ? <CheckCircle className="w-4 h-4 text-green-500" />
                                    : job.status === 'failed'
                                    ? <XCircle className="w-4 h-4 text-red-500" />
                                    : <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-800 truncate">{job.deviceName}</p>
                                <p className="text-xs text-gray-500 truncate">
                                    {job.status === 'completed'
                                        ? `Done — ${job.totalLogs ?? 0} logs cached`
                                        : job.status === 'failed'
                                        ? (job.error || 'Sync failed')
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
// ─────────────────────────────────────────────────────────────────────────────

export default function AuthenticatedLayout({ header, children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { auth } = usePage().props;

    if (!auth || !auth.user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar
                open={sidebarOpen}
                setOpen={setSidebarOpen}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                user={auth.user}
            />

            <div className={`transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
                <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
                    <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
                        >
                            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        <div className="flex-1" />

                        <div className="flex items-center gap-4">
                            <button className="p-2 rounded-md text-gray-600 hover:bg-gray-100 relative">
                                <Bell size={20} />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>

                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100"
                                >
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-medium overflow-hidden">
                                        {auth.user.photo_path ? (
                                            <img
                                                src={`/storage/${auth.user.photo_path}`}
                                                alt={auth.user.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            auth.user.name.charAt(0)
                                        )}
                                    </div>
                                    <span className="hidden sm:block text-sm font-medium text-gray-700">
                                        {auth.user.name}
                                    </span>
                                    <ChevronDown size={16} className="text-gray-500" />
                                </button>

                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200">
                                        <Link
                                            href={route('profile.edit')}
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <User size={16} />
                                            Profile
                                        </Link>
                                        <Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <LogOut size={16} />
                                            Logout
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>

            <BgSyncTracker />
        </div>
    );
}
