import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { Calendar, Clock, DollarSign, FileText } from 'lucide-react';

export default function EmployeeDashboard() {
    const stats = [
        { name: 'My Leave Balance', value: '0', icon: Calendar, color: 'bg-blue-500' },
        { name: 'Hours This Month', value: '0h', icon: Clock, color: 'bg-green-500' },
        { name: 'Last Payroll', value: '₱0', icon: DollarSign, color: 'bg-purple-500' },
        { name: 'Pending Requests', value: '0', icon: FileText, color: 'bg-yellow-500' },
    ];

    return (
        <AppLayout>
            <Head title="Employee Dashboard" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Employee Dashboard</h1>
                    <p className="text-sm text-gray-600 mt-1">Your personal workspace</p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <div key={stat.name} className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                                </div>
                                <div className={`${stat.color} p-3 rounded-lg`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Attendance</h2>
                        <p className="text-sm text-gray-500">No attendance records</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                        <div className="space-y-2">
                            <a href="/slvl" className="block px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100">
                                File Leave Request
                            </a>
                            <a href="/overtime" className="block px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100">
                                File Overtime
                            </a>
                            <a href="/my-payroll" className="block px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100">
                                View My Payroll
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
