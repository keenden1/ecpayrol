import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard, Users, Clock, Wallet, FileText,
    Settings, Building2, UserCog, Calendar, FileBarChart,
    GraduationCap, CalendarCheck, ChevronLeft, ChevronRight,
    ClipboardCheck, ChevronDown
} from 'lucide-react';
import '../../css/sidebar.css';

// ── Active detection ─────────────────────────────────────────────────────────
function isPathActive(url, path, items) {
    if (path)  return url === path || url.startsWith(path + '/');
    if (items) return items.some(s => url === s.path || url.startsWith(s.path + '/'));
    return false;
}

// ── Collapsed tooltip ────────────────────────────────────────────────────────
function Tooltip({ label, children }) {
    return (
        <div className="group/tip relative">
            {children}
            <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[70]
                            hidden group-hover/tip:flex items-center gap-0">
                <div className="w-2 h-2 bg-gray-800 rotate-45 -mr-1 flex-shrink-0" />
                <div className="bg-gray-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
                    {label}
                </div>
            </div>
        </div>
    );
}

// ── Menu Item ────────────────────────────────────────────────────────────────
const MenuItem = ({ icon: Icon, label, items, path, isCollapsed, openMenus, setOpenMenus }) => {
    const { url } = usePage();
    const active  = isPathActive(url, path, items);
    const isOpen  = !!openMenus[label];

    const isExt = (u) => u && (u.startsWith('http://') || u.startsWith('https://'));

    const toggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpenMenus(prev => ({ [label]: !prev[label] }));
    };

    // ── Shared classes ──
    const itemBase = 'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 select-none';
    const activeLeaf = 'bg-indigo-600 text-white shadow-sm shadow-indigo-200';
    const inactiveLeaf = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';
    const activeParent = 'bg-indigo-50 text-indigo-700';
    const inactiveParent = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 cursor-pointer';

    // ── Leaf (no children) ──
    if (path) {
        const cls = `${itemBase} ${active ? activeLeaf : inactiveLeaf} ${isCollapsed ? 'justify-center' : ''}`;
        const inner = (
            <>
                {Icon && <Icon className="flex-shrink-0 w-[1.1rem] h-[1.1rem]" />}
                {!isCollapsed && <span className="truncate leading-none">{label}</span>}
            </>
        );
        if (isCollapsed) {
            return (
                <Tooltip label={label}>
                    {isExt(path)
                        ? <a href={path} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
                        : <Link href={path} className={cls}>{inner}</Link>}
                </Tooltip>
            );
        }
        return isExt(path)
            ? <a href={path} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
            : <Link href={path} className={cls}>{inner}</Link>;
    }

    // ── Parent (has children) — collapsed flyout ──
    if (isCollapsed) {
        return (
            <div className="group/fly relative">
                <div className={`${itemBase} justify-center ${active ? activeParent : inactiveParent}`}>
                    {Icon && <Icon className="w-[1.1rem] h-[1.1rem] flex-shrink-0" />}
                </div>
                {/* Flyout panel */}
                <div className="pointer-events-none group-hover/fly:pointer-events-auto
                                absolute left-full top-0 ml-3 z-[70]
                                opacity-0 group-hover/fly:opacity-100
                                translate-x-1 group-hover/fly:translate-x-0
                                transition-all duration-150
                                bg-white border border-gray-200 rounded-xl shadow-xl min-w-[11rem] py-2 overflow-hidden">
                    <p className="px-4 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 mb-1">
                        {label}
                    </p>
                    {items.map((sub, i) => {
                        const subActive = url === sub.path || url.startsWith(sub.path + '/');
                        const subCls = `block px-4 py-2 text-sm transition-colors ${
                            subActive
                                ? 'text-indigo-600 bg-indigo-50 font-semibold'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`;
                        return isExt(sub.path)
                            ? <a key={i} href={sub.path} target="_blank" rel="noopener noreferrer" className={subCls}>{sub.label}</a>
                            : <Link key={i} href={sub.path} className={subCls}>{sub.label}</Link>;
                    })}
                </div>
            </div>
        );
    }

    // ── Parent — expanded ──
    return (
        <div>
            <div
                className={`${itemBase} justify-between ${active ? activeParent : inactiveParent}`}
                onClick={toggle}
            >
                <div className="flex items-center gap-2.5">
                    {Icon && <Icon className="w-[1.1rem] h-[1.1rem] flex-shrink-0" />}
                    <span className="truncate leading-none">{label}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Submenu */}
            <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                <div className="ml-3.5 mt-0.5 mb-1 pl-3 border-l-2 border-gray-100 space-y-0.5">
                    {items.map((sub, i) => {
                        const subActive = url === sub.path || url.startsWith(sub.path + '/');
                        const subCls = `block px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            subActive
                                ? 'text-indigo-700 bg-indigo-50 font-semibold'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                        }`;
                        return isExt(sub.path)
                            ? <a key={i} href={sub.path} target="_blank" rel="noopener noreferrer" className={subCls}>{sub.label}</a>
                            : <Link key={i} href={sub.path} className={subCls}>{sub.label}</Link>;
                    })}
                </div>
            </div>
        </div>
    );
};

// ── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = ({ open = false, setOpen = () => {}, isCollapsed = false, setIsCollapsed = () => {}, user }) => {
    const page       = usePage();
    const { auth }   = page.props;
    const currentUrl = page.url;

    const [userRole,  setUserRole]  = useState('');
    const [userRoles, setUserRoles] = useState([]);
    const [openMenus, setOpenMenus] = useState({});
    const sidebarRef                = useRef(null);

    // Resolve roles
    useEffect(() => {
        if (!auth?.user) return;
        if (Array.isArray(auth.user.roles) && auth.user.roles.length) {
            setUserRoles(auth.user.roles);
            setUserRole(auth.user.roles.map(r => r.name).join(', '));
        } else if (auth.user.role_slug) {
            setUserRoles([{ name: auth.user.role_slug, slug: auth.user.role_slug }]);
            setUserRole(auth.user.role_slug.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
        } else {
            fetch(`/api/user/${auth.user.id}/roles`)
                .then(r => r.json())
                .then(data => {
                    if (data.roles?.length) {
                        setUserRoles(data.roles);
                        setUserRole(data.roles.map(r => r.name).join(', '));
                    } else {
                        setUserRoles([]);
                        setUserRole('No Role');
                    }
                })
                .catch(() => {
                    setUserRoles([{ name: 'superadmin', slug: 'superadmin' }]);
                    setUserRole('Super Admin');
                });
        }
    }, [auth]);

    // Close menus on outside click
    useEffect(() => {
        const fn = (e) => {
            if (sidebarRef.current && !sidebarRef.current.contains(e.target)) setOpenMenus({});
        };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, []);

    const hasAccess = (allowed) => {
        if (!userRoles.length) return true;
        return allowed.some(role =>
            userRoles.some(ur =>
                ur.name?.toLowerCase() === role.toLowerCase() ||
                ur.slug?.toLowerCase() === role.toLowerCase()
            )
        );
    };

    const getDashboardRoute = () => {
        if (hasAccess(['superadmin']))      return '/superadmin/dashboard';
        if (hasAccess(['payroll_officer'])) return '/payroll/dashboard';
        if (hasAccess(['manager']))         return '/manager/dashboard';
        if (hasAccess(['finance']))         return '/finance/dashboard';
        return '/employee/dashboard';
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard',        path: getDashboardRoute(), allowedRoles: ['superadmin','payroll_officer','manager','finance','employee'] },
        { icon: Users,           label: 'Employees',        allowedRoles: ['superadmin','payroll_officer','manager'], items: [
            { label: 'Employee List',    path: '/employees' },
            { label: 'Import Employees', path: '/employees/import' },
        ]},
        { icon: ClipboardCheck,  label: 'Timesheets',       allowedRoles: ['superadmin','payroll_officer'], items: [
            { label: 'DTR',                path: '/payroll-summaries-page' },
            { label: 'Process Attendance', path: '/attendance' },
            { label: 'Manual Entry',       path: '/timesheet/manual-entry' },
            { label: 'Biometrics',         path: '/biometric-devices' },
            { label: 'Import Attendance',  path: '/attendance/import' },
        ]},
        { icon: Wallet,          label: 'Payroll',          allowedRoles: ['superadmin','payroll_officer','finance'], items: [
            { label: 'Final Payroll',   path: '/final-payrolls' },
            { label: 'Payroll Summary', path: '/comprehensive-payroll-summaries' },
            { label: 'Benefits',        path: '/benefits' },
            { label: 'Deductions',      path: '/deductions' },
        ]},
        { icon: FileText,        label: 'Requests',         allowedRoles: ['superadmin','payroll_officer','manager','employee'], items: [
            { label: 'Overtime',          path: '/overtimes' },
            { label: 'Offset',            path: '/offsets' },
            { label: 'Change Restday',    path: '/change-off-schedules' },
            { label: 'Cancel Restday',    path: '/cancel-rest-days' },
            { label: 'Change Time Sched', path: '/time-schedules' },
            { label: 'SLVL',              path: '/slvl' },
            { label: 'Travel Order',      path: '/travel-orders' },
            { label: 'Retro',             path: '/retro' },
        ]},
        { icon: Building2,       label: 'Manage',           allowedRoles: ['superadmin'], items: [
            { label: 'Line & Section', path: '/manage/line-section' },
            { label: 'Departments',    path: '/manage/departments' },
            { label: 'Roles & Access', path: '/manage/roles' },
        ]},
        { icon: UserCog,         label: 'Core HR',          allowedRoles: ['superadmin'], items: [
            { label: 'Promotion',    path: '/core-hr/promotion' },
            { label: 'Award',        path: '/core-hr/award' },
            { label: 'Travel',       path: '/core-hr/travel' },
            { label: 'Transfer',     path: '/core-hr/transfer' },
            { label: 'Resignations', path: '/core-hr/resignations' },
            { label: 'Complaints',   path: '/core-hr/complaints' },
            { label: 'Warnings',     path: '/core-hr/warnings' },
            { label: 'Terminations', path: '/core-hr/terminations' },
        ]},
        { icon: Calendar,        label: 'HR Calendar',      allowedRoles: ['superadmin','payroll_officer'], path: '/hr-calendar' },
        { icon: FileBarChart,    label: 'HR Reports',       allowedRoles: ['superadmin','payroll_officer'], items: [
            { label: 'Daily Attendances',  path: '/reports/daily-attendance' },
            { label: 'Monthly Attendance', path: '/reports/monthly-attendance' },
            { label: 'Training Report',    path: '/reports/training' },
        ]},
        { icon: GraduationCap,   label: 'Training',         allowedRoles: ['superadmin'], items: [
            { label: 'Training Lists', path: '/training/lists' },
            { label: 'Training Type',  path: '/training/types' },
            { label: 'Trainers',       path: '/training/trainers' },
        ]},
        { icon: CalendarCheck,   label: 'Events & Meetings', allowedRoles: ['superadmin'], items: [
            { label: 'Events',   path: '/events' },
            { label: 'Meetings', path: '/meetings' },
        ]},
        { icon: Settings,        label: 'Settings',          allowedRoles: ['superadmin'], path: '/settings' },
    ];

    // Groups
    const groups = [
        { label: 'Main',       keys: ['Dashboard', 'Employees'] },
        { label: 'Operations', keys: ['Timesheets', 'Payroll', 'Requests'] },
        { label: 'HR',         keys: ['Manage', 'Core HR', 'HR Calendar', 'HR Reports', 'Training', 'Events & Meetings'] },
        { label: 'System',     keys: ['Settings'] },
    ];

    // Auto-open active parent
    useEffect(() => {
        const active = {};
        menuItems.forEach(item => {
            if (item.items?.some(s => currentUrl === s.path || currentUrl.startsWith(s.path + '/'))) {
                active[item.label] = true;
            }
        });
        if (Object.keys(active).length) setOpenMenus(active);
    }, [currentUrl]);

    const visible = menuItems.filter(i => hasAccess(i.allowedRoles));

    return (
        <>
            {/* Mobile overlay */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            <aside
                ref={sidebarRef}
                className={`
                    fixed top-0 left-0 z-30
                    h-screen
                    transition-all duration-300 ease-in-out
                    ${open ? 'translate-x-0' : '-translate-x-full'}
                    lg:translate-x-0
                    ${isCollapsed ? 'w-[4.5rem]' : 'w-64'}
                `}
            >
                <div className="h-full flex flex-col bg-white border-r border-gray-200 shadow-sm overflow-hidden">

                    {/* ── Branding ── */}
                    <div className={`flex items-center gap-3 border-b border-gray-200 flex-shrink-0 h-16 px-4 ${isCollapsed ? 'justify-center px-0' : ''}`}>
                        <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md">
                            <span className="text-xs font-black text-white tracking-tighter">EC</span>
                        </div>
                        {!isCollapsed && (
                            <div className="min-w-0">
                                <p className="text-sm font-black text-gray-900 leading-none">EC HRIS</p>
                                <p className="text-xs text-gray-400 leading-none mt-1">Human Resource System</p>
                            </div>
                        )}
                    </div>

                    {/* ── Header ── */}
                    <div className={`flex items-center border-b border-gray-100 px-3 py-3 flex-shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                        {!isCollapsed && (
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-800 leading-none truncate">Navigation</p>
                                <p className="text-xs text-gray-400 leading-none mt-1 truncate">{userRole || '—'}</p>
                            </div>
                        )}
                        <button
                            onClick={() => { setIsCollapsed(v => !v); if (!isCollapsed) setOpenMenus({}); }}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors flex-shrink-0"
                            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            {isCollapsed
                                ? <ChevronRight className="w-4 h-4" />
                                : <ChevronLeft  className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* ── Navigation ── */}
                    <nav className="sidebar-nav flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
                        {groups.map(group => {
                            const groupItems = visible.filter(i => group.keys.includes(i.label));
                            if (!groupItems.length) return null;
                            return (
                                <div key={group.label} className="mb-2">
                                    {/* Group label */}
                                    {!isCollapsed ? (
                                        <p className="px-3 mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            {group.label}
                                        </p>
                                    ) : (
                                        <div className="mx-2 my-2 h-px bg-gray-100" />
                                    )}
                                    <div className="space-y-0.5">
                                        {groupItems.map((item, i) => (
                                            <MenuItem
                                                key={i}
                                                icon={item.icon}
                                                label={item.label}
                                                items={item.items}
                                                path={item.path}
                                                isCollapsed={isCollapsed}
                                                openMenus={openMenus}
                                                setOpenMenus={setOpenMenus}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </nav>

                    {/* ── Footer ── */}
                    <div className="flex-shrink-0 border-t border-gray-100 px-3 py-3">
                        {isCollapsed ? (
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 mx-auto flex items-center justify-center shadow-sm">
                                <span className="text-white font-black" style={{ fontSize: '0.55rem' }}>EC</span>
                            </div>
                        ) : (
                            <p className="text-[10px] text-gray-400 text-center font-medium">© 2025 EC HRIS</p>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
