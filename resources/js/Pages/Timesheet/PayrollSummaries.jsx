import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Search, Calendar, Download, RefreshCw, Users, Calculator,
    FileText, AlertTriangle, CheckCircle, Clock, Target, Eye, X,
    User, Building, Car, BarChart3, TrendingUp, ChevronLeft,
    ChevronRight as ChevronRightIcon, Filter
} from 'lucide-react';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/Button';

/* ─── Status Badge ────────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
    const map = {
        posted: { cls: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle className="w-3 h-3" />, label: 'Posted' },
        locked: { cls: 'bg-red-100 text-red-600',         icon: <AlertTriangle className="w-3 h-3" />, label: 'Locked' },
        draft:  { cls: 'bg-amber-100 text-amber-700',     icon: <Clock className="w-3 h-3" />,         label: 'Draft'  },
    };
    const cfg = map[status] ?? map.draft;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
            {cfg.icon} {cfg.label}
        </span>
    );
}

/* ─── Stat Card ───────────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, color, topColor }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className={`h-1 ${topColor}`} />
            <div className="p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                    <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
            </div>
        </div>
    );
}

/* ─── Source Badge ────────────────────────────────────────────────────────────── */
function SourceBadge({ value }) {
    const map = {
        manual_edit: { cls: 'bg-red-100 text-red-700',     label: 'Edited'   },
        slvl_sync:   { cls: 'bg-indigo-100 text-indigo-700', label: 'SLVL'   },
        import:      { cls: 'bg-blue-100 text-blue-700',   label: 'Import'   },
        biometric:   { cls: 'bg-emerald-100 text-emerald-700', label: 'Bio'  },
    };
    const cfg = map[value] ?? { cls: 'bg-gray-100 text-gray-600', label: 'Unknown' };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>;
}

/* ─── Shared helpers ──────────────────────────────────────────────────────────── */
const fmtDate = (s) => {
    if (!s) return 'N/A';
    try { return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return 'Invalid Date'; }
};

