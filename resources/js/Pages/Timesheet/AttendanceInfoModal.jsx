import React from 'react';
import { X, Edit, Clock, Calendar, User, Timer, AlertTriangle, CheckCircle, Moon, Sun, Briefcase, Info, Tag } from 'lucide-react';

const AttendanceInfoModal = ({ isOpen, attendance, onClose, onEdit }) => {
  if (!isOpen || !attendance) return null;

  const formatTime = (timeString) => {
    if (!timeString) return '—';
    try {
      let timeOnly;
      if (timeString.includes('T')) timeOnly = timeString.split('T')[1].slice(0, 5);
      else if (timeString.includes(' ') && timeString.includes(':')) timeOnly = timeString.split(' ').pop().slice(0, 5);
      else if (timeString.includes(':')) timeOnly = timeString.slice(0, 5);
      else return '—';
      const [h, m] = timeOnly.split(':');
      const hours = parseInt(h, 10);
      if (isNaN(hours)) return '—';
      return `${hours % 12 || 12}:${m} ${hours >= 12 ? 'PM' : 'AM'}`;
    } catch { return '—'; }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return '—'; }
  };

  const formatMinutes = (minutes) => {
    if (!minutes || minutes <= 0) return null;
    const h = Math.floor(minutes / 60), m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const fmt = (v, d = 2) => (v === null || v === undefined || v === '' || isNaN(Number(v))) ? '—' : Number(v).toFixed(d);

  const isNight = attendance.is_nightshift;

  const Field = ({ label, value, mono = false, children }) => (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
      {children ?? <p className={`text-sm font-semibold text-gray-800 ${mono ? 'font-mono' : ''}`}>{value}</p>}
    </div>
  );

  const Badge = ({ color, children }) => {
    const colors = {
      green:  'bg-green-100 text-green-700',
      red:    'bg-red-100 text-red-700',
      yellow: 'bg-yellow-100 text-yellow-700',
      gray:   'bg-gray-100 text-gray-500',
      blue:   'bg-blue-100 text-blue-700',
      indigo: 'bg-indigo-100 text-indigo-700',
      purple: 'bg-purple-100 text-purple-700',
      orange: 'bg-orange-100 text-orange-700',
    };
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] ?? colors.gray}`}>{children}</span>;
  };

  const sourceMap = {
    import:      { label: 'Imported',        color: 'blue' },
    manual:      { label: 'Manual Entry',     color: 'yellow' },
    biometric:   { label: 'Biometric',        color: 'green' },
    manual_edit: { label: 'Manually Edited',  color: 'orange' },
    slvl_sync:   { label: 'SLVL Sync',        color: 'indigo' },
  };
  const src = sourceMap[attendance.source] ?? { label: attendance.source ?? 'Unknown', color: 'gray' };

  const SectionHeader = ({ icon: Icon, title, color = 'text-indigo-600' }) => (
    <div className={`flex items-center gap-2 mb-3`}>
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 px-6 py-5 flex-shrink-0">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
          <div className="flex items-start justify-between relative">
            <div>
              <p className="text-indigo-200 text-xs font-medium mb-0.5">Attendance Record</p>
              <h2 className="text-xl font-bold text-white">{attendance.employee_name ?? 'Unknown Employee'}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-indigo-200 text-xs">ID: {attendance.idno ?? '—'}</span>
                <span className="text-indigo-400">·</span>
                <span className="text-indigo-200 text-xs">{attendance.department ?? '—'}</span>
                {attendance.line && <><span className="text-indigo-400">·</span><span className="text-indigo-200 text-xs">{attendance.line}</span></>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isNight ? 'bg-violet-800/60 text-violet-200' : 'bg-yellow-400/20 text-yellow-200'}`}>
                {isNight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                {isNight ? 'Night Shift' : 'Regular Shift'}
              </span>
              <button onClick={onClose} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <SectionHeader icon={Calendar} title="Date" />
              <div className="space-y-3">
                <Field label="Date" value={formatDate(attendance.attendance_date)} />
                <Field label="Day of Week" value={attendance.day ?? '—'} />
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <SectionHeader icon={Clock} title="Time" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Time In"   value={formatTime(attendance.time_in)}   mono />
                <Field label="Break Out" value={formatTime(attendance.break_out)} mono />
                <Field label="Break In"  value={formatTime(attendance.break_in)}  mono />
                <Field label={isNight && attendance.next_day_timeout ? 'Next Day Out' : 'Time Out'}
                       value={isNight && attendance.next_day_timeout ? formatTime(attendance.next_day_timeout) : formatTime(attendance.time_out)}
                       mono />
              </div>
            </div>
          </div>

          {/* Hours & Status */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <SectionHeader icon={Timer} title="Hours & Attendance" />
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Field label="Hours Worked">
                <p className="text-2xl font-bold text-indigo-600">{fmt(attendance.hours_worked)}<span className="text-sm font-normal text-gray-400 ml-1">hrs</span></p>
              </Field>
              <Field label="Late">
                {attendance.late_minutes > 0
                  ? <Badge color="red"><AlertTriangle className="w-3 h-3" />{formatMinutes(attendance.late_minutes)}</Badge>
                  : <Badge color="green"><CheckCircle className="w-3 h-3" />On time</Badge>}
              </Field>
              <Field label="Undertime">
                {attendance.undertime_minutes > 0
                  ? <Badge color="orange"><Timer className="w-3 h-3" />{formatMinutes(attendance.undertime_minutes)}</Badge>
                  : <Badge color="green"><CheckCircle className="w-3 h-3" />Full time</Badge>}
              </Field>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
              <Field label="Source">
                <Badge color={src.color}>{src.label}</Badge>
              </Field>
              <Field label="Posting Status">
                {attendance.posting_status === 'posted'
                  ? <Badge color="green"><CheckCircle className="w-3 h-3" />Posted</Badge>
                  : <Badge color="yellow"><AlertTriangle className="w-3 h-3" />Not Posted</Badge>}
              </Field>
            </div>
          </div>

          {/* Payroll Figures */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <SectionHeader icon={Briefcase} title="Payroll Figures" />
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Overtime',          value: fmt(attendance.overtime) },
                { label: 'Travel Order',       value: fmt(attendance.travel_order, 1) },
                { label: 'SLVL',              value: fmt(attendance.slvl, 1) },
                { label: 'Holiday',           value: fmt(attendance.holiday) },
                { label: 'OT Reg Holiday',    value: fmt(attendance.ot_reg_holiday) },
                { label: 'OT Spl Holiday',    value: fmt(attendance.ot_special_holiday) },
                { label: 'Retro Multiplier',  value: fmt(attendance.retromultiplier) },
                { label: 'Offset',            value: fmt(attendance.offset) },
              ].map(({ label, value }) => (
                <Field key={label} label={label} value={value} />
              ))}
            </div>
          </div>

          {/* Flags */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <SectionHeader icon={Info} title="Flags" />
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'CT',               val: attendance.ct },
                { label: 'CS',               val: attendance.cs },
                { label: 'Rest Day',          val: attendance.restday },
                { label: 'Official Business', val: attendance.ob },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">{label}:</span>
                  <Badge color={val ? 'green' : 'gray'}>{val ? 'Yes' : 'No'}</Badge>
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Trip:</span>
                <Badge color={parseFloat(attendance.trip || 0) > 0 ? 'indigo' : 'gray'}>{fmt(attendance.trip, 0)}</Badge>
              </div>
            </div>
          </div>

          {/* Manual edit notice */}
          {attendance.source === 'manual_edit' && (
            <div className="flex gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-orange-700"><strong>Manual Edit:</strong> Late/undertime and hours worked have been automatically recalculated based on the updated time entries.</p>
            </div>
          )}

          {/* Remarks */}
          {attendance.remarks && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-xs text-blue-400 uppercase tracking-wider font-semibold mb-1">Remarks</p>
              <p className="text-sm text-blue-800">{attendance.remarks}</p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors">
            Close
          </button>
          <button onClick={onEdit} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
            <Edit className="w-4 h-4" />
            Edit Attendance
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceInfoModal;
