import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Users, Clock, Calendar, AlertCircle, ArrowUpRight,
    BarChart3, Bell, Building2, Wallet, ClipboardCheck,
    FileText, Settings, UserCog, GraduationCap, CalendarCheck,
    FileBarChart, ChevronRight, TrendingUp, Shield, UserPlus,
    Activity, Briefcase
} from 'lucide-react';

/* ── Quick Nav Card ─────────────────────────────────────────────────────────── */
function NavCard({ icon: Icon, label, sub, href, gradient }) {
    return (
        <a
            href={href}
            className="group relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 p-5 flex flex-col gap-3"
        >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${gradient} shadow-md`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
                <p className="text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-snug">{sub}</p>
            </div>
            <ChevronRight className="absolute top-4 right-4 w-4 h-4 text-gray-200 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
        </a>
    );
}

/* ── Stat Card ──────────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, trend, color, href }) {
    return (
        <a
            href={href ?? '#'}
            className="relative bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden group flex flex-col gap-4"
        >
            <div className="absolute top-0 right-0 w-28 h-28 bg-gray-50 rounded-full translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform duration-300" />
            <div className="flex items-center justify-between relative">
                <div className={`p-2.5 rounded-xl ${color} bg-opacity-10`}>
                    <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
                </div>
                {trend != null && (
                    <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                        <ArrowUpRight className="w-3 h-3 mr-0.5" />{trend}%
                    </span>
                )}
            </div>
            <div className="relative">
                <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
                <p className="text-xs font-medium text-gray-500 mt-1">{label}</p>
            </div>
        </a>
    );
}

/* ── Activity Item ──────────────────────────────────────────────────────────── */
function ActivityItem({ title, time, type = 'info' }) {
    const colors = {
        info:    'bg-indigo-500',
        success: 'bg-emerald-500',
        warning: 'bg-amber-500',
        danger:  'bg-red-500',
    };
    return (
        <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors">
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${colors[type] ?? colors.info}`} />
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 leading-snug">{title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{time}</p>
            </div>
        </div>
    );
}

