import React, { useState, useEffect, useRef } from "react";
import { Head, usePage } from "@inertiajs/react";
import { router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    PlusCircle,
    Edit,
    Trash2,
    ServerCrash,
    RefreshCw,
    CheckCircle,
    XCircle,
    Search,
    Loader,
    Cpu,
} from "lucide-react";

const BiometricManagement = ({ auth, devices = [], jsonCacheInfo: initialJsonCacheInfo = {}, departments = [], jobtitles = [] }) => {
    const [deviceList, setDeviceList] = useState(devices);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentDevice, setCurrentDevice] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showTestModal, setShowTestModal] = useState(false);
    const [deviceToDelete, setDeviceToDelete] = useState(null);
    const [testResult, setTestResult] = useState(null);
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [testingDevice, setTestingDevice] = useState(null);

    // Keep local list in sync when Inertia reloads the page props after save/delete
    useEffect(() => {
        setDeviceList(devices);
    }, [devices]);

    // New states for device discovery
    const [isScanning, setIsScanning] = useState(false);
    const [scanResults, setScanResults] = useState([]);
    const [scanProgress, setScanProgress] = useState(0);

    // Refresh device list when background jobs complete
    useEffect(() => {
        const handleSyncCompleted = (e) => {
            // Partial reload of the 'devices' and 'jsonCacheInfo' props
            router.reload({ only: ['devices', 'jsonCacheInfo'] });
        };
        window.addEventListener('bgSyncJobCompleted', handleSyncCompleted);
        return () => window.removeEventListener('bgSyncJobCompleted', handleSyncCompleted);
    }, []);

    // Multi-device sync state
    const [syncConfirmDevice, setSyncConfirmDevice] = useState(null); // device waiting for confirm
    const [pythonSyncConfirmDevice, setPythonSyncConfirmDevice] = useState(null); // python sync confirm
    const [activeSyncs, setActiveSyncs] = useState({});
    // { [deviceId]: { device, progress, stage, isExpanded, status, previewRecords, previewSummary, syncLogId, previewPage, isSaving } }
    // status: 'syncing' | 'preview' | 'no_records'
    const syncRefsMap = useRef({});

    // Device users panel
    const [showUsersPanel, setShowUsersPanel] = useState(false);
    const [usersDevice, setUsersDevice] = useState(null);
    const [deviceUsers, setDeviceUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersFilter, setUsersFilter] = useState("");
    const [usersMatchFilter, setUsersMatchFilter] = useState("all");
    const [addingUsers, setAddingUsers] = useState({});
    const [addedUsers, setAddedUsers] = useState(new Set());

    // Add Employee modal state
    const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
    const [addEmployeeUser, setAddEmployeeUser] = useState(null); // the device user being added
    const [addEmployeeForm, setAddEmployeeForm] = useState({ Fname: '', Lname: '', MName: '', Department: '', Jobtitle: '', JobStatus: 'Active' });
    const [openCombo, setOpenCombo] = useState(null); // 'dept' | 'jobtitle' | null
    const previewPageSize = 50;

    // Fetch Matched Logs modal (date picker)
    const [fetchLogsDevice, setFetchLogsDevice] = useState(null);
    const [fetchStartDate, setFetchStartDate] = useState('');
    const [fetchEndDate, setFetchEndDate] = useState('');
    const [fetchUseLimit, setFetchUseLimit] = useState(false);
    const [fetchUseCached, setFetchUseCached] = useState(false);
    // JSON cache info per device — seeded from disk on page load { [deviceId]: { exists, fetch_time, total_logs } }
    const [jsonCacheInfo, setJsonCacheInfo] = useState(initialJsonCacheInfo);
    const [isSyncingRaw, setIsSyncingRaw] = useState(false);
    // Background sync tracker: { id, device, status: 'running'|'done'|'error', message }
    const [bgSyncs, setBgSyncs] = useState([]);
    const [bgSyncsExpanded, setBgSyncsExpanded] = useState(true);

    // Form data state
    const [formData, setFormData] = useState({
        name: "",
        ip_address: "",
        port: "4370",
        location: "",
        model: "",
        serial_number: "",
        status: "active",
    });

    // Test connection form data
    const [testConnectionData, setTestConnectionData] = useState({
        ip_address: "",
        port: "4370",
    });

    // Helper function to dynamically set class names for input fields
    const getFieldClassName = (fieldName) => {
        const baseClasses =
            "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm";

        const requiredFields = ["name", "ip_address", "port", "location"];
        const isRequired = requiredFields.includes(fieldName);
        const isEmpty = !formData[fieldName];

        if (isRequired && isEmpty) {
            return `${baseClasses} border-red-300 bg-red-50`;
        }

        return baseClasses;
    };

    // ── Multi-device sync helpers ──────────────────────────────────────────────

    const updateSync = (deviceId, updates) =>
        setActiveSyncs(prev => ({ ...prev, [deviceId]: { ...prev[deviceId], ...updates } }));

    const getSyncRefs = (deviceId) => {
        if (!syncRefsMap.current[deviceId]) {
            syncRefsMap.current[deviceId] = { abortController: null, pollInterval: null };
        }
        return syncRefsMap.current[deviceId];
    };

    const removeSync = (deviceId) => {
        const refs = getSyncRefs(deviceId);
        if (refs.abortController) refs.abortController.abort();
        if (refs.pollInterval) clearInterval(refs.pollInterval);
        delete syncRefsMap.current[deviceId];
        setActiveSyncs(prev => { const n = { ...prev }; delete n[deviceId]; return n; });
    };

    const expandSync = (deviceId) =>
        setActiveSyncs(prev => {
            const n = { ...prev };
            Object.keys(n).forEach(id => { n[id] = { ...n[id], isExpanded: id === String(deviceId) }; });
            return n;
        });

    const collapseSync = (deviceId) => updateSync(deviceId, { isExpanded: false });

    const openFetchLogsModal = (device) => {
        setFetchStartDate('');
        setFetchEndDate('');
        setFetchUseCached(!!jsonCacheInfo[device.id]?.exists);
        setFetchLogsDevice(device);
    };

    const saveLogs = async (deviceId) => {
        const sync = activeSyncs[deviceId];
        if (!sync) return;
        updateSync(deviceId, { isSaving: true });
        try {
            const res = await fetch(route("biometric-devices.save-logs"), {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json", "X-CSRF-TOKEN": csrfToken() },
                body: JSON.stringify({ sync_log_id: sync.syncLogId }),
            });
            const data = await res.json();
            if (data.success) {
                removeSync(deviceId);
                toast.success(`${sync.device.name} — ${data.saved_count} new, ${data.updated_count} updated`);
            } else {
                toast.error(`Save failed: ${data.message || "Unknown error"}`);
                updateSync(deviceId, { isSaving: false });
            }
        } catch (err) {
            toast.error(`Error: ${err.message}`);
            updateSync(deviceId, { isSaving: false });
        }
    };

    const csrfToken = () =>
        document.querySelector('meta[name="csrf-token"]').getAttribute("content");

    const handleOpenAddEmployeeModal = (user) => {
        // Pre-fill name from device name field (format may be "LASTNAME, FIRSTNAME" or just a name)
        let Lname = '', Fname = '';
        if (user.name) {
            const parts = user.name.split(',');
            if (parts.length >= 2) {
                Lname = parts[0].trim();
                Fname = parts.slice(1).join(',').trim();
            } else {
                Fname = user.name.trim();
            }
        }
        setAddEmployeeUser(user);
        setAddEmployeeForm({ Fname, Lname, MName: '', Department: '', Jobtitle: '', JobStatus: 'Active' });
        setShowAddEmployeeModal(true);
    };

    const handleAddDeviceUser = async () => {
        if (!addEmployeeUser) return;
        const userid = addEmployeeUser.userid;
        setAddingUsers(prev => ({ ...prev, [userid]: true }));
        setShowAddEmployeeModal(false);
        try {
            const res = await fetch("/biometric-devices/add-device-user", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json", "X-CSRF-TOKEN": csrfToken() },
                body: JSON.stringify({ idno: userid, ...addEmployeeForm }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                setAddedUsers(prev => new Set([...prev, userid]));
                const fullName = [addEmployeeForm.Lname, addEmployeeForm.Fname].filter(Boolean).join(', ') || '';
                setDeviceUsers(prev => prev.map(u => u.userid === userid ? { ...u, matched: true, employee: fullName, department: addEmployeeForm.Department } : u));
            } else {
                toast.error(data.message || "Failed to add employee");
            }
        } catch (e) {
            toast.error("Error adding employee");
        } finally {
            setAddingUsers(prev => ({ ...prev, [userid]: false }));
            setAddEmployeeUser(null);
        }
    };

    const handleViewUsers = async (device) => {
        setUsersDevice(device);
        setDeviceUsers([]);
        setUsersFilter("");
        setUsersMatchFilter("all");
        setAddedUsers(new Set());
        setShowUsersPanel(true);
        setUsersLoading(true);
        try {
            const res = await fetch("/biometric-devices/device-users", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json", "X-CSRF-TOKEN": csrfToken() },
                body: JSON.stringify({ device_id: device.id }),
            });
            const data = await res.json();
            if (data.success) {
                setDeviceUsers(data.users);
            } else {
                toast.error(data.message || "Failed to fetch users");
                setShowUsersPanel(false);
            }
        } catch (e) {
            toast.error("Error fetching device users");
            setShowUsersPanel(false);
        } finally {
            setUsersLoading(false);
        }
    };

    const startSyncPolling = (deviceId) => {
        const refs = getSyncRefs(deviceId);
        if (refs.pollInterval) clearInterval(refs.pollInterval);
        const startTime = Date.now();
        const stages = [
            { at: 0,   pct: 5,  label: "Queued for processing..." },
            { at: 3,   pct: 15, label: "Connecting to biometric device..." },
            { at: 10,  pct: 30, label: "Retrieving attendance logs from device..." },
            { at: 25,  pct: 55, label: "Processing attendance records..." },
            { at: 60,  pct: 70, label: "Building preview records..." },
            { at: 100, pct: 85, label: "Almost done..." },
        ];
        refs.pollInterval = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            let current = stages[0];
            for (const s of stages) { if (elapsed >= s.at) current = s; else break; }
            const next = stages[stages.indexOf(current) + 1];
            let progress = current.pct;
            if (next) {
                progress = current.pct + ((elapsed - current.at) / (next.at - current.at)) * (next.pct - current.pct);
            }
            updateSync(deviceId, { progress: Math.min(88, progress), stage: current.label });
        }, 800);
    };

    // Sync — fires background OS process, tracks via polling
    const startRawSync = async (device) => {
        setSyncConfirmDevice(null);
        try {
            const res = await fetch(route("biometric-devices.sync-raw-background"), {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json", "X-CSRF-TOKEN": csrfToken() },
                body: JSON.stringify({ device_id: device.id }),
            });
            const data = await res.json();
            if (data.success) {
                // Save to localStorage so the floating pill persists across page navigations
                const jobs = JSON.parse(localStorage.getItem('bgSyncJobs') || '[]');
                jobs.push({ logId: data.log_id, deviceId: device.id, deviceName: device.name, startedAt: Date.now() });
                localStorage.setItem('bgSyncJobs', JSON.stringify(jobs));
                // Dispatch event so AuthenticatedLayout picks it up immediately
                window.dispatchEvent(new Event('bgSyncJobAdded'));
            } else {
                toast.error(`${device.name}: ${data.message || 'Failed to start sync'}`);
            }
        } catch (err) {
            toast.error(`${device.name}: ${err.message}`);
        }
    };

    // Python (pyzk) background sync — same flow as startRawSync but calls the python-sync endpoint
    const startPythonSync = async (device) => {
        setPythonSyncConfirmDevice(null);
        try {
            const res = await fetch(route("biometric-devices.python-sync"), {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json", "X-CSRF-TOKEN": csrfToken() },
                body: JSON.stringify({ device_id: device.id }),
            });
            const data = await res.json();
            if (data.success) {
                const jobs = JSON.parse(localStorage.getItem('bgSyncJobs') || '[]');
                jobs.push({ logId: data.log_id, deviceId: device.id, deviceName: device.name, startedAt: Date.now() });
                localStorage.setItem('bgSyncJobs', JSON.stringify(jobs));
                window.dispatchEvent(new Event('bgSyncJobAdded'));
            } else {
                toast.error(`${device.name}: ${data.message || 'Failed to start Python sync'}`);
            }
        } catch (err) {
            toast.error(`${device.name}: ${err.message}`);
        }
    };

    // Fetch Matched Logs — reads from JSON cache (or device), filters by date + matched users, shows preview
    const startFetchLogs = async (device) => {
        const deviceId = device.id;
        setFetchLogsDevice(null);

        const extras = {};
        if (fetchStartDate) extras.start_date = fetchStartDate;
        if (fetchEndDate) extras.end_date = fetchEndDate;
        if (fetchUseCached && jsonCacheInfo[deviceId]?.exists) extras.use_cache = true;

        setActiveSyncs(prev => {
            const n = {};
            Object.keys(prev).forEach(id => { n[id] = { ...prev[id], isExpanded: false }; });
            n[deviceId] = {
                device,
                progress: 5,
                stage: "Queued for processing...",
                isExpanded: true,
                status: 'syncing',
                previewRecords: [],
                previewSummary: null,
                syncLogId: null,
                previewPage: 1,
                isSaving: false,
            };
            return n;
        });

        startSyncPolling(deviceId);
        const refs = getSyncRefs(deviceId);
        const abortController = new AbortController();
        refs.abortController = abortController;

        try {
            const res = await fetch(route("biometric-devices.fetch-logs"), {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json", "X-CSRF-TOKEN": csrfToken() },
                body: JSON.stringify({ device_id: deviceId, ...extras }),
                signal: abortController.signal,
            });

            refs.abortController = null;
            if (refs.pollInterval) { clearInterval(refs.pollInterval); refs.pollInterval = null; }
            updateSync(deviceId, { progress: 100, stage: "Preview ready" });

            const data = await res.json();

            setTimeout(() => {
                if (data.success && data.preview) {
                    if (!extras.use_cache) {
                        router.reload({ only: ['jsonCacheInfo'] });
                    }
                    updateSync(deviceId, {
                        status: 'preview',
                        isExpanded: true,
                        previewRecords: data.preview_records ?? [],
                        previewSummary: data.summary ?? {},
                        syncLogId: data.sync_log_id,
                        previewPage: 1,
                    });
                } else if (data.success) {
                    if (!extras.use_cache) {
                        router.reload({ only: ['jsonCacheInfo'] });
                    }
                    updateSync(deviceId, { status: 'no_records', isExpanded: true, previewSummary: data.summary ?? {} });
                } else {
                    toast.error(`${device.name}: ${data.message || "Unknown error"}`);
                    removeSync(deviceId);
                }
            }, 500);
        } catch (err) {
            refs.abortController = null;
            if (refs.pollInterval) { clearInterval(refs.pollInterval); refs.pollInterval = null; }
            if (err.name !== "AbortError") {
                toast.error(`${device.name}: ${err.message}`);
                removeSync(deviceId);
            }
        }
    };

    // ── Render: simple sync confirmation modal (dumps raw logs to JSON, no preview) ──
    const renderSyncConfirm = () => syncConfirmDevice && (
        <div className="fixed z-20 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-gray-500 opacity-75" onClick={() => setSyncConfirmDevice(null)} />
                <div className="relative bg-white rounded-lg shadow-xl sm:max-w-md w-full p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-green-100">
                            <RefreshCw className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">Sync — {syncConfirmDevice.name}</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Fetches all raw attendance logs from the device and <strong>saves to cache</strong>. Runs in the background — you can navigate away freely.
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                                IP: {syncConfirmDevice.ip_address} &bull; Port: {syncConfirmDevice.port}
                            </p>
                            {jsonCacheInfo[syncConfirmDevice.id] && (
                                <p className="mt-2 text-xs text-green-600">
                                    Last synced: {jsonCacheInfo[syncConfirmDevice.id].fetch_time} &bull; {jsonCacheInfo[syncConfirmDevice.id].total_logs} logs
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="mt-5 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setSyncConfirmDevice(null)}
                            className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        >Cancel</button>
                        <button
                            type="button"
                            onClick={() => startRawSync(syncConfirmDevice)}
                            className="px-4 py-2 text-sm rounded-md bg-green-600 text-white font-medium hover:bg-green-700 flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Sync Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // ── Render: Python sync confirmation modal ────────────────────────────────
    const renderPythonSyncConfirm = () => pythonSyncConfirmDevice && (
        <div className="fixed z-20 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-gray-500 opacity-75" onClick={() => setPythonSyncConfirmDevice(null)} />
                <div className="relative bg-white rounded-lg shadow-xl sm:max-w-md w-full p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-orange-100">
                            <Cpu className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">Python Sync — {pythonSyncConfirmDevice.name}</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Fetches all raw attendance logs using <strong>pyzk</strong> (Python) and saves to cache. Runs in the background — you can navigate away freely.
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                                IP: {pythonSyncConfirmDevice.ip_address} &bull; Port: {pythonSyncConfirmDevice.port}
                            </p>
                            {jsonCacheInfo[pythonSyncConfirmDevice.id] && (
                                <p className="mt-2 text-xs text-orange-600">
                                    Last synced: {jsonCacheInfo[pythonSyncConfirmDevice.id].fetch_time} &bull; {jsonCacheInfo[pythonSyncConfirmDevice.id].total_logs} logs
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="mt-5 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setPythonSyncConfirmDevice(null)}
                            className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        >Cancel</button>
                        <button
                            type="button"
                            onClick={() => startPythonSync(pythonSyncConfirmDevice)}
                            className="px-4 py-2 text-sm rounded-md bg-orange-600 text-white font-medium hover:bg-orange-700 flex items-center gap-2"
                        >
                            <Cpu className="w-4 h-4" />
                            Python Sync
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // ── Render: fetch matched logs modal (with date filter) ───────────────────
    const renderFetchLogsModal = () => fetchLogsDevice && (
        <div className="fixed z-20 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-gray-500 opacity-75" onClick={() => setFetchLogsDevice(null)} />
                <div className="relative bg-white rounded-lg shadow-xl sm:max-w-md w-full p-6">
                    <div className="flex items-start gap-4 mb-5">
                        <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-green-100">
                            <RefreshCw className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">
                                Fetch Logs for ZKTeco Device ({fetchLogsDevice.ip_address})
                            </h3>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <input
                                type="date"
                                value={fetchStartDate}
                                onChange={e => setFetchStartDate(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Date <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <input
                                type="date"
                                value={fetchEndDate}
                                onChange={e => setFetchEndDate(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>

                        <p className="text-xs text-gray-500">
                            Leave dates blank to fetch all available logs. If both dates are provided, only logs within that range will be fetched.
                        </p>

                        <div className="bg-gray-50 rounded-md p-3 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-700">Use cached data</p>
                                <p className="text-xs text-gray-400">
                                    {jsonCacheInfo[fetchLogsDevice.id]?.exists
                                        ? `Synced ${jsonCacheInfo[fetchLogsDevice.id].fetch_time} · ${jsonCacheInfo[fetchLogsDevice.id].total_logs} logs`
                                        : 'No cache yet — sync device first'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => jsonCacheInfo[fetchLogsDevice.id]?.exists && setFetchUseCached(v => !v)}
                                disabled={!jsonCacheInfo[fetchLogsDevice.id]?.exists}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${fetchUseCached && jsonCacheInfo[fetchLogsDevice.id]?.exists ? 'bg-green-500' : 'bg-gray-200'} ${!jsonCacheInfo[fetchLogsDevice.id]?.exists ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${fetchUseCached && jsonCacheInfo[fetchLogsDevice.id]?.exists ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="mt-5 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setFetchLogsDevice(null)}
                            className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        >Cancel</button>
                        <button
                            type="button"
                            onClick={() => startFetchLogs(fetchLogsDevice)}
                            className="px-4 py-2 text-sm rounded-md bg-green-600 text-white font-medium hover:bg-green-700"
                        >Fetch Logs</button>
                    </div>
                </div>
            </div>
        </div>
    );

    // ── Render: floating chips (one per active sync) ───────────────────────────
    const renderSyncChips = () => {
        const syncs = Object.values(activeSyncs);
        if (syncs.length === 0) return null;
        return (
            <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end">
                {syncs.map(sync => {
                    if (sync.isExpanded) return null;
                    const deviceId = sync.device.id;
                    const isSyncing = sync.status === 'syncing';
                    const isDone = sync.status === 'preview' || sync.status === 'no_records';
                    return (
                        <div
                            key={deviceId}
                            className="flex items-center gap-3 bg-white border border-gray-200 shadow-xl rounded-full px-4 py-2.5 cursor-pointer hover:shadow-2xl transition-shadow"
                            onClick={() => expandSync(deviceId)}
                        >
                            {isSyncing
                                ? <RefreshCw className="h-4 w-4 text-green-600 animate-spin flex-shrink-0" />
                                : <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            }
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-semibold text-gray-800 truncate max-w-[140px]">{sync.device.name}</span>
                                <span className="text-xs text-gray-400 truncate max-w-[140px]">
                                    {isSyncing ? sync.stage : 'Preview ready — click to review'}
                                </span>
                            </div>
                            {isSyncing && (
                                <>
                                    <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                        <div className="h-1.5 rounded-full bg-green-500 transition-all duration-500" style={{ width: `${sync.progress}%` }} />
                                    </div>
                                    <span className="text-xs font-medium text-green-600 w-7 text-right">{Math.round(sync.progress)}%</span>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // ── Render: expanded sync modal (progress or preview) ─────────────────────
    const renderExpandedSync = () => {
        const sync = Object.values(activeSyncs).find(s => s.isExpanded);
        if (!sync) return null;
        const deviceId = sync.device.id;

        return (
            <div className="fixed z-10 inset-0 overflow-y-auto">
                <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div className="fixed inset-0 bg-gray-500 opacity-75" />
                    <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                    <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${sync.status === 'preview' && sync.previewRecords.length > 0 ? 'sm:max-w-4xl' : 'sm:max-w-lg'} sm:w-full`}>

                        {sync.status === 'syncing' ? (
                            /* Progress view */
                            <div className="bg-white px-6 py-8">
                                <div className="flex flex-col items-center">
                                    <div className="mb-2 flex items-center gap-2 text-green-600 w-full justify-between">
                                        <div className="flex items-center gap-2">
                                            <RefreshCw className="h-5 w-5 animate-spin" />
                                            <span className="text-sm font-medium">Syncing {sync.device.name}…</span>
                                        </div>
                                        <button
                                            onClick={() => collapseSync(deviceId)}
                                            title="Minimize"
                                            className="text-gray-400 hover:text-gray-600 text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100"
                                        >
                                            <span>Minimize</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 self-start">Fetching all available logs</p>
                                    <div className="mt-4 mb-2 w-full flex justify-between text-xs text-gray-500 font-medium">
                                        <span>{sync.stage}</span>
                                        <span>{Math.round(sync.progress)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                        <div className="h-4 rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500" style={{ width: `${sync.progress}%` }} />
                                    </div>
                                    <p className="mt-4 text-xs text-gray-400 text-center">You can minimize this and continue using the dashboard.</p>
                                    <button onClick={() => removeSync(deviceId)} className="mt-4 text-xs text-red-500 hover:text-red-700 underline">Cancel</button>
                                </div>
                            </div>

                        ) : sync.status === 'preview' && sync.previewRecords.length > 0 ? (
                            /* Preview table */
                            <div className="bg-white">
                                <div className="px-6 pt-5 pb-3 border-b border-gray-200 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Preview — {sync.device.name}</h3>
                                        <div className="mt-1 flex gap-4 text-sm">
                                            <span className="text-gray-600">Total: <strong>{sync.previewSummary?.total_records ?? sync.previewRecords.length}</strong></span>
                                            <span className="text-green-600">New: <strong>{sync.previewSummary?.new_records ?? 0}</strong></span>
                                            <span className="text-blue-600">Updates: <strong>{sync.previewSummary?.update_records ?? 0}</strong></span>
                                            {sync.previewSummary?.skipped_count > 0 && (
                                                <span className="text-gray-400">Skipped: <strong>{sync.previewSummary.skipped_count}</strong></span>
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={() => collapseSync(deviceId)} className="text-gray-400 hover:text-gray-600 text-xs px-2 py-1 rounded hover:bg-gray-100">Minimize</button>
                                </div>
                                <div className="overflow-auto" style={{ maxHeight: '55vh' }}>
                                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                {['ID', 'Employee', 'Date', 'Time In', 'Time Out', 'Time In', 'Time Out', 'Hours', 'Status'].map(h => (
                                                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {sync.previewRecords.slice((sync.previewPage - 1) * previewPageSize, sync.previewPage * previewPageSize).map((r, i) => (
                                                <tr key={i} className={r.is_new ? '' : 'bg-blue-50/40'}>
                                                    <td className="px-3 py-1.5 whitespace-nowrap text-gray-500">{r.employee_idno}</td>
                                                    <td className="px-3 py-1.5 whitespace-nowrap font-medium text-gray-900">{r.employee_name}</td>
                                                    <td className="px-3 py-1.5 whitespace-nowrap text-gray-600">{r.attendance_date}</td>
                                                    <td className="px-3 py-1.5 whitespace-nowrap text-gray-600">{r.time_in ? r.time_in.split(' ')[1]?.slice(0,5) : '—'}</td>
                                                    <td className="px-3 py-1.5 whitespace-nowrap text-gray-400">{r.break_in ? r.break_in.split(' ')[1]?.slice(0,5) : '—'}</td>
                                                    <td className="px-3 py-1.5 whitespace-nowrap text-gray-400">{r.break_out ? r.break_out.split(' ')[1]?.slice(0,5) : '—'}</td>
                                                    <td className="px-3 py-1.5 whitespace-nowrap text-gray-600">{r.time_out ? r.time_out.split(' ')[1]?.slice(0,5) : '—'}</td>
                                                    <td className="px-3 py-1.5 whitespace-nowrap text-gray-600">{r.hours_worked ?? '—'}</td>
                                                    <td className="px-3 py-1.5 whitespace-nowrap">
                                                        {r.is_new
                                                            ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">New</span>
                                                            : <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Update</span>
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {sync.previewRecords.length > previewPageSize && (() => {
                                    const totalPages = Math.ceil(sync.previewRecords.length / previewPageSize);
                                    return (
                                        <div className="px-6 py-2 border-t border-gray-100 flex items-center justify-between text-sm">
                                            <span className="text-gray-500">
                                                Showing {((sync.previewPage - 1) * previewPageSize) + 1}–{Math.min(sync.previewPage * previewPageSize, sync.previewRecords.length)} of {sync.previewRecords.length}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => updateSync(deviceId, { previewPage: 1 })} disabled={sync.previewPage === 1} className="px-2 py-1 rounded border border-gray-300 text-gray-600 disabled:opacity-40 hover:bg-gray-50">«</button>
                                                <button onClick={() => updateSync(deviceId, { previewPage: sync.previewPage - 1 })} disabled={sync.previewPage === 1} className="px-2 py-1 rounded border border-gray-300 text-gray-600 disabled:opacity-40 hover:bg-gray-50">‹</button>
                                                <span className="px-3 py-1 text-gray-700">Page {sync.previewPage} / {totalPages}</span>
                                                <button onClick={() => updateSync(deviceId, { previewPage: sync.previewPage + 1 })} disabled={sync.previewPage === totalPages} className="px-2 py-1 rounded border border-gray-300 text-gray-600 disabled:opacity-40 hover:bg-gray-50">›</button>
                                                <button onClick={() => updateSync(deviceId, { previewPage: totalPages })} disabled={sync.previewPage === totalPages} className="px-2 py-1 rounded border border-gray-300 text-gray-600 disabled:opacity-40 hover:bg-gray-50">»</button>
                                            </div>
                                        </div>
                                    );
                                })()}
                                <div className="px-6 py-3 bg-gray-50 flex justify-end gap-3 border-t border-gray-200">
                                    <button type="button" onClick={() => removeSync(deviceId)} className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Discard</button>
                                    <button type="button" onClick={() => saveLogs(deviceId)} disabled={sync.isSaving} className="px-4 py-2 text-sm rounded-md bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50">
                                        {sync.isSaving ? 'Saving…' : `Save ${sync.previewRecords.length} Records`}
                                    </button>
                                </div>
                            </div>

                        ) : (
                            /* No records / error state */
                            <div className="bg-white px-6 py-8">
                                <div className="flex flex-col items-center text-center">
                                    {(() => {
                                        const reason = sync.previewSummary?.no_records_reason;
                                        if (reason === 'device_empty') return (<>
                                            <ServerCrash className="h-12 w-12 text-orange-400 mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">Device Returned No Data</h3>
                                            <p className="text-sm text-gray-500 mb-1"><strong>{sync.device.name}</strong> connected but returned 0 logs.</p>
                                            <p className="text-xs text-orange-500 mb-6">The device may be busy or its log storage is empty. Wait a minute and try again.</p>
                                        </>);
                                        if (reason === 'all_unmatched') return (<>
                                            <XCircle className="h-12 w-12 text-red-400 mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Matched Employees</h3>
                                            <p className="text-sm text-gray-500 mb-1">Logs were found on <strong>{sync.device.name}</strong> but no user IDs matched any employee.</p>
                                            <p className="text-xs text-red-500 mb-6">Use the Enrolled Users panel to add unmatched users to employees.</p>
                                        </>);
                                        return (<>
                                            <XCircle className="h-12 w-12 text-gray-400 mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Records Found</h3>
                                            <p className="text-xs text-gray-400 mb-6">All available logs were fetched but none were found on <strong>{sync.device.name}</strong>.</p>
                                        </>);
                                    })()}
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => removeSync(deviceId)} className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Close</button>
                                        <button type="button" onClick={() => { removeSync(deviceId); openFetchLogsModal(sync.device); }} className="px-4 py-2 text-sm rounded-md bg-green-600 text-white font-medium hover:bg-green-700">Try Again</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Handle test connection form input changes
    const handleTestConnectionChange = (e) => {
        const { name, value } = e.target;
        setTestConnectionData({ ...testConnectionData, [name]: value });
    };

    // Open modal for adding a new device
    const handleAddDevice = () => {
        setIsEditing(false);
        setCurrentDevice(null);
        setFormData({
            name: "",
            ip_address: "",
            port: "4370",
            location: "",
            model: "",
            serial_number: "",
            status: "active",
        });
        setScanResults([]);
        setShowModal(true);
    };

    // Handle subnet input for scanning

    // Scanner for ZKTeco devices on the network
    const handleScanNetwork = async (fixedSubnet) => {
        setIsScanning(true);
        setScanResults([]);
        setScanProgress(0);

        try {
            const scanToastId = toast.loading(
                `Scanning subnet ${fixedSubnet}.0/24 for ZKTeco devices...`,
            );

            const scanPayload = {
                subnet: fixedSubnet,
                port: 4370, // Default ZKTeco port
            };

            const response = await fetch(
                route("biometric-devices.scan-network"),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        "X-CSRF-TOKEN": document
                            .querySelector('meta[name="csrf-token"]')
                            .getAttribute("content"),
                    },
                    body: JSON.stringify(scanPayload),
                },
            );

            if (!response.ok) {
                throw new Error(`Network error: ${response.status}`);
            }

            const data = await response.json();

            setScanProgress(100);

            if (data.success && data.devices && data.devices.length > 0) {
                // Filter out devices that are already in the list
                const existingIPs = deviceList.map((device) => device.ip_address);
                const newDevices = data.devices.filter(
                    (device) => !existingIPs.includes(device.ip_address),
                );

                setScanResults(newDevices);

                if (newDevices.length > 0) {
                    toast.update(scanToastId, {
                        render: `Found ${newDevices.length} new ZKTeco device(s) on the network`,
                        type: "success",
                        isLoading: false,
                        autoClose: 3000,
                    });
                } else {
                    toast.update(scanToastId, {
                        render: "All ZKTeco devices on this network are already registered",
                        type: "info",
                        isLoading: false,
                        autoClose: 3000,
                    });
                }
            } else {
                toast.update(scanToastId, {
                    render: "No ZKTeco devices found on the network",
                    type: "info",
                    isLoading: false,
                    autoClose: 3000,
                });
            }
        } catch (error) {
            console.error("Network scan error:", error);
            toast.error(`Scan failed: ${error.message}`);
        } finally {
            setIsScanning(false);
        }
    };
    // Enhanced device selection handler with completion reminder
    const handleSelectDevice = (device) => {
        setFormData({
            ...formData,
            name: device.name || `ZKTeco Device (${device.ip_address})`,
            ip_address: device.ip_address,
            port: device.port.toString() || "4370",
            model: device.model || "",
            serial_number: device.serial_number || "",
            // Maintain other form values if they exist
            location: formData.location || "",
            status: formData.status || "active",
        });

        toast.info(
            <div>
                <p>Selected device: {device.name}</p>
                <p className="text-xs mt-1">
                    Please complete all required fields, especially the Location
                    field.
                </p>
            </div>,
            { autoClose: 3000 },
        );
    };

    // Open modal for editing an existing device
    const handleEditDevice = (device) => {
        setIsEditing(true);
        setCurrentDevice(device);
        setFormData({
            name: device.name,
            ip_address: device.ip_address,
            port: device.port.toString(),
            location: device.location,
            model: device.model || "",
            serial_number: device.serial_number || "",
            status: device.status,
        });
        setShowModal(true);
    };

    // Open confirmation modal for deleting a device
    const handleDeleteClick = (device) => {
        setDeviceToDelete(device);
        setShowDeleteConfirm(true);
    };

    // Updated handleSubmit function with validation prompt
    const handleSubmit = (e) => {
        e.preventDefault();

        // Check if required fields are filled
        const requiredFields = ["name", "ip_address", "port", "location"];
        const missingFields = requiredFields.filter(
            (field) => !formData[field],
        );

        if (missingFields.length > 0) {
            // Format field names for display (capitalize first letter, replace underscores with spaces)
            const formattedMissingFields = missingFields
                .map((field) =>
                    field
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase()),
                )
                .join(", ");

            toast.error(
                <div>
                    <p>
                        <strong>Please complete all required fields:</strong>
                    </p>
                    <p>{formattedMissingFields}</p>
                    <p className="text-xs mt-1">
                        Note: Device information obtained from scanning may need
                        to be supplemented with additional details.
                    </p>
                </div>,
                { autoClose: 5000 },
            );
            return;
        }

        if (isEditing && currentDevice) {
            // Update existing device — use POST + _method spoofing (reliable with Inertia v2)
            router.post(
                route("biometric-devices.update", { id: currentDevice.id }),
                { ...formData, _method: "PUT" },
                {
                    onSuccess: () => {
                        setShowModal(false);
                        toast.success("Device updated successfully");
                    },
                    onError: (errors) => {
                        console.error(errors);
                        Object.keys(errors).forEach((key) => {
                            toast.error(errors[key]);
                        });
                    },
                },
            );
        } else {
            // Create new device
            router.post(route("biometric-devices.store"), formData, {
                onSuccess: () => {
                    setShowModal(false);
                    toast.success("Device added successfully");
                },
                onError: (errors) => {
                    console.error(errors);
                    Object.keys(errors).forEach((key) => {
                        toast.error(errors[key]);
                    });
                },
            });
        }
    };

    // Handle device deletion
    const confirmDelete = async () => {
        if (!deviceToDelete) return;
        try {
            const res = await fetch(route("biometric-devices.destroy", deviceToDelete.id), {
                method: "DELETE",
                headers: { "Content-Type": "application/json", Accept: "application/json", "X-CSRF-TOKEN": csrfToken() },
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setDeviceList(prev => prev.filter(d => d.id !== deviceToDelete.id));
                setShowDeleteConfirm(false);
                setDeviceToDelete(null);
                toast.success("Device deleted successfully");
            } else {
                toast.error(data.message || "Failed to delete device");
            }
        } catch (err) {
            toast.error("Failed to delete device");
        }
    };

    // Open test connection modal
    const handleTestConnectionClick = (device = null) => {
        setTestingDevice(device ?? null);
        if (device) {
            setTestConnectionData({
                ip_address: device.ip_address,
                port: device.port.toString(),
            });
        } else {
            setTestConnectionData({
                ip_address: "",
                port: "4370",
            });
        }
        setTestResult(null);
        setShowTestModal(true);
    };

    // Test Connection Method
    const handleTestConnection = async (e) => {
        e.preventDefault();
        setIsTestingConnection(true);
        setTestResult(null);

        try {
            // Dynamically generate connection payload
            const connectionPayload = {
                ip_address: testConnectionData.ip_address,
                port: testConnectionData.port,
                serial_number: "", // Consider making this dynamic
                device_pin: "", // Consider making this dynamic
                verbose: true,
                connection_timeout: 10000, // 10-second timeout
                retry_attempts: 2, // Allow retry mechanism
                ...(testingDevice ? { device_id: testingDevice.id } : {}),
            };

            // Perform fetch request to test connection
            const response = await fetch(
                route("biometric-devices.test-connection"),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        "X-CSRF-TOKEN": document
                            .querySelector('meta[name="csrf-token"]')
                            .getAttribute("content"),
                    },
                    body: JSON.stringify(connectionPayload),
                },
            );

            // Validate response content type
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error(`Unexpected response type: ${contentType}`);
            }

            // Parse response data
            const data = await response.json();

            // Comprehensive logging
            console.group("Connection Test Details");
            console.log("Connection Payload:", connectionPayload);
            console.log("Server Response:", {
                success: data.success,
                message: data.message,
                deviceDetails: data.device_info,
            });
            console.groupEnd();

            // Update test result state
            setTestResult(data);

            // Update device status in local list if this test was for a specific device
            if (testingDevice) {
                const newStatus = data.success ? "active" : "inactive";
                setDeviceList((prev) =>
                    prev.map((d) =>
                        d.id === testingDevice.id ? { ...d, status: newStatus } : d,
                    ),
                );
            }

            // Sophisticated success/failure handling
            if (data.success) {
                toast.success(
                    testingDevice
                        ? `${testingDevice.name} is now Active`
                        : "Device Connection Verified",
                    { duration: 4000 },
                );
            } else {
                toast.error(
                    testingDevice
                        ? `${testingDevice.name} set to Inactive`
                        : "Connection Verification Failed",
                    {
                        description: data.message || "Unable to establish device connection",
                        duration: 4000,
                    },
                );
            }
        } catch (error) {
            // Comprehensive error handling
            console.group("Connection Test Error");
            console.error("Connection Authentication Error:", {
                name: error.name,
                message: error.message,
                stack: error.stack,
                connectionDetails: {
                    ipAddress: testConnectionData.ip_address,
                    port: testConnectionData.port,
                },
            });
            console.groupEnd();

            // Update test result with detailed error
            setTestResult({
                success: false,
                message: `Connection Error: ${error.message}`,
                recommendations: [
                    "Verify device IP and port",
                    "Check network connectivity",
                    "Confirm device is powered on",
                    "Validate device authentication credentials",
                ],
                detailedError: {
                    name: error.name,
                    message: error.message,
                    // Limit stack trace to first few lines
                    stack: error.stack
                        ? error.stack.split("\n").slice(0, 3).join("\n")
                        : "No stack trace available",
                },
            });

            // Enhanced error toast
            toast.error("Connection Test Failed", {
                description: `Detailed Error: ${error.message}\nCheck network, credentials, and device status`,
                duration: 5000,
            });
        } finally {
            // Always reset testing state
            setIsTestingConnection(false);
        }
    };

    // Diagnostic Method

    // Render device actions (including fetch logs)
    const renderDeviceActions = (device) => {
        return (
            <div className="flex justify-end space-x-2">
                <button
                    onClick={() => handleTestConnectionClick(device)}
                    className="text-indigo-600 hover:text-indigo-900"
                    title="Test Connection"
                >
                    <ServerCrash className="w-5 h-5" />
                </button>

                <button
                    onClick={() => setPythonSyncConfirmDevice(device)}
                    className="text-orange-600 hover:text-orange-900"
                    title="Sync (Python/pyzk)"
                >
                    <Cpu className="w-5 h-5" />
                </button>
                <button
                    onClick={() => handleViewUsers(device)}
                    className="text-purple-600 hover:text-purple-900"
                    title="View Enrolled Users"
                >
                    <Search className="w-5 h-5" />
                </button>
                <button
                    onClick={() => handleEditDevice(device)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit"
                >
                    <Edit className="w-5 h-5" />
                </button>
                <button
                    onClick={() => handleDeleteClick(device)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        );
    };

    // Safely display diagnostic results
    const renderDiagnosticResults = () => {
        if (!diagnosticResults || !diagnosticResults.results) {
            return null;
        }

        return (
            <div className="mt-4">
                <h4 className="font-medium text-gray-900">
                    Diagnostic Results
                </h4>

                <div className="mt-2 space-y-3">
                    {Object.entries(diagnosticResults.results || {}).map(
                        ([test, result]) => (
                            <div
                                key={test}
                                className={`p-3 rounded-md ${
                                    result.success ? "bg-green-50" : "bg-red-50"
                                }`}
                            >
                                <div className="flex items-center">
                                    {result.success ? (
                                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                                    )}
                                    <span className="font-medium capitalize">
                                        {test.replace("_", " ")}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-gray-600">
                                    {typeof result.details === "string"
                                        ? result.details
                                        : test === "device_info" &&
                                            result.success &&
                                            result.details
                                          ? Object.entries(result.details).map(
                                                ([key, value]) => (
                                                    <div
                                                        key={key}
                                                        className="flex justify-between mt-1"
                                                    >
                                                        <span className="text-xs text-gray-500 capitalize">
                                                            {key.replace(
                                                                "_",
                                                                " ",
                                                            )}
                                                            :
                                                        </span>
                                                        <span className="text-xs font-medium">
                                                            {value}
                                                        </span>
                                                    </div>
                                                ),
                                            )
                                          : JSON.stringify(
                                                result.details || {},
                                            )}
                                </p>
                            </div>
                        ),
                    )}
                </div>

                {diagnosticResults.recommendations &&
                    diagnosticResults.recommendations.length > 0 && (
                        <div className="mt-4 bg-blue-50 p-3 rounded-md">
                            <h5 className="font-medium text-blue-700">
                                Recommendations
                            </h5>
                            <ul className="mt-2 list-disc list-inside text-sm text-blue-700 space-y-1">
                                {diagnosticResults.recommendations.map(
                                    (rec, index) => (
                                        <li key={index}>{rec}</li>
                                    ),
                                )}
                            </ul>
                        </div>
                    )}
            </div>
        );
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Biometric Device Management" />
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ── Page Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#0D2E6E] flex items-center justify-center shadow-sm flex-shrink-0">
                            <Cpu className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 leading-tight">Biometric Device Management</h1>
                            <p className="text-sm text-gray-400 leading-none mt-0.5">Manage and monitor connected biometric devices</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleTestConnectionClick()}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all"
                        >
                            <ServerCrash className="w-4 h-4 text-gray-500" />
                            Test Connection
                        </button>
                        <button
                            onClick={handleAddDevice}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0D2E6E] text-white text-sm font-semibold hover:bg-[#0a2257] shadow-sm transition-all"
                        >
                            <PlusCircle className="w-4 h-4" />
                            Add Device
                        </button>
                    </div>
                </div>

                {/* ── Devices Table Card ── */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

                    {/* Stats bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 border-b border-gray-100">
                        {[
                            { label: 'Total Devices',   value: deviceList.length },
                            { label: 'Active',          value: deviceList.filter(d => d.status === 'active').length,   color: 'text-emerald-600' },
                            { label: 'Inactive',        value: deviceList.filter(d => d.status !== 'active').length,   color: 'text-red-500' },
                            { label: 'Synced Today',    value: deviceList.filter(d => d.last_sync && new Date(d.last_sync).toDateString() === new Date().toDateString()).length },
                        ].map(s => (
                            <div key={s.label} className="px-5 py-4">
                                <p className="text-xs text-gray-400 font-medium mb-1">{s.label}</p>
                                <p className={`text-2xl font-black ${s.color || 'text-gray-800'}`}>{s.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Device</th>
                                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">IP Address</th>
                                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Port</th>
                                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Last Sync</th>
                                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {!deviceList || deviceList.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-5 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                                                    <Cpu className="h-7 w-7 text-gray-300" />
                                                </div>
                                                <p className="text-sm font-semibold text-gray-500">No devices found</p>
                                                <p className="text-xs text-gray-400">Click <span className="font-semibold">Add Device</span> to register a biometric device.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    deviceList.map((device) => (
                                        <tr key={device.id} className="hover:bg-gray-50/60 transition-colors group">
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-[#0D2E6E]/8 flex items-center justify-center flex-shrink-0">
                                                        <Cpu className="h-4 w-4 text-[#0D2E6E]" />
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-900">{device.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-600 font-mono">{device.ip_address}</span>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-600 font-mono">{device.port}</span>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-600">{device.location}</span>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-500">
                                                    {device.last_sync
                                                        ? new Date(device.last_sync).toLocaleString('en-US', {
                                                              month: 'short', day: 'numeric', year: 'numeric',
                                                              hour: 'numeric', minute: '2-digit', hour12: true,
                                                          })
                                                        : <span className="text-gray-400 italic">Never</span>}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                    device.status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-red-50 text-red-600 border border-red-200'
                                                }`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${device.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                    {device.status === 'active' ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-right">
                                                {renderDeviceActions(device)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Sync confirmation modal */}
            {renderSyncConfirm()}

            {/* Python sync confirmation modal */}
            {renderPythonSyncConfirm()}

            {/* Fetch Matched Logs modal (with date filter) */}
            {renderFetchLogsModal()}

            {/* Floating chips for each active sync */}
            {renderSyncChips()}

            {/* Expanded modal for the focused sync */}
            {renderExpandedSync()}

            {/* Device Users Panel */}
            {showUsersPanel && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-start justify-center min-h-screen pt-10 px-4">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-50" onClick={() => setShowUsersPanel(false)} />
                        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Enrolled Users — {usersDevice?.name}
                                    </h3>
                                    {!usersLoading && (
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {deviceUsers.length} users &nbsp;·&nbsp;
                                            <span className="text-green-600">{deviceUsers.filter(u => u.matched).length} matched</span>
                                            &nbsp;·&nbsp;
                                            <span className="text-red-500">{deviceUsers.filter(u => !u.matched).length} unmatched</span>
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {!usersLoading && deviceUsers.some(u => u.matched) && (
                                        <button
                                            onClick={() => {
                                                setShowUsersPanel(false);
                                                openFetchLogsModal(usersDevice);
                                            }}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            Fetch Matched Logs
                                        </button>
                                    )}
                                    <button onClick={() => setShowUsersPanel(false)} className="text-gray-400 hover:text-gray-600">
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Filters */}
                            {!usersLoading && (
                                <div className="px-6 py-3 border-b border-gray-100 flex gap-3 items-center flex-wrap">
                                    <div className="relative flex-1 min-w-[180px]">
                                        <Search className="absolute left-2 top-2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search ID, name, employee..."
                                            className="pl-8 pr-3 py-1.5 w-full text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            value={usersFilter}
                                            onChange={e => setUsersFilter(e.target.value)}
                                        />
                                    </div>
                                    <select
                                        className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        value={usersMatchFilter}
                                        onChange={e => setUsersMatchFilter(e.target.value)}
                                    >
                                        <option value="all">All</option>
                                        <option value="matched">Matched only</option>
                                        <option value="unmatched">Unmatched only</option>
                                    </select>
                                </div>
                            )}

                            {/* Body */}
                            <div className="overflow-auto" style={{ maxHeight: '60vh' }}>
                                {usersLoading ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                        <Loader className="w-8 h-8 animate-spin mb-3" />
                                        <p className="text-sm">Fetching enrolled users from device...</p>
                                    </div>
                                ) : deviceUsers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                        <XCircle className="w-10 h-10 mb-3" />
                                        <p className="text-sm">No users enrolled on this device.</p>
                                    </div>
                                ) : (() => {
                                    const q = usersFilter.toLowerCase();
                                    const filtered = deviceUsers.filter(u => {
                                        const matchesSearch = !q ||
                                            u.userid?.toLowerCase().includes(q) ||
                                            u.name?.toLowerCase().includes(q) ||
                                            u.employee?.toLowerCase().includes(q) ||
                                            u.department?.toLowerCase().includes(q);
                                        const matchesStatus =
                                            usersMatchFilter === "all" ||
                                            (usersMatchFilter === "matched" && u.matched) ||
                                            (usersMatchFilter === "unmatched" && !u.matched);
                                        return matchesSearch && matchesStatus;
                                    });

                                    return filtered.length === 0 ? (
                                        <div className="text-center py-10 text-sm text-gray-400">No users match your filter.</div>
                                    ) : (
                                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    {['UID', 'User ID', 'Device Name', 'Employee', 'Department', 'Status', ''].map(h => (
                                                        <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {filtered.map((u, i) => (
                                                    <tr key={i} className={u.matched ? '' : 'bg-red-50'}>
                                                        <td className="px-4 py-2 text-gray-500">{u.uid}</td>
                                                        <td className="px-4 py-2 font-mono font-medium">{u.userid}</td>
                                                        <td className="px-4 py-2 text-gray-600">{u.name}</td>
                                                        <td className="px-4 py-2">{u.employee ?? <span className="text-red-400 italic">No match</span>}</td>
                                                        <td className="px-4 py-2 text-gray-500">{u.department ?? '—'}</td>
                                                        <td className="px-4 py-2">
                                                            {u.matched
                                                                ? <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle className="w-3.5 h-3.5" /> Matched</span>
                                                                : <span className="inline-flex items-center gap-1 text-red-500 text-xs font-medium"><XCircle className="w-3.5 h-3.5" /> Unmatched</span>}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {!u.matched && (
                                                                <button
                                                                    onClick={() => handleOpenAddEmployeeModal(u)}
                                                                    disabled={!!addingUsers[u.userid]}
                                                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap"
                                                                >
                                                                    {addingUsers[u.userid]
                                                                        ? <Loader className="w-3 h-3 animate-spin" />
                                                                        : <PlusCircle className="w-3 h-3" />}
                                                                    Add
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Employee Modal */}
            {showAddEmployeeModal && addEmployeeUser && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddEmployeeModal(false)}></div>
                    <div className="relative w-full max-w-md mx-4 my-6 bg-white rounded-xl shadow-2xl border border-gray-200 z-10">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-800">Add Employee</h3>
                                <p className="text-xs text-gray-500">Device User ID: <span className="font-mono font-medium">{addEmployeeUser.userid}</span></p>
                            </div>
                            <button onClick={() => setShowAddEmployeeModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="px-4 py-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-0.5">First Name</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={addEmployeeForm.Fname}
                                        onChange={e => setAddEmployeeForm(f => ({ ...f, Fname: e.target.value }))}
                                        placeholder="First name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Last Name</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={addEmployeeForm.Lname}
                                        onChange={e => setAddEmployeeForm(f => ({ ...f, Lname: e.target.value }))}
                                        placeholder="Last name"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-0.5">Middle Name</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={addEmployeeForm.MName}
                                    onChange={e => setAddEmployeeForm(f => ({ ...f, MName: e.target.value }))}
                                    placeholder="Middle name (optional)"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {/* Department combobox */}
                                <div className="relative">
                                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Department</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={addEmployeeForm.Department}
                                        onChange={e => { setAddEmployeeForm(f => ({ ...f, Department: e.target.value })); setOpenCombo('dept'); }}
                                        onFocus={() => setOpenCombo('dept')}
                                        onBlur={() => setTimeout(() => setOpenCombo(c => c === 'dept' ? null : c), 150)}
                                        placeholder="Select or type"
                                    />
                                    {openCombo === 'dept' && (() => {
                                        const q = addEmployeeForm.Department.toLowerCase();
                                        const filtered = departments.filter(d => d.toLowerCase().includes(q));
                                        return filtered.length > 0 ? (
                                            <ul className="absolute z-20 left-0 right-0 mt-0.5 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto text-sm">
                                                {filtered.map((d, i) => (
                                                    <li key={i} onMouseDown={() => { setAddEmployeeForm(f => ({ ...f, Department: d })); setOpenCombo(null); }}
                                                        className="px-2 py-1.5 cursor-pointer hover:bg-indigo-50 hover:text-indigo-700">
                                                        {d}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : null;
                                    })()}
                                </div>
                                {/* Job Title combobox */}
                                <div className="relative">
                                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Job Title</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={addEmployeeForm.Jobtitle}
                                        onChange={e => { setAddEmployeeForm(f => ({ ...f, Jobtitle: e.target.value })); setOpenCombo('jobtitle'); }}
                                        onFocus={() => setOpenCombo('jobtitle')}
                                        onBlur={() => setTimeout(() => setOpenCombo(c => c === 'jobtitle' ? null : c), 150)}
                                        placeholder="Select or type"
                                    />
                                    {openCombo === 'jobtitle' && (() => {
                                        const q = addEmployeeForm.Jobtitle.toLowerCase();
                                        const filtered = jobtitles.filter(j => j.toLowerCase().includes(q));
                                        return filtered.length > 0 ? (
                                            <ul className="absolute z-20 left-0 right-0 mt-0.5 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto text-sm">
                                                {filtered.map((j, i) => (
                                                    <li key={i} onMouseDown={() => { setAddEmployeeForm(f => ({ ...f, Jobtitle: j })); setOpenCombo(null); }}
                                                        className="px-2 py-1.5 cursor-pointer hover:bg-indigo-50 hover:text-indigo-700">
                                                        {j}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : null;
                                    })()}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-0.5">Status</label>
                                <select
                                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={addEmployeeForm.JobStatus}
                                    onChange={e => setAddEmployeeForm(f => ({ ...f, JobStatus: e.target.value }))}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                            <button
                                onClick={() => setShowAddEmployeeModal(false)}
                                className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddDeviceUser}
                                className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 inline-flex items-center gap-1"
                            >
                                <PlusCircle className="w-3.5 h-3.5" />
                                Save Employee
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Device Modal with Device Discovery */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
                    {/* Overlay with blur effect */}
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowModal(false)}
                    ></div>

                    {/* Modal Container */}
                    <div className="relative w-full max-w-2xl mx-4 my-6 transition-all duration-300 ease-in-out transform">
                        <div className="relative flex flex-col w-full bg-white rounded-xl shadow-2xl border border-gray-200">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-5 border-b border-gray-200 rounded-t-xl bg-gray-50">
                                <h3 className="text-xl font-semibold text-gray-900">
                                    {isEditing
                                        ? "Edit Device"
                                        : "Add New Device"}
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                            clipRule="evenodd"
                                        ></path>
                                    </svg>
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form
                                id="device-form"
                                onSubmit={handleSubmit}
                                className="p-6 space-y-6"
                            >
                                {/* Device Discovery Section */}
                                {!isEditing && (
                                    <div className="mb-6">
                                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-indigo-800 font-medium">
                                                    Network Device Discovery
                                                </h4>
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                                    onClick={() =>
                                                        handleScanNetwork(
                                                            "10.151.5",
                                                        )
                                                    }
                                                    disabled={isScanning}
                                                >
                                                    {isScanning ? (
                                                        <>
                                                            <Loader className="animate-spin w-4 h-4 mr-2" />
                                                            Scanning...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Search className="w-4 h-4 mr-2" />
                                                            Scan Network
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            {/* Improved Progress Bar */}
                                            {isScanning && (
                                                <div className="mt-3">
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                                        <div
                                                            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                                                            style={{
                                                                width: `${scanProgress}%`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                        <span>Scanning...</span>
                                                        <span>
                                                            {Math.round(
                                                                scanProgress,
                                                            )}
                                                            % Complete
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Scan Results with Enhanced Design */}
                                        {scanResults.length > 0 && (
                                            <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                                    <h5 className="text-sm font-semibold text-gray-700">
                                                        Found{" "}
                                                        {scanResults.length}{" "}
                                                        Device
                                                        {scanResults.length > 1
                                                            ? "s"
                                                            : ""}
                                                    </h5>
                                                </div>
                                                <div className="max-h-56 overflow-y-auto">
                                                    {scanResults.map(
                                                        (device, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 group"
                                                            >
                                                                <div className="flex-1">
                                                                    <div className="font-medium text-gray-800 group-hover:text-indigo-600">
                                                                        {device.name ||
                                                                            `ZKTeco Device (${device.ip_address})`}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 mt-1 space-x-2">
                                                                        <span>
                                                                            IP:{" "}
                                                                            {
                                                                                device.ip_address
                                                                            }
                                                                        </span>
                                                                        <span>
                                                                            •
                                                                        </span>
                                                                        <span>
                                                                            Port:{" "}
                                                                            {device.port ||
                                                                                4370}
                                                                        </span>
                                                                    </div>
                                                                    {(device.model ||
                                                                        device.serial_number) && (
                                                                        <div className="text-xs text-gray-500 mt-1">
                                                                            {device.model && (
                                                                                <span>
                                                                                    Model:{" "}
                                                                                    {
                                                                                        device.model
                                                                                    }
                                                                                </span>
                                                                            )}
                                                                            {device.serial_number && (
                                                                                <span className="ml-2">
                                                                                    S/N:{" "}
                                                                                    {
                                                                                        device.serial_number
                                                                                    }
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    className="ml-4 px-3 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-md hover:bg-indigo-200 transition-colors"
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        handleSelectDevice(
                                                                            device,
                                                                        );
                                                                    }}
                                                                >
                                                                    Select
                                                                </button>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Form Fields Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label
                                            htmlFor="name"
                                            className="block text-sm font-medium text-gray-700 mb-1"
                                        >
                                            Device Name{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            id="name"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all duration-200"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                        {!formData.name && (
                                            <p className="mt-1 text-xs text-red-500">
                                                Device name is required
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="ip_address"
                                            className="block text-sm font-medium text-gray-700 mb-1"
                                        >
                                            IP Address{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            name="ip_address"
                                            id="ip_address"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all duration-200"
                                            value={formData.ip_address}
                                            onChange={handleChange}
                                            placeholder="192.168.1.100"
                                            required
                                        />
                                        {!formData.ip_address && (
                                            <p className="mt-1 text-xs text-red-500">
                                                IP address is required
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="port"
                                            className="block text-sm font-medium text-gray-700 mb-1"
                                        >
                                            Port{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="number"
                                            name="port"
                                            id="port"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all duration-200"
                                            value={formData.port}
                                            onChange={handleChange}
                                            min="1"
                                            max="65535"
                                            placeholder="4370"
                                            required
                                        />
                                        {!formData.port && (
                                            <p className="mt-1 text-xs text-red-500">
                                                Port is required
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="location"
                                            className="block text-sm font-medium text-gray-700 mb-1"
                                        >
                                            Location{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            name="location"
                                            id="location"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all duration-200"
                                            value={formData.location}
                                            onChange={handleChange}
                                            placeholder="Main Office"
                                            required
                                        />
                                        {!formData.location && (
                                            <p className="mt-1 text-xs text-red-500">
                                                Location is required
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="model"
                                            className="block text-sm font-medium text-gray-700 mb-1"
                                        >
                                            Model
                                        </label>
                                        <input
                                            type="text"
                                            name="model"
                                            id="model"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all duration-200"
                                            value={formData.model}
                                            onChange={handleChange}
                                            placeholder="ZKTeco K40"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="serial_number"
                                            className="block text-sm font-medium text-gray-700 mb-1"
                                        >
                                            Serial Number
                                        </label>
                                        <input
                                            type="text"
                                            name="serial_number"
                                            id="serial_number"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all duration-200"
                                            value={formData.serial_number}
                                            onChange={handleChange}
                                            placeholder="ZK12345678"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="status"
                                            className="block text-sm font-medium text-gray-700 mb-1"
                                        >
                                            Status{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            name="status"
                                            id="status"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all duration-200"
                                            value={formData.status}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="active">
                                                Active
                                            </option>
                                            <option value="inactive">
                                                Inactive
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                {/* Required Fields Note */}
                                <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center">
                                    <svg
                                        className="w-5 h-5 text-yellow-500 mr-3"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        ></path>
                                    </svg>
                                    <p className="text-xs text-yellow-800">
                                        <span className="font-semibold">
                                            Note:
                                        </span>{" "}
                                        Fields marked with an asterisk (
                                        <span className="text-red-500">*</span>)
                                        are required. Ensure all mandatory
                                        fields are completed.
                                    </p>
                                </div>
                            </form>

                            {/* Modal Footer */}
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 rounded-b-xl">
                                <button
                                    type="button"
                                    className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="device-form"
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                                >
                                    {isEditing ? "Update Device" : "Add Device"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Test Connection Modal */}
            {showTestModal && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div
                            className="fixed inset-0 transition-opacity"
                            aria-hidden="true"
                        >
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <span
                            className="hidden sm:inline-block sm:align-middle sm:h-screen"
                            aria-hidden="true"
                        >
                            &#8203;
                        </span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleTestConnection}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                            <ServerCrash className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                                Test Biometric Device Connection
                                            </h3>
                                            <div className="mt-4 space-y-4">
                                                <div>
                                                    <label
                                                        htmlFor="test_ip_address"
                                                        className="block text-sm font-medium text-gray-700"
                                                    >
                                                        IP Address
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="ip_address"
                                                        id="test_ip_address"
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                        value={
                                                            testConnectionData.ip_address
                                                        }
                                                        onChange={
                                                            handleTestConnectionChange
                                                        }
                                                        placeholder="192.168.1.100"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label
                                                        htmlFor="test_port"
                                                        className="block text-sm font-medium text-gray-700"
                                                    >
                                                        Port
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="port"
                                                        id="test_port"
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                        value={
                                                            testConnectionData.port
                                                        }
                                                        onChange={
                                                            handleTestConnectionChange
                                                        }
                                                        min="1"
                                                        max="65535"
                                                        placeholder="4370"
                                                        required
                                                    />
                                                </div>

                                                {testResult && (
                                                    <div
                                                        className={`mt-4 p-3 rounded-md ${
                                                            testResult.success
                                                                ? "bg-green-50"
                                                                : "bg-red-50"
                                                        }`}
                                                    >
                                                        <div className="flex items-center">
                                                            {testResult.success ? (
                                                                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                                            ) : (
                                                                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                                                            )}
                                                            <span className="font-medium">
                                                                {testResult.success
                                                                    ? "Connection Successful"
                                                                    : "Connection Failed"}
                                                            </span>
                                                        </div>
                                                        {testResult.message && (
                                                            <p className="mt-1 text-sm text-gray-600">
                                                                {
                                                                    testResult.message
                                                                }
                                                            </p>
                                                        )}
                                                        {testResult.device_info && (
                                                            <div className="mt-2 pt-2 border-t border-gray-200">
                                                                <h4 className="text-sm font-medium text-gray-700">
                                                                    Device
                                                                    Information
                                                                </h4>
                                                                <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                                                    {Object.entries(
                                                                        testResult.device_info,
                                                                    ).map(
                                                                        ([
                                                                            key,
                                                                            value,
                                                                        ]) => (
                                                                            <div
                                                                                key={
                                                                                    key
                                                                                }
                                                                            >
                                                                                <dt className="text-gray-500 capitalize">
                                                                                    {key.replace(
                                                                                        "_",
                                                                                        " ",
                                                                                    )}
                                                                                </dt>
                                                                                <dd className="font-medium">
                                                                                    {
                                                                                        value
                                                                                    }
                                                                                </dd>
                                                                            </div>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        disabled={isTestingConnection}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                    >
                                        {isTestingConnection
                                            ? "Testing..."
                                            : "Test Connection"}
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                        onClick={() => setShowTestModal(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Diagnostic Modal */}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div
                            className="fixed inset-0 transition-opacity"
                            aria-hidden="true"
                        >
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <span
                            className="hidden sm:inline-block sm:align-middle sm:h-screen"
                            aria-hidden="true"
                        >
                            &#8203;
                        </span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <Trash2 className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Delete Biometric Device
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                Are you sure you want to delete
                                                the device "
                                                {deviceToDelete?.name}"? This
                                                action cannot be undone and will
                                                remove all associated data.
                                            </p>
                                            <div className="mt-3 bg-gray-50 p-3 rounded-md">
                                                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                                    <div>
                                                        <dt className="text-gray-500">
                                                            Name
                                                        </dt>
                                                        <dd className="font-medium">
                                                            {
                                                                deviceToDelete?.name
                                                            }
                                                        </dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-gray-500">
                                                            IP Address
                                                        </dt>
                                                        <dd className="font-medium">
                                                            {
                                                                deviceToDelete?.ip_address
                                                            }
                                                        </dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-gray-500">
                                                            Location
                                                        </dt>
                                                        <dd className="font-medium">
                                                            {
                                                                deviceToDelete?.location
                                                            }
                                                        </dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-gray-500">
                                                            Status
                                                        </dt>
                                                        <dd className="font-medium">
                                                            <span
                                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                    deviceToDelete?.status ===
                                                                    "active"
                                                                        ? "bg-green-100 text-green-800"
                                                                        : "bg-red-100 text-red-800"
                                                                }`}
                                                            >
                                                                {
                                                                    deviceToDelete?.status
                                                                }
                                                            </span>
                                                        </dd>
                                                    </div>
                                                </dl>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={confirmDelete}
                                >
                                    Delete Device
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setShowDeleteConfirm(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer />
        </AuthenticatedLayout>
    );
};

export default BiometricManagement;
