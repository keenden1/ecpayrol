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
            <div className="max-w-7xl mx-auto">
                <div className="max-w-7xl mx-auto">
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
                                    onClick={handleGeneration}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-white/20 hover:bg-white/30 border border-white/30 transition-colors"
                                >
                                    <PlusCircle className="w-3.5 h-3.5" />
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
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Employee
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Department
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Period
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Basic Pay
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Overtime
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Gross
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Deductions
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Net Pay
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Approval
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {payrolls.map((payroll) => (
                                            <tr
                                                key={payroll.id}
                                                className="hover:bg-blue-50 cursor-pointer transition-colors"
                                                onDoubleClick={() =>
                                                    handleRowDoubleClick(
                                                        payroll,
                                                    )
                                                }
                                                title="Double-click to view detailed payroll breakdown"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {
                                                                payroll.employee_name
                                                            }
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {
                                                                payroll.employee_no
                                                            }
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div>
                                                        <div>
                                                            {payroll.department}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {payroll.line}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {payroll.full_period}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                    {formatCurrency(
                                                        payroll.basic_pay,
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                    {formatCurrency(
                                                        payroll.overtime_pay,
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                    {formatCurrency(
                                                        payroll.gross_earnings,
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                                                    {formatCurrency(
                                                        payroll.total_deductions,
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                                                    <span className="text-lg text-blue-600">
                                                        {formatCurrency(
                                                            payroll.net_pay,
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                            payroll.status ===
                                                            "paid"
                                                                ? "bg-green-100 text-green-800"
                                                                : payroll.status ===
                                                                    "finalized"
                                                                  ? "bg-blue-100 text-blue-800"
                                                                  : "bg-yellow-100 text-yellow-800"
                                                        }`}
                                                    >
                                                        {payroll.status ===
                                                            "paid" && (
                                                            <CreditCard className="h-3 w-3 mr-1" />
                                                        )}
                                                        {payroll.status ===
                                                            "finalized" && (
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                        )}
                                                        {payroll.status ===
                                                            "draft" && (
                                                            <Clock className="h-3 w-3 mr-1" />
                                                        )}
                                                        {payroll.status
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            payroll.status.slice(
                                                                1,
                                                            )}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                            payroll.approval_status ===
                                                            "approved"
                                                                ? "bg-green-100 text-green-800"
                                                                : payroll.approval_status ===
                                                                    "rejected"
                                                                  ? "bg-red-100 text-red-800"
                                                                  : "bg-yellow-100 text-yellow-800"
                                                        }`}
                                                    >
                                                        {payroll.approval_status ===
                                                            "approved" && (
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                        )}
                                                        {payroll.approval_status ===
                                                            "rejected" && (
                                                            <XCircle className="h-3 w-3 mr-1" />
                                                        )}
                                                        {payroll.approval_status ===
                                                            "pending" && (
                                                            <Clock className="h-3 w-3 mr-1" />
                                                        )}
                                                        {payroll.approval_status
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            payroll.approval_status.slice(
                                                                1,
                                                            )}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end space-x-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRowDoubleClick(
                                                                    payroll,
                                                                );
                                                            }}
                                                            className="text-blue-600 hover:text-blue-900"
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {payroll.has_adjustments && (
                                                            <span
                                                                className="inline-flex items-center px-1 py-0.5 rounded text-xs bg-orange-100 text-orange-800"
                                                                title="Has manual adjustments"
                                                            >
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
        </AuthenticatedLayout>
    );
};

export default FinalPayroll;
