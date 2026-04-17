import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
  Search, Calendar, Filter, Download, Trash2, RefreshCw, Users, 
  Calculator, FileText, AlertTriangle, CheckCircle, Clock, Target, 
  Eye, X, User, Building, DollarSign, TrendingUp, Edit, Check, 
  XCircle, Play, Pause, CreditCard, BarChart3, FileSpreadsheet,
  PlusCircle, Settings, Award, AlertCircle, ChevronRight, Zap
} from 'lucide-react';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';

// Final Payroll Generation Modal
const FinalPayrollGenerationModal = ({ isOpen, onClose, filters, onGenerate }) => {
  const [loading, setLoading] = useState(false);
  const [availableSummaries, setAvailableSummaries] = useState([]);
  const [selectedSummaries, setSelectedSummaries] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [generationOptions, setGenerationOptions] = useState({
    include_benefits: true,
    include_deductions: true,
    force_regenerate: false,
    auto_approve: false
  });

  useEffect(() => {
    if (isOpen) {
      loadAvailableSummaries();
    }
  }, [isOpen, filters]);

  const loadAvailableSummaries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('year', filters.year);
      params.append('month', filters.month);
      if (filters.periodType) params.append('period_type', filters.periodType);
      if (filters.department) params.append('department', filters.department);
      params.append('status', 'posted'); // Only posted summaries

      const response = await fetch('/api/comprehensive-payroll-summaries/available-for-final-payroll?' + params.toString(), {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setAvailableSummaries(data.data);
        setSelectedSummaries([]);
        setSelectAll(false);
      } else {
        alert(data.message || 'Failed to load available summaries');
      }
    } catch (err) {
      console.error('Error loading available summaries:', err);
      alert('Failed to load available summaries');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedSummaries([]);
    } else {
      setSelectedSummaries(availableSummaries.map(s => s.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectSummary = (summaryId) => {
    setSelectedSummaries(prev => {
      if (prev.includes(summaryId)) {
        return prev.filter(id => id !== summaryId);
      } else {
        return [...prev, summaryId];
      }
    });
  };

  const handleGenerate = async () => {
    if (selectedSummaries.length === 0) {
      alert('Please select at least one payroll summary to generate final payroll');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/final-payrolls/generate-from-summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          summary_ids: selectedSummaries,
          ...generationOptions,
          year: filters.year,
          month: filters.month,
          period_type: filters.periodType,
          department: filters.department
        })
      });

      const data = await response.json();
      
      if (data.success) {
        onGenerate(data);
        onClose();
      } else {
        alert(data.message || 'Failed to generate final payroll');
      }
    } catch (err) {
      console.error('Error generating final payroll:', err);
      alert('Failed to generate final payroll');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-lg max-w-6xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <Zap className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              Generate Final Payroll
            </h2>
            <span className="text-sm text-gray-500">
              ({availableSummaries.length} summaries available)
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Generation Options */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Generation Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={generationOptions.include_benefits}
                  onChange={(e) => setGenerationOptions(prev => ({
                    ...prev,
                    include_benefits: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Include Benefits</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={generationOptions.include_deductions}
                  onChange={(e) => setGenerationOptions(prev => ({
                    ...prev,
                    include_deductions: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Include Deductions</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={generationOptions.force_regenerate}
                  onChange={(e) => setGenerationOptions(prev => ({
                    ...prev,
                    force_regenerate: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">Force Regenerate (overwrite existing)</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={generationOptions.auto_approve}
                  onChange={(e) => setGenerationOptions(prev => ({
                    ...prev,
                    auto_approve: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Auto-approve generated payrolls</span>
              </label>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2 text-lg">Loading available summaries...</span>
            </div>
          ) : availableSummaries.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No summaries available</h3>
              <p className="text-gray-500">
                All posted payroll summaries for this period already have final payrolls generated.
                <br />
                Enable "Force Regenerate" to recreate existing final payrolls.
              </p>
            </div>
          ) : (
            <>
              {/* Selection Header */}
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Select All ({availableSummaries.length} summaries)
                  </span>
                </label>
                <span className="text-sm text-gray-600">
                  {selectedSummaries.length} selected
                </span>
              </div>

              {/* Available Summaries List */}
              <div className="max-h-96 overflow-y-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">OT Hours</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Deductions</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Benefits</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {availableSummaries.map((summary) => (
                      <tr 
                        key={summary.id}
                        className={`hover:bg-blue-50 ${selectedSummaries.includes(summary.id) ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedSummaries.includes(summary.id)}
                            onChange={() => handleSelectSummary(summary.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {summary.employee_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {summary.employee_no}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            <div>{summary.department}</div>
                            <div className="text-xs text-gray-400">{summary.line}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {parseFloat(summary.days_worked || 0).toFixed(1)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {parseFloat(summary.ot_hours || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-red-600 font-medium">
                          {formatCurrency(summary.total_deductions)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-green-600 font-medium">
                          {formatCurrency(summary.total_benefits)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {summary.status?.charAt(0).toUpperCase() + summary.status?.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Statistics */}
              {selectedSummaries.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Generation Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{selectedSummaries.length}</div>
                      <div className="text-gray-600">Employees</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {availableSummaries
                          .filter(s => selectedSummaries.includes(s.id))
                          .reduce((sum, s) => sum + parseFloat(s.days_worked || 0), 0)
                          .toFixed(1)}
                      </div>
                      <div className="text-gray-600">Total Days</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(
                          availableSummaries
                            .filter(s => selectedSummaries.includes(s.id))
                            .reduce((sum, s) => sum + parseFloat(s.total_deductions || 0), 0)
                        )}
                      </div>
                      <div className="text-gray-600">Total Deductions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(
                          availableSummaries
                            .filter(s => selectedSummaries.includes(s.id))
                            .reduce((sum, s) => sum + parseFloat(s.total_benefits || 0), 0)
                        )}
                      </div>
                      <div className="text-gray-600">Total Benefits</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
          <div className="flex items-center text-sm text-gray-600">
            <AlertCircle className="h-4 w-4 mr-2" />
            This will generate final payroll records for the selected summaries
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={loading || selectedSummaries.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Final Payroll ({selectedSummaries.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PayrollSummaryDetailModal = ({ isOpen, summary, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [benefitsData, setBenefitsData] = useState(null);
  const [deductionsData, setDeductionsData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (isOpen && summary) {
      setFormData({
        days_worked: summary.days_worked || 0,
        ot_hours: summary.ot_hours || 0,
        late_under_minutes: summary.late_under_minutes || 0,
        nsd_hours: summary.nsd_hours || 0,
        slvl_days: summary.slvl_days || 0,
        retro: summary.retro || 0,
        travel_order_hours: summary.travel_order_hours || 0,
        holiday_hours: summary.holiday_hours || 0,
        trip_count: summary.trip_count || 0,
        notes: summary.notes || ''
      });
      
      // Load detailed benefits and deductions data
      loadBenefitsAndDeductions();
    }
  }, [isOpen, summary]);

  const loadBenefitsAndDeductions = async () => {
    if (!summary) return;
    
    setLoadingDetails(true);
    try {
      // Load benefits data
      const benefitsResponse = await fetch(`/api/payroll-summaries/${summary.id}/benefits-details`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        }
      });
      
      // Load deductions data
      const deductionsResponse = await fetch(`/api/payroll-summaries/${summary.id}/deductions-details`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        }
      });
      
      if (benefitsResponse.ok) {
        const benefitsResult = await benefitsResponse.json();
        setBenefitsData(benefitsResult.data);
      }
      
      if (deductionsResponse.ok) {
        const deductionsResult = await deductionsResponse.json();
        setDeductionsData(deductionsResult.data);
      }
    } catch (error) {
      console.error('Error loading benefits and deductions details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/comprehensive-payroll-summaries/${summary.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        setEditing(false);
        onUpdate();
        alert('Payroll summary updated successfully');
      } else {
        alert(data.message || 'Failed to update payroll summary');
      }
    } catch (err) {
      console.error('Error updating summary:', err);
      alert('Failed to update payroll summary');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatNumber = (num, decimals = 2) => {
    return parseFloat(num || 0).toFixed(decimals);
  };

  const formatMinutesToHours = (minutes) => {
    if (!minutes) return '0.00';
    return (parseFloat(minutes) / 60).toFixed(2);
  };

  if (!isOpen) return null;

  // Calculate totals from the loaded data
  const calculateTotalDeductions = () => {
    const generalDeductions = deductionsData ? 
      parseFloat(deductionsData.advance || 0) +
      parseFloat(deductionsData.charge_store || 0) +
      parseFloat(deductionsData.charge || 0) +
      parseFloat(deductionsData.meals || 0) +
      parseFloat(deductionsData.miscellaneous || 0) +
      parseFloat(deductionsData.other_deductions || 0) : 0;
    
    const governmentDeductions = 
      parseFloat(summary.sss_prem || 0) +
      parseFloat(summary.philhealth || 0) +
      parseFloat(summary.hmdf_prem || 0);
    
    const loans = 
      parseFloat(summary.mf_loan || 0) +
      parseFloat(summary.sss_loan || 0) +
      parseFloat(summary.hmdf_loan || 0);
    
    return generalDeductions + governmentDeductions + loans;
  };

  const calculateTotalBenefits = () => {
    return benefitsData ? 
      parseFloat(benefitsData.mf_shares || 0) +
      parseFloat(benefitsData.allowances || 0) : 0;
  };

  const totalDeductions = calculateTotalDeductions();
  const totalBenefits = calculateTotalBenefits();
  const netEffect = totalBenefits - totalDeductions;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 flex-shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Payroll Summary Details</h2>
              {summary && <p className="text-indigo-200 text-xs">{summary.employee_name} · {summary.full_period}</p>}
            </div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
              summary?.status === 'posted' ? 'bg-emerald-100 text-emerald-700'
              : summary?.status === 'locked' ? 'bg-red-100 text-red-700'
              : 'bg-amber-100 text-amber-700'
            }`}>
              {summary?.status?.charAt(0).toUpperCase() + summary?.status?.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {summary?.status !== 'locked' && !editing && (
              <button onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-colors">
                <Edit className="h-3.5 w-3.5" /> Edit
              </button>
            )}
            {editing && (<>
              <button onClick={handleSave} disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60">
                {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save
              </button>
              <button onClick={() => setEditing(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-colors">
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            </>)}
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Employee Info */}
          <div className="grid grid-cols-3 gap-3 bg-indigo-50 rounded-2xl p-4">
            {[
              { icon: User,     label: 'Employee',   main: summary?.employee_name, sub: summary?.employee_no },
              { icon: Building, label: 'Department', main: summary?.department,    sub: summary?.line },
              { icon: Calendar, label: 'Period',     main: summary?.full_period,   sub: `Cost Center: ${summary?.cost_center || 'N/A'}` },
            ].map(({ icon: Icon, label, main, sub }) => (
              <div key={label}>
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                  <Icon className="w-3 h-3" /> {label}
                </p>
                <p className="text-sm font-bold text-gray-900">{main}</p>
                <p className="text-xs text-gray-500">{sub}</p>
              </div>
            ))}
          </div>

          {/* Attendance metrics */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Days Worked',    val: formatNumber(summary?.days_worked, 1),          color: 'text-emerald-600' },
              { label: 'OT Hours',       val: formatNumber(summary?.ot_hours),                color: 'text-indigo-600'  },
              { label: 'Late/Under Hrs', val: formatMinutesToHours(summary?.late_under_minutes), color: 'text-red-500'  },
              { label: 'NSD Hours',      val: formatNumber(summary?.nsd_hours),               color: 'text-violet-600'  },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
                <p className={`text-xl font-bold ${color}`}>{val}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Financial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Deductions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border-b border-red-100">
                <DollarSign className="h-3.5 w-3.5 text-red-500" />
                <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider">Deductions Details</h3>
                {loadingDetails && <RefreshCw className="h-3 w-3 ml-auto animate-spin text-red-400" />}
              </div>
              <div className="p-4 space-y-3">
              {loadingDetails ? (
                <div className="flex justify-center py-6">
                  <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : deductionsData ? (
                <>
                  {/* General Deductions */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">General</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      {[
                        ['Advance', deductionsData.advance],
                        ['Store Charge', deductionsData.charge_store],
                        ['General Charge', deductionsData.charge],
                        ['Meals', deductionsData.meals],
                        ['Miscellaneous', deductionsData.miscellaneous],
                        ['Other', deductionsData.other_deductions],
                      ].map(([label, val]) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-gray-500">{label}</span>
                          <span className="font-medium text-red-600">{formatCurrency(val)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs font-semibold border-t border-red-100 mt-1.5 pt-1.5">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-red-600">{formatCurrency(
                        parseFloat(deductionsData.advance || 0) + parseFloat(deductionsData.charge_store || 0) +
                        parseFloat(deductionsData.charge || 0) + parseFloat(deductionsData.meals || 0) +
                        parseFloat(deductionsData.miscellaneous || 0) + parseFloat(deductionsData.other_deductions || 0)
                      )}</span>
                    </div>
                  </div>

                  {/* Government */}
                  <div className="border-t pt-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Government</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      {[
                        ['SSS Premium', summary.sss_prem],
                        ['PhilHealth', summary.philhealth],
                        ['HDMF Premium', summary.hmdf_prem],
                      ].map(([label, val]) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-gray-500">{label}</span>
                          <span className="font-medium text-red-600">{formatCurrency(val)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs font-semibold border-t border-red-100 mt-1.5 pt-1.5">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-red-600">{formatCurrency(
                        parseFloat(summary.sss_prem || 0) + parseFloat(summary.philhealth || 0) + parseFloat(summary.hmdf_prem || 0)
                      )}</span>
                    </div>
                  </div>

                  {/* Loans */}
                  <div className="border-t pt-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Loans</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      {[
                        ['MF Loan', summary.mf_loan],
                        ['SSS Loan', summary.sss_loan],
                        ['HDMF Loan', summary.hmdf_loan],
                      ].map(([label, val]) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-gray-500">{label}</span>
                          <span className="font-medium text-red-600">{formatCurrency(val)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs font-semibold border-t border-red-100 mt-1.5 pt-1.5">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-red-600">{formatCurrency(
                        parseFloat(summary.mf_loan || 0) + parseFloat(summary.sss_loan || 0) + parseFloat(summary.hmdf_loan || 0)
                      )}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t-2 border-red-200 pt-2">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Total Deductions</span>
                    <span className="text-sm font-bold text-red-600">{formatCurrency(totalDeductions)}</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <AlertTriangle className="h-6 w-6 mx-auto text-gray-300 mb-1" />
                  <p className="text-xs text-gray-400">No deduction data found</p>
                </div>
              )}
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                <Award className="h-3.5 w-3.5 text-emerald-600" />
                <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Benefits & Allowances</h3>
                {loadingDetails && <RefreshCw className="h-3 w-3 ml-auto animate-spin text-emerald-400" />}
              </div>
              <div className="p-4 space-y-3">
              {loadingDetails ? (
                <div className="flex justify-center py-6">
                  <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : benefitsData ? (
                <>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Allowances</p>
                    <div className="space-y-1 text-xs">
                      {[
                        ['MF Shares', benefitsData.mf_shares],
                        ['Allowances', benefitsData.allowances],
                      ].map(([label, val]) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-gray-500">{label}</span>
                          <span className="font-medium text-emerald-600">{formatCurrency(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Additional</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      {[
                        ['SLVL Days', formatNumber(summary?.slvl_days, 1)],
                        ['Trip Count', formatNumber(summary?.trip_count, 1)],
                        ['Travel Order Hrs', formatNumber(summary?.travel_order_hours)],
                        ['Holiday Hrs', formatNumber(summary?.holiday_hours)],
                        ['Retro', formatCurrency(summary?.retro)],
                      ].map(([label, val]) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-gray-500">{label}</span>
                          <span className="font-medium text-gray-700">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t-2 border-emerald-200 pt-2">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Total Benefits</span>
                    <span className="text-sm font-bold text-emerald-600">{formatCurrency(totalBenefits)}</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <AlertTriangle className="h-6 w-6 mx-auto text-gray-300 mb-1" />
                  <p className="text-xs text-gray-400">No benefits data found</p>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Grand Total Summary */}
          <div className="bg-indigo-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="h-3.5 w-3.5 text-indigo-500" />
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Grand Total Summary</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Deductions', val: formatCurrency(totalDeductions), color: 'text-red-600' },
                { label: 'Total Benefits',   val: formatCurrency(totalBenefits),   color: 'text-emerald-600' },
                { label: netEffect >= 0 ? 'Net Benefit' : 'Net Deduction',
                  val: formatCurrency(Math.abs(netEffect)),
                  color: netEffect >= 0 ? 'text-indigo-600' : 'text-red-600' },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-white rounded-xl p-3 text-center shadow-sm">
                  <p className={`text-base font-bold ${color}`}>{val}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Status Flags */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Status Information</p>
            <div className="grid grid-cols-3 gap-3 text-xs mb-3">
              {[
                ['Has CT', summary?.has_ct],
                ['Has CS', summary?.has_cs],
                ['Has OB', summary?.has_ob],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className={val ? 'text-emerald-600 font-semibold' : 'text-gray-300'}>
                    {val ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
              ))}
            </div>
            {summary?.posted_at && (
              <div className="grid grid-cols-2 gap-3 text-xs border-t border-gray-200 pt-3">
                <div>
                  <span className="text-gray-400">Posted At: </span>
                  <span className="font-medium text-gray-700">{new Date(summary.posted_at).toLocaleString()}</span>
                </div>
                {summary?.posted_by && (
                  <div>
                    <span className="text-gray-400">Posted By: </span>
                    <span className="font-medium text-gray-700">{summary.posted_by.name}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end flex-shrink-0">
          <button onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Main PayrollSummaries Component
const PayrollSummaries = ({ auth }) => {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filter state
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [periodType, setPeriodType] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [departments, setDepartments] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(25);
  
  // Statistics
  const [statistics, setStatistics] = useState(null);

  // Detail modal state
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Final Payroll Generation modal state
  const [showFinalPayrollModal, setShowFinalPayrollModal] = useState(false);

  // Load payroll summaries
  const loadSummaries = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      params.append('year', year);
      params.append('month', month);
      params.append('page', currentPage);
      params.append('per_page', perPage);
      
      if (periodType) params.append('period_type', periodType);
      if (department) params.append('department', department);
      if (status) params.append('status', status);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch('/api/comprehensive-payroll-summaries/list?' + params.toString(), {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSummaries(data.data);
        setTotalPages(data.pagination.last_page);
        setCurrentPage(data.pagination.current_page);
        setStatistics(data.statistics);
        if (data.departments) {
          setDepartments(data.departments);
        }
      } else {
        setError('Failed to load payroll summaries');
      }
    } catch (err) {
      console.error('Error loading summaries:', err);
      setError('Error loading payroll summaries: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Handle row double-click
  const handleRowDoubleClick = (summary) => {
    setSelectedSummary(summary);
    setShowDetailModal(true);
  };

  // Handle summary update
  const handleSummaryUpdate = () => {
    loadSummaries();
    setShowDetailModal(false);
  };

  // Handle final payroll generation
  const handleFinalPayrollGeneration = (result) => {
    setSuccess(`Successfully generated ${result.generated} final payroll records. ${result.skipped} records were skipped.`);
    setTimeout(() => setSuccess(''), 5000);
    
    // Optionally redirect to final payroll page
    if (result.generated > 0) {
      const confirmRedirect = confirm('Final payroll generation completed. Would you like to view the final payroll page?');
      if (confirmRedirect) {
        window.location.href = '/final-payroll';
      }
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format number
  const formatNumber = (num, decimals = 2) => {
    return parseFloat(num || 0).toFixed(decimals);
  };

  // Format minutes to hours
  const formatMinutesToHours = (minutes) => {
    if (!minutes) return '0.00';
    return (parseFloat(minutes) / 60).toFixed(2);
  };

  // Load data on component mount and filter changes
  useEffect(() => {
    loadSummaries();
  }, [year, month, periodType, department, status, searchTerm, currentPage]);

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Payroll Summaries" />
      <div className="w-full">
          <div className="w-full">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-2xl px-6 py-6 overflow-hidden shadow-lg mb-6">
              <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
              <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div>
                  <p className="text-indigo-200 text-xs font-medium mb-1">Payroll</p>
                  <h1 className="text-xl font-bold text-white">Comprehensive Payroll Summaries</h1>
                  <p className="text-indigo-200 text-xs mt-1">
                    Double-click any row to view detailed payroll information
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFinalPayrollModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-white/20 hover:bg-white/30 border border-white/30 transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Final Payroll
                  </button>
                  <button
                    onClick={loadSummaries}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/30 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {/* Filters Card */}
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  {/* Search Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Search by name or ID..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                    <input
                      type="number"
                      min="2020"
                      max="2030"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={month}
                      onChange={(e) => setMonth(parseInt(e.target.value))}
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(2024, i, 1).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={periodType}
                      onChange={(e) => setPeriodType(e.target.value)}
                    >
                      <option value="">All Periods</option>
                      <option value="1st_half">1st Half (1-15)</option>
                      <option value="2nd_half">2nd Half (16-30/31)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    >
                      <option value="">All Departments</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="">All Status</option>
                      <option value="draft">Draft</option>
                      <option value="posted">Posted</option>
                      <option value="locked">Locked</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Statistics */}
            {statistics && (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
                {[
                  { icon: Users,      label: 'Total Summaries',  value: statistics.total_summaries || 0,               color: 'bg-indigo-500',  top: 'bg-indigo-500'  },
                  { icon: Calendar,   label: 'Total Days',       value: formatNumber(statistics.total_days_worked, 1),  color: 'bg-emerald-500', top: 'bg-emerald-500' },
                  { icon: Clock,      label: 'Total OT Hours',   value: formatNumber(statistics.total_ot_hours),        color: 'bg-amber-500',   top: 'bg-amber-500'   },
                  { icon: DollarSign, label: 'Total Deductions', value: formatCurrency(statistics.total_deductions),    color: 'bg-red-500',     top: 'bg-red-500'     },
                  { icon: Award,      label: 'Total Benefits',   value: formatCurrency(statistics.total_benefits),      color: 'bg-violet-500',  top: 'bg-violet-500'  },
                ].map(({ icon: Icon, label, value, color, top }) => (
                  <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className={`h-1 ${top}`} />
                    <div className="p-3 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-900 leading-none">{value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Table container */}
            <div className="bg-white rounded-lg shadow">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                  <span className="ml-2 text-lg">Loading...</span>
                </div>
              ) : summaries.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No payroll summaries found</h3>
                  <p className="text-gray-500">Try adjusting your filters or generate summaries from attendance data.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">OT Hrs</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Late/Under</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">NSD</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">SLVL</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Deductions</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Benefits</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {summaries.map((summary) => (
                        <tr 
                          key={summary.id} 
                          className="hover:bg-blue-50 cursor-pointer transition-colors"
                          onDoubleClick={() => handleRowDoubleClick(summary)}
                          title="Double-click to view detailed information"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <User className="h-5 w-5 text-blue-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {summary.employee_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {summary.employee_no}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Building className="h-4 w-4 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm text-gray-900">{summary.department}</div>
                                <div className="text-xs text-gray-500">{summary.line}</div>
                                <div className="text-xs text-gray-400">{summary.cost_center}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>
                              <div className="font-medium">{summary.full_period}</div>
                              <div className="text-xs">{summary.period_type === '1st_half' ? '1-15' : '16-30/31'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {formatNumber(summary.days_worked, 1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              {formatNumber(summary.ot_hours)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <Clock className="h-3 w-3 text-red-500" />
                              <span className="text-sm text-red-600 font-medium">
                                {formatMinutesToHours(summary.late_under_minutes)}h
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            {formatNumber(summary.nsd_hours)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {formatNumber(summary.slvl_days, 1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm">
                              <div className="text-red-600 font-medium">{formatCurrency(summary.total_deductions)}</div>
                              <div className="text-xs text-gray-500">
                                A:{formatCurrency(summary.advance)} | 
                                S:{formatCurrency(summary.charge_store)} | 
                                M:{formatCurrency(summary.meals)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm">
                              <div className="text-green-600 font-medium">{formatCurrency(summary.total_benefits)}</div>
                              <div className="text-xs text-gray-500">
                                MF:{formatCurrency(summary.mf_shares)} | 
                                All:{formatCurrency(summary.allowances)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              summary.status === 'posted' 
                                ? 'bg-green-100 text-green-800'
                                : summary.status === 'locked'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {summary.status === 'posted' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {summary.status === 'locked' && <AlertTriangle className="h-3 w-3 mr-1" />}
                              {summary.status === 'draft' && <Clock className="h-3 w-3 mr-1" />}
                              {summary.status?.charAt(0).toUpperCase() + summary.status?.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRowDoubleClick(summary);
                                }}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {summary.status !== 'locked' && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRowDoubleClick(summary);
                                    }}
                                    className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                    title="Edit"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              {summary.status === 'posted' && (
                                <span className="inline-flex items-center px-1 py-0.5 rounded text-xs bg-blue-100 text-blue-800" title="Ready for Final Payroll">
                                  <ChevronRight className="h-3 w-3" />
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 bg-white">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                    >
                      Next
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing page <span className="font-medium">{currentPage}</span> of{' '}
                        <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <Button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          variant="outline"
                          size="sm"
                          className="rounded-l-md"
                        >
                          First
                        </Button>
                        <Button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          variant="outline"
                          size="sm"
                        >
                          Previous
                        </Button>
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = currentPage <= 3 
                            ? i + 1 
                            : (currentPage >= totalPages - 2 
                              ? totalPages - 4 + i 
                              : currentPage - 2 + i);
                          
                          if (pageNum > 0 && pageNum <= totalPages) {
                            return (
                              <Button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                className={currentPage === pageNum ? "bg-blue-500 text-white" : ""}
                              >
                                {pageNum}
                              </Button>
                            );
                          }
                          return null;
                        })}
                        
                        <Button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          variant="outline"
                          size="sm"
                        >
                          Next
                        </Button>
                        <Button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          variant="outline"
                          size="sm"
                          className="rounded-r-md"
                        >
                          Last
                        </Button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Detail Modal */}
      <PayrollSummaryDetailModal
        isOpen={showDetailModal}
        summary={selectedSummary}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedSummary(null);
        }}
        onUpdate={handleSummaryUpdate}
      />

      {/* Final Payroll Generation Modal */}
      <FinalPayrollGenerationModal
        isOpen={showFinalPayrollModal}
        onClose={() => setShowFinalPayrollModal(false)}
        filters={{ year, month, periodType, department }}
        onGenerate={handleFinalPayrollGeneration}
      />
    </AuthenticatedLayout>
  );
};

export default PayrollSummaries;