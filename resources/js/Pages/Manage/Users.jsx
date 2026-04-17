import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Plus, Search, Edit2, Trash2, X, Save, Eye, EyeOff,
    Users, Shield, Mail, User as UserIcon, KeyRound
} from 'lucide-react';

const EMPTY_FORM = { name: '', email: '', password: '', role_id: '' };

export default function UsersManage({ users: initialUsers, roles }) {
    const { auth } = usePage().props;
    const flash    = usePage().props.flash ?? {};

    const [users, setUsers]     = useState(initialUsers);
    const [search, setSearch]   = useState('');
    const [modal, setModal]     = useState(null); // null | 'create' | 'edit'
    const [form, setForm]       = useState(EMPTY_FORM);
    const [editing, setEditing] = useState(null);
    const [errors, setErrors]   = useState({});
    const [showPass, setShowPass] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [processing, setProcessing] = useState(false);

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setErrors({});
        setShowPass(false);
        setEditing(null);
        setModal('create');
    };

    const openEdit = (user) => {
        setForm({
            name:     user.name,
            email:    user.email,
            password: '',
            role_id:  user.roles?.[0]?.id ?? '',
        });
        setErrors({});
        setShowPass(false);
        setEditing(user);
        setModal('edit');
    };

    const closeModal = () => { setModal(null); setEditing(null); };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: value }));
        if (errors[name]) setErrors(p => { const n = { ...p }; delete n[name]; return n; });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);

        const payload = {
            name:     form.name,
            email:    form.email,
            role_id:  form.role_id,
            ...(form.password ? { password: form.password } : {}),
        };

        if (modal === 'create') {
            router.post(route('manage.users.store'), { ...payload, password: form.password }, {
                onSuccess: () => { closeModal(); router.reload({ only: ['users'] }); },
                onError:   (e) => setErrors(e),
                onFinish:  () => setProcessing(false),
            });
        } else {
            router.put(route('manage.users.update', editing.id), payload, {
                onSuccess: () => { closeModal(); router.reload({ only: ['users'] }); },
                onError:   (e) => setErrors(e),
                onFinish:  () => setProcessing(false),
            });
        }
    };

    const handleDelete = (user) => {
        router.delete(route('manage.users.destroy', user.id), {
            onSuccess: () => { setDeleting(null); router.reload({ only: ['users'] }); },
            onFinish:  () => setDeleting(null),
        });
    };

    const filtered = (initialUsers ?? []).filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const roleBadgeColor = (slug) => {
        const map = {
            superadmin:      'bg-violet-100 text-violet-700',
            payroll_officer: 'bg-blue-100 text-blue-700',
            finance:         'bg-emerald-100 text-emerald-700',
            manager:         'bg-amber-100 text-amber-700',
            hrd_manager:     'bg-pink-100 text-pink-700',
            employee:        'bg-gray-100 text-gray-600',
        };
        return map[slug] ?? 'bg-gray-100 text-gray-600';
    };

    return (
        <AuthenticatedLayout>
            <Head title="Staff / Users" />

            <div className="max-w-6xl mx-auto space-y-5">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <Users className="h-5 w-5 text-indigo-600" /> Staff / Users
                        </h1>
                        <p className="text-sm text-gray-400 mt-0.5">Manage system accounts and their roles</p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow"
                        style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
                    >
                        <Plus className="h-4 w-4" /> Add User
                    </button>
                </div>

                {/* Flash */}
                {flash.success && (
                    <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl">
                        {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                        {flash.error}
                    </div>
                )}

                {/* Table card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                    {/* Search bar */}
                    <div className="px-5 py-4 border-b border-gray-100">
                        <div className="relative max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search name or email…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-5 py-3 text-left">User</th>
                                    <th className="px-5 py-3 text-left">Email</th>
                                    <th className="px-5 py-3 text-left">Role</th>
                                    <th className="px-5 py-3 text-left">Created</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                                            No users found.
                                        </td>
                                    </tr>
                                ) : filtered.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
                                                    {user.photo_path
                                                        ? <img src={`/storage/${user.photo_path}`} alt={user.name} className="w-full h-full object-cover" />
                                                        : user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-gray-800">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-gray-500">{user.email}</td>
                                        <td className="px-5 py-3">
                                            {user.roles.length > 0 ? user.roles.map(r => (
                                                <span key={r.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${roleBadgeColor(r.slug)}`}>
                                                    <Shield className="h-2.5 w-2.5" /> {r.name}
                                                </span>
                                            )) : (
                                                <span className="text-gray-400 text-xs">No role</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 text-gray-400">{user.created_at}</td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEdit(user)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </button>
                                                {user.id !== auth.user.id && (
                                                    <button
                                                        onClick={() => setDeleting(user)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
                        {filtered.length} user{filtered.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            {/* ── Create / Edit Modal ── */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl">

                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="font-bold text-gray-900">
                                {modal === 'create' ? 'Add New User' : 'Edit User'}
                            </h2>
                            <button onClick={closeModal} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

                            {/* Name */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="Juan Dela Cruz"
                                        className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-100 ${errors.name ? 'border-red-300' : 'border-gray-200 focus:border-indigo-400'}`}
                                    />
                                </div>
                                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="user@company.com"
                                        className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-100 ${errors.email ? 'border-red-300' : 'border-gray-200 focus:border-indigo-400'}`}
                                    />
                                </div>
                                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Password {modal === 'edit' && <span className="normal-case font-normal text-gray-400">(leave blank to keep current)</span>}
                                </label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className={`w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-100 ${errors.password ? 'border-red-300' : 'border-gray-200 focus:border-indigo-400'}`}
                                    />
                                    <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Role
                                </label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <select
                                        name="role_id"
                                        value={form.role_id}
                                        onChange={handleChange}
                                        className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 ${errors.role_id ? 'border-red-300' : 'border-gray-200 focus:border-indigo-400'}`}
                                    >
                                        <option value="">Select a role…</option>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {errors.role_id && <p className="mt-1 text-xs text-red-500">{errors.role_id}</p>}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-70"
                                    style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
                                >
                                    <Save className="h-3.5 w-3.5" />
                                    {processing ? 'Saving…' : modal === 'create' ? 'Create User' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm ── */}
            {deleting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
                        <h2 className="font-bold text-gray-900 mb-1">Delete User</h2>
                        <p className="text-sm text-gray-500 mb-5">
                            Are you sure you want to delete <strong>{deleting.name}</strong>? This cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button onClick={() => setDeleting(null)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleting)}
                                className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
