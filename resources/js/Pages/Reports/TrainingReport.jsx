import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { GraduationCap, Search } from 'lucide-react';
import axios from 'axios';

export default function TrainingReport({ auth }) {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [department, setDepartment] = useState('');
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/trainings/list', {
                params: { search, department, per_page: 100 }
            });
            setRecords(res.data?.data ?? res.data ?? []);
        } catch {
            setRecords([]);
        } finally {
            setLoading(false);
            setSearched(true);
        }
    };

    useEffect(() => {
        handleSearch();
    }, []);

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Training Report" />
            <div className="py-8 px-4 max-w-7xl mx-auto">
                <div className="mb-6 flex items-center gap-3">
                    <GraduationCap className="w-7 h-7 text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-800">Training Report</h1>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow p-5 mb-6 flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                        <input
                            type="text"
                            placeholder="Training name..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
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
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Training Name</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Employee</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Department</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Start Date</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">End Date</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading...</td>
                                </tr>
                            ) : records.length > 0 ? records.map((r, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">{i + 1}</td>
                                    <td className="px-4 py-3">{r.training_name ?? r.name ?? '-'}</td>
                                    <td className="px-4 py-3">{r.employee_name ?? (`${r.employee?.Fname ?? ''} ${r.employee?.Lname ?? ''}`.trim() || '-')}</td>
                                    <td className="px-4 py-3">{r.department ?? r.employee?.Department ?? '-'}</td>
                                    <td className="px-4 py-3">{r.start_date ?? '-'}</td>
                                    <td className="px-4 py-3">{r.end_date ?? '-'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            r.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                            r.status === 'Ongoing' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                            {r.status ?? 'N/A'}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                        No training records found.
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
