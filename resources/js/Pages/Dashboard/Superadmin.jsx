import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import {
    Users, DollarSign, Clock, TrendingUp, BarChart3,
    Wallet, AlertCircle, CheckCircle, CreditCard,
    UserCheck, UserX, UserPlus,
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

/* ── Stat Card ── */
function StatCard({ icon: Icon, label, value, sub, color, top, href }) {
    const Tag = href ? 'a' : 'div';
    return (
        <Tag href={href} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className={`h-1 ${top}`} />
            <div className="p-4 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xl font-black text-gray-900 leading-none">{value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
                </div>
            </div>
        </Tag>
    );
}

/* ── Chart Card wrapper ── */
function ChartCard({ title, sub, children }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-bold text-gray-800">{title}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5 mb-4">{sub}</p>}
            {!sub && <div className="mb-4" />}
            {children}
        </div>
    );
}

/* ── Custom Tooltip ── */
const PhpTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs">
            <p className="font-semibold text-gray-700 mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }}>
                    {p.name}: {typeof p.value === 'number' && p.value > 999
                        ? '₱' + p.value.toLocaleString('en-PH', { minimumFractionDigits: 2 })
                        : p.value}
                </p>
            ))}
        </div>
    );
};

const PIE_COLORS  = ['#6366f1', '#94a3b8'];
const PIE_COLORS2 = ['#f59e0b', '#10b981', '#ef4444'];
const PIE_COLORS3 = ['#f59e0b', '#6366f1'];
const PIE_COLORS4 = ['#f59e0b', '#ef4444'];

export default function SuperadminDashboard({ auth, stats: s, charts: c }) {
    const { auth: pageAuth } = usePage().props;
    const user = auth?.user ?? pageAuth?.user;

    const now     = new Date();
    const hour    = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const today   = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const formatCurrency = (v) =>
        '₱' + Number(v ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const statCards = [
        { icon: UserCheck,   label: 'Active Employees',   value: s?.totalEmployees    ?? 0,  sub: `${s?.newEmployeesMonth ?? 0} new this month`,   color: 'bg-indigo-500',  top: 'bg-indigo-500',  href: '/employees' },
        { icon: UserX,       label: 'Inactive Employees', value: s?.inactiveEmployees ?? 0,  sub: 'Not currently employed',                        color: 'bg-gray-400',    top: 'bg-gray-400',    href: '/employees' },
        { icon: UserPlus,    label: 'System Users',       value: s?.totalUsers        ?? 0,  sub: 'Staff & admin accounts',                        color: 'bg-violet-500',  top: 'bg-violet-500',  href: '/manage/users' },
        { icon: AlertCircle, label: 'Pending Requests',   value: s?.pendingRequests   ?? 0,  sub: `${s?.pendingOvertimes ?? 0} overtime requests`,  color: 'bg-amber-500',   top: 'bg-amber-500',   href: '/overtimes' },
        { icon: Wallet,      label: 'Payroll This Month', value: formatCurrency(s?.payrollThisMonth), sub: `${s?.totalPayrolls ?? 0} payroll records`, color: 'bg-emerald-500', top: 'bg-emerald-500', href: '/final-payrolls' },
        { icon: CheckCircle, label: 'Posted Benefits',    value: s?.postedBenefits    ?? 0,  sub: 'Benefits finalized',                            color: 'bg-sky-500',     top: 'bg-sky-500',     href: '/benefits' },
        { icon: CreditCard,  label: 'Posted Deductions',  value: s?.postedDeductions  ?? 0,  sub: 'Deductions finalized',                          color: 'bg-rose-500',    top: 'bg-rose-500',    href: '/deductions' },
        { icon: TrendingUp,  label: 'Payroll Summaries',  value: s?.totalPayrolls     ?? 0,  sub: 'Current month',                                 color: 'bg-teal-500',    top: 'bg-teal-500',    href: '/comprehensive-payroll-summaries' },
    ];

    const payrollTrend      = c?.payrollTrend      ?? [];
    const employeeStatus    = c?.employeeStatus    ?? [];
    const requestsBreakdown = c?.requestsBreakdown ?? [];
    const benefitsStatus    = c?.benefitsStatus    ?? [];
    const deductionsStatus  = c?.deductionsStatus  ?? [];
    const overtimeTrend     = c?.overtimeTrend     ?? [];

    return (
        <AuthenticatedLayout user={user}>
            <Head title="Superadmin Dashboard" />

            <div className="max-w-7xl mx-auto space-y-6">

                {/* ── Header Banner ── */}
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-2xl p-7 text-white shadow-xl">
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.06) 1px,transparent 1px)`, backgroundSize: '40px 40px' }} />
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-violet-400/20 rounded-full blur-3xl" />
                    <div className="relative flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-indigo-200 text-xs font-medium mb-1">{today}</p>
                            <h1 className="text-2xl font-black leading-tight">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
                            <p className="text-indigo-200 text-sm mt-1">Here's your system overview for today.</p>
                        </div>
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">System Overview</p>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {statCards.map((c) => <StatCard key={c.label} {...c} />)}
                    </div>
                </div>

                {/* ── Charts Row 1: Payroll Trend + Employee Status ── */}
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Analytics</p>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                        {/* Payroll Trend - wide */}
                        <div className="lg:col-span-2">
                            <ChartCard title="Payroll Trend" sub="Net pay disbursed — last 6 months">
                                <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={payrollTrend} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                                            tickFormatter={(v) => v >= 1000 ? `₱${(v/1000).toFixed(0)}k` : `₱${v}`} />
                                        <Tooltip content={<PhpTooltip />} />
                                        <Area type="monotone" dataKey="total" name="Net Pay" stroke="#6366f1" strokeWidth={2.5} fill="url(#payGrad)" dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        </div>

                        {/* Employee Status Pie */}
                        <ChartCard title="Employee Status" sub="Active vs Inactive">
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={employeeStatus} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={75} innerRadius={45} paddingAngle={3}>
                                        {employeeStatus.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v, n) => [v, n]} />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>
                </div>

                {/* ── Charts Row 2: Overtime Trend + Requests Breakdown + Benefits + Deductions ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* Overtime Trend */}
                    <ChartCard title="Overtime Requests" sub="Filed per month — last 6 months">
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={overtimeTrend} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip content={<PhpTooltip />} />
                                <Bar dataKey="count" name="Requests" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Pending Requests Breakdown */}
                    <ChartCard title="Pending Requests Breakdown" sub="By request type">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={requestsBreakdown} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={75} innerRadius={45} paddingAngle={3}>
                                    {requestsBreakdown.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS2[i % PIE_COLORS2.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v, n) => [v, n]} />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Benefits Status */}
                    <ChartCard title="Benefits Status" sub="Pending vs Posted">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={benefitsStatus} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={75} innerRadius={45} paddingAngle={3}>
                                    {benefitsStatus.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS3[i % PIE_COLORS3.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v, n) => [v, n]} />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Deductions Status */}
                    <ChartCard title="Deductions Status" sub="Pending vs Posted">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={deductionsStatus} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={75} innerRadius={45} paddingAngle={3}>
                                    {deductionsStatus.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS4[i % PIE_COLORS4.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v, n) => [v, n]} />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>

                </div>

            </div>
        </AuthenticatedLayout>
    );
}
