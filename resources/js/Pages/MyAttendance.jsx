import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Clock, Calendar, AlertTriangle, TrendingDown,
    ChevronLeft, ChevronRight, Timer, CheckCircle2,
    User, Building2, Briefcase
} from 'lucide-react';

const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
];

function SummaryCard({ icon: Icon, label, value, sub, color }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
                <p className="text-xs font-semibold text-gray-500 mt-1">{label}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function StatusBadge({ status, restday, timeIn }) {
    if (restday) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">Rest Day</span>;
    if (!timeIn)  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600">Absent</span>;
    if (status === 'late') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">Late</span>;
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700">Present</span>;
}

export default function MyAttendance() {
    const { auth, records = [], summary = {}, employeeInfo = {}, filters = {} } = usePage().props;

    const [month, setMonth] = useState(filters.month ?? new Date().getMonth() + 1);
    const [year,  setYear]  = useState(filters.year  ?? new Date().getFullYear());
    const [lastUpdated, setLastUpdated] = useState(new Date());

    function navigate(newMonth, newYear) {
        router.get('/my-attendance', { month: newMonth, year: newYear }, { preserveState: true });
    }

    // Auto-refresh records every 60 seconds (only when tab is visible) so newly processed biometric punches appear without a manual reload.
    useEffect(() => {
        const now = new Date();
        const isCurrentMonth = month === (now.getMonth() + 1) && year === now.getFullYear();
        if (!isCurrentMonth) return;

        const tick = () => {
            if (document.visibilityState !== 'visible') return;
            router.reload({
                only: ['records', 'summary'],
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => setLastUpdated(new Date()),
            });
        };

        const id = setInterval(tick, 60_000);
        return () => clearInterval(id);
    }, [month, year]);

    function prevMonth() {
        const m = month === 1 ? 12 : month - 1;
        const y = month === 1 ? year - 1 : year;
        setMonth(m); setYear(y);
        navigate(m, y);
    }

    function nextMonth() {
        const m = month === 12 ? 1 : month + 1;
        const y = month === 12 ? year + 1 : year;
        setMonth(m); setYear(y);
        navigate(m, y);
    }

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="My Attendance" />

            <div className="p-6 space-y-6">

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">My Attendance</h1>
                                <p className="text-indigo-200 text-sm">{employeeInfo.name ?? auth.user?.name}</p>
                            </div>
                        </div>
                        {/* Month navigator */}
                        <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
                            <button onClick={prevMonth} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-semibold min-w-[120px] text-center">
                                {MONTHS[month - 1]} {year}
                            </span>
                            <button onClick={nextMonth} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Employee info pills */}
                    <div className="flex flex-wrap gap-3 mt-4">
                        {employeeInfo.idno && (
                            <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5 text-xs font-medium">
                                <User className="w-3.5 h-3.5" /> {employeeInfo.idno}
                            </div>
                        )}
                        {employeeInfo.department && (
                            <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5 text-xs font-medium">
                                <Building2 className="w-3.5 h-3.5" /> {employeeInfo.department}
                            </div>
                        )}
                        {employeeInfo.jobTitle && (
                            <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5 text-xs font-medium">
                                <Briefcase className="w-3.5 h-3.5" /> {employeeInfo.jobTitle}
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <SummaryCard icon={Calendar}      label="Total Days"     value={summary.total_days ?? 0}      color="bg-indigo-500" />
                    <SummaryCard icon={CheckCircle2}  label="Days Present"   value={summary.present_days ?? 0}    color="bg-green-500" />
                    <SummaryCard icon={Timer}         label="Total Hours"    value={summary.total_hours ?? 0}     sub="hrs worked"   color="bg-blue-500" />
                    <SummaryCard icon={AlertTriangle} label="Late (mins)"    value={summary.total_late ?? 0}      sub="total late"   color="bg-amber-500" />
                    <SummaryCard icon={TrendingDown}  label="Undertime (mins)" value={summary.total_undertime ?? 0} sub="total undertime" color="bg-red-400" />
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-sm font-bold text-gray-800">
                                Attendance Records — {MONTHS[month - 1]} {year}
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">{records.length} record{records.length !== 1 ? 's' : ''} found</p>
                        </div>
                        {month === (new Date().getMonth() + 1) && year === new Date().getFullYear() && (
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 whitespace-nowrap">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span>Auto-refresh • {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        )}
                    </div>

                    {records.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <Clock className="w-10 h-10 mb-3 opacity-40" />
                            <p className="text-sm font-medium">No attendance records found</p>
                            <p className="text-xs mt-1">for {MONTHS[month - 1]} {year}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-left">
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Day</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time In</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time Out</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hours</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Late</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Undertime</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {records.map((rec) => (
                                        <tr key={rec.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-6 py-3.5 font-medium text-gray-800 whitespace-nowrap">
                                                {formatDate(rec.attendance_date)}
                                            </td>
                                            <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                                                {rec.day ?? '—'}
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                {rec.time_in
                                                    ? <span className="text-green-700 font-semibold">{rec.time_in}</span>
                                                    : <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                {rec.time_out
                                                    ? <span className="text-indigo-700 font-semibold">{rec.time_out}</span>
                                                    : <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap">
                                                {rec.hours_worked ? `${rec.hours_worked}h` : '—'}
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                {rec.late_minutes > 0
                                                    ? <span className="text-amber-600 font-semibold">{rec.late_minutes}m</span>
                                                    : <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                {rec.undertime_minutes > 0
                                                    ? <span className="text-red-500 font-semibold">{rec.undertime_minutes}m</span>
                                                    : <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <StatusBadge status={rec.status} restday={rec.restday} timeIn={rec.time_in} />
                                            </td>
                                            <td className="px-4 py-3.5 text-gray-400 text-xs max-w-[160px] truncate">
                                                {rec.remarks ?? '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
