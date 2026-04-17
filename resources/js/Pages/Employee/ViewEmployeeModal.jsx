import React from 'react';
import { X, Check, ShieldOff, Lock, User, Phone, Briefcase, DollarSign, FileText, AlertCircle } from 'lucide-react';

const ViewEmployeeModal = ({ isOpen, onClose, employee }) => {
    if (!isOpen || !employee) return null;

    const StatusBadge = ({ status }) => {
        const map = {
            Active:     { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: <Check className="h-3.5 w-3.5" /> },
            Inactive:   { cls: 'bg-amber-50 text-amber-700 ring-amber-200',        icon: <ShieldOff className="h-3.5 w-3.5" /> },
            Blocked:    { cls: 'bg-red-50 text-red-700 ring-red-200',              icon: <Lock className="h-3.5 w-3.5" /> },
            'On Leave': { cls: 'bg-blue-50 text-blue-700 ring-blue-200',           icon: null },
        };
        const cfg = map[status] || { cls: 'bg-gray-100 text-gray-600 ring-gray-200', icon: null };
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${cfg.cls}`}>
                {cfg.icon}{status}
            </span>
        );
    };

    const Section = ({ icon, title, children }) => (
        <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-500">{icon}</div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</h3>
                <div className="flex-1 h-px bg-gray-100" />
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {children}
            </div>
        </div>
    );

    const formatDate = (val) => {
        if (!val) return null;
        const d = new Date(val);
        if (isNaN(d)) return val;
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const Field = ({ label, value, date, custom }) => (
        <div>
            <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
            {custom ? custom : <p className="text-sm text-gray-800 font-medium">{(date ? formatDate(value) : value) || <span className="text-gray-300">—</span>}</p>}
        </div>
    );

    const initials = `${(employee.Fname || '')[0] || ''}${(employee.Lname || '')[0] || ''}`.toUpperCase();
    const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-sky-500', 'bg-teal-500', 'bg-rose-500'];
    const avatarColor = colors[(employee.Fname?.charCodeAt(0) || 0) % colors.length];

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-xl ${avatarColor} flex items-center justify-center text-white text-lg font-bold shadow-inner`}>
                            {initials || '?'}
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">
                                {employee.Lname}, {employee.Fname} {employee.MName || ''}
                            </h3>
                            <p className="text-slate-300 text-sm">{employee.Jobtitle || 'No Job Title'} · {employee.Department || 'No Department'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">

                    <Section icon={<User className="h-4 w-4" />} title="Personal Information">
                        <Field label="ID Number"    value={employee.idno} />
                        <Field label="Biometrics ID" value={employee.bid} />
                        <Field label="Last Name"    value={employee.Lname} />
                        <Field label="First Name"   value={employee.Fname} />
                        <Field label="Middle Name"  value={employee.MName} />
                        <Field label="Suffix"       value={employee.Suffix} />
                        <Field label="Gender"       value={employee.Gender} />
                        <Field label="Civil Status" value={employee.CivilStatus} />
                        <Field label="Birthdate"    value={employee.Birthdate} date />
                    </Section>

                    <Section icon={<AlertCircle className="h-4 w-4" />} title="Status">
                        <Field label="Employment Status" value={employee.EmpStatus} />
                        <Field label="Job Status" custom={<StatusBadge status={employee.JobStatus} />} />
                    </Section>

                    <Section icon={<Phone className="h-4 w-4" />} title="Contact Information">
                        <Field label="Contact Number"    value={employee.ContactNo} />
                        <Field label="Email"             value={employee.Email} />
                        <Field label="Present Address"   value={employee.PresentAddress} />
                        <Field label="Permanent Address" value={employee.PermanentAddress} />
                        <Field label="Emergency Contact" value={employee.EmerContactName} />
                        <Field label="Emergency Number"  value={employee.EmerContactNo} />
                        <Field label="Relationship"      value={employee.EmerRelationship} />
                    </Section>

                    <Section icon={<Briefcase className="h-4 w-4" />} title="Employment">
                        <Field label="Rank / File"      value={employee.RankFile} />
                        <Field label="Department"       value={employee.Department} />
                        <Field label="Line"             value={employee.Line} />
                        <Field label="Job Title"        value={employee.Jobtitle} />
                        <Field label="Hired Date"       value={employee.HiredDate} date />
                        <Field label="End of Contract"  value={employee.EndOfContract} date />
                        <Field label="Education"        value={employee.EducationalAttainment} />
                        <Field label="Degree"           value={employee.Degree} />
                    </Section>

                    <Section icon={<DollarSign className="h-4 w-4" />} title="Compensation">
                        <Field label="Pay Type"      value={employee.pay_type} />
                        <Field label="Pay Rate"      value={employee.payrate ? `₱ ${Number(employee.payrate).toLocaleString()}` : null} />
                        <Field label="Pay Allowance" value={employee.pay_allowance} />
                    </Section>

                    <Section icon={<FileText className="h-4 w-4" />} title="Government IDs">
                        <Field label="SSS Number"       value={employee.SSSNO} />
                        <Field label="PhilHealth Number" value={employee.PHILHEALTHNo} />
                        <Field label="HDMF Number"      value={employee.HDMFNo} />
                        <Field label="Tax Number"       value={employee.TaxNo} />
                        <Field label="Taxable"          value={employee.Taxable ? 'Yes' : 'No'} />
                        <Field label="Cost Center"      value={employee.CostCenter} />
                    </Section>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewEmployeeModal;
