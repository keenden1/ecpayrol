import React from 'react';
import { Head } from '@inertiajs/react';
import { router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Clock, Calendar, Briefcase, FileText, Bell,
    ChevronRight, AlertCircle, ClipboardCheck,
    TrendingUp, CheckCircle2, XCircle, Info,
    ArrowRight, User, MapPin, Building2, BadgeCheck
} from 'lucide-react';
import OvertimeStatusBadge from './Overtime/OvertimeStatusBadge';

/* ── Greeting helper ─────────────────────────────────────────────────────────── */
function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

/* ── Stat Card ───────────────────────────────────────────────────────────────── */
function StatCard({ title, value, sub, icon: Icon, iconColor, borderColor, href }) {
    return (
        <a
            href={href}
            className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
        >
            <div className={`h-1 w-full ${borderColor}`} />
            <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor} bg-opacity-10`}>
                        <Icon className={`w-5 h-5 ${iconColor.replace('bg-', 'text-')}`} />
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all mt-0.5 flex-shrink-0" />
                </div>
                <div className="mt-4">
                    <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
                    <p className="text-xs font-medium text-gray-500 mt-1">{title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
            </div>
        </a>
    );
}

/* ── Quick Action Button ─────────────────────────────────────────────────────── */
function QuickAction({ icon: Icon, label, color, onClick, href }) {
    const cls = `flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group`;
    const inner = (
        <>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 text-center leading-tight">{label}</span>
        </>
    );
    if (href) return <a href={href} className={cls}>{inner}</a>;
    return <button onClick={onClick} className={cls}>{inner}</button>;
}

/* ── Notification Item ───────────────────────────────────────────────────────── */
function NotifItem({ notification }) {
    const config = {
        approval:  { bg: 'bg-green-100', text: 'text-green-600',  Icon: CheckCircle2 },
        rejection: { bg: 'bg-red-100',   text: 'text-red-500',    Icon: XCircle      },
        info:      { bg: 'bg-blue-100',  text: 'text-blue-600',   Icon: Info         },
    };
    const { bg, text, Icon } = config[notification.type] ?? config.info;

    return (
        <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
                <Icon className={`w-4 h-4 ${text}`} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 leading-snug">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-0.5">{notification.time}</p>
            </div>
        </div>
    );
}

/* ── Event Item ──────────────────────────────────────────────────────────────── */
function EventItem({ event }) {
    const d     = event.date ? new Date(event.date) : null;
    const valid = d && !isNaN(d.getTime());
    const day   = valid ? String(d.getDate()) : '—';
    const month = valid ? d.toLocaleString('default', { month: 'short' }) : '';

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex flex-col items-center justify-center flex-shrink-0 text-center">
                <span className="text-xs font-bold text-indigo-700 leading-none">{day}</span>
                <span className="text-[10px] font-medium text-indigo-400 leading-none mt-0.5">{month}</span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{event.title}</p>
                <p className="text-xs text-gray-400">{event.date}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
        </div>
    );
}

/* ── Main Component ──────────────────────────────────────────────────────────── */
const EmployeeDashboard = () => {
    const { props } = usePage();
    const { auth, myOvertimes = [], upcomingEvents = [], employeeInfo = {}, notifications = [] } = props;

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const stats = [
        {
            title: 'Overtime Hours',
            value: employeeInfo?.totalOvertimeHours ?? '0',
            sub: 'This month',
            icon: Clock,
            iconColor: 'bg-indigo-500',
            borderColor: 'bg-indigo-500',
            href: route('overtimes.index'),
        },
        {
            title: 'Leave Balance',
            value: `${employeeInfo?.leaveBalance ?? '0'} days`,
            sub: 'Available',
            icon: Calendar,
            iconColor: 'bg-emerald-500',
            borderColor: 'bg-emerald-500',
            href: '#',
        },
        {
            title: 'Attendance',
            value: employeeInfo?.attendancePercentage ?? '0%',
            sub: 'This month',
            icon: ClipboardCheck,
            iconColor: 'bg-sky-500',
            borderColor: 'bg-sky-500',
            href: '#',
        },
        {
            title: 'Payslips',
            value: 'View',
            sub: 'Recent documents',
            icon: FileText,
            iconColor: 'bg-violet-500',
            borderColor: 'bg-violet-500',
            href: '#',
        },
    ];

    const handleFileOvertime = () => router.get(route('overtimes.index', { tab: 'create' }));

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="My Dashboard" />

            <div className="w-full space-y-6">

                {/* ── Page Header ─────────────────────────────────────────────── */}
                <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-2xl px-6 py-7 overflow-hidden shadow-lg">
                    {/* decorative blobs */}
                    <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 left-1/3 w-56 h-24 bg-white/5 rounded-full pointer-events-none" />

                    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-indigo-200 text-sm font-medium mb-1">{today}</p>
                            <h1 className="text-2xl font-bold text-white leading-tight">
                                {getGreeting()}, {auth.user.name.split(' ')[0]} 👋
                            </h1>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                                {employeeInfo?.jobTitle && (
                                    <span className="flex items-center gap-1.5 text-indigo-200 text-xs">
                                        <Briefcase className="w-3.5 h-3.5" /> {employeeInfo.jobTitle}
                                    </span>
                                )}
                                {employeeInfo?.department && (
                                    <span className="flex items-center gap-1.5 text-indigo-200 text-xs">
                                        <Building2 className="w-3.5 h-3.5" /> {employeeInfo.department}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleFileOvertime}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 text-sm font-semibold rounded-xl hover:bg-indigo-50 transition-colors shadow-md flex-shrink-0"
                        >
                            <Clock className="w-4 h-4" />
                            File Overtime
                        </button>
                    </div>
                </div>

                {/* ── Stat Cards ──────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((s, i) => <StatCard key={i} {...s} />)}
                </div>

                {/* ── Quick Actions ────────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Quick Actions</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        <QuickAction icon={Clock}         label="File Overtime"    color="bg-indigo-500"  onClick={handleFileOvertime} />
                        <QuickAction icon={Calendar}      label="Request Leave"    color="bg-emerald-500" href="#" />
                        <QuickAction icon={FileText}      label="View Payslips"    color="bg-violet-500"  href="#" />
                        <QuickAction icon={ClipboardCheck} label="My Attendance"   color="bg-sky-500"     href="#" />
                        <QuickAction icon={BadgeCheck}    label="My Requests"      color="bg-amber-500"   href={route('overtimes.index')} />
                        <QuickAction icon={User}          label="My Profile"       color="bg-rose-500"    href={route('profile.edit')} />
                    </div>
                </div>

                {/* ── Lower Grid ──────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Overtime Requests Table */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-sm font-bold text-gray-900">My Overtime Requests</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Recent filings</p>
                            </div>
                            <a
                                href={route('overtimes.index')}
                                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                                View all <ArrowRight className="w-3.5 h-3.5" />
                            </a>
                        </div>

                        {myOvertimes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                                    <Clock className="w-7 h-7 text-indigo-400" />
                                </div>
                                <p className="text-sm font-semibold text-gray-700 mb-1">No overtime requests yet</p>
                                <p className="text-xs text-gray-400 mb-5">You haven't filed any overtime requests this period</p>
                                <button
                                    onClick={handleFileOvertime}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                                >
                                    <Clock className="w-3.5 h-3.5" /> File New Overtime
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Hours</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Filed On</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {myOvertimes.slice(0, 6).map((ot) => (
                                            <tr
                                                key={ot.id}
                                                onClick={() => router.get(route('overtimes.index', { selected: ot.id }))}
                                                className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                                            >
                                                <td className="px-6 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                                                    {ot.date ? new Date(ot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                </td>
                                                <td className="px-6 py-3.5 text-gray-600 whitespace-nowrap">
                                                    {ot.total_hours ? `${parseFloat(ot.total_hours).toFixed(2)} hrs` : '—'}
                                                </td>
                                                <td className="px-6 py-3.5 whitespace-nowrap">
                                                    <OvertimeStatusBadge status={ot.status} />
                                                </td>
                                                <td className="px-6 py-3.5 text-gray-500 whitespace-nowrap">
                                                    {ot.created_at ? new Date(ot.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Right column */}
                    <div className="space-y-4">

                        {/* Notifications */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                <h2 className="text-sm font-bold text-gray-900">Notifications</h2>
                                {notifications.length > 0 && (
                                    <span className="px-2 py-0.5 text-xs font-bold bg-indigo-600 text-white rounded-full">
                                        {notifications.length}
                                    </span>
                                )}
                            </div>

                            <div className="p-3">
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center py-8 text-center">
                                        <Bell className="w-8 h-8 text-gray-200 mb-2" />
                                        <p className="text-xs text-gray-400">All caught up! No new notifications.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {notifications.map((n, i) => <NotifItem key={i} notification={n} />)}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Upcoming Events */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                <h2 className="text-sm font-bold text-gray-900">Upcoming Events</h2>
                                <a href="#" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">Calendar</a>
                            </div>

                            <div className="p-3">
                                {upcomingEvents.length === 0 ? (
                                    <div className="flex flex-col items-center py-8 text-center">
                                        <Calendar className="w-8 h-8 text-gray-200 mb-2" />
                                        <p className="text-xs text-gray-400">No upcoming events this week.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {upcomingEvents.map((e, i) => <EventItem key={i} event={e} />)}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default EmployeeDashboard;