const fmtTime = (s) => {
    if (!s) return '—';
    try {
        if (/^\d{1,2}:\d{2}:\d{2}$/.test(s)) {
            const [h, m] = s.split(':').map(Number);
            return new Date(0, 0, 0, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        }
        if (s.includes('T')) {
            const d = new Date(s);
            return isNaN(d) ? '—' : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' });
        }
        if (s.includes(' ')) {
            const [, t] = s.split(' ');
            const [h, m] = t.split(':').map(Number);
            return isNaN(h) ? '—' : new Date(0, 0, 0, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        }
        return '—';
    } catch { return '—'; }
};

const fmtNum  = (v, d = 2) => { const n = parseFloat(v); return isNaN(n) ? '0.00' : n.toFixed(d); };
const fmtMins = (m) => { const n = parseFloat(m); return (!m || isNaN(n)) ? '0.00' : (n / 60).toFixed(2); };

/* ─── Detail Modal ────────────────────────────────────────────────────────────── */
const PayrollSummaryDetailModal = ({ isOpen, summary, onClose }) => {
    const [attendanceDetails, setAttendanceDetails] = useState([]);
    const [loading,       setLoading]       = useState(false);
    const [error,         setError]         = useState('');
    const [showReport,    setShowReport]    = useState(false);
    const [reportData,    setReportData]    = useState(null);
    const [reportLoading, setReportLoading] = useState(false);

    useEffect(() => { if (isOpen && summary) loadAttendanceDetails(); }, [isOpen, summary]);

    const loadAttendanceDetails = async () => {
        setLoading(true); setError('');
        try {
            const res  = await fetch(`/payroll-summaries/${summary.id}/attendance-details`, { headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } });
            if (!res.ok) throw new Error(`Failed: ${res.status}`);
            const data = await res.json();
            if (data.success) setAttendanceDetails(data.data);
            else setError('Failed to load attendance details');
        } catch (err) { setError('Error: ' + (err.message || 'Unknown error')); }
        finally { setLoading(false); }
    };

    const generateCostCenterReport = async () => {
        setReportLoading(true); setError('');
        try {
            const params = new URLSearchParams({ year: summary.year, month: summary.month, period_type: summary.period_type, department: summary.department || '', per_page: 1000 });
            const res    = await fetch(`/payroll-summaries?${params}`, { headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } });
            if (!res.ok) throw new Error(`Failed: ${res.status}`);
            const data = await res.json();
            if (data.success) {
                const groupedData = data.data.reduce((acc, item) => {
                    const cc = item.cost_center || 'No Cost Center';
                    if (!acc[cc]) acc[cc] = { employees: [], totals: { employees_count: 0, days_worked: 0, ot_hours: 0, off_days: 0, late_under_minutes: 0, nsd_hours: 0, slvl_days: 0, offset_hours: 0, retro: 0, trip_count: 0 } };
                    acc[cc].employees.push(item);
                    acc[cc].totals.employees_count++;
                    ['days_worked','ot_hours','off_days','late_under_minutes','nsd_hours','slvl_days','offset_hours','retro','trip_count'].forEach(k => { acc[cc].totals[k] += parseFloat(item[k] || 0); });
                    return acc;
                }, {});
                const grandTotals = Object.values(groupedData).reduce((a, g) => {
                    Object.keys(a).forEach(k => { a[k] += g.totals[k]; });
                    return a;
                }, { employees_count: 0, days_worked: 0, ot_hours: 0, off_days: 0, late_under_minutes: 0, nsd_hours: 0, slvl_days: 0, offset_hours: 0, retro: 0, trip_count: 0 });
                setReportData({ groupedData, grandTotals, period: `${summary.year}-${String(summary.month).padStart(2,'0')} ${summary.period_type}`, department: summary.department, generated_at: new Date().toISOString() });
                setShowReport(true);
            } else setError('Failed to generate report');
        } catch (err) { setError('Error: ' + (err.message || 'Unknown error')); }
        finally { setReportLoading(false); }
    };

    const exportReport = () => {
        if (!reportData) return;
        const headers = ['COST CENTER','Employee ID','Employee Name','Department','Line','Period','Year','Month','Period Type','Days Worked','OT Hours','Off Days','Late/Under Minutes','Late/Under Hours','NSD Hours','SLVL Days','Retro','Travel Order Hours','Holiday Hours','OT Regular Holiday Hours','OT Special Holiday Hours','Offset Hours','Trip Count'];
        const rows = [headers];
        Object.keys(reportData.groupedData).sort().forEach(cc => {
            reportData.groupedData[cc].employees.forEach(e => {
                rows.push([cc, e.employee_no, e.employee_name, e.department||'', e.line||'', reportData.period, summary?.year, summary?.month, summary?.period_type,
                    fmtNum(e.days_worked,1), fmtNum(e.ot_hours), fmtNum(e.off_days,1), fmtNum(e.late_under_minutes), fmtMins(e.late_under_minutes),
                    fmtNum(e.nsd_hours), fmtNum(e.slvl_days,1), fmtNum(e.retro), fmtNum(e.travel_order_hours), fmtNum(e.holiday_hours),
                    fmtNum(e.ot_reg_holiday_hours), fmtNum(e.ot_special_holiday_hours), fmtNum(e.offset_hours), fmtNum(e.trip_count,1)]);
            });
        });
        Object.keys(reportData.groupedData).sort().forEach(cc => {
            const g = reportData.groupedData[cc];
            rows.push([`SUBTOTAL - ${cc}`, '', `(${g.totals.employees_count} employees)`, '', '', reportData.period, summary?.year, summary?.month, summary?.period_type,
                fmtNum(g.totals.days_worked,1), fmtNum(g.totals.ot_hours), fmtNum(g.totals.off_days,1), fmtNum(g.totals.late_under_minutes), fmtMins(g.totals.late_under_minutes),
                fmtNum(g.totals.nsd_hours), fmtNum(g.totals.slvl_days,1), fmtNum(g.totals.retro), 0, 0, 0, 0, fmtNum(g.totals.offset_hours), fmtNum(g.totals.trip_count,1)]);
        });
        rows.push(['GRAND TOTAL', '', `(${reportData.grandTotals.employees_count} employees)`, '', '', reportData.period, summary?.year, summary?.month, summary?.period_type,
            fmtNum(reportData.grandTotals.days_worked,1), fmtNum(reportData.grandTotals.ot_hours), fmtNum(reportData.grandTotals.off_days,1),
            fmtNum(reportData.grandTotals.late_under_minutes), fmtMins(reportData.grandTotals.late_under_minutes),
            fmtNum(reportData.grandTotals.nsd_hours), fmtNum(reportData.grandTotals.slvl_days,1), fmtNum(reportData.grandTotals.retro), 0, 0, 0, 0,
            fmtNum(reportData.grandTotals.offset_hours), fmtNum(reportData.grandTotals.trip_count,1)]);
        const csv  = '\uFEFF' + rows.map(r => r.map(c => { const s = String(c||''); return (s.includes(',')||s.includes('"')||s.includes('\n')) ? `"${s.replace(/"/g,'""')}"` : s; }).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url  = URL.createObjectURL(blob);
        const a    = Object.assign(document.createElement('a'), { href: url, download: `cost_center_report_${reportData.period.replace(/\s+/g,'_')}_${new Date().toISOString().split('T')[0]}.csv` });
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden">

                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-violet-600 flex-shrink-0 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                            {showReport ? <BarChart3 className="w-5 h-5 text-white" /> : <FileText className="w-5 h-5 text-white" />}
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white">{showReport ? 'Cost Center Report' : 'Payroll Summary Details'}</h2>
                            {summary && <p className="text-indigo-200 text-xs">{summary.employee_name} · {summary.full_period}</p>}
                        </div>
                        {summary?.status && <StatusBadge status={summary.status} />}
                    </div>
                    <div className="flex items-center gap-2">
                        {!showReport && (
                            <button onClick={generateCostCenterReport} disabled={reportLoading}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60">
                                {reportLoading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Generating...</> : <><BarChart3 className="w-3.5 h-3.5" />Report</>}
                            </button>
                        )}
                        {showReport && (
                            <>
                                <button onClick={exportReport} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors">
                                    <Download className="w-3.5 h-3.5" /> Export CSV
                                </button>
                                <button onClick={() => setShowReport(false)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-colors">
                                    <Eye className="w-3.5 h-3.5" /> Back
                                </button>
                            </>
                        )}
                        <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="overflow-y-auto flex-1 p-6 space-y-5">
                    {error && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                        </div>
                    )}

                    {showReport ? (
                        /* ── Report View ─────────────────────────────────── */
                        reportData && (
                            <div className="space-y-5">
                                {/* Report meta */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-indigo-50 rounded-2xl p-4">
                                    {[['Period', reportData.period], ['Department', reportData.department || 'All Departments'], ['Generated', fmtDate(reportData.generated_at)]].map(([l, v]) => (
                                        <div key={l}>
                                            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">{l}</p>
                                            <p className="text-sm font-semibold text-indigo-900 mt-0.5">{v}</p>
                                        </div>
                                    ))}
                                </div>
                                {/* Grand totals */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    {[
                                        { label: 'Employees', val: reportData.grandTotals.employees_count, color: 'text-indigo-600' },
                                        { label: 'Days Worked', val: fmtNum(reportData.grandTotals.days_worked,1), color: 'text-emerald-600' },
                                        { label: 'OT Hours', val: fmtNum(reportData.grandTotals.ot_hours), color: 'text-amber-600' },
                                        { label: 'Late/Under (hrs)', val: fmtMins(reportData.grandTotals.late_under_minutes), color: 'text-red-600' },
                                        { label: 'SLVL Days', val: fmtNum(reportData.grandTotals.slvl_days,1), color: 'text-violet-600' },
                                    ].map(({ label, val, color }) => (
                                        <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                                            <p className={`text-2xl font-bold ${color}`}>{val}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                                        </div>
                                    ))}
                                </div>
                                {/* Cost center breakdown */}
                                <div className="space-y-4">
                                    {Object.entries(reportData.groupedData).map(([cc, group]) => (
                                        <div key={cc} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                            <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100">
                                                <Building className="w-4 h-4 text-indigo-500" />
                                                <h4 className="text-sm font-bold text-gray-900">{cc}</h4>
                                                <span className="text-xs text-gray-400">({group.totals.employees_count} employees)</span>
                                            </div>
                                            <div className="grid grid-cols-4 md:grid-cols-8 gap-2 p-3 bg-indigo-50/50">
                                                {[['Days', fmtNum(group.totals.days_worked,1),'text-indigo-700'], ['OT', fmtNum(group.totals.ot_hours),'text-amber-700'], ['Off', fmtNum(group.totals.off_days,1),'text-gray-700'], ['Late/Under', fmtMins(group.totals.late_under_minutes),'text-red-700'], ['NSD', fmtNum(group.totals.nsd_hours),'text-violet-700'], ['SLVL', fmtNum(group.totals.slvl_days,1),'text-blue-700'], ['Offset', fmtNum(group.totals.offset_hours),'text-emerald-700'], ['Trip', fmtNum(group.totals.trip_count,1),'text-orange-700']].map(([l,v,c]) => (
                                                    <div key={l} className="text-center">
                                                        <p className={`font-bold text-sm ${c}`}>{v}</p>
                                                        <p className="text-xs text-gray-500">{l}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs">
                                                    <thead className="bg-gray-50 border-b border-gray-100">
                                                        <tr>
                                                            {['Employee','Days','OT','Off','Late/Under','NSD','SLVL','Offset','Retro','Trip'].map(h => (
                                                                <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {group.employees.map(e => (
                                                            <tr key={e.id} className="hover:bg-indigo-50/30 transition-colors">
                                                                <td className="px-3 py-2">
                                                                    <p className="font-medium text-gray-900">{e.employee_name}</p>
                                                                    <p className="text-gray-400">{e.employee_no}</p>
                                                                </td>
                                                                <td className="px-3 py-2 text-gray-700">{fmtNum(e.days_worked,1)}</td>
                                                                <td className="px-3 py-2 text-gray-700">{fmtNum(e.ot_hours)}</td>
                                                                <td className="px-3 py-2 text-gray-700">{fmtNum(e.off_days,1)}</td>
                                                                <td className="px-3 py-2 text-gray-700">{fmtMins(e.late_under_minutes)}</td>
                                                                <td className="px-3 py-2 text-gray-700">{fmtNum(e.nsd_hours)}</td>
                                                                <td className="px-3 py-2 text-gray-700">{fmtNum(e.slvl_days,1)}</td>
                                                                <td className="px-3 py-2 text-gray-700">{fmtNum(e.offset_hours)}</td>
                                                                <td className="px-3 py-2 text-gray-700">{fmtNum(e.retro)}</td>
                                                                <td className="px-3 py-2 text-gray-700">{fmtNum(e.trip_count,1)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    ) : (
                        /* ── Detail View ─────────────────────────────────── */
                        <>
                            {/* Summary info row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-indigo-50 rounded-2xl p-4">
                                <div>
                                    <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest flex items-center gap-1"><User className="w-3 h-3" /> Employee</p>
                                    <p className="text-sm font-bold text-gray-900 mt-0.5">{summary?.employee_name}</p>
                                    <p className="text-xs text-gray-500">{summary?.employee_no}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest flex items-center gap-1"><Building className="w-3 h-3" /> Department</p>
                                    <p className="text-sm font-bold text-gray-900 mt-0.5">{summary?.department}</p>
                                    <p className="text-xs text-gray-500">{summary?.line}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest flex items-center gap-1"><Calendar className="w-3 h-3" /> Period</p>
                                    <p className="text-sm font-bold text-gray-900 mt-0.5">{summary?.full_period}</p>
                                    <p className="text-xs text-gray-500">Cost Center: {summary?.cost_center || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {[
                                    { label: 'Days Worked',    val: fmtNum(summary?.days_worked,1),       color: 'text-emerald-600' },
                                    { label: 'OT Hours',       val: fmtNum(summary?.ot_hours),            color: 'text-indigo-600'  },
                                    { label: 'Late/Under Hrs', val: fmtMins(summary?.late_under_minutes), color: 'text-red-500'     },
                                    { label: 'NSD Hours',      val: fmtNum(summary?.nsd_hours),           color: 'text-violet-600'  },
                                    { label: 'SLVL Days',      val: fmtNum(summary?.slvl_days,1),         color: 'text-amber-600'   },
                                ].map(({ label, val, color }) => (
                                    <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                                        <p className={`text-2xl font-bold ${color}`}>{val}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Attendance table */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-indigo-500" />
                                        <h3 className="text-sm font-bold text-gray-900">Detailed Attendance Records</h3>
                                        <span className="px-2 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-full">{attendanceDetails.length}</span>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                                        <RefreshCw className="w-7 h-7 text-indigo-500 animate-spin" />
                                        <p className="text-sm text-gray-500">Loading attendance records…</p>
                                    </div>
                                ) : attendanceDetails.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                                            <FileText className="w-7 h-7 text-gray-300" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-600 mb-1">No attendance records found</p>
                                        <p className="text-xs text-gray-400">Records may have been deleted or not properly linked.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead className="bg-gray-50 border-b border-gray-100">
                                                <tr>
                                                    {['Date','Time In','Break Out','Break In','Time Out','Late/Under','Night Shift','Hours','OT','Travel','SLVL','CT','CS','Holiday','Trip','OT Reg','OT Spl'].map(h => (
                                                        <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {attendanceDetails.map((a) => (
                                                    <tr key={a.id} className="hover:bg-indigo-50/30 transition-colors">
                                                        <td className="px-3 py-3 whitespace-nowrap">
                                                            <p className="font-medium text-gray-900">{fmtDate(a.attendance_date)}</p>
                                                            <p className="text-gray-400">{a.day || ''}</p>
                                                        </td>
                                                        <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">{fmtTime(a.time_in)}</td>
                                                        <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{fmtTime(a.break_out)}</td>
                                                        <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{fmtTime(a.break_in)}</td>
                                                        <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">{a.is_nightshift && a.next_day_timeout ? fmtTime(a.next_day_timeout) : fmtTime(a.time_out)}</td>
                                                        <td className="px-3 py-3 whitespace-nowrap">
                                                            {(a.late_minutes > 0 || a.undertime_minutes > 0) ? (
                                                                <div className="space-y-0.5">
                                                                    {a.late_minutes > 0 && <p className="text-red-600">{Math.round(a.late_minutes)}m late</p>}
                                                                    {a.undertime_minutes > 0 && <p className="text-amber-600">{Math.round(a.undertime_minutes)}m under</p>}
                                                                </div>
                                                            ) : <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />On Time</span>}
                                                        </td>
                                                        <td className="px-3 py-3 whitespace-nowrap">
                                                            {a.is_nightshift
                                                                ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-violet-100 text-violet-700">☽ Night</span>
                                                                : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">☀ Day</span>}
                                                        </td>
                                                        <td className="px-3 py-3 font-medium text-gray-900">{fmtNum(a.hours_worked)}</td>
                                                        <td className="px-3 py-3 text-gray-600">{fmtNum(a.overtime)}</td>
                                                        <td className="px-3 py-3 text-gray-600">{fmtNum(a.travel_order)}</td>
                                                        <td className="px-3 py-3 text-gray-600">{fmtNum(a.slvl,1)}</td>
                                                        <td className="px-3 py-3 text-center">{a.ct ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mx-auto" /> : <span className="text-gray-300">—</span>}</td>
                                                        <td className="px-3 py-3 text-center">{a.cs ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mx-auto" /> : <span className="text-gray-300">—</span>}</td>
                                                        <td className="px-3 py-3 text-gray-600">{fmtNum(a.holiday)}</td>
                                                        <td className="px-3 py-3">
                                                            <span className="flex items-center gap-1 text-sky-600"><Car className="w-3 h-3" />{fmtNum(a.trip,1)}</span>
                                                        </td>
                                                        <td className="px-3 py-3 text-gray-600">{fmtNum(a.ot_reg_holiday)}</td>
                                                        <td className="px-3 py-3 text-gray-600">{fmtNum(a.ot_special_holiday)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Additional info + flags */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                    <h4 className="text-sm font-bold text-gray-900 mb-3">Additional Metrics</h4>
                                    <div className="space-y-2">
                                        {[
                                            ['Off Days', fmtNum(summary?.off_days,1)],
                                            ['Travel Order Hours', fmtNum(summary?.travel_order_hours)],
                                            ['Holiday Hours', fmtNum(summary?.holiday_hours)],
                                            ['OT Reg Holiday', fmtNum(summary?.ot_reg_holiday_hours)],
                                            ['OT Special Holiday', fmtNum(summary?.ot_special_holiday_hours)],
                                            ['Offset Hours', fmtNum(summary?.offset_hours)],
                                            ['Trip Count', fmtNum(summary?.trip_count,1)],
                                            ['Retro', fmtNum(summary?.retro)],
                                        ].map(([l,v]) => (
                                            <div key={l} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                                                <span className="text-xs text-gray-500">{l}</span>
                                                <span className="text-xs font-semibold text-gray-800">{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                    <h4 className="text-sm font-bold text-gray-900 mb-3">Flags</h4>
                                    <div className="space-y-2">
                                        {[
                                            ['CT (Compensatory Time)', summary?.has_ct],
                                            ['CS (Compressed Schedule)', summary?.has_cs],
                                            ['OB (Official Business)', summary?.has_ob],
                                        ].map(([l, v]) => (
                                            <div key={l} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                                                <span className="text-xs text-gray-500">{l}</span>
                                                {v
                                                    ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle className="w-3 h-3" />Yes</span>
                                                    : <span className="text-xs text-gray-400">No</span>}
                                            </div>
                                        ))}
                                        {summary?.posted_at && (
                                            <div className="mt-2 pt-3 border-t border-gray-100 space-y-2">
                                                <div className="flex justify-between"><span className="text-xs text-gray-500">Posted At</span><span className="text-xs font-semibold text-gray-800">{fmtDate(summary.posted_at)}</span></div>
                                                {summary?.posted_by && <div className="flex justify-between"><span className="text-xs text-gray-500">Posted By</span><span className="text-xs font-semibold text-gray-800">{summary.posted_by.name}</span></div>}
                                            </div>
                                        )}
                                    </div>
                                    {summary?.notes && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <p className="text-xs font-semibold text-gray-500 mb-1">Notes</p>
                                            <p className="text-xs text-gray-700">{summary.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50 rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─── Main Component ──────────────────────────────────────────────────────────── */
const PayrollSummaries = ({ auth }) => {
    const [summaries,    setSummaries]    = useState([]);
    const [loading,      setLoading]      = useState(false);
    const [exporting,    setExporting]    = useState(false);
    const [error,        setError]        = useState('');
    const [success,      setSuccess]      = useState('');
    const [year,         setYear]         = useState(new Date().getFullYear());
    const [month,        setMonth]        = useState(new Date().getMonth() + 1);
    const [periodType,   setPeriodType]   = useState('');
    const [department,   setDepartment]   = useState('');
    const [status,       setStatus]       = useState('');
    const [searchTerm,   setSearchTerm]   = useState('');
    const [departments,  setDepartments]  = useState([]);
    const [currentPage,  setCurrentPage]  = useState(1);
    const [totalPages,   setTotalPages]   = useState(1);
    const [perPage]                       = useState(25);
    const [statistics,   setStatistics]   = useState(null);
    const [selectedSummary, setSelectedSummary] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const loadSummaries = async () => {
        setLoading(true); setError('');
        try {
            const params = new URLSearchParams({ year, month, page: currentPage, per_page: perPage });
            if (periodType)  params.append('period_type', periodType);
            if (department)  params.append('department',  department);
            if (status)      params.append('status',      status);
            if (searchTerm)  params.append('search',      searchTerm);
            const res  = await fetch('/payroll-summaries?' + params, { headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } });
            const data = await res.json();
            if (data.success) { setSummaries(data.data); setTotalPages(data.pagination.last_page); setCurrentPage(data.pagination.current_page); setStatistics(data.statistics); }
            else setError('Failed to load payroll summaries');
        } catch (err) { setError('Error: ' + (err.message || 'Unknown error')); }
        finally { setLoading(false); }
    };

    const handleExport = async () => {
        setExporting(true); setError('');
        try {
            const params = new URLSearchParams({ year, month });
            if (periodType) params.append('period_type', periodType);
            if (department) params.append('department',  department);
            if (status)     params.append('status',      status);
            if (searchTerm) params.append('search',      searchTerm);
            const res = await fetch('/payroll-summaries/export?' + params, { method: 'GET', headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/octet-stream' } });
            if (!res.ok) throw new Error(`Export failed: ${res.status}`);
            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            const a    = Object.assign(document.createElement('a'), { href: url, download: `payroll_summaries_${year}_${month}_${new Date().toISOString().split('T')[0]}.csv` });
            document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
            setSuccess('Payroll summaries exported successfully');
        } catch (err) { setError('Export failed: ' + (err.message || 'Unknown error')); }
        finally { setExporting(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this payroll summary? This will revert attendance records to not-posted status.')) return;
        try {
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res  = await fetch(`/payroll-summaries/${id}`, { method: 'DELETE', headers: { 'X-CSRF-TOKEN': csrf, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } });
            if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
            const data = await res.json();
            if (data.success) { setSuccess(data.message || 'Deleted successfully'); await loadSummaries(); }
            else setError('Delete failed: ' + (data.message || 'Unknown error'));
        } catch (err) { setError('Delete failed: ' + (err.message || 'Unknown error')); }
    };

    const loadDepartments = async () => {
        try {
            const res  = await fetch('/attendance/departments', { headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } });
            if (res.ok) { const data = await res.json(); if (data.success) setDepartments(data.data); }
        } catch {}
    };

    useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);
    useEffect(() => { if (error)   { const t = setTimeout(() => setError(''),   5000); return () => clearTimeout(t); } }, [error]);
    useEffect(() => { loadSummaries(); }, [year, month, periodType, department, status, searchTerm, currentPage]);
    useEffect(() => { loadDepartments(); }, []);

    const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white';
    const months   = Array.from({ length: 12 }, (_, i) => ({ val: i + 1, label: new Date(2024, i, 1).toLocaleString('default', { month: 'long' }) }));

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Daily Time Records" />

            <div className="max-w-7xl mx-auto space-y-5">

                {/* ── Page Header ──────────────────────────────────────────── */}
                <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-2xl px-6 py-6 overflow-hidden shadow-lg">
                    <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
                    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-indigo-200 text-xs font-medium mb-1">Timesheet</p>
                            <h1 className="text-2xl font-bold text-white">Daily Time Records</h1>
                            <p className="text-indigo-200 text-xs mt-1">Double-click any row to view detailed attendance records</p>
                        </div>
                        <button
                            onClick={handleExport}
                            disabled={exporting}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 text-sm font-semibold rounded-xl hover:bg-indigo-50 transition-colors shadow-md flex-shrink-0 disabled:opacity-60"
                        >
                            {exporting ? <><RefreshCw className="w-4 h-4 animate-spin" />Exporting…</> : <><Download className="w-4 h-4" />Export</>}
                        </button>
                    </div>
                </div>

                {/* Alerts */}
                {error   && <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"><AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}</div>}
                {success && <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700"><CheckCircle className="w-4 h-4 flex-shrink-0" />{success}</div>}

                {/* ── Filters ──────────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1.5"><Filter className="w-3.5 h-3.5" />Filters</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                        {/* Search */}
                        <div className="relative lg:col-span-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input type="text" placeholder="Search by name or ID…" className={`${inputCls} pl-9`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        {/* Year */}
                        <input type="number" min="2020" max="2030" className={inputCls} value={year} onChange={e => setYear(parseInt(e.target.value))} />
                        {/* Month */}
                        <select className={inputCls} value={month} onChange={e => setMonth(parseInt(e.target.value))}>
                            {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                        </select>
                        {/* Period */}
                        <select className={inputCls} value={periodType} onChange={e => setPeriodType(e.target.value)}>
                            <option value="">All Periods</option>
                            <option value="1st_half">1st Half (1–15)</option>
                            <option value="2nd_half">2nd Half (16–31)</option>
                        </select>
                        {/* Department */}
                        <select className={inputCls} value={department} onChange={e => setDepartment(e.target.value)}>
                            <option value="">All Departments</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        {/* Status */}
                        <select className={inputCls} value={status} onChange={e => setStatus(e.target.value)}>
                            <option value="">All Status</option>
                            <option value="posted">Posted</option>
                            <option value="draft">Draft</option>
                            <option value="locked">Locked</option>
                        </select>
                    </div>
                </div>

                {/* ── Stat Cards ───────────────────────────────────────────── */}
                {statistics && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={Users}    label="Total Summaries"     value={statistics.total_summaries || 0}                    color="bg-indigo-500"  topColor="bg-indigo-500" />
                        <StatCard icon={Calendar} label="Total Days Worked"   value={fmtNum(statistics.total_days_worked, 1)}            color="bg-emerald-500" topColor="bg-emerald-500" />
                        <StatCard icon={Clock}    label="Total OT Hours"      value={fmtNum(statistics.total_ot_hours)}                  color="bg-amber-500"   topColor="bg-amber-500" />
                        <StatCard icon={Target}   label="Avg Days / Employee" value={fmtNum(statistics.avg_days_worked, 1)}              color="bg-violet-500"  topColor="bg-violet-500" />
                    </div>
                )}

                {/* ── Table Card ───────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <RefreshCw className="w-7 h-7 text-indigo-500 animate-spin" />
                            <p className="text-sm text-gray-500">Loading records…</p>
                        </div>
                    ) : summaries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                                <FileText className="w-8 h-8 text-indigo-300" />
                            </div>
                            <p className="text-sm font-semibold text-gray-700 mb-1">No payroll summaries found</p>
                            <p className="text-xs text-gray-400">Try adjusting your filters or check if any attendance records have been posted.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            {['Employee','Department','Period','Days Worked','OT Hours','Off Days','Late/Under Hrs','NSD Hours','SLVL Days','Retro','Status','Posted'].map(h => (
                                                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {summaries.map(s => (
                                            <tr
                                                key={s.id}
                                                className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                                                onDoubleClick={() => { setSelectedSummary(s); setShowDetailModal(true); }}
                                                title="Double-click to view detailed attendance records"
                                            >
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <p className="font-semibold text-gray-900">{s.employee_name}</p>
                                                    <p className="text-xs text-gray-400">{s.employee_no}</p>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <p className="text-gray-700">{s.department}</p>
                                                    <p className="text-xs text-gray-400">{s.line}</p>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">{s.full_period}</td>
                                                <td className="px-5 py-3.5 whitespace-nowrap font-semibold text-gray-900">{fmtNum(s.days_worked,1)}</td>
                                                <td className="px-5 py-3.5 whitespace-nowrap font-semibold text-gray-900">{fmtNum(s.ot_hours)}</td>
                                                <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">{fmtNum(s.off_days,1)}</td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <span className="flex items-center gap-1 text-gray-600"><Clock className="w-3 h-3 text-amber-500" />{fmtMins(s.late_under_minutes)}</span>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">{fmtNum(s.nsd_hours)}</td>
                                                <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">{fmtNum(s.slvl_days,1)}</td>
                                                <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">{fmtNum(s.retro)}</td>
                                                <td className="px-5 py-3.5 whitespace-nowrap"><StatusBadge status={s.status} /></td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <p className="text-gray-600">{fmtDate(s.posted_at)}</p>
                                                    {s.posted_by && <p className="text-xs text-gray-400">by {s.posted_by.name}</p>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-500">Page <span className="font-semibold text-gray-800">{currentPage}</span> of <span className="font-semibold text-gray-800">{totalPages}</span></p>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">First</button>
                                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            const pg = currentPage <= 3 ? i + 1 : (currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i);
                                            if (pg < 1 || pg > totalPages) return null;
                                            return (
                                                <button key={pg} onClick={() => setCurrentPage(pg)} className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${currentPage === pg ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{pg}</button>
                                            );
                                        })}
                                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"><ChevronRightIcon className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">Last</button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <PayrollSummaryDetailModal
                isOpen={showDetailModal}
                summary={selectedSummary}
                onClose={() => { setShowDetailModal(false); setSelectedSummary(null); }}
            />
        </AuthenticatedLayout>
    );
};

export default PayrollSummaries;
