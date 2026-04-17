import React, { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    Search,
    Calendar,
    Filter,
    Download,
    Trash2,
    RefreshCw,
    Users,
    Calculator,
    FileText,
    AlertTriangle,
    CheckCircle,
    Clock,
    Target,
    Eye,
    X,
    User,
    Building,
    DollarSign,
    TrendingUp,
    Edit,
    Check,
    XCircle,
    Play,
    Pause,
    CreditCard,
    BarChart3,
    FileSpreadsheet,
    PlusCircle,
    Settings,
    Award,
    AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/Components/ui/alert";
import { Button } from "@/Components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";

// Final Payroll Detail Modal
const FinalPayrollDetailModal = ({ isOpen, payroll, onClose, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [calculationBreakdown, setCalculationBreakdown] = useState(null);

    useEffect(() => {
        if (isOpen && payroll) {
            setFormData({
                basic_rate: payroll.basic_rate || 0,
                pay_allowance: payroll.pay_allowance || 0,
                other_earnings: payroll.other_earnings || 0,
                advance_deduction: payroll.advance_deduction || 0,
                charge_store: payroll.charge_store || 0,
                charge_deduction: payroll.charge_deduction || 0,
                meals_deduction: payroll.meals_deduction || 0,
                miscellaneous_deduction: payroll.miscellaneous_deduction || 0,
                other_deductions: payroll.other_deductions || 0,
                calculation_notes: payroll.calculation_notes || "",
            });
            loadCalculationBreakdown();
        }
    }, [isOpen, payroll]);

    const loadCalculationBreakdown = async () => {
        try {
            const response = await fetch(
                `/final-payrolls/${payroll.id}/calculation-breakdown`,
                {
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        Accept: "application/json",
                    },
                },
            );

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setCalculationBreakdown(data.data);
                }
            }
        } catch (err) {
            console.error("Error loading calculation breakdown:", err);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            minimumFractionDigits: 2,
        }).format(amount || 0);
    };

    const formatNumber = (num, decimals = 2) => {
        return parseFloat(num || 0).toFixed(decimals);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                            <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white">Final Payroll Details</h2>
                            {payroll && <p className="text-indigo-200 text-xs">{payroll.employee_name} · {payroll.full_period}</p>}
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            payroll?.status === "paid" ? "bg-emerald-100 text-emerald-700"
                            : payroll?.status === "finalized" ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                            {payroll?.status?.charAt(0).toUpperCase() + payroll?.status?.slice(1)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            payroll?.approval_status === "approved" ? "bg-emerald-100 text-emerald-700"
                            : payroll?.approval_status === "rejected" ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                            {payroll?.approval_status?.charAt(0).toUpperCase() + payroll?.approval_status?.slice(1)}
                        </span>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-5 space-y-4">

                    {/* Employee Info */}
                    <div className="grid grid-cols-3 gap-3 bg-indigo-50 rounded-2xl p-4">
                        {[
                            { icon: User,     label: 'Employee',   main: payroll?.employee_name, sub: payroll?.employee_no },
                            { icon: Building, label: 'Department', main: payroll?.department,    sub: payroll?.line },
                            { icon: Calendar, label: 'Period',     main: payroll?.full_period || `${new Date(0, payroll?.month - 1).toLocaleString("default", { month: "long" })} ${payroll?.year} (${payroll?.period_type === "1st_half" ? "1-15" : "16-30/31"})`, sub: `Cost Center: ${payroll?.cost_center || "N/A"}` },
                        ].map(({ icon: Icon, label, main, sub }) => (
                            <div key={label}>
                                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                                    <Icon className="w-3 h-3" /> {label}
                                </p>
                                <p className="text-sm font-bold text-gray-900">{main}</p>
                                <p className="text-xs text-gray-500">{sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { label: 'Gross Earnings',    val: formatCurrency(payroll?.gross_earnings),         color: 'text-emerald-600' },
                            { label: 'Total Deductions',  val: formatCurrency(payroll?.total_deductions),       color: 'text-red-500'     },
                            { label: 'Net Pay',           val: formatCurrency(payroll?.net_pay),                color: 'text-indigo-600'  },
                            { label: 'Days Worked',       val: formatNumber(payroll?.days_worked, 1),           color: 'text-violet-600'  },
                        ].map(({ label, val, color }) => (
                            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
                                <p className={`text-xl font-bold ${color}`}>{val}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Calculation Breakdown */}
                    {calculationBreakdown && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                                <Calculator className="h-3.5 w-3.5 text-gray-500" />
                                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Calculation Breakdown</h4>
                            </div>
                            <div className="p-4 space-y-3">

                                {/* Basic Calculation */}
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Basic Calculation</p>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                                        {[
                                            ['Pay Type', calculationBreakdown.basic_calculation?.pay_type || 'daily'],
                                            ['Basic Rate', formatCurrency(calculationBreakdown.basic_calculation?.basic_rate)],
                                            ['Days/Hours', formatNumber(calculationBreakdown.basic_calculation?.days_worked || calculationBreakdown.basic_calculation?.hours_worked, 2)],
                                            ['Basic Pay', formatCurrency(calculationBreakdown.basic_calculation?.basic_pay)],
                                        ].map(([label, val]) => (
                                            <div key={label} className="flex justify-between">
                                                <span className="text-gray-500">{label}</span>
                                                <span className="font-medium text-gray-800">{val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Overtime */}
                                {(calculationBreakdown.overtime_calculation?.regular_ot || calculationBreakdown.overtime_calculation?.rest_day_ot) && (
                                    <div className="border-t pt-3">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Overtime</p>
                                        <div className="space-y-1 text-xs">
                                            {calculationBreakdown.overtime_calculation?.regular_ot && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Regular OT ({formatNumber(calculationBreakdown.overtime_calculation.regular_ot.hours)} hrs @ {calculationBreakdown.overtime_calculation.regular_ot.rate?.toFixed(2)})</span>
                                                    <span className="font-medium text-gray-800">{formatCurrency(calculationBreakdown.overtime_calculation.regular_ot.amount)}</span>
                                                </div>
                                            )}
                                            {calculationBreakdown.overtime_calculation?.rest_day_ot && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Rest Day OT ({formatNumber(calculationBreakdown.overtime_calculation.rest_day_ot.hours)} hrs @ {calculationBreakdown.overtime_calculation.rest_day_ot.rate?.toFixed(2)})</span>
                                                    <span className="font-medium text-gray-800">{formatCurrency(calculationBreakdown.overtime_calculation.rest_day_ot.amount)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Deductions */}
                                <div className="border-t pt-3">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Deductions</p>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                                        {calculationBreakdown.deductions_calculation?.government && (
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 mb-1">Government</p>
                                                {[
                                                    ['SSS', calculationBreakdown.deductions_calculation.government.sss],
                                                    ['PhilHealth', calculationBreakdown.deductions_calculation.government.philhealth],
                                                    ['HDMF', calculationBreakdown.deductions_calculation.government.hdmf],
                                                    ['W/Tax', calculationBreakdown.deductions_calculation.government.withholding_tax],
                                                ].map(([label, val]) => (
                                                    <div key={label} className="flex justify-between mb-0.5">
                                                        <span className="text-gray-500">{label}</span>
                                                        <span className="font-medium text-red-600">{formatCurrency(val)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {calculationBreakdown.deductions_calculation?.other && (
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 mb-1">Other</p>
                                                {[
                                                    ['Advance', calculationBreakdown.deductions_calculation.other.advance],
                                                    ['Store', calculationBreakdown.deductions_calculation.other.charge_store],
                                                    ['Meals', calculationBreakdown.deductions_calculation.other.meals],
                                                    ['Late/Under', calculationBreakdown.deductions_calculation.other.late_under],
                                                ].map(([label, val]) => (
                                                    <div key={label} className="flex justify-between mb-0.5">
                                                        <span className="text-gray-500">{label}</span>
                                                        <span className="font-medium text-red-600">{formatCurrency(val)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Summary totals */}
                                {calculationBreakdown.summary && (
                                    <div className="border-t pt-3 bg-indigo-50 rounded-xl p-3">
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                                            {[
                                                ['Gross Earnings', formatCurrency(calculationBreakdown.summary.gross_earnings), 'text-emerald-600'],
                                                ['Total Deductions', formatCurrency(calculationBreakdown.summary.total_deductions), 'text-red-600'],
                                                ['Taxable Income', formatCurrency(calculationBreakdown.summary.taxable_income), 'text-gray-800'],
                                                ['Net Pay', formatCurrency(calculationBreakdown.summary.net_pay), 'text-indigo-600 font-bold'],
                                            ].map(([label, val, color]) => (
                                                <div key={label} className="flex justify-between">
                                                    <span className="text-gray-500">{label}</span>
                                                    <span className={`font-semibold ${color}`}>{val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Audit Information */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            {
                                title: 'Creation Info',
                                rows: [
                                    ['Created', payroll?.created_at ? new Date(payroll.created_at).toLocaleString() : null],
                                    ['Created by', payroll?.creator?.name],
                                    payroll?.has_adjustments ? ['Note', '⚠ Has manual adjustments'] : null,
                                ].filter(Boolean),
                            },
                            {
                                title: 'Approval Info',
                                rows: [
                                    payroll?.approved_at ? ['Approved', new Date(payroll.approved_at).toLocaleString()] : null,
                                    payroll?.approver?.name ? ['Approved by', payroll.approver.name] : null,
                                    payroll?.approval_remarks ? ['Remarks', payroll.approval_remarks] : null,
                                    payroll?.finalized_at ? ['Finalized', new Date(payroll.finalized_at).toLocaleString()] : null,
                                    payroll?.finalizer?.name ? ['Finalized by', payroll.finalizer.name] : null,
                                    payroll?.paid_at ? ['Paid', new Date(payroll.paid_at).toLocaleString()] : null,
                                    payroll?.paid_by?.name ? ['Paid by', payroll.paid_by.name] : null,
                                ].filter(Boolean),
                            },
                        ].map(({ title, rows }) => (
                            <div key={title} className="bg-gray-50 rounded-2xl p-4">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{title}</p>
                                <div className="space-y-1">
                                    {rows.map(([label, val]) => (
                                        <div key={label} className="flex justify-between text-xs">
                                            <span className="text-gray-500">{label}</span>
                                            <span className="font-medium text-gray-700">{val || '—'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end flex-shrink-0">
                    <button onClick={onClose}
                        className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Payslip + Modal ────────────────────────────────────────────────────────
const Payslip = ({ p, isLast }) => {
    const fmt = (v) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(parseFloat(v) || 0);
    const num = (v, d = 2) => parseFloat(v || 0).toFixed(d);
    const nz  = (v) => parseFloat(v || 0) !== 0;

    const cell  = (extra = {}) => ({ padding: '4px 8px', fontSize: '10px', color: '#1f2937', borderBottom: '1px solid #e5e7eb', verticalAlign: 'middle', ...extra });
    const amtC  = (color, extra = {}) => cell({ textAlign: 'right', fontWeight: '600', color, width: '38%', ...extra });

    // Earnings rows — always show Basic Pay; rest only when non-zero
    const earnRows = [
        { label: 'Basic Pay',             sub: `${num(p.days_worked,1)} day(s) × ${fmt(p.basic_rate)}`,  value: p.basic_pay,                 always: true },
        { label: 'OT Regular',            sub: `${num(p.ot_regular_hours)} hrs`,                          value: p.ot_regular_amount,          show: nz(p.ot_regular_hours) },
        { label: 'OT Rest Day',           sub: `${num(p.ot_rest_day_hours)} hrs`,                         value: p.ot_rest_day_amount,         show: nz(p.ot_rest_day_hours) },
        { label: 'OT Special Holiday',    sub: `${num(p.ot_special_holiday_hours)} hrs`,                  value: p.ot_special_holiday_amount,  show: nz(p.ot_special_holiday_hours) },
        { label: 'OT Regular Holiday',    sub: `${num(p.ot_regular_holiday_hours)} hrs`,                  value: p.ot_regular_holiday_amount,  show: nz(p.ot_regular_holiday_hours) },
        { label: 'Holiday Pay',           sub: `${num(p.holiday_hours)} hrs`,                             value: p.holiday_amount,             show: nz(p.holiday_hours) },
        { label: 'Night Shift Diff.',     sub: `${num(p.nsd_hours)} hrs`,                                 value: p.nsd_amount,                 show: nz(p.nsd_hours) },
        { label: 'SLVL',                  sub: `${num(p.slvl_days,1)} day(s)`,                            value: p.slvl_amount,                show: nz(p.slvl_days) },
        { label: 'Travel Order',          sub: `${num(p.travel_order_hours)} hrs`,                        value: p.travel_order_amount,        show: nz(p.travel_order_hours) },
        { label: 'Offset',                sub: `${num(p.offset_hours)} hrs`,                              value: p.offset_amount,              show: nz(p.offset_hours) },
        { label: 'Trip Allowance',        sub: `${num(p.trip_count,1)} trip(s)`,                          value: p.trip_amount,                show: nz(p.trip_count) },
        { label: 'Retro Pay',             sub: '',                                                         value: p.retro_amount,               show: nz(p.retro_amount) },
        { label: 'Allowance',             sub: '',                                                         value: p.allowances || p.pay_allowance, show: nz(p.allowances) || nz(p.pay_allowance) },
        { label: 'Other Earnings',        sub: '',                                                         value: p.other_earnings,             show: nz(p.other_earnings) },
    ].filter(r => r.always || r.show);

    // Deductions rows — always show all government; rest only when non-zero
    const dedRows = [
        { label: 'SSS Contribution',      sub: '',                                                         value: p.sss_contribution,           always: true },
        { label: 'PhilHealth',            sub: '',                                                         value: p.philhealth_contribution,    always: true },
        { label: 'HDMF / Pag-IBIG',       sub: '',                                                         value: p.hdmf_contribution,          always: true },
        { label: 'Withholding Tax',       sub: '',                                                         value: p.withholding_tax,            always: true },
        { label: 'SSS Loan',              sub: '',                                                         value: p.sss_loan,                   show: nz(p.sss_loan) },
        { label: 'HDMF Loan',             sub: '',                                                         value: p.hdmf_loan,                  show: nz(p.hdmf_loan) },
        { label: 'MF Loan',               sub: '',                                                         value: p.mf_loan,                    show: nz(p.mf_loan) },
        { label: 'MF Shares',             sub: '',                                                         value: p.mf_shares,                  show: nz(p.mf_shares) },
        { label: 'Late / Undertime',      sub: `${num(p.late_under_hours)} hrs`,                           value: p.late_under_deduction,       show: nz(p.late_under_deduction) },
        { label: 'Absence',               sub: `${num(p.absence_days,1)} day(s)`,                         value: p.absence_deduction,          show: nz(p.absence_deduction) },
        { label: 'Advance',               sub: '',                                                         value: p.advance_deduction,          show: nz(p.advance_deduction) },
        { label: 'Charge Store',          sub: '',                                                         value: p.charge_store,               show: nz(p.charge_store) },
        { label: 'Charge Deduction',      sub: '',                                                         value: p.charge_deduction,           show: nz(p.charge_deduction) },
        { label: 'Meals',                 sub: '',                                                         value: p.meals_deduction,            show: nz(p.meals_deduction) },
        { label: 'Miscellaneous',         sub: '',                                                         value: p.miscellaneous_deduction,    show: nz(p.miscellaneous_deduction) },
        { label: 'Other Deductions',      sub: '',                                                         value: p.other_deductions,           show: nz(p.other_deductions) },
    ].filter(r => r.always || r.show);

    const grossPay = parseFloat(p.gross_earnings || 0);
    const totalDed = parseFloat(p.total_deductions || 0);
    const netPay   = parseFloat(p.net_pay || 0);
    const rowCount = Math.max(earnRows.length, dedRows.length);

    const th = (extra = {}) => ({ padding: '5px 8px', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280', background: '#f9fafb', borderBottom: '2px solid #e5e7eb', ...extra });

    return (
        <div style={{ pageBreakAfter: isLast ? 'avoid' : 'always', fontFamily: '"Helvetica Neue", Arial, sans-serif', fontSize: '11px', color: '#111827', width: '100%', maxWidth: '680px', margin: '0 auto' }}>

            {/* ══ HEADER ══ */}
            <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '2px solid #1e1b4b', paddingBottom: '10px', marginBottom: '10px' }}>
                <tbody><tr>
                    <td style={{ verticalAlign: 'middle', width: '64px' }}>
                        <img src="/image/logo.png" alt="logo" style={{ width: '56px', height: '56px', objectFit: 'contain', display: 'block' }} />
                    </td>
                    <td style={{ verticalAlign: 'middle', paddingLeft: '12px' }}>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e1b4b', letterSpacing: '0.5px' }}>EC HRIS</div>
                        <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>Human Resource Information System</div>
                    </td>
                    <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e1b4b', letterSpacing: '4px', textTransform: 'uppercase' }}>PAYSLIP</div>
                        <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '3px' }}>
                            Period: <strong style={{ color: '#374151' }}>{p.full_period}</strong>
                        </div>
                        <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '1px' }}>
                            Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </td>
                </tr></tbody>
            </table>

            {/* ══ EMPLOYEE INFO ══ */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', marginBottom: '10px' }}>
                <tbody>
                    <tr style={{ background: '#f3f4f6' }}>
                        <td style={{ padding: '4px 8px', width: '20%', borderRight: '1px solid #d1d5db' }}>
                            <div style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee Name</div>
                            <div style={{ fontWeight: '700', fontSize: '11px', marginTop: '2px' }}>{p.employee_name}</div>
                        </td>
                        <td style={{ padding: '4px 8px', width: '12%', borderRight: '1px solid #d1d5db' }}>
                            <div style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee No.</div>
                            <div style={{ fontWeight: '600', fontSize: '11px', marginTop: '2px' }}>{p.employee_no}</div>
                        </td>
                        <td style={{ padding: '4px 8px', width: '16%', borderRight: '1px solid #d1d5db' }}>
                            <div style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</div>
                            <div style={{ fontWeight: '600', fontSize: '11px', marginTop: '2px' }}>{p.department}</div>
                        </td>
                        <td style={{ padding: '4px 8px', width: '20%', borderRight: '1px solid #d1d5db' }}>
                            <div style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Position</div>
                            <div style={{ fontWeight: '600', fontSize: '11px', marginTop: '2px' }}>{p.job_title || p.line || '—'}</div>
                        </td>
                        <td style={{ padding: '4px 8px', width: '14%', borderRight: '1px solid #d1d5db' }}>
                            <div style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pay Type</div>
                            <div style={{ fontWeight: '600', fontSize: '11px', marginTop: '2px', textTransform: 'capitalize' }}>{p.pay_type || 'Daily'}</div>
                        </td>
                        <td style={{ padding: '4px 8px', width: '18%' }}>
                            <div style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Basic Rate</div>
                            <div style={{ fontWeight: '700', fontSize: '11px', marginTop: '2px' }}>{fmt(p.basic_rate)}</div>
                        </td>
                    </tr>
                    <tr style={{ background: '#fafafa' }}>
                        {[
                            { lbl: 'Days Worked',   val: num(p.days_worked, 1) },
                            { lbl: 'Hours Worked',  val: num(p.hours_worked, 1) },
                            { lbl: 'OT Hours',      val: num(parseFloat(p.ot_regular_hours||0)+parseFloat(p.ot_rest_day_hours||0)+parseFloat(p.ot_special_holiday_hours||0)+parseFloat(p.ot_regular_holiday_hours||0), 2) },
                            { lbl: 'Off Days',      val: num(p.absence_days, 1) },
                            { lbl: 'Late/UT (hrs)', val: num(p.late_under_hours, 2) },
                            { lbl: 'NSD Hours',     val: num(p.nsd_hours, 2) },
                            { lbl: 'Holiday (hrs)', val: num(p.holiday_hours, 2) },
                            { lbl: 'SLVL Days',     val: num(p.slvl_days, 1) },
                        ].map(({ lbl, val }, i) => (
                            <td key={lbl} style={{ padding: '4px 8px', borderRight: i < 7 ? '1px solid #d1d5db' : 'none', borderTop: '1px solid #d1d5db' }}>
                                <div style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{lbl}</div>
                                <div style={{ fontWeight: '600', fontSize: '11px', marginTop: '2px' }}>{val}</div>
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>

            {/* ══ EARNINGS | DEDUCTIONS side-by-side ══ */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', marginBottom: '10px' }}>
                <thead>
                    <tr>
                        <td colSpan={2} style={{ ...th(), background: '#1e1b4b', color: '#fff', fontSize: '10px', padding: '6px 8px', borderRight: '2px solid #fff' }}>EARNINGS</td>
                        <td colSpan={2} style={{ ...th(), background: '#7f1d1d', color: '#fff', fontSize: '10px', padding: '6px 8px' }}>DEDUCTIONS</td>
                    </tr>
                    <tr>
                        <td style={th({ width: '37%', borderRight: '1px solid #e5e7eb' })}>Description</td>
                        <td style={th({ width: '13%', textAlign: 'right', borderRight: '2px solid #d1d5db' })}>Amount</td>
                        <td style={th({ width: '37%', borderRight: '1px solid #e5e7eb' })}>Description</td>
                        <td style={th({ width: '13%', textAlign: 'right' })}>Amount</td>
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rowCount }).map((_, i) => {
                        const e = earnRows[i];
                        const d = dedRows[i];
                        const bg = i % 2 === 0 ? '#ffffff' : '#fafafa';
                        return (
                            <tr key={i} style={{ background: bg }}>
                                <td style={cell({ width: '37%', borderRight: '1px solid #e5e7eb' })}>
                                    {e ? <><span>{e.label}</span>{e.sub ? <span style={{ display: 'block', fontSize: '8.5px', color: '#9ca3af', marginTop: '1px' }}>{e.sub}</span> : null}</> : ''}
                                </td>
                                <td style={amtC('#065f46', { borderRight: '2px solid #d1d5db' })}>{e ? fmt(e.value) : ''}</td>
                                <td style={cell({ width: '37%', borderRight: '1px solid #e5e7eb' })}>
                                    {d ? <><span>{d.label}</span>{d.sub ? <span style={{ display: 'block', fontSize: '8.5px', color: '#9ca3af', marginTop: '1px' }}>{d.sub}</span> : null}</> : ''}
                                </td>
                                <td style={amtC('#991b1b')}>{d ? fmt(d.value) : ''}</td>
                            </tr>
                        );
                    })}
                    {/* Totals */}
                    <tr style={{ background: '#f3f4f6', borderTop: '2px solid #d1d5db' }}>
                        <td style={{ padding: '5px 8px', fontWeight: '700', fontSize: '10px', borderRight: '1px solid #e5e7eb', borderTop: '2px solid #6b7280' }}>GROSS PAY</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: '700', fontSize: '10px', color: '#065f46', borderRight: '2px solid #d1d5db', borderTop: '2px solid #6b7280' }}>{fmt(grossPay)}</td>
                        <td style={{ padding: '5px 8px', fontWeight: '700', fontSize: '10px', borderRight: '1px solid #e5e7eb', borderTop: '2px solid #6b7280' }}>TOTAL DEDUCTIONS</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: '700', fontSize: '10px', color: '#991b1b', borderTop: '2px solid #6b7280' }}>{fmt(totalDed)}</td>
                    </tr>
                </tbody>
            </table>

            {/* ══ NET PAY ══ */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #1e1b4b', marginBottom: '16px' }}>
                <tbody><tr style={{ background: '#1e1b4b' }}>
                    <td style={{ padding: '8px 12px', color: '#fff', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px' }}>NET PAY</td>
                    <td style={{ padding: '8px 12px', color: '#fff', fontSize: '9px', textAlign: 'center' }}>
                        Gross: <strong>{fmt(grossPay)}</strong>&nbsp;&nbsp;−&nbsp;&nbsp;Deductions: <strong>{fmt(totalDed)}</strong>
                    </td>
                    <td style={{ padding: '8px 14px', color: '#86efac', fontWeight: '900', fontSize: '18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {fmt(netPay)}
                    </td>
                </tr></tbody>
            </table>

            {/* ══ SIGNATURES ══ */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <tbody><tr>
                    {['Prepared by', 'Checked by', 'Approved by', "Employee's Signature"].map((lbl, i) => (
                        <td key={lbl} style={{ textAlign: 'center', padding: '0 6px', width: '25%', borderRight: i < 3 ? '1px solid #e5e7eb' : 'none' }}>
                            <div style={{ height: '32px' }} />
                            <div style={{ borderTop: '1px solid #374151', paddingTop: '4px', fontSize: '8px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{lbl}</div>
                        </td>
                    ))}
                </tr></tbody>
            </table>

            {!isLast && (
                <div style={{ borderTop: '1px dashed #d1d5db', margin: '18px 0 0', textAlign: 'center', paddingTop: '4px', fontSize: '8px', color: '#9ca3af', letterSpacing: '3px' }}>
                    ✂ &nbsp; CUT HERE &nbsp; ✂
                </div>
            )}
        </div>
    );
};

const PayrollPrintModal = ({ isOpen, onClose, payrolls }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
            {/* Centered column: toolbar on top, payslips below */}
            <div className="flex flex-col items-center py-6 min-h-full">
                {/* Toolbar */}
                <div className="print:hidden w-full max-w-2xl bg-white border border-gray-200 rounded-xl shadow-lg mb-4 flex items-center justify-between px-5 py-3 sticky top-4 z-10">
                    <span className="text-sm font-semibold text-gray-700">
                        Payslip Preview — {payrolls.length} employee{payrolls.length !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                        >
                            <FileText className="w-4 h-4" />
                            Print
                        </button>
                        <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Payslip pages */}
                <div id="payroll-print-area" className="w-full max-w-2xl bg-white shadow-lg rounded-xl p-8 print:shadow-none print:rounded-none print:p-0 print:max-w-none">
                    {payrolls.map((p, i) => (
                        <Payslip key={p.id} p={p} isLast={i === payrolls.length - 1} />
                    ))}
                </div>
            </div>

            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 1.5cm; }
                    body * { visibility: hidden; }
                    #payroll-print-area, #payroll-print-area * { visibility: visible; }
                    #payroll-print-area { position: fixed; top: 0; left: 0; width: 100%; }
                }
            `}</style>
        </div>
    );
};

// Main Final Payroll Component
const FinalPayroll = ({ auth }) => {
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Filter state
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [periodType, setPeriodType] = useState("");
    const [department, setDepartment] = useState("");
    const [status, setStatus] = useState("");
    const [approvalStatus, setApprovalStatus] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [departments, setDepartments] = useState([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [perPage, setPerPage] = useState(25);

    // Statistics
    const [statistics, setStatistics] = useState(null);

    // Detail modal state
    const [selectedPayroll, setSelectedPayroll] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Generation modal state
    const [showGenerationModal, setShowGenerationModal] = useState(false);
    const [availableSummaries, setAvailableSummaries] = useState([]);

    // Print modal state
    const [showPrintModal, setShowPrintModal] = useState(false);

    // Row selection state
    const [selectedRows, setSelectedRows] = useState(new Set());

    // Approve/Reject modal state
    const [approvalModal, setApprovalModal] = useState({ open: false, type: null, payroll: null });
    const [approvalRemarks, setApprovalRemarks] = useState('');
    const [approvalLoading, setApprovalLoading] = useState(false);

    // Load final payrolls
    const loadPayrolls = async () => {
        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams();
            params.append("year", year);
            params.append("month", month);
            params.append("page", currentPage);
            params.append("per_page", perPage);

            if (periodType) params.append("period_type", periodType);
            if (department) params.append("department", department);
            if (status) params.append("status", status);
            if (approvalStatus)
                params.append("approval_status", approvalStatus);
            if (searchTerm) params.append("search", searchTerm);

            const response = await fetch(
                "/final-payrolls?" + params.toString(),
                {
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        Accept: "application/json",
                    },
                },
            );

            const data = await response.json();

            if (data.success) {
                setPayrolls(data.data);
                setTotalPages(data.pagination.last_page);
                setCurrentPage(data.pagination.current_page);
                setStatistics(data.statistics);
                setDepartments(data.departments);
            } else {
                setError("Failed to load final payrolls");
            }
        } catch (err) {
            console.error("Error loading payrolls:", err);
            setError(
                "Error loading final payrolls: " +
                    (err.message || "Unknown error"),
            );
        } finally {
            setLoading(false);
        }
    };

    // Handle row double-click
    const handleRowDoubleClick = async (payroll) => {
        try {
            const response = await fetch(`/final-payrolls/${payroll.id}`, {
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    Accept: "application/json",
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setSelectedPayroll(data.data);
                    setShowDetailModal(true);
                }
            }
        } catch (err) {
            console.error("Error loading payroll details:", err);
        }
    };

    // Handle payroll update
    const handlePayrollUpdate = () => {
        loadPayrolls();
    };

    // Open approve/reject modal
    const openApprovalModal = (e, payroll, type) => {
        e.stopPropagation();
        setApprovalRemarks('');
        setApprovalModal({ open: true, type, payroll });
    };

    // Submit approve/reject
    const handleApprovalSubmit = async () => {
        if (!approvalModal.payroll) return;
        if (approvalModal.type === 'reject' && !approvalRemarks.trim()) return;
        setApprovalLoading(true);
        try {
            const endpoint = approvalModal.type === 'approve'
                ? `/final-payrolls/${approvalModal.payroll.id}/approve`
                : `/final-payrolls/${approvalModal.payroll.id}/reject`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ approval_remarks: approvalRemarks }),
            });
            const data = await response.json();
            if (data.success) {
                setSuccess(data.message);
                setApprovalModal({ open: false, type: null, payroll: null });
                loadPayrolls();
            } else {
                setError(data.message || 'Action failed');
            }
        } catch (err) {
            setError('Failed to process approval');
        } finally {
            setApprovalLoading(false);
        }
    };

    // Handle generation
    const handleGeneration = async () => {
        try {
            const response = await fetch(
                "/final-payrolls/available-summaries",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute("content"),
                        "X-Requested-With": "XMLHttpRequest",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        year,
                        month,
                        period_type: periodType || "1st_half",
                        department,
                    }),
                },
            );

            const data = await response.json();
            if (data.success) {
                setAvailableSummaries(data.data);
                setShowGenerationModal(true);
            } else {
                setError(data.message || "Failed to get available summaries");
            }
        } catch (err) {
            console.error("Error getting available summaries:", err);
            setError("Failed to get available summaries");
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            minimumFractionDigits: 2,
        }).format(amount || 0);
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch (err) {
            return "Invalid Date";
        }
    };

    // Load data on component mount and filter changes
    useEffect(() => {
        loadPayrolls();
    }, [
        year,
        month,
        periodType,
        department,
        status,
        approvalStatus,
        searchTerm,
        currentPage,
    ]);

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Final Payroll" />
            <div className="w-full">
                <div className="w-full">
                    {/* Header */}
                    <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-2xl px-6 py-6 overflow-hidden shadow-lg mb-6">
                        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
                        <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            <div>
                                <p className="text-indigo-200 text-xs font-medium mb-1">Payroll</p>
                                <h1 className="text-xl font-bold text-white">Final Payroll</h1>
                                <p className="text-indigo-200 text-xs mt-1">
                                    Double-click any row to view detailed payroll information
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowPrintModal(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-white/20 hover:bg-white/30 border border-white/30 transition-colors"
                                >
                                    <FileText className="w-3.5 h-3.5" />
                                    Generate
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="mb-4 border-green-200 bg-green-50">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                            <AlertDescription className="text-green-800">
                                {success}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Filters Card */}
                    <Card className="mb-4">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Filters</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                                {/* Search Input */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Search
                                  </label>

                                  <div className="relative">
                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />

                                      <input
                                          type="text"
                                          placeholder="Search by name or ID..."
                                          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          value={searchTerm}
                                          onChange={(e) => setSearchTerm(e.target.value)}
                                      />
                                  </div>
                              </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Year
                                    </label>
                                    <input
                                        type="number"
                                        min="2020"
                                        max="2030"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={year}
                                        onChange={(e) =>
                                            setYear(parseInt(e.target.value))
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Month
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={month}
                                        onChange={(e) =>
                                            setMonth(parseInt(e.target.value))
                                        }
                                    >
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>
                                                {new Date(
                                                    2024,
                                                    i,
                                                    1,
                                                ).toLocaleString("default", {
                                                    month: "long",
                                                })}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Period
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={periodType}
                                        onChange={(e) =>
                                            setPeriodType(e.target.value)
                                        }
                                    >
                                        <option value="">All Periods</option>
                                        <option value="1st_half">
                                            1st Half (1-15)
                                        </option>
                                        <option value="2nd_half">
                                            2nd Half (16-30/31)
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Department
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={department}
                                        onChange={(e) =>
                                            setDepartment(e.target.value)
                                        }
                                    >
                                        <option value="">
                                            All Departments
                                        </option>
                                        {departments.map((dept) => (
                                            <option key={dept} value={dept}>
                                                {dept}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={status}
                                        onChange={(e) =>
                                            setStatus(e.target.value)
                                        }
                                    >
                                        <option value="">All Status</option>
                                        <option value="draft">Draft</option>
                                        <option value="finalized">
                                            Finalized
                                        </option>
                                        <option value="paid">Paid</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Approval
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={approvalStatus}
                                        onChange={(e) =>
                                            setApprovalStatus(e.target.value)
                                        }
                                    >
                                        <option value="">
                                            All Approval Status
                                        </option>
                                        <option value="pending">Pending</option>
                                        <option value="approved">
                                            Approved
                                        </option>
                                        <option value="rejected">
                                            Rejected
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary Statistics */}
                    {statistics && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                            {[
                                { icon: Users,      label: 'Total Employees', value: statistics.total_employees || 0,                          color: 'bg-indigo-500',  top: 'bg-indigo-500'  },
                                { icon: DollarSign, label: 'Total Net Pay',   value: formatCurrency(statistics.total_net_pay),                  color: 'bg-emerald-500', top: 'bg-emerald-500' },
                                { icon: TrendingUp, label: 'Total Gross',     value: formatCurrency(statistics.total_gross_earnings),           color: 'bg-amber-500',   top: 'bg-amber-500'   },
                                { icon: AlertCircle,label: 'Total Deductions',value: formatCurrency(statistics.total_deductions),               color: 'bg-red-500',     top: 'bg-red-500'     },
                            ].map(({ icon: Icon, label, value, color, top }) => (
                                <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className={`h-1 ${top}`} />
                                    <div className="p-3 flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                                            <Icon className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-gray-900 leading-none">{value}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Table container */}
                    <div className="bg-white rounded-lg shadow">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                                <span className="ml-2 text-lg">Loading...</span>
                            </div>
                        ) : payrolls.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-600 mb-2">
                                    No final payrolls found
                                </h3>
                                <p className="text-gray-500">
                                    Try adjusting your filters or generate
                                    payrolls from posted summaries.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-8">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    checked={payrolls.length > 0 && selectedRows.size === payrolls.length}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedRows(new Set(payrolls.map(p => p.id)));
                                                        else setSelectedRows(new Set());
                                                    }}
                                                />
                                            </th>
                                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Period</th>
                                            <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Basic Pay</th>
                                            <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Overtime</th>
                                            <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross</th>
                                            <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Deductions</th>
                                            <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Pay</th>
                                            <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Approval</th>
                                            <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {payrolls.map((payroll) => (
                                            <tr
                                                key={payroll.id}
                                                className={`hover:bg-blue-50 cursor-pointer transition-colors ${selectedRows.has(payroll.id) ? 'bg-indigo-50' : ''}`}
                                                onDoubleClick={() => handleRowDoubleClick(payroll)}
                                                title="Double-click to view detailed payroll breakdown"
                                            >
                                                <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                        checked={selectedRows.has(payroll.id)}
                                                        onChange={(e) => {
                                                            const next = new Set(selectedRows);
                                                            if (e.target.checked) next.add(payroll.id);
                                                            else next.delete(payroll.id);
                                                            setSelectedRows(next);
                                                        }}
                                                    />
                                                </td>
                                                <td className="px-3 py-2.5 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{payroll.employee_name}</div>
                                                    <div className="text-xs text-gray-400">{payroll.employee_no}</div>
                                                </td>
                                                <td className="px-3 py-2.5 whitespace-nowrap">
                                                    <div className="text-sm text-gray-700">{payroll.department}</div>
                                                    <div className="text-xs text-gray-400">{payroll.line}</div>
                                                </td>
                                                <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-600">
                                                    {payroll.full_period}
                                                </td>
                                                <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-900 font-medium text-right">
                                                    {formatCurrency(payroll.basic_pay)}
                                                </td>
                                                <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-900 font-medium text-right">
                                                    {formatCurrency(payroll.overtime_pay)}
                                                </td>
                                                <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-900 font-medium text-right">
                                                    {formatCurrency(payroll.gross_earnings)}
                                                </td>
                                                <td className="px-3 py-2.5 whitespace-nowrap text-sm text-red-600 font-medium text-right">
                                                    {formatCurrency(payroll.total_deductions)}
                                                </td>
                                                <td className="px-3 py-2.5 whitespace-nowrap text-sm font-bold text-indigo-600 text-right">
                                                    {formatCurrency(payroll.net_pay)}
                                                </td>
                                                <td className="px-3 py-2.5 whitespace-nowrap text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        payroll.status === 'paid' ? 'bg-green-100 text-green-700'
                                                        : payroll.status === 'finalized' ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {payroll.status === 'paid' && <CreditCard className="h-3 w-3" />}
                                                        {payroll.status === 'finalized' && <CheckCircle className="h-3 w-3" />}
                                                        {payroll.status === 'draft' && <Clock className="h-3 w-3" />}
                                                        {payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5 whitespace-nowrap text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        payroll.approval_status === 'approved' ? 'bg-emerald-100 text-emerald-700'
                                                        : payroll.approval_status === 'rejected' ? 'bg-red-100 text-red-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {payroll.approval_status === 'approved' && <CheckCircle className="h-3 w-3" />}
                                                        {payroll.approval_status === 'rejected' && <XCircle className="h-3 w-3" />}
                                                        {payroll.approval_status === 'pending' && <Clock className="h-3 w-3" />}
                                                        {payroll.approval_status.charAt(0).toUpperCase() + payroll.approval_status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5 whitespace-nowrap text-center">
                                                    <div className="flex justify-center items-center gap-0.5">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleRowDoubleClick(payroll); }}
                                                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </button>
                                                        {payroll.approval_status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={(e) => openApprovalModal(e, payroll, 'approve')}
                                                                    className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                                                                    title="Approve"
                                                                >
                                                                    <Check className="h-3.5 w-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => openApprovalModal(e, payroll, 'reject')}
                                                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                                                    title="Reject"
                                                                >
                                                                    <XCircle className="h-3.5 w-3.5" />
                                                                </button>
                                                            </>
                                                        )}
                                                        {payroll.has_adjustments && (
                                                            <span className="inline-flex items-center px-1 py-0.5 rounded text-xs bg-orange-100 text-orange-800" title="Has manual adjustments">
                                                                <Settings className="h-3 w-3" />
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 bg-white">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <Button
                                        onClick={() =>
                                            setCurrentPage(
                                                Math.max(1, currentPage - 1),
                                            )
                                        }
                                        disabled={currentPage === 1}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        onClick={() =>
                                            setCurrentPage(
                                                Math.min(
                                                    totalPages,
                                                    currentPage + 1,
                                                ),
                                            )
                                        }
                                        disabled={currentPage === totalPages}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Next
                                    </Button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing page{" "}
                                            <span className="font-medium">
                                                {currentPage}
                                            </span>{" "}
                                            of{" "}
                                            <span className="font-medium">
                                                {totalPages}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <nav
                                            className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                                            aria-label="Pagination"
                                        >
                                            <Button
                                                onClick={() =>
                                                    setCurrentPage(1)
                                                }
                                                disabled={currentPage === 1}
                                                variant="outline"
                                                size="sm"
                                                className="rounded-l-md"
                                            >
                                                First
                                            </Button>
                                            <Button
                                                onClick={() =>
                                                    setCurrentPage(
                                                        Math.max(
                                                            1,
                                                            currentPage - 1,
                                                        ),
                                                    )
                                                }
                                                disabled={currentPage === 1}
                                                variant="outline"
                                                size="sm"
                                            >
                                                Previous
                                            </Button>

                                            {Array.from(
                                                {
                                                    length: Math.min(
                                                        5,
                                                        totalPages,
                                                    ),
                                                },
                                                (_, i) => {
                                                    const pageNum =
                                                        currentPage <= 3
                                                            ? i + 1
                                                            : currentPage >=
                                                                totalPages - 2
                                                              ? totalPages -
                                                                4 +
                                                                i
                                                              : currentPage -
                                                                2 +
                                                                i;

                                                    if (
                                                        pageNum > 0 &&
                                                        pageNum <= totalPages
                                                    ) {
                                                        return (
                                                            <Button
                                                                key={pageNum}
                                                                onClick={() =>
                                                                    setCurrentPage(
                                                                        pageNum,
                                                                    )
                                                                }
                                                                variant={
                                                                    currentPage ===
                                                                    pageNum
                                                                        ? "default"
                                                                        : "outline"
                                                                }
                                                                size="sm"
                                                                className={
                                                                    currentPage ===
                                                                    pageNum
                                                                        ? "bg-blue-500 text-white"
                                                                        : ""
                                                                }
                                                            >
                                                                {pageNum}
                                                            </Button>
                                                        );
                                                    }
                                                    return null;
                                                },
                                            )}

                                            <Button
                                                onClick={() =>
                                                    setCurrentPage(
                                                        Math.min(
                                                            totalPages,
                                                            currentPage + 1,
                                                        ),
                                                    )
                                                }
                                                disabled={
                                                    currentPage === totalPages
                                                }
                                                variant="outline"
                                                size="sm"
                                            >
                                                Next
                                            </Button>
                                            <Button
                                                onClick={() =>
                                                    setCurrentPage(totalPages)
                                                }
                                                disabled={
                                                    currentPage === totalPages
                                                }
                                                variant="outline"
                                                size="sm"
                                                className="rounded-r-md"
                                            >
                                                Last
                                            </Button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Print Modal */}
            <PayrollPrintModal
                isOpen={showPrintModal}
                onClose={() => setShowPrintModal(false)}
                payrolls={selectedRows.size > 0 ? payrolls.filter(p => selectedRows.has(p.id)) : payrolls}
                filters={{
                    period: periodType || 'All Periods',
                    department: department || 'All Departments',
                }}
            />

            {/* Detail Modal */}
            <FinalPayrollDetailModal
                isOpen={showDetailModal}
                payroll={selectedPayroll}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedPayroll(null);
                }}
                onUpdate={handlePayrollUpdate}
            />

            {/* Approve / Reject Confirmation Modal */}
            {approvalModal.open && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className={`px-5 py-4 flex items-center gap-3 ${approvalModal.type === 'approve' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-red-500 to-rose-500'}`}>
                            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                                {approvalModal.type === 'approve'
                                    ? <Check className="w-4 h-4 text-white" />
                                    : <XCircle className="w-4 h-4 text-white" />}
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">
                                    {approvalModal.type === 'approve' ? 'Approve Payroll' : 'Reject Payroll'}
                                </h3>
                                <p className="text-white/70 text-xs">{approvalModal.payroll?.employee_name} · {approvalModal.payroll?.full_period}</p>
                            </div>
                        </div>
                        <div className="p-5 space-y-4">
                            <p className="text-sm text-gray-600">
                                {approvalModal.type === 'approve'
                                    ? 'Are you sure you want to approve this payroll? This action will mark it as approved.'
                                    : 'Are you sure you want to reject this payroll? Please provide a reason.'}
                            </p>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">
                                    Remarks {approvalModal.type === 'reject' && <span className="text-red-500">*</span>}
                                </label>
                                <textarea
                                    value={approvalRemarks}
                                    onChange={(e) => setApprovalRemarks(e.target.value)}
                                    rows={3}
                                    placeholder={approvalModal.type === 'approve' ? 'Optional remarks...' : 'Reason for rejection (required)'}
                                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                                />
                                {approvalModal.type === 'reject' && !approvalRemarks.trim() && (
                                    <p className="text-xs text-red-500 mt-1">Remarks are required for rejection.</p>
                                )}
                            </div>
                        </div>
                        <div className="px-5 pb-5 flex justify-end gap-2">
                            <button
                                onClick={() => setApprovalModal({ open: false, type: null, payroll: null })}
                                disabled={approvalLoading}
                                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApprovalSubmit}
                                disabled={approvalLoading || (approvalModal.type === 'reject' && !approvalRemarks.trim())}
                                className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 ${approvalModal.type === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
                            >
                                {approvalLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                                {approvalModal.type === 'approve' ? 'Approve' : 'Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
};

export default FinalPayroll;
