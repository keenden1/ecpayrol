import React, { useState, useEffect, useCallback } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DeductionsTable from './DeductionsTable';
import DeductionsFilters from './DeductionsFilters';
import DeductionsStatusCards from './DeductionsStatusCards';
import { Button } from '@/Components/ui/Button';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { 
    Search, 
    Calendar,
    FileText,
    Download,
    Upload,
    Plus,
    Save,
    AlertCircle,
    Trash2
} from 'lucide-react';
import ConfirmModal from '@/Components/ConfirmModal';
import axios from 'axios';
import { debounce } from 'lodash';
import * as XLSX from 'xlsx';

const DeductionsPage = ({ employees: initialEmployees, cutoff: initialCutoff, month: initialMonth, year: initialYear, search: initialSearch, status, dateRange, flash }) => {
    // Make sure we safely access auth and user
    const { auth } = usePage().props || {};
    const user = auth?.user || {};
    
    const [employees, setEmployees] = useState(initialEmployees?.data || []);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        cutoff: initialCutoff || '1st',
        month: initialMonth || new Date().getMonth() + 1,
        year: initialYear || new Date().getFullYear(),
        search: initialSearch || '',
    });
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: '',
        confirmVariant: 'destructive',
        onConfirm: () => {}
    });
    const [alertMessage, setAlertMessage] = useState(flash?.message || null);
    const [pagination, setPagination] = useState({
        currentPage: initialEmployees?.current_page || 1,
        perPage: initialEmployees?.per_page || 50,
        total: initialEmployees?.total || 0,
    });
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);

    // Update pagination when initialEmployees changes
    useEffect(() => {
        if (initialEmployees) {
            setPagination({
                currentPage: initialEmployees.current_page || 1,
                perPage: initialEmployees.per_page || 50,
                total: initialEmployees.total || 0,
            });
            setEmployees(initialEmployees.data || []);
        }
    }, [initialEmployees]);

    // Handle filter changes
    const handleFilterChange = (name, value) => {
        setFilters(prev => {
            const newFilters = {
                ...prev,
                [name]: value
            };
            
            // Reset page to 1 when filters change
            if (name !== 'page') {
                return {
                    ...newFilters,
                    page: 1
                };
            }
            
            return newFilters;
        });
    };

    // Debounced search to prevent too many requests
    const debouncedSearch = useCallback(
        debounce((value) => {
            handleFilterChange('search', value);
        }, 300),
        []
    );

    // Apply filters and reload data
    const applyFilters = () => {
        setLoading(true);
        router.visit(
            `/deductions?cutoff=${filters.cutoff}&month=${filters.month}&year=${filters.year}&search=${filters.search}`,
            {
                preserveState: true,
                preserveScroll: true,
                only: ['employees', 'status', 'dateRange'],
                onFinish: () => setLoading(false)
            }
        );
    };

    // Watch for filter changes and apply them
    useEffect(() => {
        applyFilters();
    }, [filters.cutoff, filters.month, filters.year, filters.search]);

    // Handle table cell update
    const handleCellUpdate = async (deductionId, field, value) => {
        try {
            const response = await axios.patch(`/deductions/${deductionId}/field`, { 
                field: field,
                value: value
            });
            
            // Update the employees state to reflect the change
            setEmployees(currentEmployees => 
                currentEmployees.map(employee => {
                    if (employee.deductions && employee.deductions.length > 0 && employee.deductions[0].id === deductionId) {
                        const updatedDeductions = [...employee.deductions];
                        updatedDeductions[0] = response.data;
                        return { ...employee, deductions: updatedDeductions };
                    }
                    return employee;
                })
            );
            
        } catch (error) {
            console.error('Error updating deduction:', error);
            setAlertMessage(error.response?.data?.message || 'Error updating deduction');
            setTimeout(() => setAlertMessage(null), 3000);
        }
    };

    // Modified createDeduction method to better handle async creation
    const createDeduction = async (employeeId) => {
        try {
            setLoading(true);
            const response = await axios.post('/deductions/create-from-default', {
                employee_id: employeeId,
                cutoff: filters.cutoff,
                date: new Date(`${filters.year}-${filters.month}-${filters.cutoff === '1st' ? 15 : 28}`).toISOString().split('T')[0]
            });
            
            // Update the employees state to add the new deduction
            setEmployees(currentEmployees => 
                currentEmployees.map(employee => {
                    if (employee.id === employeeId) {
                        return { 
                            ...employee, 
                            deductions: [response.data, ...(employee.deductions || [])] 
                        };
                    }
                    return employee;
                })
            );
            
            return response.data;
        } catch (error) {
            console.error('Error creating deduction:', error);
            setAlertMessage(error.response?.data?.message || 'Error creating deduction');
            setTimeout(() => setAlertMessage(null), 3000);
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Post a single deduction
    const postDeduction = async (deductionId) => {
        try {
            const response = await axios.post(`/deductions/${deductionId}/post`);
            
            // Update the employees state to reflect the posted deduction
            setEmployees(currentEmployees => 
                currentEmployees.map(employee => {
                    if (employee.deductions && employee.deductions.length > 0 && employee.deductions[0].id === deductionId) {
                        const updatedDeductions = [...employee.deductions];
                        updatedDeductions[0] = response.data;
                        return { ...employee, deductions: updatedDeductions };
                    }
                    return employee;
                })
            );
            
            // Also update the status counts
            applyFilters();
            
            setAlertMessage('Deduction posted successfully');
            setTimeout(() => setAlertMessage(null), 3000);
        } catch (error) {
            console.error('Error posting deduction:', error);
            setAlertMessage(error.response?.data?.message || 'Error posting deduction');
            setTimeout(() => setAlertMessage(null), 3000);
        }
    };

    // Bulk post deductions
    const bulkPostDeductions = async (deductionIds) => {
        if (!deductionIds || deductionIds.length === 0) return;
        
        try {
            setLoading(true);
            
            const response = await axios.post('/deductions/bulk-post', {
                deduction_ids: deductionIds
            });
            
            // Refresh data instead of manual state update
            applyFilters();
            
            setAlertMessage(`Successfully posted ${deductionIds.length} deductions`);
            setTimeout(() => setAlertMessage(null), 3000);
        } catch (error) {
            console.error('Error posting deductions in bulk:', error);
            setAlertMessage(error.response?.data?.message || 'Error posting deductions');
            setTimeout(() => setAlertMessage(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    // Bulk set default deductions
    const bulkSetDefaultDeductions = async (deductionIds) => {
        if (!deductionIds || deductionIds.length === 0) return;
        
        try {
            setLoading(true);
            
            const response = await axios.post('/deductions/bulk-set-default', {
                deduction_ids: deductionIds
            });
            
            // Refresh data
            applyFilters();
            
            setAlertMessage(`Successfully set ${deductionIds.length} deductions as default`);
            setTimeout(() => setAlertMessage(null), 3000);
        } catch (error) {
            console.error('Error setting default deductions in bulk:', error);
            setAlertMessage(error.response?.data?.message || 'Error setting default deductions');
            setTimeout(() => setAlertMessage(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    // Post all deductions
    const postAllDeductions = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Post All Deductions',
            message: `Are you sure you want to post all deductions for the ${filters.cutoff} cutoff of ${filters.month}/${filters.year}? This action cannot be undone.`,
            confirmText: 'Post All',
            confirmVariant: 'destructive',
            onConfirm: async () => {
                try {
                    setLoading(true);
                    
                    const response = await axios.post('/deductions/post-all', {
                        cutoff: filters.cutoff,
                        start_date: dateRange.start,
                        end_date: dateRange.end
                    });
                    
                    // Reload data after posting
                    applyFilters();
                    
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    setAlertMessage(`${response.data.updated_count} deductions posted successfully`);
                    setTimeout(() => setAlertMessage(null), 3000);
                } catch (error) {
                    console.error('Error posting all deductions:', error);
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    setAlertMessage(error.response?.data?.message || 'Error posting deductions');
                    setTimeout(() => setAlertMessage(null), 3000);
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    // Delete all not posted deductions
    const deleteAllNotPostedDeductions = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete All Not Posted Deductions',
            message: `Are you sure you want to delete ALL not posted deductions for the ${filters.cutoff} cutoff of ${filters.month}/${filters.year}? This action cannot be undone.`,
            confirmText: 'Delete All Not Posted',
            confirmVariant: 'destructive',
            onConfirm: async () => {
                try {
                    setLoading(true);
                    
                    const response = await axios.post('/deductions/delete-all-not-posted', {
                        cutoff: filters.cutoff,
                        start_date: dateRange.start,
                        end_date: dateRange.end
                    });
                    
                    // Reload data after deletion
                    applyFilters();
                    
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    setAlertMessage(`${response.data.deleted_count} not posted deductions deleted successfully`);
                    setTimeout(() => setAlertMessage(null), 3000);
                } catch (error) {
                    console.error('Error deleting not posted deductions:', error);
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    setAlertMessage(error.response?.data?.message || 'Error deleting deductions');
                    setTimeout(() => setAlertMessage(null), 3000);
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    // Create deductions for all active employees
    const createBulkDeductions = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Create Deductions for All Employees',
            message: `This will create deduction entries for all active employees for the ${filters.cutoff} cutoff of ${filters.month}/${filters.year} using their default values.`,
            confirmText: 'Create Deductions',
            confirmVariant: 'default',
            onConfirm: async () => {
                try {
                    setLoading(true);
                    
                    const response = await axios.post('/deductions/bulk-create', {
                        cutoff: filters.cutoff,
                        date: new Date(`${filters.year}-${filters.month}-${filters.cutoff === '1st' ? 15 : 28}`).toISOString().split('T')[0]
                    });
                    
                    // Reload data after creating
                    applyFilters();
                    
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    setAlertMessage(`${response.data.created_count} deduction entries created successfully`);
                    setTimeout(() => setAlertMessage(null), 3000);
                } catch (error) {
                    console.error('Error creating bulk deductions:', error);
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    setAlertMessage(error.response?.data?.message || 'Error creating deductions');
                    setTimeout(() => setAlertMessage(null), 3000);
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    // Set a deduction as default
    const setDefaultDeduction = async (deductionId) => {
        try {
            const response = await axios.post(`/deductions/${deductionId}/set-default`);
            
            // Update employees state to reflect the change
            setEmployees(currentEmployees => 
                currentEmployees.map(employee => {
                    if (employee.deductions && employee.deductions.length > 0 && employee.deductions[0].id === deductionId) {
                        const updatedDeductions = [...employee.deductions];
                        updatedDeductions[0] = response.data;
                        return { ...employee, deductions: updatedDeductions };
                    }
                    return employee;
                })
            );
            
            setAlertMessage('Default deduction set successfully');
            setTimeout(() => setAlertMessage(null), 3000);
        } catch (error) {
            console.error('Error setting default deduction:', error);
            setAlertMessage(error.response?.data?.message || 'Error setting default deduction');
            setTimeout(() => setAlertMessage(null), 3000);
        }
    };

    // Handle pagination
    const handlePageChange = (page) => {
        setLoading(true);
        router.visit(
            `/deductions?cutoff=${filters.cutoff}&month=${filters.month}&year=${filters.year}&search=${filters.search}&page=${page}`,
            {
                preserveState: true,
                preserveScroll: true,
                only: ['employees'],
                onFinish: () => setLoading(false)
            }
        );
    };

    // Export to Excel
    const exportToExcel = () => {
        window.location.href = `/deductions/export?cutoff=${filters.cutoff}&month=${filters.month}&year=${filters.year}&search=${filters.search}`;
    };

    // Download template
    const downloadTemplate = () => {
        window.location.href = '/deductions/template/download';
    };

    // Handle import
    const handleImport = async () => {
        if (!importFile) {
            setAlertMessage('Please select a file to import');
            setTimeout(() => setAlertMessage(null), 3000);
            return;
        }

        const formData = new FormData();
        formData.append('file', importFile);
        formData.append('cutoff', filters.cutoff);
        formData.append('date', new Date(`${filters.year}-${filters.month}-${filters.cutoff === '1st' ? 15 : 28}`).toISOString().split('T')[0]);

        try {
            setLoading(true);
            const response = await axios.post('/deductions/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setShowImportModal(false);
            setImportFile(null);
            applyFilters();
            
            if (response.data.errors && response.data.errors.length > 0) {
                setAlertMessage(`Import completed with ${response.data.errors.length} errors. Check console for details.`);
                console.log('Import errors:', response.data.errors);
            } else {
                setAlertMessage(`Successfully imported ${response.data.imported_count} deductions`);
            }
            setTimeout(() => setAlertMessage(null), 5000);
        } catch (error) {
            console.error('Error importing deductions:', error);
            setAlertMessage(error.response?.data?.message || 'Error importing deductions');
            setTimeout(() => setAlertMessage(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    // Generate months
    const months = [
        { id: 1, name: 'January' },
        { id: 2, name: 'February' },
        { id: 3, name: 'March' },
        { id: 4, name: 'April' },
        { id: 5, name: 'May' },
        { id: 6, name: 'June' },
        { id: 7, name: 'July' },
        { id: 8, name: 'August' },
        { id: 9, name: 'September' },
        { id: 10, name: 'October' },
        { id: 11, name: 'November' },
        { id: 12, name: 'December' }
    ];

    // Generate years (current year ± 2 years)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    return (
        <AuthenticatedLayout user={user}>
            <Head title="Employee Deductions" />
            <div className="max-w-7xl mx-auto">
                        {alertMessage && (
                            <Alert className="mb-4">
                                <AlertDescription>{alertMessage}</AlertDescription>
                            </Alert>
                        )}

                        {/* Header Section */}
                        <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-2xl px-6 py-6 overflow-hidden shadow-lg mb-6">
                            <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
                            <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                <div>
                                    <p className="text-indigo-200 text-xs font-medium mb-1">Payroll</p>
                                    <h1 className="text-xl font-bold text-white">Employee Deductions Management</h1>
                                    <p className="text-indigo-200 text-xs mt-1">
                                        Manage employee deductions including advances, charges, meals, and miscellaneous deductions.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2 items-end">
                                    <div className="flex items-center gap-2 flex-wrap justify-end">
                                        <button
                                            onClick={() => setShowImportModal(true)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-colors"
                                        >
                                            <Upload className="w-3.5 h-3.5" />
                                            Import
                                        </button>
                                        <button
                                            onClick={exportToExcel}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            Export
                                        </button>
                                        <button
                                            onClick={createBulkDeductions}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-white/20 hover:bg-white/30 transition-colors"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Create All
                                        </button>
                                        <button
                                            onClick={deleteAllNotPostedDeductions}
                                            disabled={status?.pendingCount === 0}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete All Not Posted
                                        </button>
                                        <button
                                            onClick={postAllDeductions}
                                            disabled={status?.pendingCount === 0}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors disabled:opacity-50"
                                        >
                                            <Save className="w-3.5 h-3.5" />
                                            Post All
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Status Cards */}
                        <DeductionsStatusCards 
                            total={status?.allCount || 0}
                            posted={status?.postedCount || 0}
                            pending={status?.pendingCount || 0}
                        />

                        {/* Filters */}
                        <DeductionsFilters 
                            filters={filters}
                            months={months}
                            years={years}
                            onFilterChange={handleFilterChange}
                            onSearch={debouncedSearch}
                        />

                        {/* Deductions Table */}
                        <div className="bg-white rounded-lg shadow mt-6">
                            <DeductionsTable
                                employees={employees}
                                loading={loading}
                                onCellUpdate={handleCellUpdate}
                                onCreateDeduction={createDeduction}
                                onPostDeduction={postDeduction}
                                onSetDefault={setDefaultDeduction}
                                onBulkPostDeductions={bulkPostDeductions}
                                onBulkSetDefaultDeductions={bulkSetDefaultDeductions}
                                pagination={{
                                    ...pagination,
                                    onPageChange: handlePageChange,
                                    links: initialEmployees?.links || []
                                }}
                            />
                        </div>

                        {/* Import Modal */}
                        {showImportModal && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                                <div className="bg-white rounded-lg max-w-md w-full p-6">
                                    <h3 className="text-lg font-semibold mb-4">Import Deductions</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Select Excel File
                                            </label>
                                            <input
                                                type="file"
                                                accept=".xlsx,.xls,.csv"
                                                onChange={(e) => setImportFile(e.target.files[0])}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                            />
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            <p>Import will use current filter settings:</p>
                                            <ul className="list-disc list-inside mt-1">
                                                <li>Cutoff: {filters.cutoff}</li>
                                                <li>Period: {filters.month}/{filters.year}</li>
                                            </ul>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                onClick={downloadTemplate}
                                                variant="outline"
                                                size="sm"
                                                className="flex items-center"
                                            >
                                                <Download className="w-4 h-4 mr-1" />
                                                Download Template
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex justify-end space-x-3 mt-6">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setShowImportModal(false);
                                                setImportFile(null);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleImport}
                                            disabled={!importFile || loading}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            {loading ? 'Importing...' : 'Import'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Confirm Modal */}
                        <ConfirmModal
                            isOpen={confirmModal.isOpen}
                            onClose={() => setConfirmModal({...confirmModal, isOpen: false})}
                            title={confirmModal.title}
                            message={confirmModal.message}
                            confirmText={confirmModal.confirmText}
                            confirmVariant={confirmModal.confirmVariant}
                            onConfirm={confirmModal.onConfirm}
                        />
                    </div>
                
            
        </AuthenticatedLayout>
    );
};

export default DeductionsPage;