import React, { useState, useEffect, useMemo } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Calendar, Clock, User, Save, AlertTriangle, Search, Loader2, Users, Moon, Coffee, FileText, Info, CheckCircle2 } from 'lucide-react';

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow hover:border-gray-300';
const labelCls = 'block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5';

function SectionHeader({ icon: Icon, title }) {
    return (
        <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Icon className="w-4 h-4 text-indigo-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{title}</h3>
            <div className="flex-1 h-px bg-gray-100" />
        </div>
    );
}

const ManualAttendance = ({ auth, employees = [], departments = [] }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { errors } = usePage().props;
    
    // Form state
    const [formData, setFormData] = useState({
        employee_ids: [], // Changed to array for multiple selection
        attendance_date: new Date().toISOString().split('T')[0],
        time_in: '08:00',
        time_out: '17:00',
        break_in: '',
        break_out: '',
        is_nightshift: false,
        next_day_timeout: '',
        remarks: ''
    });
    
    // Employee selection state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    
    // Enhanced useEffect for employee filtering and sorting
    const displayedEmployees = useMemo(() => {
        let selectedAndExactMatch = [];      // Priority 1: Selected + Exact match
        let selectedAndPartialMatch = [];    // Priority 2: Selected + Partial match  
        let selectedButNotMatched = [];      // Priority 3: Selected but no search match
        let exactSearchMatches = [];         // Priority 4: Not selected + Exact match
        let partialSearchMatches = [];       // Priority 5: Not selected + Partial match
        let otherEmployees = [];             // Priority 6: Everything else
        
        // Ensure employees is an array and filter out any invalid entries
        const validEmployees = Array.isArray(employees) ? employees.filter(emp => emp && emp.id) : [];
        
        validEmployees.forEach(employee => {
            const isSelected = formData.employee_ids.includes(employee.id);
            
            // Check search match
            let matchesSearch = true;
            let exactMatch = false;
            
            if (searchTerm) {
                const term = searchTerm.toLowerCase().trim();
                const fullName = `${employee.Fname || ''} ${employee.Lname || ''}`.toLowerCase();
                const reverseName = `${employee.Lname || ''} ${employee.Fname || ''}`.toLowerCase();
                const employeeId = employee.idno?.toString().toLowerCase() || '';
                
                // Check for exact match first
                if (
                    (employee.Lname || '').toLowerCase() === term || 
                    (employee.Fname || '').toLowerCase() === term ||
                    fullName === term ||
                    reverseName === term ||
                    employeeId === term
                ) {
                    exactMatch = true;
                    matchesSearch = true;
                } else {
                    // Check for partial match
                    matchesSearch = 
                        (employee.Fname || '').toLowerCase().includes(term) || 
                        (employee.Lname || '').toLowerCase().includes(term) || 
                        employeeId.includes(term);
                }
            }
            
            // Check department match - fix department access
            let matchesDepartment = true;
            if (selectedDepartment) {
                const employeeDepartment = (employee.Department || '').trim();
                matchesDepartment = employeeDepartment === selectedDepartment;
            }
            
            // Skip if doesn't match department filter
            if (!matchesDepartment) {
                return;
            }
            
            // Categorize based on selection status and search matches
            if (isSelected && exactMatch) {
                selectedAndExactMatch.push(employee);
            } else if (isSelected && matchesSearch) {
                selectedAndPartialMatch.push(employee);
            } else if (isSelected) {
                selectedButNotMatched.push(employee);
            } else if (exactMatch) {
                exactSearchMatches.push(employee);
            } else if (matchesSearch) {
                partialSearchMatches.push(employee);
            } else if (!searchTerm) {
                // Only show non-matching employees when no search term
                otherEmployees.push(employee);
            }
        });
        
        // Sort each category alphabetically by last name
        const sortByName = (a, b) => {
            const aName = `${a.Lname || ''}, ${a.Fname || ''}`.toLowerCase();
            const bName = `${b.Lname || ''}, ${b.Fname || ''}`.toLowerCase();
            return aName.localeCompare(bName);
        };
        
        selectedAndExactMatch.sort(sortByName);
        selectedAndPartialMatch.sort(sortByName);
        selectedButNotMatched.sort(sortByName);
        exactSearchMatches.sort(sortByName);
        partialSearchMatches.sort(sortByName);
        otherEmployees.sort(sortByName);
        
        // Combine all categories in priority order
        const result = [
            ...selectedAndExactMatch,
            ...selectedAndPartialMatch,
            ...selectedButNotMatched,
            ...exactSearchMatches,
            ...partialSearchMatches,
            ...otherEmployees
        ];
        
        return result;
    }, [searchTerm, selectedDepartment, employees, formData.employee_ids]);
    
    // Handle form input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ 
            ...formData, 
            [name]: type === 'checkbox' ? checked : value 
        });
    };
    
    // Handle employee selection (multiple)
    const handleEmployeeSelection = (employeeId) => {
        const numericId = parseInt(employeeId, 10);
        setFormData(prevData => {
            // Check if employee is already selected
            if (prevData.employee_ids.includes(numericId)) {
                // Remove the employee
                return {
                    ...prevData,
                    employee_ids: prevData.employee_ids.filter(id => id !== numericId)
                };
            } else {
                // Add the employee
                return {
                    ...prevData,
                    employee_ids: [...prevData.employee_ids, numericId]
                };
            }
        });
    };
    
    // Handle individual checkbox change - directly modify the checkbox without affecting the row click
    const handleCheckboxChange = (e, employeeId) => {
        e.stopPropagation(); // Prevent row click handler from firing
        handleEmployeeSelection(employeeId);
    };
    
    // Handle select all employees (currently displayed only)
    const handleSelectAll = () => {
        setFormData(prevData => {
            // Get IDs of all currently displayed employees
            const displayedIds = displayedEmployees.map(emp => emp.id);
            
            // Check if all displayed employees are already selected
            const allSelected = displayedIds.every(id => prevData.employee_ids.includes(id));
            
            if (allSelected) {
                // If all are selected, deselect them
                return {
                    ...prevData,
                    employee_ids: prevData.employee_ids.filter(id => !displayedIds.includes(id))
                };
            } else {
                // If not all are selected, select all displayed employees
                // First remove any existing displayed employees to avoid duplicates
                const remainingSelectedIds = prevData.employee_ids.filter(id => !displayedIds.includes(id));
                return {
                    ...prevData,
                    employee_ids: [...remainingSelectedIds, ...displayedIds]
                };
            }
        });
    };
    
    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isSubmitting) return; // Prevent double submission
        
        // Validate form
        if (formData.employee_ids.length === 0) {
            toast.error('Please select at least one employee');
            return;
        }
        
        if (!formData.attendance_date) {
            toast.error('Please select a date');
            return;
        }
        
        if (!formData.time_in || !formData.time_out) {
            toast.error('Please enter both time in and time out');
            return;
        }
        
        // For non-nightshift, check if time_out is after time_in
        if (!formData.is_nightshift) {
            const timeIn = formData.time_in.split(':').map(Number);
            const timeOut = formData.time_out.split(':').map(Number);
            
            if (timeIn[0] > timeOut[0] || (timeIn[0] === timeOut[0] && timeIn[1] >= timeOut[1])) {
                toast.error('Time out must be after time in for regular shifts');
                return;
            }
        }
        
        // For nightshift, require next_day_timeout if no regular time_out
        if (formData.is_nightshift && !formData.next_day_timeout && !formData.time_out) {
            toast.error('Please enter either time out or next day timeout for night shift');
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            // Submit each employee individually
            const results = [];
            const errors = [];
            
            for (const employeeId of formData.employee_ids) {
                try {
                    const payload = {
                        employee_id: employeeId,
                        attendance_date: formData.attendance_date,
                        time_in: formData.time_in,
                        time_out: formData.time_out,
                        break_in: formData.break_in || null,
                        break_out: formData.break_out || null,
                        is_nightshift: formData.is_nightshift,
                        next_day_timeout: formData.is_nightshift ? formData.next_day_timeout : null,
                        remarks: formData.remarks
                    };
                    
                    const response = await fetch(route('attendance.manual.store'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                        },
                        body: JSON.stringify(payload)
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        results.push(data);
                    } else {
                        const employee = employees.find(emp => emp.id === employeeId);
                        errors.push(`${employee?.Fname} ${employee?.Lname}: ${data.message}`);
                    }
                } catch (error) {
                    const employee = employees.find(emp => emp.id === employeeId);
                    errors.push(`${employee?.Fname} ${employee?.Lname}: Failed to create attendance`);
                }
            }
            
            // Show results
            if (results.length > 0) {
                toast.success(`Successfully created attendance records for ${results.length} employee(s)`);
            }
            
            if (errors.length > 0) {
                errors.forEach(error => toast.error(error));
            }
            
            // Reset form if all successful
            if (errors.length === 0) {
                setFormData({
                    employee_ids: [],
                    attendance_date: formData.attendance_date, // Keep the same date
                    time_in: formData.time_in, // Keep the same times
                    time_out: formData.time_out,
                    break_in: formData.break_in,
                    break_out: formData.break_out,
                    is_nightshift: formData.is_nightshift,
                    next_day_timeout: formData.next_day_timeout,
                    remarks: ''
                });
                setSearchTerm('');
            }
            
        } catch (error) {
            console.error('Error submitting manual attendance:', error);
            toast.error('Error submitting attendance records');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Calculate if all displayed employees are selected
    const allDisplayedSelected = displayedEmployees.length > 0 && 
        displayedEmployees.every(emp => formData.employee_ids.includes(emp.id));
    
    // Get selected employees details for display
    const selectedEmployees = employees.filter(emp => formData.employee_ids.includes(emp.id));
    
    // Ensure departments is an array and filter out invalid entries
    const validDepartments = Array.isArray(departments) ? departments.filter(dept => dept && dept.name) : [];
    
    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Manual Attendance Entry" />

            <div className="p-6 space-y-6">

                {/* ── Header ── */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Manual Attendance Entry</h1>
                            <p className="text-indigo-200 text-sm mt-0.5">Manually record attendance when biometric data is unavailable</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Main Form ── */}
                    <div className="lg:col-span-2 space-y-5">
                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Employee Selection */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <SectionHeader icon={Users} title="Select Employees" />

                                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by name or ID…"
                                            className="pl-9 w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow hover:border-gray-300"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <select
                                        className={`${inputCls} sm:w-44`}
                                        value={selectedDepartment}
                                        onChange={(e) => setSelectedDepartment(e.target.value)}
                                        disabled={isSubmitting}
                                    >
                                        <option value="">All Departments</option>
                                        {validDepartments.map((d) => (
                                            <option key={`dept-${d.id}`} value={d.value || d.name}>{d.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        disabled={isSubmitting}
                                        className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors whitespace-nowrap ${
                                            allDisplayedSelected
                                                ? 'bg-indigo-700 hover:bg-indigo-800 text-white'
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                        } disabled:opacity-50`}
                                    >
                                        {allDisplayedSelected ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>

                                <div className="border border-gray-100 rounded-xl overflow-hidden">
                                    <div className="max-h-56 overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-10"></th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">ID</th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Name</th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Department</th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Position</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {displayedEmployees.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-400">
                                                            No employees match your search
                                                        </td>
                                                    </tr>
                                                ) : displayedEmployees.map(employee => {
                                                    const selected = formData.employee_ids.includes(employee.id);
                                                    return (
                                                        <tr
                                                            key={`emp-${employee.id}`}
                                                            onClick={() => !isSubmitting && handleEmployeeSelection(employee.id)}
                                                            className={`cursor-pointer transition-colors ${selected ? 'bg-indigo-50' : 'hover:bg-gray-50/60'} ${isSubmitting ? 'opacity-50' : ''}`}
                                                        >
                                                            <td className="px-4 py-2.5">
                                                                <input
                                                                    type="checkbox"
                                                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
                                                                    checked={selected}
                                                                    onChange={(e) => handleCheckboxChange(e, employee.id)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    disabled={isSubmitting}
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{employee.idno || '—'}</td>
                                                            <td className="px-4 py-2.5 font-medium text-gray-800">
                                                                {employee.Lname}, {employee.Fname} {employee.MName || ''}
                                                            </td>
                                                            <td className="px-4 py-2.5 text-gray-500 hidden sm:table-cell">{employee.Department || '—'}</td>
                                                            <td className="px-4 py-2.5 text-gray-500 hidden md:table-cell">{employee.Jobtitle || '—'}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="mt-3 text-xs">
                                    {formData.employee_ids.length > 0 ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 font-semibold rounded-lg">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            {formData.employee_ids.length} employee{formData.employee_ids.length !== 1 ? 's' : ''} selected
                                            {formData.employee_ids.length <= 5 && ` — ${selectedEmployees.map(e => e.Lname).join(', ')}`}
                                        </span>
                                    ) : (
                                        <span className="text-amber-600 font-medium">No employees selected</span>
                                    )}
                                </div>
                            </div>

                            {/* Date & Shift */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <SectionHeader icon={Calendar} title="Date & Shift" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Attendance Date</label>
                                        <input
                                            type="date"
                                            name="attendance_date"
                                            className={inputCls}
                                            value={formData.attendance_date}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <label className="flex items-center gap-3 cursor-pointer select-none group">
                                            <div className={`relative w-10 h-5 rounded-full transition-colors ${formData.is_nightshift ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                                                <input
                                                    type="checkbox"
                                                    name="is_nightshift"
                                                    className="sr-only"
                                                    checked={formData.is_nightshift}
                                                    onChange={handleChange}
                                                />
                                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.is_nightshift ? 'translate-x-5' : ''}`} />
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Moon className="w-4 h-4 text-indigo-500" />
                                                <span className="text-sm font-semibold text-gray-700">Night Shift</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Time Fields */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <SectionHeader icon={Clock} title="Time Records" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Time In <span className="text-red-400">*</span></label>
                                        <input type="time" name="time_in" className={inputCls} value={formData.time_in} onChange={handleChange} required />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Time Out {!formData.is_nightshift && <span className="text-red-400">*</span>}</label>
                                        <input type="time" name="time_out" className={inputCls} value={formData.time_out} onChange={handleChange} required={!formData.is_nightshift} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Break Out <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
                                        <input type="time" name="break_out" className={inputCls} value={formData.break_out} onChange={handleChange} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Break In <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
                                        <input type="time" name="break_in" className={inputCls} value={formData.break_in} onChange={handleChange} />
                                    </div>
                                    {formData.is_nightshift && (
                                        <div className="sm:col-span-2">
                                            <label className={labelCls}>Next Day Timeout</label>
                                            <input type="time" name="next_day_timeout" className={inputCls} value={formData.next_day_timeout} onChange={handleChange} />
                                            <p className="mt-1.5 text-xs text-gray-400">Clock-out time on the following day for night shift employees.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Remarks */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <SectionHeader icon={FileText} title="Remarks" />
                                <textarea
                                    name="remarks"
                                    rows="3"
                                    className={`${inputCls} resize-none`}
                                    placeholder="Add any notes or remarks here…"
                                    value={formData.remarks}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isSubmitting || formData.employee_ids.length === 0}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating Records…</>
                                ) : (
                                    <><Save className="w-4 h-4" /> Create Attendance for {formData.employee_ids.length} Employee{formData.employee_ids.length !== 1 ? 's' : ''}</>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* ── Sidebar Instructions ── */}
                    <div className="space-y-4">
                        {/* Warning */}
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-amber-800 mb-1">Exceptional Use Only</p>
                                    <p className="text-xs text-amber-700 leading-relaxed">Use only when the biometric system was unavailable or malfunctioning. All manual entries are flagged in reports.</p>
                                </div>
                            </div>
                        </div>

                        {/* Instructions card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
                            <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-indigo-500" />
                                <h3 className="text-sm font-bold text-gray-700">Instructions</h3>
                            </div>

                            {[
                                { title: 'Employee Selection', items: ['Search by name or employee ID', 'Filter by department', 'Check boxes to select multiple', '"Select All" applies to filtered list'] },
                                { title: 'Required Fields', items: ['At least one employee', 'Attendance date', 'Time In & Time Out'] },
                                { title: 'Notes', items: ['Night shift: use Next Day Timeout', 'Break fields are optional but both must be filled', 'Same times apply to all selected employees'] },
                            ].map(section => (
                                <div key={section.title}>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{section.title}</p>
                                    <ul className="space-y-1.5">
                                        {section.items.map(item => (
                                            <li key={item} className="flex items-start gap-2 text-xs text-gray-500">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick draggable pauseOnHover theme="light" />
        </AuthenticatedLayout>
    );
};

export default ManualAttendance;