/* ── Main ───────────────────────────────────────────────────────────────────── */
export default function SuperadminDashboard({ auth, stats: serverStats, recentActivities }) {
    const { auth: pageAuth } = usePage().props;
    const user = auth?.user ?? pageAuth?.user;

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    const stats = [
        { icon: Users,        label: 'Total Employees',   value: serverStats?.totalEmployees   ?? '—', trend: null, color: 'bg-indigo-500', href: '/employees' },
        { icon: Clock,        label: 'Attendance Today',  value: serverStats?.attendanceToday  ?? '—', trend: null, color: 'bg-emerald-500', href: '/attendance' },
        { icon: AlertCircle,  label: 'Pending Requests',  value: serverStats?.pendingRequests  ?? '—', trend: null, color: 'bg-amber-500',   href: '/overtimes' },
        { icon: Wallet,       label: 'Payroll This Month',value: serverStats?.payrollThisMonth ?? '—', trend: null, color: 'bg-violet-500',  href: '/final-payrolls' },
    ];

    const activities = recentActivities ?? [
        { title: 'No recent activities yet.', time: '', type: 'info' },
    ];

    /* Quick nav sections */
    const quickNav = [
        {
            section: 'People',
            items: [
                { icon: Users,        label: 'Employees',      sub: 'Manage employee records',    href: '/employees',           gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-600' },
                { icon: UserPlus,     label: 'Staff / Users',  sub: 'System accounts & roles',    href: '/manage/users',        gradient: 'bg-gradient-to-br from-violet-500 to-violet-600' },
                { icon: Shield,       label: 'Roles & Access', sub: 'Permissions & role groups',  href: '/manage/roles',        gradient: 'bg-gradient-to-br from-blue-500 to-blue-600' },
                { icon: UserCog,      label: 'Core HR',        sub: 'Promotions, awards & more',  href: '/core-hr/promotion',   gradient: 'bg-gradient-to-br from-sky-500 to-sky-600' },
            ],
        },
        {
            section: 'Operations',
            items: [
                { icon: ClipboardCheck, label: 'Timesheets',    sub: 'DTR & attendance logs',      href: '/payroll-summaries-page', gradient: 'bg-gradient-to-br from-teal-500 to-teal-600' },
                { icon: Wallet,         label: 'Payroll',       sub: 'Final payroll & summaries',  href: '/final-payrolls',         gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-600' },
                { icon: FileText,       label: 'Requests',      sub: 'OT, leave & other requests', href: '/overtimes',              gradient: 'bg-gradient-to-br from-amber-500 to-amber-600' },
                { icon: Briefcase,      label: 'Official Biz',  sub: 'Official business filings',  href: '/official-business',      gradient: 'bg-gradient-to-br from-orange-500 to-orange-600' },
            ],
        },
        {
            section: 'Organization',
            items: [
                { icon: Building2,      label: 'Departments',   sub: 'Org structure & units',      href: '/manage/departments',   gradient: 'bg-gradient-to-br from-pink-500 to-pink-600' },
                { icon: Calendar,       label: 'HR Calendar',   sub: 'Events & important dates',   href: '/hr-calendar',          gradient: 'bg-gradient-to-br from-rose-500 to-rose-600' },
                { icon: GraduationCap,  label: 'Training',      sub: 'Training lists & types',     href: '/training/lists',       gradient: 'bg-gradient-to-br from-purple-500 to-purple-600' },
                { icon: CalendarCheck,  label: 'Events',        sub: 'Meetings & company events',  href: '/events',               gradient: 'bg-gradient-to-br from-fuchsia-500 to-fuchsia-600' },
            ],
        },
        {
            section: 'Insights',
            items: [
                { icon: FileBarChart,   label: 'HR Reports',    sub: 'Attendance & monthly reports', href: '/reports/daily-attendance', gradient: 'bg-gradient-to-br from-cyan-500 to-cyan-600' },
                { icon: BarChart3,      label: 'Payroll Summary', sub: 'Payroll computation overview', href: '/comprehensive-payroll-summaries', gradient: 'bg-gradient-to-br from-blue-500 to-blue-600' },
                { icon: Activity,       label: 'Biometrics',    sub: 'Device sync & logs',          href: '/biometric-devices',        gradient: 'bg-gradient-to-br from-indigo-500 to-violet-600' },
                { icon: Settings,       label: 'Settings',      sub: 'System configuration',        href: '/settings',                 gradient: 'bg-gradient-to-br from-gray-500 to-gray-600' },
            ],
        },
    ];

    return (
        <AuthenticatedLayout user={user}>
            <Head title="Superadmin Dashboard" />

            <div className="max-w-7xl mx-auto space-y-8">

                {/* ── Header ── */}
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-2xl p-7 text-white shadow-xl">
                    {/* bg decorations */}
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.06) 1px,transparent 1px)`, backgroundSize: '40px 40px' }} />
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-violet-400/20 rounded-full blur-3xl" />

                    <div className="relative flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-indigo-200 text-sm font-medium mb-1">{today}</p>
                            <h1 className="text-2xl font-black leading-tight">
                                {greeting}, {user?.name?.split(' ')[0]} 👋
                            </h1>
                            <p className="text-indigo-200 text-sm mt-1">Here's your system overview for today.</p>
                        </div>
                        <a
                            href="/reports/daily-attendance"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl text-sm font-semibold transition-colors backdrop-blur-sm"
                        >
                            <BarChart3 className="w-4 h-4" /> Generate Report
                        </a>
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((s, i) => <StatCard key={i} {...s} />)}
                </div>

                {/* ── Quick Navigation ── */}
                {quickNav.map(({ section, items }) => (
                    <div key={section}>
                        <div className="flex items-center gap-3 mb-4">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{section}</p>
                            <div className="flex-1 h-px bg-gray-100" />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {items.map((item) => <NavCard key={item.label} {...item} />)}
                        </div>
                    </div>
                ))}

                {/* ── Recent Activity ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Latest system updates</p>
                        </div>
                        <TrendingUp className="w-4 h-4 text-gray-300" />
                    </div>
                    <div className="divide-y divide-gray-50 py-2">
                        {activities.map((a, i) => <ActivityItem key={i} {...a} />)}
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
