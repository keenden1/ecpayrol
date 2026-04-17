import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Clock, CalendarCheck, User, FileText, FileInput,
    Clock8, Users, HeartHandshake, ChevronRight,
    CalendarDays, Wallet, AlertCircle, BarChart3,
} from 'lucide-react';

/* ── Stat Card ── */
function StatCard({ icon: Icon, label, value, color, top }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className={`h-1 ${top}`} />
            <div className="p-4 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                    <p className="text-xl font-black text-gray-900 leading-none">{value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
            </div>
        </div>
    );
}

/* ── Action Card ── */
function ActionCard({ icon: Icon, title, desc, href, gradient }) {
    return (
        <a href={href} className="group relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 p-5 flex flex-col gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${gradient} shadow-md`}>
                <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
                <p className="text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{title}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-snug">{desc}</p>
            </div>
            <ChevronRight className="absolute top-4 right-4 w-4 h-4 text-gray-200 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
        </a>
    );
}

/* ── Section Header ── */
function SectionHeader({ label }) {
    return (
        <div className="flex items-center gap-3 mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
            <div className="flex-1 h-px bg-gray-100" />
        </div>
    );
}

const EmployeeDashboard = ({ auth }) => {
    const [pendingOvertimes, setPendingOvertimes] = useState(0);

    const isManager = auth.user.roles?.some(role =>
        ['department_manager', 'superadmin', 'hrd_manager', 'hrd'].includes(
            role.name?.toLowerCase() || role.slug?.toLowerCase()
        )
    );

    useEffect(() => {
        if (isManager) {
            fetch('/api/pending-overtimes-count')
                .then(r => r.json())
                .then(d => setPendingOvertimes(d.count || 0))
                .catch(() => setPendingOvertimes(0));
        }
    }, [isManager]);

    const now     = new Date();
    const hour    = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const today   = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const statCards = [
        { icon: CalendarDays, label: 'Leave Balance',     value: '—', color: 'bg-indigo-500',  top: 'bg-indigo-500'  },
        { icon: Clock,        label: 'Hours This Month',  value: '—', color: 'bg-emerald-500', top: 'bg-emerald-500' },
        { icon: Wallet,       label: 'Last Payroll',      value: '—', color: 'bg-violet-500',  top: 'bg-violet-500'  },
        { icon: AlertCircle,  label: 'Pending Requests',  value: '—', color: 'bg-amber-500',   top: 'bg-amber-500'   },
    ];

    const quickActions = [
        { icon: Clock,        title: 'My Attendance',    desc: 'View your DTR & time logs',         href: '/my-attendance',      gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-600' },
        { icon: FileInput,    title: 'File a Request',   desc: 'OT, leave & other requests',        href: '/overtimes',          gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-600' },
        { icon: CalendarCheck,title: 'SLVL / Leave',     desc: 'File sick/vacation leave',          href: '/slvl',               gradient: 'bg-gradient-to-br from-sky-500 to-sky-600' },
        { icon: Wallet,       title: 'My Payroll',       desc: 'View payslips & payroll history',   href: '/my-payroll',         gradient: 'bg-gradient-to-br from-violet-500 to-violet-600' },
        { icon: User,         title: 'My Profile',       desc: 'Update personal information',       href: '/profile',            gradient: 'bg-gradient-to-br from-pink-500 to-pink-600' },
        { icon: FileText,     title: 'Official Business',desc: 'File official business trips',      href: '/official-business',  gradient: 'bg-gradient-to-br from-amber-500 to-amber-600' },
    ];

    const managerActions = [
        { icon: FileText,     title: 'Pending Approvals',  desc: `${pendingOvertimes} OT requests awaiting approval`, href: '/overtimes',             gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-600' },
        { icon: Clock8,       title: 'Schedule Monitoring',desc: 'Create and manage team schedules',                  href: '/schedule-monitoring',   gradient: 'bg-gradient-to-br from-teal-500 to-teal-600' },
        { icon: Users,        title: 'Team Overview',      desc: 'View your team members',                            href: '/employees',             gradient: 'bg-gradient-to-br from-blue-500 to-blue-600' },
        { icon: HeartHandshake,title:'Employee Relations', desc: 'Manage engagement & support',                       href: '/employee-relations',    gradient: 'bg-gradient-to-br from-rose-500 to-rose-600' },
    ];

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Employee Dashboard" />

            <div className="max-w-7xl mx-auto space-y-6">

                {/* ── Header Banner ── */}
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-2xl p-7 text-white shadow-xl">
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.06) 1px,transparent 1px)`, backgroundSize: '40px 40px' }} />
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-violet-400/20 rounded-full blur-3xl" />
                    <div className="relative flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-indigo-200 text-xs font-medium mb-1">{today}</p>
                            <h1 className="text-2xl font-black leading-tight">{greeting}, {auth.user.name?.split(' ')[0]} 👋</h1>
                            <p className="text-indigo-200 text-sm mt-1">Manage your work activities and personal information.</p>
                        </div>
                        <a
                            href="/profile"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl text-sm font-semibold transition-colors backdrop-blur-sm"
                        >
                            <User className="w-4 h-4" /> My Profile
                        </a>
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div>
                    <SectionHeader label="My Overview" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {statCards.map((c) => <StatCard key={c.label} {...c} />)}
                    </div>
                </div>

                {/* ── Quick Actions ── */}
                <div>
                    <SectionHeader label="Quick Actions" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {quickActions.map((a) => <ActionCard key={a.title} {...a} />)}
                    </div>
                </div>

                {/* ── Manager Section ── */}
                {isManager && (
                    <div>
                        <SectionHeader label="Manager Tools" />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {managerActions.map((a) => <ActionCard key={a.title} {...a} />)}
                        </div>
                    </div>
                )}

                {/* ── Announcement ── */}
                <div>
                    <SectionHeader label="Announcements" />
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <p className="text-sm font-semibold text-gray-800">Company Update</p>
                        <p className="text-xs text-gray-500 mt-1">All employees are required to complete the annual compliance training by the end of this month.</p>
                        <p className="text-xs text-gray-400 mt-2">Posted on March 5, 2025</p>
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
};

export default EmployeeDashboard;
