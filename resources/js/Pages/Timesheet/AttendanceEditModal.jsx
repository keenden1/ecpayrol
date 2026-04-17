import React, { useState, useEffect } from 'react';
import { X, Save, Clock, AlertTriangle, RotateCcw, Trash2, Loader2, Info, Moon, Sun, RefreshCw, CheckCircle, Car } from 'lucide-react';

const formatTimeForInput = (timeString) => {
  if (!timeString) return '';
  try {
    let t;
    if (timeString.includes('T')) t = timeString.split('T')[1].slice(0, 5);
    else if (timeString.includes(' ')) t = timeString.split(' ').pop().slice(0, 5);
    else t = timeString.slice(0, 5);
    return t;
  } catch { return ''; }
};

const formatTime = (timeString) => {
  if (!timeString) return '—';
  try {
    let t;
    if (timeString.includes('T')) t = timeString.split('T')[1].slice(0, 5);
    else t = timeString.split(' ').pop().slice(0, 5);
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    return isNaN(hour) ? '—' : `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  } catch { return '—'; }
};

const TimeField = ({ label, name, value, onChange, disabled, hint, required, accent = false }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    <div className="relative">
      <Clock className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${accent ? 'text-violet-500' : 'text-gray-400'}`} />
      <input
        type="time"
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full pl-9 pr-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-colors
          ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : 'bg-white border-gray-200 hover:border-indigo-300 focus:ring-indigo-400 focus:border-indigo-400'}`}
      />
    </div>
    {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
  </div>
);

const AttendanceEditModal = ({ isOpen, attendance, onClose, onSave, onDelete, onSync }) => {
  const [formData, setFormData] = useState({
    id: '', time_in: '', time_out: '', break_in: '', break_out: '',
    next_day_timeout: '', is_nightshift: false, trip: 0,
  });
  const [error, setError]                   = useState('');
  const [success, setSuccess]               = useState('');
  const [loading, setLoading]               = useState(false);
  const [syncLoading, setSyncLoading]       = useState(false);
  const [deleteLoading, setDeleteLoading]   = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (attendance) {
      setFormData({
        id: attendance.id,
        time_in:          formatTimeForInput(attendance.time_in),
        time_out:         formatTimeForInput(attendance.time_out),
        break_in:         formatTimeForInput(attendance.break_in),
        break_out:        formatTimeForInput(attendance.break_out),
        next_day_timeout: formatTimeForInput(attendance.next_day_timeout),
        is_nightshift:    attendance.is_nightshift || false,
        trip:             attendance.trip || 0,
      });
      setError(''); setSuccess(''); setShowDeleteConfirm(false);
    }
  }, [attendance]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleNightShiftChange = (e) => {
    const night = e.target.checked;
    setFormData(prev => ({ ...prev, is_nightshift: night, ...(night && prev.next_day_timeout ? { time_out: '' } : {}), ...(!night ? { next_day_timeout: '' } : {}) }));
  };

  const validate = () => {
    if (!formData.time_in)          { setError('Time In is required'); return false; }
    if (formData.is_nightshift) {
      if (!formData.time_out && !formData.next_day_timeout) { setError('Either Time Out or Next Day Timeout is required for night shifts'); return false; }
      if (formData.time_out && formData.next_day_timeout)   { setError('Use either Time Out OR Next Day Timeout, not both'); return false; }
    } else {
      if (!formData.time_out) { setError('Time Out is required'); return false; }
    }
    if (formData.break_out && !formData.break_in) { setError('Break In is required when Break Out is set'); return false; }
    if (formData.break_in && !formData.break_out) { setError('Break Out is required when Break In is set'); return false; }
    if (formData.trip && (isNaN(formData.trip) || formData.trip < 0)) { setError('Trip must be a valid positive number'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    setError(''); setSuccess('');
    if (!validate()) return;
    setLoading(true);
    try {
      await onSave({ ...formData, trip: parseFloat(formData.trip) || 0 });
      setSuccess('Attendance updated successfully!');
      window.location.reload();
    } catch (err) {
      setError('Failed to save: ' + (err.message || 'Unknown error'));
    } finally { setLoading(false); }
  };

  const handleSync = async () => {
    if (!attendance?.id) return;
    setSyncLoading(true); setError('');
    try { await onSync(attendance.id); setSuccess('Record synced successfully!'); }
    catch (err) { setError('Sync failed: ' + (err.message || 'Unknown error')); }
    finally { setSyncLoading(false); }
  };

  const handleDelete = async () => {
    if (!attendance?.id) return;
    setDeleteLoading(true); setError('');
    try { await onDelete(attendance.id); setShowDeleteConfirm(false); onClose(); }
    catch (err) { setError('Delete failed: ' + (err.message || 'Unknown error')); }
    finally { setDeleteLoading(false); }
  };

  const handleReset = () => {
    if (!attendance) return;
    setFormData({
      id: attendance.id,
      time_in:          formatTimeForInput(attendance.time_in),
      time_out:         formatTimeForInput(attendance.time_out),
      break_in:         formatTimeForInput(attendance.break_in),
      break_out:        formatTimeForInput(attendance.break_out),
      next_day_timeout: formatTimeForInput(attendance.next_day_timeout),
      is_nightshift:    attendance.is_nightshift || false,
      trip:             attendance.trip || 0,
    });
    setError(''); setSuccess('');
  };

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);
  useEffect(() => { if (error)   { const t = setTimeout(() => setError(''), 5000);   return () => clearTimeout(t); } }, [error]);

  if (!isOpen) return null;

  const isNight = formData.is_nightshift;
  const busy    = loading || syncLoading || deleteLoading;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 px-6 py-5 flex-shrink-0">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
          <div className="flex items-start justify-between relative">
            <div>
              <p className="text-indigo-200 text-xs font-medium mb-0.5">Edit Attendance</p>
              <h2 className="text-xl font-bold text-white">{attendance?.employee_name ?? 'Employee'}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-indigo-200 text-xs">ID: {attendance?.idno ?? '—'}</span>
                <span className="text-indigo-400">·</span>
                <span className="text-indigo-200 text-xs">{attendance?.department ?? '—'}</span>
                <span className="text-indigo-400">·</span>
                <span className="text-indigo-200 text-xs">
                  {attendance?.attendance_date ? new Date(attendance.attendance_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </span>
                <span className="text-indigo-400">·</span>
                <span className="text-indigo-200 text-xs">{attendance?.hours_worked ?? '—'} hrs worked</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isNight ? 'bg-violet-800/60 text-violet-200' : 'bg-yellow-400/20 text-yellow-200'}`}>
                {isNight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                {isNight ? 'Night Shift' : 'Regular Shift'}
              </span>
              <button onClick={onClose} disabled={busy} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Current times summary */}
          <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Current Values</p>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-600">
              {[
                ['In',        attendance?.time_in],
                ['Out',       attendance?.time_out],
                ['Break Out', attendance?.break_out],
                ['Break In',  attendance?.break_in],
                ['Next Day',  attendance?.next_day_timeout],
                ['Trips',     attendance?.trip ?? 0],
              ].map(([lbl, val]) => (
                <span key={lbl}><span className="text-gray-400">{lbl}:</span> <span className="font-mono font-semibold text-gray-700">{typeof val === 'number' ? val : formatTime(val)}</span></span>
              ))}
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex gap-2.5 p-3.5 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Night shift toggle */}
          <label className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 transition-colors">
            <input
              type="checkbox"
              name="is_nightshift"
              checked={formData.is_nightshift}
              onChange={handleNightShiftChange}
              disabled={loading}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            <div className="flex items-center gap-2">
              {isNight ? <Moon className="w-4 h-4 text-violet-600" /> : <Sun className="w-4 h-4 text-yellow-500" />}
              <span className="text-sm font-semibold text-gray-800">Night Shift</span>
            </div>
            <span className="text-xs text-gray-400 ml-auto">
              {isNight ? 'Employee may clock out the following day' : 'Employee clocks in and out on the same day'}
            </span>
          </label>

          {/* Time inputs */}
          <div className="grid grid-cols-2 gap-4">
            <TimeField label="Time In"   name="time_in"   value={formData.time_in}   onChange={handleChange} disabled={loading} required />
            <TimeField label="Time Out"  name="time_out"  value={formData.time_out}  onChange={handleChange}
              disabled={(isNight && !!formData.next_day_timeout) || loading}
              required={!isNight}
              hint={isNight ? 'Only if clocking out same day' : undefined} />
            <TimeField label="Break Out (Optional)" name="break_out" value={formData.break_out} onChange={handleChange} disabled={loading} hint="When leaving for break/lunch" />
            <TimeField label="Break In (Optional)"  name="break_in"  value={formData.break_in}  onChange={handleChange} disabled={loading} hint="When returning from break/lunch" />
            {isNight && (
              <TimeField label="Next Day Timeout" name="next_day_timeout" value={formData.next_day_timeout}
                onChange={handleChange} disabled={!!formData.time_out || loading}
                required={!formData.time_out} accent
                hint="When clocking out the following day" />
            )}
            {/* Trip */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5"><Car className="w-3.5 h-3.5 text-indigo-500" />Number of Trips</span>
              </label>
              <input
                type="number" name="trip" min="0" max="999.99" step="0.01"
                value={formData.trip} onChange={handleChange} disabled={loading}
                placeholder="0.00"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl hover:border-indigo-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:outline-none transition-colors"
              />
              <p className="mt-1 text-xs text-gray-400">Supports decimals (e.g. 1.5)</p>
            </div>
          </div>

          {/* How to use — collapsible hint */}
          <details className="group bg-indigo-50 border border-indigo-100 rounded-xl">
            <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer text-xs font-semibold text-indigo-600 uppercase tracking-wider list-none select-none">
              <Info className="w-3.5 h-3.5" /> How to use
              <span className="ml-auto text-indigo-400 group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <div className="px-4 pb-4 text-xs text-indigo-700 space-y-1 leading-relaxed">
              <p><strong>Regular Shifts:</strong> Fill Time In + Time Out for same-day attendance.</p>
              <p><strong>Night Shifts:</strong> Check Night Shift, then use Time Out (same day) OR Next Day Timeout (next day) — not both.</p>
              <p><strong>Break Times:</strong> Break Out = leaving for break · Break In = returning from break. Both must be filled together.</p>
              <p><strong>Trips:</strong> Number of trips completed. Supports decimals like 1.5.</p>
            </div>
          </details>

          {/* Delete confirm */}
          {showDeleteConfirm && (
            <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700 mb-2">Delete this attendance record? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowDeleteConfirm(false)} disabled={deleteLoading}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-300 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50">
                    Cancel
                  </button>
                  <button onClick={handleDelete} disabled={deleteLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                    {deleteLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Deleting…</> : <><Trash2 className="w-3.5 h-3.5" />Confirm Delete</>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowDeleteConfirm(true)} disabled={busy || showDeleteConfirm}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <button onClick={handleSync} disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-colors disabled:opacity-50">
              {syncLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Syncing…</> : <><RefreshCw className="w-3.5 h-3.5" />Sync</>}
            </button>
            <button onClick={handleReset} disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} disabled={busy}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceEditModal;
