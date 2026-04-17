import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FileBarChart, Search } from 'lucide-react';
import axios from 'axios';

export default function MonthlyAttendance({ auth }) {
    const now = new Date();
    const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
    const [year, setYear] = useState(String(now.getFullYear()));
    const [department, setDepartment] = useState('');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));
    const months = [
        { value: '01', label: 'January' }, { value: '02', label: 'February' },
        { value: '03', label: 'March' },   { value: '04', label: 'April' },
        { value: '05', label: 'May' },     { value: '06', label: 'June' },
        { value: '07', label: 'July' },    { value: '08', label: 'August' },
        { value: '09', label: 'September'},{ value: '10', label: 'October' },
        { value: '11', label: 'November' },{ value: '12', label: 'December' },
    ];

    const handleSearch = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/attendance/list', {
                params: { month, year, department, per_page: 200 }
            });
            setRecords(res.data?.data ?? res.data ?? []);
        } catch {
            setRecords([]);
        } finally {
            setLoading(false);
            setSearched(true);
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Monthly Attendance Report" />
            <div className="w-full">
                <div className="mb-6 flex items-center gap-3">
                    <FileBarChart className="w-7 h-7 text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-800">Monthly Attendance Report</h1>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow p-5 mb-6 flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                        <select
                            value={month}
                            onChange={e => setMonth(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                        <select
                            value={year}
                            onChange={e => setYear(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <input
                            type="text"
                            placeholder="All departments"
                            value={department}
                            onChange={e => setDepartment(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                        <Search className="w-4 h-4" />
                        {loading ? 'Loading...' : 'Search'}
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Employee ID</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Department</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Days Present</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Days Absent</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Late (hrs)</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Overtime (hrs)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {records.length > 0 ? records.map((r, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">{r.idno ?? r.employee?.idno ?? '-'}</td>
                                    <td className="px-4 py-3">{r.employee_name ?? (`${r.employee?.Fname ?? ''} ${r.employee?.Lname ?? ''}`.trim() || '-')}</td>
                                    <td className="px-4 py-3">{r.department ?? r.employee?.Department ?? '-'}</td>
                                    <td className="px-4 py-3">{r.days_present ?? r.present_days ?? '-'}</td>
                                    <td className="px-4 py-3">{r.days_absent ?? r.absent_days ?? '-'}</td>
                                    <td className="px-4 py-3">{r.late_hours ?? r.total_late ?? '-'}</td>
                                    <td className="px-4 py-3">{r.overtime_hours ?? r.total_ot ?? '-'}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                        {searched ? 'No records found.' : 'Select a month/year and click Search.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
