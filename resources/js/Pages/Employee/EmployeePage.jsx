import React, { useState, useEffect } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ViewEmployeeModal from "./ViewEmployeeModal";
import {
    Search,
    Edit2,
    Trash2,
    UserPlus,
    Eye,
    X,
    ShieldOff,
    Check,
    Lock,
    Users,
    FileSpreadsheet,
    ChevronRight,
    AlertTriangle,
    KeyRound,
    RefreshCw,
} from "lucide-react";
import { Alert, AlertDescription } from "@/Components/ui/alert";
import { Button } from "@/Components/ui/Button";
import { Card, CardContent } from "@/Components/ui/card";

// ─── Modal ────────────────────────────────────────────────────────────────────
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full overflow-hidden">
                <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-700">
                    <h3
                        id="modal-title"
                        className="text-base font-semibold text-white tracking-wide"
                    >
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

// ─── Confirm Modal ─────────────────────────────────────────────────────────────
const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    confirmVariant = "destructive",
}) => {
    if (!isOpen) return null;
    const variantClass =
        confirmVariant === "destructive"
            ? "bg-red-600 hover:bg-red-700 text-white"
            : confirmVariant === "warning"
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : "bg-indigo-600 hover:bg-indigo-700 text-white";
    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                <div className="px-6 pt-6 pb-4 flex items-start gap-4">
                    <div
                        className={`flex-shrink-0 p-2 rounded-full ${confirmVariant === "destructive" ? "bg-red-100" : confirmVariant === "warning" ? "bg-amber-100" : "bg-indigo-100"}`}
                    >
                        <AlertTriangle
                            className={`h-5 w-5 ${confirmVariant === "destructive" ? "text-red-600" : confirmVariant === "warning" ? "text-amber-600" : "text-indigo-600"}`}
                        />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                            {title}
                        </h3>
                        <p className="text-sm text-gray-500">{message}</p>
                    </div>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${variantClass}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Form Section Header ───────────────────────────────────────────────────────
const FormSection = ({ title }) => (
    <div className="flex items-center gap-3 mb-3">
        <div className="w-1 h-5 rounded-full bg-indigo-500"></div>
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            {title}
        </h3>
        <div className="flex-1 h-px bg-gray-100"></div>
    </div>
);

// ─── Form Field ────────────────────────────────────────────────────────────────
const FormField = ({ label, required, error, children }) => (
    <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
);

const inputCls = (err) =>
    `w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow ${err ? "border-red-400 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"}`;

// ─── Employee Form ─────────────────────────────────────────────────────────────
const EmployeeForm = ({
    isOpen,
    onClose,
    employee = null,
    mode = "create",
}) => {
    const [formData, setFormData] = useState({
        idno: "",
        bid: "",
        Lname: "",
        Fname: "",
        MName: "",
        Suffix: "",
        Gender: "",
        EducationalAttainment: "",
        Degree: "",
        CivilStatus: "",
        Birthdate: "",
        ContactNo: "",
        Email: "",
        PresentAddress: "",
        PermanentAddress: "",
        EmerContactName: "",
        EmerContactNo: "",
        EmerRelationship: "",
        EmpStatus: "",
        JobStatus: "Active",
        RankFile: "",
        Department: "",
        Line: "",
        Jobtitle: "",
        HiredDate: "",
        EndOfContract: "",
        pay_type: "",
        payrate: "",
        pay_allowance: "",
        SSSNO: "",
        PHILHEALTHNo: "",
        HDMFNo: "",
        TaxNo: "",
        Taxable: false,
        CostCenter: "",
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (employee) {
            const taxableValue =
                typeof employee.Taxable === "boolean"
                    ? employee.Taxable
                    : employee.Taxable === "Yes" || employee.Taxable === "1";
            // Normalize null → '' so controlled inputs never receive null
            const str = (v) => v ?? "";
            setFormData({
                idno: str(employee.idno),
                bid: str(employee.bid),
                Lname: str(employee.Lname),
                Fname: str(employee.Fname),
                MName: str(employee.MName),
                Suffix: str(employee.Suffix),
                Gender: str(employee.Gender),
                EducationalAttainment: str(employee.EducationalAttainment),
                Degree: str(employee.Degree),
                CivilStatus: str(employee.CivilStatus),
                Birthdate: employee.Birthdate
                    ? String(employee.Birthdate).substring(0, 10)
                    : "",
                ContactNo: str(employee.ContactNo),
                Email: str(employee.Email),
                PresentAddress: str(employee.PresentAddress),
                PermanentAddress: str(employee.PermanentAddress),
                EmerContactName: str(employee.EmerContactName),
                EmerContactNo: str(employee.EmerContactNo),
                EmerRelationship: str(employee.EmerRelationship),
                EmpStatus: str(employee.EmpStatus),
                JobStatus: str(employee.JobStatus) || "Active",
                RankFile: str(employee.RankFile),
                Department: str(employee.Department),
                Line: str(employee.Line),
                Jobtitle: str(employee.Jobtitle),
                HiredDate: employee.HiredDate
                    ? String(employee.HiredDate).substring(0, 10)
                    : "",
                EndOfContract: employee.EndOfContract
                    ? String(employee.EndOfContract).substring(0, 10)
                    : "",
                pay_type: str(employee.pay_type),
                payrate: employee.payrate ?? "",
                pay_allowance: employee.pay_allowance ?? "",
                SSSNO: str(employee.SSSNO),
                PHILHEALTHNo: str(employee.PHILHEALTHNo),
                HDMFNo: str(employee.HDMFNo),
                TaxNo: str(employee.TaxNo),
                Taxable: taxableValue,
                CostCenter: str(employee.CostCenter),
            });
        } else {
            setFormData({
                idno: "",
                bid: "",
                Lname: "",
                Fname: "",
                MName: "",
                Suffix: "",
                Gender: "",
                EducationalAttainment: "",
                Degree: "",
                CivilStatus: "",
                Birthdate: "",
                ContactNo: "",
                Email: "",
                PresentAddress: "",
                PermanentAddress: "",
                EmerContactName: "",
                EmerContactNo: "",
                EmerRelationship: "",
                EmpStatus: "",
                JobStatus: "Active",
                RankFile: "",
                Department: "",
                Line: "",
                Jobtitle: "",
                HiredDate: "",
                EndOfContract: "",
                pay_type: "",
                payrate: "",
                pay_allowance: "",
                SSSNO: "",
                PHILHEALTHNo: "",
                HDMFNo: "",
                TaxNo: "",
                Taxable: false,
                CostCenter: "",
            });
        }
    }, [employee]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const processedData = {
            ...formData,
            Taxable: Boolean(formData.Taxable),
        };
        if (mode === "create") {
            router.post("/employees", processedData, {
                onError: (errors) => setErrors(errors),
                onSuccess: () => onClose(),
                preserveScroll: true,
            });
        } else {
            if (!employee || !employee.id) {
                setErrors({ general: "Employee ID is missing" });
                return;
            }
            router.post(
                `/employees/${employee.id}`,
                { ...processedData, _method: "PUT" },
                {
                    preserveState: true,
                    preserveScroll: true,
                    onError: (errors) => setErrors(errors),
                    onSuccess: () => onClose(),
                },
            );
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "Taxable") {
            setFormData((prev) => ({
                ...prev,
                [name]: value === "1" || value === "true",
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === "create" ? "Add New Employee" : "Edit Employee"}
        >
            <form onSubmit={handleSubmit} className="p-8">
                {/* ── 3-column landscape layout ── */}
                <div className="grid grid-cols-3 gap-8">

                    {/* ── Column 1: Personal Information ── */}
                    <div className="space-y-4">
                        <FormSection title="Personal Information" />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="ID Number" error={errors.idno}>
                                <input id="idno" name="idno" type="text" className={inputCls(errors.idno)} value={formData.idno} onChange={handleChange} />
                            </FormField>
                            <FormField label="Biometrics ID">
                                <input id="bid" name="bid" type="text" className={inputCls()} value={formData.bid} onChange={handleChange} />
                            </FormField>
                            <FormField label="Last Name" required error={errors.Lname}>
                                <input id="Lname" name="Lname" type="text" className={inputCls(errors.Lname)} value={formData.Lname} onChange={handleChange} required />
                            </FormField>
                            <FormField label="First Name" required error={errors.Fname}>
                                <input id="Fname" name="Fname" type="text" className={inputCls(errors.Fname)} value={formData.Fname} onChange={handleChange} required />
                            </FormField>
                            <FormField label="Middle Name">
                                <input id="MName" name="MName" type="text" className={inputCls()} value={formData.MName} onChange={handleChange} />
                            </FormField>
                            <FormField label="Suffix">
                                <input id="Suffix" name="Suffix" type="text" className={inputCls()} value={formData.Suffix} onChange={handleChange} />
                            </FormField>
                            <FormField label="Gender" error={errors.Gender}>
                                <select id="Gender" name="Gender" className={inputCls(errors.Gender)} value={formData.Gender} onChange={handleChange}>
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </FormField>
                            <FormField label="Civil Status">
                                <select id="CivilStatus" name="CivilStatus" className={inputCls()} value={formData.CivilStatus} onChange={handleChange}>
                                    <option value="">Select Status</option>
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Widowed">Widowed</option>
                                    <option value="Divorced">Divorced</option>
                                </select>
                            </FormField>
                            <div className="col-span-2">
                                <FormField label="Birthdate">
                                    <input id="Birthdate" name="Birthdate" type="date" className={inputCls()} value={formData.Birthdate} onChange={handleChange} />
                                </FormField>
                            </div>
                        </div>
                    </div>

                    {/* ── Column 2: Contact + Employment ── */}
                    <div className="space-y-4">
                        <FormSection title="Contact Information" />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Contact Number">
                                <input id="ContactNo" name="ContactNo" type="tel" className={inputCls()} value={formData.ContactNo} onChange={handleChange} />
                            </FormField>
                            <FormField label="Email" required={mode === "create"} error={errors.Email}>
                                <input id="Email" name="Email" type="email" className={inputCls(errors.Email)} value={formData.Email} onChange={handleChange} required={mode === "create"} />
                            </FormField>
                        </div>

                        <div className="pt-2">
                            <FormSection title="Employment Information" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Employment Status">
                                <select id="EmpStatus" name="EmpStatus" className={inputCls()} value={formData.EmpStatus} onChange={handleChange}>
                                    <option value="">Select Status</option>
                                    <option value="Regular">Regular</option>
                                    <option value="Contractual">Contractual</option>
                                    <option value="Probationary">Probationary</option>
                                </select>
                            </FormField>
                            <FormField label="Job Status">
                                <select id="JobStatus" name="JobStatus" className={inputCls()} value={formData.JobStatus} onChange={handleChange}>
                                    <option value="">Select Status</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Blocked">Blocked</option>
                                    <option value="On Leave">On Leave</option>
                                </select>
                            </FormField>
                            <FormField label="Department" required error={errors.Department}>
                                <input id="Department" name="Department" type="text" className={inputCls(errors.Department)} value={formData.Department} onChange={handleChange} required />
                            </FormField>
                            <FormField label="Job Title" required error={errors.Jobtitle}>
                                <input id="Jobtitle" name="Jobtitle" type="text" className={inputCls(errors.Jobtitle)} value={formData.Jobtitle} onChange={handleChange} required />
                            </FormField>
                            <FormField label="Hired Date">
                                <input id="HiredDate" name="HiredDate" type="date" className={inputCls()} value={formData.HiredDate} onChange={handleChange} />
                            </FormField>
                            <FormField label="End of Contract">
                                <input id="EndOfContract" name="EndOfContract" type="date" className={inputCls()} value={formData.EndOfContract} onChange={handleChange} />
                            </FormField>
                        </div>
                    </div>

                    {/* ── Column 3: Compensation + Government IDs ── */}
                    <div className="space-y-4">
                        <FormSection title="Compensation" />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Pay Type">
                                <select id="pay_type" name="pay_type" className={inputCls()} value={formData.pay_type} onChange={handleChange}>
                                    <option value="">Select Pay Type</option>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Weekly">Weekly</option>
                                    <option value="Daily">Daily</option>
                                </select>
                            </FormField>
                            <FormField label="Pay Rate">
                                <input id="payrate" name="payrate" type="number" step="0.01" className={inputCls()} value={formData.payrate} onChange={handleChange} />
                            </FormField>
                        </div>

                        <div className="pt-2">
                            <FormSection title="Government IDs" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="SSS Number">
                                <input id="SSSNO" name="SSSNO" type="text" className={inputCls()} value={formData.SSSNO} onChange={handleChange} />
                            </FormField>
                            <FormField label="PhilHealth Number">
                                <input id="PHILHEALTHNo" name="PHILHEALTHNo" type="text" className={inputCls()} value={formData.PHILHEALTHNo} onChange={handleChange} />
                            </FormField>
                            <FormField label="HDMF Number">
                                <input id="HDMFNo" name="HDMFNo" type="text" className={inputCls()} value={formData.HDMFNo} onChange={handleChange} />
                            </FormField>
                            <FormField label="Tax Number">
                                <input id="TaxNo" name="TaxNo" type="text" className={inputCls()} value={formData.TaxNo} onChange={handleChange} />
                            </FormField>
                            <div className="col-span-2">
                                <FormField label="Taxable" required>
                                    <select id="Taxable" name="Taxable" className={inputCls()} value={formData.Taxable ? "1" : "0"} onChange={handleChange} required>
                                        <option value="1">Yes</option>
                                        <option value="0">No</option>
                                    </select>
                                </FormField>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-gray-100">
                    <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                        {mode === "create" ? "Add Employee" : "Save Changes"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// ─── Tabs ──────────────────────────────────────────────────────────────────────
const Tabs = ({ children, defaultValue, className = "", onValueChange }) => {
    const [activeTab, setActiveTab] = useState(defaultValue);
    useEffect(() => {
        if (onValueChange) onValueChange(activeTab);
    }, [activeTab, onValueChange]);
    return (
        <div className={className}>
            {React.Children.map(children, (child) => {
                if (
                    child &&
                    (child.type === TabsList || child.type === TabsContent)
                )
                    return React.cloneElement(child, {
                        activeTab,
                        setActiveTab,
                    });
                return child;
            })}
        </div>
    );
};

const TabsList = ({ children, activeTab, setActiveTab, className = "" }) => (
    <div className={`flex gap-1 bg-gray-100 p-1 rounded-xl ${className}`}>
        {React.Children.map(children, (child) =>
            child && child.type === TabsTrigger
                ? React.cloneElement(child, { activeTab, setActiveTab })
                : child,
        )}
    </div>
);

const TabsTrigger = ({ children, value, activeTab, setActiveTab, count }) => {
    const isActive = activeTab === value;
    return (
        <button
            onClick={() => setActiveTab(value)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                isActive
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-white/60"
            }`}
        >
            {children}
        </button>
    );
};

const TabsContent = ({ children, value, activeTab }) => {
    if (activeTab !== value) return null;
    return <div className="mt-2">{children}</div>;
};

// ─── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        Active: {
            cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
            icon: <Check className="w-3 h-3" />,
        },
        Inactive: {
            cls: "bg-amber-50 text-amber-700 ring-amber-200",
            icon: <ShieldOff className="w-3 h-3" />,
        },
        Blocked: {
            cls: "bg-red-50 text-red-700 ring-red-200",
            icon: <Lock className="w-3 h-3" />,
        },
        "On Leave": {
            cls: "bg-blue-50 text-blue-700 ring-blue-200",
            icon: null,
        },
    };
    const cfg = map[status] || {
        cls: "bg-gray-50 text-gray-600 ring-gray-200",
        icon: null,
    };
    return (
        <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${cfg.cls}`}
        >
            {cfg.icon}
            {status}
        </span>
    );
};

// ─── Avatar ────────────────────────────────────────────────────────────────────
const Avatar = ({ fname, lname }) => {
    const initials =
        `${(fname || "")[0] || ""}${(lname || "")[0] || ""}`.toUpperCase();
    const colors = [
        "bg-indigo-500",
        "bg-violet-500",
        "bg-sky-500",
        "bg-teal-500",
        "bg-rose-500",
    ];
    const idx = (fname?.charCodeAt(0) || 0) % colors.length;
    return (
        <div
            className={`flex-shrink-0 h-8 w-8 rounded-full ${colors[idx]} flex items-center justify-center text-white text-xs font-bold`}
        >
            {initials || "?"}
        </div>
    );
};

// ─── Action Button ─────────────────────────────────────────────────────────────
const ActionBtn = ({ onClick, title, className, children }) => (
    <button
        onClick={onClick}
        title={title}
        className={`p-1.5 rounded-lg transition-colors ${className}`}
    >
        {children}
    </button>
);

// ─── Employee List ─────────────────────────────────────────────────────────────
const EmployeeList = ({
    employees,
    onView,
    onEdit,
    onDelete,
    onMarkInactive,
    onMarkBlocked,
    onMarkActive,
    onCreateLogin,
    onResetLogin,
}) => {
    if (!employees?.length) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">
                    No employees found
                </p>
                <p className="text-xs text-gray-400 mt-1">
                    Try adjusting your search or filter
                </p>
            </div>
        );
    }

    return (
        <div>
            <table className="w-full table-fixed">
                <thead className="sticky top-0 z-10 bg-white">
                    <tr className="border-b border-gray-100">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-20">
                            ID / BID
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-56">
                            Employee
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">
                            Status
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-36">
                            Department
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-40">
                            Job Title
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-36">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {employees.map((employee) => (
                        <tr
                            key={employee.id}
                            className="hover:bg-indigo-50/30 transition-colors group"
                        >
                            {/* ID / BID */}
                            <td className="px-3 py-2 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-mono text-gray-600">{employee.idno || "—"}</p>
                                    {employee.has_account
                                        ? <span title="Has login credentials" className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-700">✓ Login</span>
                                        : <span title="No login account" className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-400">No Login</span>
                                    }
                                </div>
                                {employee.bid && (
                                    <p className="text-xs font-mono text-indigo-500 mt-0.5">{employee.bid}</p>
                                )}
                            </td>
                            {/* Employee Name + Avatar */}
                            <td className="px-3 py-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <Avatar fname={employee.Fname} lname={employee.Lname} />
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">
                                            {`${employee.Lname}, ${employee.Fname}${employee.MName ? " " + employee.MName[0] + "." : ""}`}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate">{employee.Email || "—"}</p>
                                    </div>
                                </div>
                            </td>

                            {/* Status */}
                            <td className="px-3 py-2 whitespace-nowrap">
                                <StatusBadge status={employee.JobStatus} />
                            </td>

                            {/* Department */}
                            <td className="px-3 py-2 text-sm text-gray-600 truncate">
                                {employee.Department || "—"}
                            </td>

                            {/* Job Title */}
                            <td className="px-3 py-2 text-sm text-gray-600 truncate">
                                {employee.Jobtitle || "—"}
                            </td>

                            {/* Actions */}
                            <td className="px-3 py-2 whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                    <ActionBtn
                                        onClick={() => onView(employee)}
                                        title="View"
                                        className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </ActionBtn>
                                    <ActionBtn
                                        onClick={() => onEdit(employee)}
                                        title="Edit"
                                        className="text-gray-400 hover:text-slate-700 hover:bg-gray-100"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </ActionBtn>
                                    {!employee.has_account ? (
                                        <ActionBtn
                                            onClick={() => onCreateLogin(employee.id)}
                                            title="Create Login (ID + Birthdate)"
                                            className="text-gray-400 hover:text-green-600 hover:bg-green-50"
                                        >
                                            <KeyRound className="h-4 w-4" />
                                        </ActionBtn>
                                    ) : (
                                        <ActionBtn
                                            onClick={() => onResetLogin(employee.id)}
                                            title="Reset Password to Birthdate"
                                            className="text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                        </ActionBtn>
                                    )}
                                    {employee.JobStatus !== "Inactive" && (
                                        <ActionBtn
                                            onClick={() =>
                                                onMarkInactive(employee.id)
                                            }
                                            title="Mark Inactive"
                                            className="text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                                        >
                                            <ShieldOff className="h-4 w-4" />
                                        </ActionBtn>
                                    )}
                                    {employee.JobStatus !== "Blocked" && (
                                        <ActionBtn
                                            onClick={() =>
                                                onMarkBlocked(employee.id)
                                            }
                                            title="Block"
                                            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Lock className="h-4 w-4" />
                                        </ActionBtn>
                                    )}
                                    {(employee.JobStatus === "Inactive" ||
                                        employee.JobStatus === "Blocked") && (
                                        <ActionBtn
                                            onClick={() =>
                                                onMarkActive(employee.id)
                                            }
                                            title="Activate"
                                            className="text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                                        >
                                            <Check className="h-4 w-4" />
                                        </ActionBtn>
                                    )}
                                    <ActionBtn
                                        onClick={() => onDelete(employee.id)}
                                        title="Delete"
                                        className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </ActionBtn>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ title, count, icon, accent }) => (
    <div
        className={`bg-white rounded-xl border-l-4 ${accent} shadow-sm px-5 py-4 flex items-center justify-between`}
    >
        <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                {title}
            </p>
            <p className="text-3xl font-bold text-gray-800">{count}</p>
        </div>
        <div className="opacity-60">{icon}</div>
    </div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────
const EmployeePage = ({
    employees: initialEmployees,
    currentStatus = "all",
    flash,
}) => {
    const { auth } = usePage().props;
    const [filteredEmployees, setFilteredEmployees] = useState(
        initialEmployees || [],
    );
    const [searchTerm, setSearchTerm] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [formMode, setFormMode] = useState("create");
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        confirmText: "",
        confirmVariant: "destructive",
        onConfirm: () => {},
    });
    const [statusCounts, setStatusCounts] = useState({
        total: initialEmployees?.length || 0,
        active:
            initialEmployees?.filter((e) => e.JobStatus === "Active").length ||
            0,
        inactive:
            initialEmployees?.filter((e) => e.JobStatus === "Inactive")
                .length || 0,
        blocked:
            initialEmployees?.filter((e) => e.JobStatus === "Blocked").length ||
            0,
    });
    const [activeTab, setActiveTab] = useState(currentStatus || "all");

    useEffect(() => {
        let filtered = initialEmployees || [];
        if (activeTab !== "all")
            filtered = filtered.filter((e) => e.JobStatus === activeTab);
        if (searchTerm)
            filtered = filtered.filter(
                (e) =>
                    e.Lname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    e.Fname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    e.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    e.Department?.toLowerCase().includes(
                        searchTerm.toLowerCase(),
                    ) ||
                    e.idno?.toLowerCase().includes(searchTerm.toLowerCase()),
            );
        setFilteredEmployees(filtered);
    }, [searchTerm, initialEmployees, activeTab]);

    useEffect(() => {
        if (initialEmployees) {
            setStatusCounts({
                total: initialEmployees.length,
                active: initialEmployees.filter((e) => e.JobStatus === "Active")
                    .length,
                inactive: initialEmployees.filter(
                    (e) => e.JobStatus === "Inactive",
                ).length,
                blocked: initialEmployees.filter(
                    (e) => e.JobStatus === "Blocked",
                ).length,
            });
        }
    }, [initialEmployees]);

    const handleView = async (employee) => {
        try {
            const res = await fetch(`/employees/${employee.id}`, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
            });
            const full = await res.json();
            setSelectedEmployee(full);
        } catch {
            setSelectedEmployee(employee);
        }
        setViewModalOpen(true);
    };

    const handleDelete = (id) => {
        setConfirmModal({
            isOpen: true,
            title: "Delete Employee",
            message:
                "Are you sure you want to delete this employee? This action cannot be undone.",
            confirmText: "Delete",
            confirmVariant: "destructive",
            onConfirm: () => {
                router.delete(`/employees/${id}`, {
                    onSuccess: () =>
                        setConfirmModal((p) => ({ ...p, isOpen: false })),
                    preserveScroll: true,
                });
            },
        });
    };

    const handleMarkInactive = (id) => {
        setConfirmModal({
            isOpen: true,
            title: "Mark Employee as Inactive",
            message: "Are you sure you want to mark this employee as inactive?",
            confirmText: "Mark Inactive",
            confirmVariant: "warning",
            onConfirm: () => {
                router.post(
                    `/employees/${id}/mark-inactive`,
                    {},
                    {
                        preserveState: true,
                        preserveScroll: true,
                        onSuccess: () => {
                            setFilteredEmployees((prev) =>
                                prev.map((emp) =>
                                    emp.id === id
                                        ? { ...emp, JobStatus: "Inactive" }
                                        : emp,
                                ),
                            );
                            setStatusCounts((prev) => {
                                const emp = initialEmployees.find(
                                    (e) => e.id === id,
                                );
                                return {
                                    ...prev,
                                    active:
                                        emp?.JobStatus === "Active"
                                            ? prev.active - 1
                                            : prev.active,
                                    inactive: prev.inactive + 1,
                                };
                            });
                            setConfirmModal((p) => ({ ...p, isOpen: false }));
                        },
                    },
                );
            },
        });
    };

    const handleMarkBlocked = (id) => {
        setConfirmModal({
            isOpen: true,
            title: "Block Employee",
            message:
                "Are you sure you want to block this employee? Blocked employees cannot access company resources.",
            confirmText: "Block",
            confirmVariant: "destructive",
            onConfirm: () => {
                router.post(
                    `/employees/${id}/mark-blocked`,
                    {},
                    {
                        preserveState: true,
                        preserveScroll: true,
                        onSuccess: () => {
                            setFilteredEmployees((prev) =>
                                prev.map((emp) =>
                                    emp.id === id
                                        ? { ...emp, JobStatus: "Blocked" }
                                        : emp,
                                ),
                            );
                            setStatusCounts((prev) => {
                                const emp = initialEmployees.find(
                                    (e) => e.id === id,
                                );
                                return {
                                    ...prev,
                                    active:
                                        emp?.JobStatus === "Active"
                                            ? prev.active - 1
                                            : prev.active,
                                    inactive:
                                        emp?.JobStatus === "Inactive"
                                            ? prev.inactive - 1
                                            : prev.inactive,
                                    blocked: prev.blocked + 1,
                                };
                            });
                            setConfirmModal((p) => ({ ...p, isOpen: false }));
                        },
                    },
                );
            },
        });
    };

    const handleMarkActive = (id) => {
        setConfirmModal({
            isOpen: true,
            title: "Activate Employee",
            message: "Are you sure you want to mark this employee as active?",
            confirmText: "Activate",
            confirmVariant: "default",
            onConfirm: () => {
                router.post(
                    `/employees/${id}/mark-active`,
                    {},
                    {
                        preserveState: true,
                        preserveScroll: true,
                        onSuccess: () => {
                            setFilteredEmployees((prev) =>
                                prev.map((emp) =>
                                    emp.id === id
                                        ? { ...emp, JobStatus: "Active" }
                                        : emp,
                                ),
                            );
                            setStatusCounts((prev) => {
                                const emp = initialEmployees.find(
                                    (e) => e.id === id,
                                );
                                return {
                                    ...prev,
                                    active: prev.active + 1,
                                    inactive:
                                        emp?.JobStatus === "Inactive"
                                            ? prev.inactive - 1
                                            : prev.inactive,
                                    blocked:
                                        emp?.JobStatus === "Blocked"
                                            ? prev.blocked - 1
                                            : prev.blocked,
                                };
                            });
                            setConfirmModal((p) => ({ ...p, isOpen: false }));
                        },
                    },
                );
            },
        });
    };

    const csrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    const handleCreateLogin = async (id) => {
        try {
            const res = await fetch(`/employees/${id}/create-login`, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'X-CSRF-TOKEN': csrfToken(), 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data = await res.json();
            if (res.status === 409) { alert('This employee already has a login account.'); return; }
            if (!res.ok) { alert(data.message || 'Failed to create login.'); return; }
            alert('Login created!\nUsername: Employee ID\nPassword: Birthdate (MMDDYYYY)');
            // Update local state
            setFilteredEmployees(prev => prev.map(e => e.id === id ? { ...e, has_account: true } : e));
        } catch { alert('Network error. Please try again.'); }
    };

    const handleResetLogin = async (id) => {
        if (!confirm('Reset this employee\'s password to their birthdate (MMDDYYYY)?')) return;
        try {
            const res = await fetch(`/employees/${id}/reset-login`, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'X-CSRF-TOKEN': csrfToken(), 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data = await res.json();
            if (!res.ok) { alert(data.message || 'Failed to reset password.'); return; }
            alert('Password reset to birthdate (MMDDYYYY) successfully.');
        } catch { alert('Network error. Please try again.'); }
    };

    const [creatingAllLogins, setCreatingAllLogins] = useState(false);
    const [loginResultModal, setLoginResultModal] = useState({ isOpen: false, created: 0, message: '' });

    const handleCreateAllLogins = () => {
        const noLogin = filteredEmployees.filter(e => !e.has_account).length;
        if (noLogin === 0) {
            setLoginResultModal({ isOpen: true, created: 0, message: 'All employees already have login accounts.' });
            return;
        }
        setConfirmModal({
            isOpen: true,
            title: 'Create Login Accounts',
            message: `Create login accounts for ${noLogin} employee(s) without one? Username: Employee ID | Password: Birthdate (MMDDYYYY)`,
            confirmText: 'Create Logins',
            confirmVariant: 'primary',
            onConfirm: async () => {
                setConfirmModal(p => ({ ...p, isOpen: false }));
                setCreatingAllLogins(true);
                try {
                    const res = await fetch('/employees/create-all-logins', {
                        method: 'POST',
                        headers: { 'Accept': 'application/json', 'X-CSRF-TOKEN': csrfToken(), 'X-Requested-With': 'XMLHttpRequest' },
                    });
                    const data = await res.json();
                    const created = data.created ?? 0;
                    setLoginResultModal({ isOpen: true, created, message: data.message });
                    setFilteredEmployees(prev => prev.map(e => ({ ...e, has_account: true })));
                } catch {
                    setLoginResultModal({ isOpen: true, created: 0, message: 'Network error. Please try again.' });
                } finally {
                    setCreatingAllLogins(false);
                }
            },
        });
    };

    const handleTabChange = (value) => {
        setActiveTab(value);
        router.visit(`/employees?status=${value}`, {
            preserveState: true,
            preserveScroll: true,
            only: ["employees", "currentStatus"],
        });
    };

    const handleExportToExcel = async () => {
        setIsExporting(true);
        try {
            const params = new URLSearchParams();
            if (activeTab !== "all") params.append("status", activeTab);
            if (searchTerm) params.append("search", searchTerm);
            const link = document.createElement("a");
            link.href = `/employees/export?${params.toString()}`;
            link.style.display = "none";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Export failed:", error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Employee Management" />

            <div className="w-full space-y-5">
                {flash?.message && (
                    <Alert className="border-indigo-200 bg-indigo-50">
                        <AlertDescription className="text-indigo-800">
                            {flash.message}
                        </AlertDescription>
                    </Alert>
                )}

                {/* ── Page Header ── */}
                <div className="flex items-start justify-between">
                    <div>
                        {/* Breadcrumb */}
                        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                            <span>HR Management</span>
                            <ChevronRight className="h-3 w-3" />
                            <span className="text-indigo-600 font-medium">
                                Employee Management
                            </span>
                        </nav>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            Employee Management
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Manage your employee records and information.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        <button
                            onClick={handleCreateAllLogins}
                            disabled={creatingAllLogins}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Create login accounts for all employees without one"
                        >
                            {creatingAllLogins ? (
                                <div className="h-4 w-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <KeyRound className="h-4 w-4" />
                            )}
                            Create All Logins
                        </button>
                        <button
                            onClick={handleExportToExcel}
                            disabled={isExporting || !filteredEmployees.length}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isExporting ? (
                                <div className="h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <FileSpreadsheet className="h-4 w-4" />
                            )}
                            Export to Excel
                        </button>
                        <button
                            onClick={() => {
                                setFormMode("create");
                                setSelectedEmployee(null);
                                setIsFormOpen(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            <UserPlus className="h-4 w-4" />
                            Add Employee
                        </button>
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Employees"
                        count={statusCounts.total}
                        accent="border-indigo-500"
                        icon={<Users className="h-10 w-10 text-indigo-400" />}
                    />
                    <StatCard
                        title="Active"
                        count={statusCounts.active}
                        accent="border-emerald-500"
                        icon={<Check className="h-10 w-10 text-emerald-400" />}
                    />
                    <StatCard
                        title="Inactive"
                        count={statusCounts.inactive}
                        accent="border-amber-500"
                        icon={
                            <ShieldOff className="h-10 w-10 text-amber-400" />
                        }
                    />
                    <StatCard
                        title="Blocked"
                        count={statusCounts.blocked}
                        accent="border-red-500"
                        icon={<Lock className="h-10 w-10 text-red-400" />}
                    />
                </div>

                {/* ── Toolbar ── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, ID, department, or email…"
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* Tabs */}
                    <Tabs
                        defaultValue={activeTab}
                        onValueChange={handleTabChange}
                    >
                        <TabsList>
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="Active">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                                Active
                            </TabsTrigger>
                            <TabsTrigger value="Inactive">
                                <span className="h-2 w-2 rounded-full bg-amber-500 inline-block"></span>
                                Inactive
                            </TabsTrigger>
                            <TabsTrigger value="Blocked">
                                <span className="h-2 w-2 rounded-full bg-red-500 inline-block"></span>
                                Blocked
                            </TabsTrigger>
                            <TabsTrigger value="On Leave">On Leave</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* ── Table Card ── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Table header bar */}
                    <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-700">
                            {filteredEmployees.length}{" "}
                            {filteredEmployees.length === 1
                                ? "Employee"
                                : "Employees"}
                        </p>
                        {searchTerm && (
                            <p className="text-xs text-gray-400">
                                Showing results for{" "}
                                <span className="font-medium text-gray-600">
                                    "{searchTerm}"
                                </span>
                            </p>
                        )}
                    </div>
                    <div style={{ maxHeight: "58vh", overflowY: "auto", overflowX: "auto" }}>
                        <EmployeeList
                            employees={filteredEmployees}
                            onView={handleView}
                            onEdit={async (employee) => {
                                // Fetch full record — list only has slim columns
                                try {
                                    const res = await fetch(`/employees/${employee.id}`, {
                                        headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
                                    });
                                    const full = await res.json();
                                    setSelectedEmployee(full);
                                } catch {
                                    setSelectedEmployee(employee);
                                }
                                setFormMode("edit");
                                setIsFormOpen(true);
                            }}
                            onDelete={handleDelete}
                            onMarkInactive={handleMarkInactive}
                            onMarkBlocked={handleMarkBlocked}
                            onMarkActive={handleMarkActive}
                            onCreateLogin={handleCreateLogin}
                            onResetLogin={handleResetLogin}
                        />
                    </div>
                </div>
            </div>

            {/* ── Modals ── */}
            <ViewEmployeeModal
                isOpen={viewModalOpen}
                onClose={() => {
                    setViewModalOpen(false);
                    setSelectedEmployee(null);
                }}
                employee={selectedEmployee}
            />
            <EmployeeForm
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setSelectedEmployee(null);
                }}
                employee={selectedEmployee}
                mode={formMode}
            />
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() =>
                    setConfirmModal((p) => ({ ...p, isOpen: false }))
                }
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                confirmVariant={confirmModal.confirmVariant}
                onConfirm={confirmModal.onConfirm}
            />

            {/* Login creation result modal */}
            {loginResultModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
                        <div className="px-6 pt-6 pb-4 flex flex-col items-center text-center gap-3">
                            {loginResultModal.created > 0 ? (
                                <>
                                    <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                                        <KeyRound className="w-7 h-7 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Accounts Created</h3>
                                    <p className="text-4xl font-black text-indigo-600">{loginResultModal.created}</p>
                                    <p className="text-sm text-gray-500">
                                        {loginResultModal.created === 1 ? 'login account was' : 'login accounts were'} successfully created.
                                    </p>
                                    <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 w-full">
                                        Username: Employee ID &nbsp;|&nbsp; Password: Birthdate (MMDDYYYY)
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <Check className="w-7 h-7 text-indigo-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">All Set</h3>
                                    <p className="text-sm text-gray-500">{loginResultModal.message}</p>
                                </>
                            )}
                        </div>
                        <div className="flex justify-center px-6 py-4 bg-gray-50 border-t border-gray-100">
                            <button
                                onClick={() => setLoginResultModal(p => ({ ...p, isOpen: false }))}
                                className="px-6 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
};

export default EmployeePage;
