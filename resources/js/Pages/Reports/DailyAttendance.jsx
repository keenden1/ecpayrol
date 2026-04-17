import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FileBarChart, Download, Search, Filter } from 'lucide-react';
import axios from 'axios';

export default function DailyAttendance({ auth }) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [department, setDepartment] = useState('');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/attendance/list', {
                params: { date, department, per_page: 100 }
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
            <Head title="Daily Attendances Report" />
            <div className="py-8 px-4 max-w-7xl mx-auto">
                <div className="mb-6 flex items-center gap-3">
                    <FileBarChart className="w-7 h-7 text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-800">Daily Attendances Report</h1>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow p-5 mb-6 flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
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
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Time In</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Time Out</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {records.length > 0 ? records.map((r, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">{r.idno ?? r.employee?.idno ?? '-'}</td>
                                    <td className="px-4 py-3">{r.employee_name ?? (`${r.employee?.Fname ?? ''} ${r.employee?.Lname ?? ''}`.trim() || '-')}</td>
                                    <td className="px-4 py-3">{r.department ?? r.employee?.Department ?? '-'}</td>
                                    <td className="px-4 py-3">{r.date ?? r.attendance_date ?? '-'}</td>
                                    <td className="px-4 py-3">{r.time_in ?? r.AM_In ?? '-'}</td>
                                    <td className="px-4 py-3">{r.time_out ?? r.PM_Out ?? '-'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {r.status ?? 'N/A'}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                        {searched ? 'No records found.' : 'Select a date and click Search.'}
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
