import React, { useState, useEffect, useCallback } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Shield, Users, Plus, Edit2, Trash2, X, Save,
    Search, ChevronDown, ChevronUp, Check, AlertCircle,
    LayoutGrid, Minus
} from 'lucide-react';
import axios from 'axios';
import ConfirmModal from '@/Components/ConfirmModal';

/* ── Role Badge ─────────────────────────────────────────────────────────────── */
function RoleBadge({ slug }) {
    const map = {
        superadmin:      'bg-violet-100 text-violet-700',
        payroll_officer: 'bg-blue-100 text-blue-700',
        finance:         'bg-emerald-100 text-emerald-700',
        manager:         'bg-amber-100 text-amber-700',
        hrd_manager:     'bg-pink-100 text-pink-700',
        employee:        'bg-gray-100 text-gray-600',
    };
    const cls = map[slug] ?? 'bg-gray-100 text-gray-600';
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
            <Shield className="w-2.5 h-2.5" />{slug}
        </span>
    );
}

/* ── Alert Banner ───────────────────────────────────────────────────────────── */
function Alert({ message, type, onClose }) {
    if (!message) return null;
    const styles = {
        success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        error:   'bg-red-50 border-red-200 text-red-700',
        info:    'bg-blue-50 border-blue-200 text-blue-700',
    };
    return (
        <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm mb-5 ${styles[type] ?? styles.info}`}>
            <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {message}
            </div>
            <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
    );
}

/* ── Role Matrix ────────────────────────────────────────────────────────────── */
const ROLES = [
    { key: 'superadmin',      label: 'Super Admin',      color: 'bg-violet-500' },
    { key: 'payroll_officer', label: 'Payroll Officer',  color: 'bg-blue-500'   },
    { key: 'finance',         label: 'Finance',          color: 'bg-emerald-500'},
    { key: 'manager',         label: 'Manager',          color: 'bg-amber-500'  },
    { key: 'employee',        label: 'Employee',         color: 'bg-gray-400'   },
];

const MODULES = [
    { group: 'General', items: [
        { label: 'Dashboard',          roles: ['superadmin','payroll_officer','finance','manager','employee'] },
    ]},
    { group: 'Employee Management', items: [
        { label: 'Employee List',      roles: ['superadmin','payroll_officer','manager'] },
        { label: 'Import Employees',   roles: ['superadmin','payroll_officer','manager'] },
    ]},
    { group: 'Timesheets', items: [
        { label: 'DTR',                roles: ['superadmin','payroll_officer'] },
        { label: 'Process Attendance', roles: ['superadmin','payroll_officer'] },
        { label: 'Manual Entry',       roles: ['superadmin','payroll_officer'] },
        { label: 'Biometrics',         roles: ['superadmin','payroll_officer'] },
        { label: 'Import Attendance',  roles: ['superadmin','payroll_officer'] },
    ]},
    { group: 'Payroll', items: [
        { label: 'Final Payroll',      roles: ['superadmin','payroll_officer','finance'] },
        { label: 'Payroll Summary',    roles: ['superadmin','payroll_officer','finance'] },
        { label: 'Benefits',           roles: ['superadmin','payroll_officer','finance'] },
        { label: 'Deductions',         roles: ['superadmin','payroll_officer','finance'] },
    ]},
    { group: 'Self-Service', items: [
        { label: 'My Attendance',      roles: ['employee'] },
        { label: 'My Payroll',         roles: ['employee'] },
    ]},
    { group: 'Requests', items: [
        { label: 'Overtime',           roles: ['superadmin','payroll_officer','manager','employee'] },
        { label: 'Offset',             roles: ['superadmin','payroll_officer','manager','employee'] },
        { label: 'Change Restday',     roles: ['superadmin','payroll_officer','manager','employee'] },
        { label: 'Cancel Restday',     roles: ['superadmin','payroll_officer','manager','employee'] },
        { label: 'Change Time Sched',  roles: ['superadmin','payroll_officer','manager','employee'] },
        { label: 'SLVL',               roles: ['superadmin','payroll_officer','manager','employee'] },
        { label: 'Travel Order',       roles: ['superadmin','payroll_officer','manager','employee'] },
        { label: 'Official Business',  roles: ['superadmin','payroll_officer','manager','employee'] },
    ]},
    { group: 'Manage', items: [
        { label: 'User Management',    roles: ['superadmin'] },
        { label: 'Roles & Access',     roles: ['superadmin'] },
    ]},
    { group: 'Core HR', items: [
        { label: 'Promotions',         roles: ['superadmin','payroll_officer'] },
        { label: 'Awards',             roles: ['superadmin','payroll_officer'] },
        { label: 'Transfers',          roles: ['superadmin','payroll_officer'] },
        { label: 'Resignations',       roles: ['superadmin','payroll_officer'] },
        { label: 'Complaints',         roles: ['superadmin','payroll_officer'] },
        { label: 'Warnings',           roles: ['superadmin','payroll_officer'] },
        { label: 'Terminations',       roles: ['superadmin','payroll_officer'] },
    ]},
    { group: 'HR Tools', items: [
        { label: 'HR Calendar',        roles: ['superadmin','payroll_officer'] },
        { label: 'Daily Attendance Report', roles: ['superadmin','payroll_officer'] },
        { label: 'Monthly Attendance Report', roles: ['superadmin','payroll_officer'] },
        { label: 'Training Report',    roles: ['superadmin','payroll_officer'] },
        { label: 'Training',           roles: ['superadmin'] },
        { label: 'Meetings',           roles: ['superadmin','payroll_officer'] },
        { label: 'Events',             roles: ['superadmin','payroll_officer'] },
    ]},
    { group: 'System', items: [
        { label: 'Settings',           roles: ['superadmin'] },
    ]},
];

function RoleMatrix() {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="bg-gray-50">
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-48 border-b border-gray-100">
                            Module / Feature
                        </th>
                        {ROLES.map(r => (
                            <th key={r.key} className="px-3 py-3 text-center border-b border-gray-100 min-w-[110px]">
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className={`w-7 h-7 rounded-lg ${r.color} flex items-center justify-center`}>
                                        <Shield className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-700 leading-tight">{r.label}</span>
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {MODULES.map(group => (
                        <React.Fragment key={group.group}>
                            {/* Group header row */}
                            <tr className="bg-indigo-50/60">
                                <td
                                    colSpan={ROLES.length + 1}
                                    className="px-5 py-2 text-xs font-bold text-indigo-600 uppercase tracking-widest border-y border-indigo-100"
                                >
                                    {group.group}
                                </td>
                            </tr>
                            {/* Feature rows */}
                            {group.items.map((item, idx) => (
                                <tr key={item.label} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                                    <td className="px-5 py-2.5 text-sm text-gray-700 font-medium border-b border-gray-50">
                                        {item.label}
                                    </td>
                                    {ROLES.map(role => {
                                        const has = item.roles.includes(role.key);
                                        return (
                                            <td key={role.key} className="px-3 py-2.5 text-center border-b border-gray-50">
                                                {has ? (
                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 mx-auto">
                                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 mx-auto">
                                                        <Minus className="w-3 h-3 text-gray-300" />
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
            {/* Legend */}
            <div className="flex items-center gap-6 px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100">
                        <Check className="w-3 h-3 text-emerald-600" />
                    </span>
                    Has access
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100">
                        <Minus className="w-3 h-3 text-gray-300" />
                    </span>
                    No access
                </div>
            </div>
        </div>
    );
}

/* ── Main ───────────────────────────────────────────────────────────────────── */
const RolesAndAccess = () => {
    const [activeTab, setActiveTab]   = useState('roles');
    const [roles, setRoles]           = useState([]);
    const [users, setUsers]           = useState([]);
    const [loading, setLoading]       = useState(true);
    const [search, setSearch]         = useState('');
    const [alert, setAlert]           = useState(null); // {message, type}

    /* role modal */
    const [roleModal, setRoleModal]   = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [roleForm, setRoleForm]     = useState({ name: '', slug: '' });
    const [roleErrors, setRoleErrors] = useState({});
    const [roleSaving, setRoleSaving] = useState(false);

    /* user role modal */
    const [userModal, setUserModal]   = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [userSaving, setUserSaving] = useState(false);

    /* confirm delete */
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    const showAlert = (message, type = 'info') => {
        setAlert({ message, type });
        setTimeout(() => setAlert(null), 4000);
    };

    /* ── Load data ── */
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [rolesRes, usersRes] = await Promise.all([
                axios.get(`/api/roles?search=${search}`),
                axios.get(`/api/users?search=${search}`),
            ]);
            setRoles(rolesRes.data.data ?? []);
            setUsers(usersRes.data.data ?? []);
        } catch {
            showAlert('Failed to load data. Please refresh.', 'error');
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        const t = setTimeout(() => loadData(), 300);
        return () => clearTimeout(t);
    }, [loadData]);

    /* ── Role CRUD ── */
    const openCreateRole = () => {
        setEditingRole(null);
        setRoleForm({ name: '', slug: '' });
        setRoleErrors({});
        setRoleModal(true);
    };

    const openEditRole = (role) => {
        setEditingRole(role);
        setRoleForm({ name: role.name, slug: role.slug ?? '' });
        setRoleErrors({});
        setRoleModal(true);
    };

    const handleRoleSubmit = async (e) => {
        e.preventDefault();
        const errs = {};
        if (!roleForm.name.trim()) errs.name = 'Name is required';
        if (Object.keys(errs).length) { setRoleErrors(errs); return; }

        setRoleSaving(true);
        try {
            if (editingRole) {
                await axios.put(`/api/roles/${editingRole.id}`, roleForm);
                showAlert('Role updated successfully.', 'success');
            } else {
                await axios.post('/api/roles', roleForm);
                showAlert('Role created successfully.', 'success');
            }
            setRoleModal(false);
            loadData();
        } catch (err) {
            const msg = err.response?.data?.message ?? 'Failed to save role.';
            showAlert(msg, 'error');
        } finally {
            setRoleSaving(false);
        }
    };

    const confirmDeleteRole = (role) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Role',
            message: `Are you sure you want to delete the role "${role.name}"? This will remove it from all users.`,
            onConfirm: async () => {
                try {
                    await axios.delete(`/api/roles/${role.id}`);
                    showAlert('Role deleted.', 'success');
                    loadData();
                } catch {
                    showAlert('Failed to delete role.', 'error');
                } finally {
                    setConfirmModal(c => ({ ...c, isOpen: false }));
                }
            },
        });
    };

    /* ── User role assignment ── */
    const openUserRoles = (user) => {
        setEditingUser(user);
        setSelectedRoles(user.roles ?? []);
        setUserModal(true);
    };

    const toggleRole = (roleId) => {
        setSelectedRoles(prev =>
            prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
        );
    };

    const handleUserRoleSave = async () => {
        setUserSaving(true);
        try {
            await axios.put(`/api/users/${editingUser.id}/roles`, { roles: selectedRoles });
            showAlert('User roles updated.', 'success');
            setUserModal(false);
            loadData();
        } catch {
            showAlert('Failed to update roles.', 'error');
        } finally {
            setUserSaving(false);
        }
    };

    /* ── Filter ── */
    const filteredRoles = roles.filter(r =>
        r.name?.toLowerCase().includes(search.toLowerCase())
    );
    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AuthenticatedLayout>
            <Head title="Roles & Access" />

            <div className="max-w-6xl mx-auto space-y-5">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <Shield className="h-5 w-5 text-indigo-600" /> Roles & Access
                        </h1>
                        <p className="text-sm text-gray-400 mt-0.5">Manage roles and assign them to users</p>
                    </div>
                    {activeTab === 'roles' && (
                        <button
                            onClick={openCreateRole}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow"
                            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
                        >
                            <Plus className="h-4 w-4" /> New Role
                        </button>
                    )}
                </div>

                <Alert message={alert?.message} type={alert?.type} onClose={() => setAlert(null)} />

                {/* Tabs + Search */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 gap-4 flex-wrap">
                        {/* Tabs */}
                        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                            {[
                                { key: 'roles',  label: 'Roles',       icon: Shield },
                                { key: 'users',  label: 'Users',       icon: Users  },
                                { key: 'matrix', label: 'Role Matrix', icon: LayoutGrid },
                            ].map(({ key, label, icon: Icon }) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(key)}
                                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                                        activeTab === key
                                            ? 'bg-white text-indigo-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />{label}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 w-48"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
                            Loading…
                        </div>
                    ) : activeTab === 'roles' ? (
                        /* ── Roles Table ── */
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-5 py-3 text-left">Role Name</th>
                                        <th className="px-5 py-3 text-left">Slug</th>
                                        <th className="px-5 py-3 text-left">Users</th>
                                        <th className="px-5 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredRoles.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-5 py-12 text-center text-gray-400">
                                                No roles found. {roles.length === 0 && 'Run the RoleSeeder to add default roles.'}
                                            </td>
                                        </tr>
                                    ) : filteredRoles.map(role => (
                                        <tr key={role.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-5 py-3 font-semibold text-gray-800">{role.name}</td>
                                            <td className="px-5 py-3"><RoleBadge slug={role.slug ?? role.name.toLowerCase().replace(' ', '_')} /></td>
                                            <td className="px-5 py-3 text-gray-500">
                                                {users.filter(u => u.roles?.includes(role.id)).length} user(s)
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => openEditRole(role)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Edit">
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button onClick={() => confirmDeleteRole(role)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
                                {filteredRoles.length} role{filteredRoles.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    ) : activeTab === 'matrix' ? (
                        /* ── Role Matrix ── */
                        <RoleMatrix />
                    ) : (
                        /* ── Users Table ── */
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-5 py-3 text-left">User</th>
                                        <th className="px-5 py-3 text-left">Email</th>
                                        <th className="px-5 py-3 text-left">Roles</th>
                                        <th className="px-5 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-5 py-12 text-center text-gray-400">No users found.</td>
                                        </tr>
                                    ) : filteredUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                        {user.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-gray-800">{user.name} {user.surname ?? ''}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-gray-500">{user.email}</td>
                                            <td className="px-5 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {(user.roles ?? []).length === 0
                                                        ? <span className="text-xs text-gray-400">No role</span>
                                                        : (user.roles ?? []).map(roleId => {
                                                            const r = roles.find(r => r.id === roleId);
                                                            return r ? <RoleBadge key={roleId} slug={r.slug ?? r.name} /> : null;
                                                        })
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex justify-end">
                                                    <button onClick={() => openUserRoles(user)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Edit roles">
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
                                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Role Create/Edit Modal ── */}
            {roleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="font-bold text-gray-900">{editingRole ? 'Edit Role' : 'New Role'}</h2>
                            <button onClick={() => setRoleModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <form onSubmit={handleRoleSubmit} className="px-6 py-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Role Name</label>
                                <input
                                    value={roleForm.name}
                                    onChange={e => { setRoleForm(p => ({ ...p, name: e.target.value })); setRoleErrors(p => { const n={...p}; delete n.name; return n; }); }}
                                    placeholder="e.g. Payroll Officer"
                                    className={`w-full px-4 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-100 ${roleErrors.name ? 'border-red-300' : 'border-gray-200 focus:border-indigo-400'}`}
                                />
                                {roleErrors.name && <p className="mt-1 text-xs text-red-500">{roleErrors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Slug <span className="normal-case font-normal text-gray-400">(optional)</span></label>
                                <input
                                    value={roleForm.slug}
                                    onChange={e => setRoleForm(p => ({ ...p, slug: e.target.value }))}
                                    placeholder="e.g. payroll_officer"
                                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-1">
                                <button type="button" onClick={() => setRoleModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={roleSaving}
                                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-70"
                                    style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
                                >
                                    <Save className="h-3.5 w-3.5" />
                                    {roleSaving ? 'Saving…' : editingRole ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── User Role Assignment Modal ── */}
            {userModal && editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="font-bold text-gray-900">Assign Roles</h2>
                                <p className="text-xs text-gray-400 mt-0.5">{editingUser.name}</p>
                            </div>
                            <button onClick={() => setUserModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="px-6 py-4 space-y-2 max-h-64 overflow-y-auto">
                            {roles.length === 0 && <p className="text-sm text-gray-400">No roles available.</p>}
                            {roles.map(role => (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => toggleRole(role.id)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                                        selectedRoles.includes(role.id)
                                            ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                                >
                                    <span>{role.name}</span>
                                    {selectedRoles.includes(role.id) && <Check className="w-4 h-4 text-indigo-600" />}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                            <button onClick={() => setUserModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
                            <button
                                onClick={handleUserRoleSave}
                                disabled={userSaving}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-70"
                                style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
                            >
                                <Save className="h-3.5 w-3.5" />
                                {userSaving ? 'Saving…' : 'Save Roles'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(c => ({ ...c, isOpen: false }))}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText="Delete"
                confirmVariant="destructive"
                onConfirm={confirmModal.onConfirm}
            />
        </AuthenticatedLayout>
    );
};

export default RolesAndAccess;
