import React, { useEffect, useState } from 'react';
import FormBuilder from '../components/FormBuilder';
import DataTable from '../components/DataTable';
import { toast } from 'react-toastify';
import { useLimitedDateRange } from "../components/useLimitedDateRange";

function AttendanceManagement() {
   const { minDateStr, maxDateStr } = useLimitedDateRange({
    allowPastDays: 1,     // jitnay din back-date allow
    allowFutureDays: 0,   // future bilkul nahin
  });
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [initialValues, setInitialValues] = useState({});
  const [editId, setEditId] = useState(null);
  const isEditing = !!editId;

  // Load active employees for dropdown
  const fetchEmployees = () => {
    fetch('http://localhost:5186/api/attendance/employees-active')
      .then(res => res.json())
      .then(data => setEmployees(data))
      .catch(() => toast.error('Failed to load employees ❌'));
  };

  // Load attendance rows
  const fetchAttendance = () => {
    fetch('http://localhost:5186/api/attendance')
      .then(res => res.json())
      .then(data => setRows(data))
      .catch(() => toast.error('Failed to load attendance ❌'));
  };

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, []);

  const employeeOptions = employees; // [{value,label}]

  const fields = [
    {
      name: 'employeeID',
      label: 'Employee',
      type: 'select',
      options: employeeOptions,
      required: true
    },
    {
      name: 'attendanceDate',
      label: 'Date',
      type: 'date',
      min: minDateStr,   // 🔥 hook se aa raha
    max: maxDateStr,   // 🔥
    },
    {
      name: 'checkIn',
      label: 'Check-In',
      type: 'time'
    },
    {
      name: 'checkOut',
      label: 'Check-Out',
      type: 'time'
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: ['Present', 'Absent', 'Leave', 'Half Day'],
      required: true
    }
  ];

  // DeliveryNote-style signature
  const handleFieldChange = (fieldName, value, setFormValues) => {
    if (fieldName === 'attendanceDate' && !value) {
      // default to today if cleared
      const today = new Date().toISOString().split('T')[0];
      setFormValues(prev => ({ ...prev, attendanceDate: today }));
      return;
    }
    setFormValues(prev => ({ ...prev, [fieldName]: value }));
  };

  const validate = (d) => {
    if (!d.employeeID) return 'Employee is required.';
    if (d.status && !['Present','Absent','Leave','Half Day'].includes(d.status)) return 'Invalid status.';
    // time sanity
    if (d.checkIn && d.checkOut && d.checkOut <= d.checkIn) return 'Check-Out must be later than Check-In.';
    return null;
  };

  const toPayload = (data) => {
    const payload = { ...data };

    // default date to today if empty
    if (!payload.attendanceDate) {
      payload.attendanceDate = new Date().toISOString().split('T')[0];
    }

    // Convert time string "HH:MM" to SQL TIME via backend binder (string is fine)
    // Keep as "HH:MM"—ASP.NET Core can bind to TimeSpan automatically if "HH:MM"
    if (!payload.checkIn) delete payload.checkIn;
    if (!payload.checkOut) delete payload.checkOut;

    return payload;
  };

 const handleSubmit = async (data) => {
  const payload = toPayload(data);
  const err = validate(payload);
  if (err) { toast.error(err); return; }

  try {
    let res;
    if (isEditing) {
      payload.attendanceID = initialValues.attendanceID;
      res = await fetch(`http://localhost:5186/api/attendance/${initialValues.attendanceID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw res;
      toast.info('Attendance updated ✅');
    } else {
      res = await fetch('http://localhost:5186/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw res;
      toast.success('Attendance added ✅');
    }

    setInitialValues({});
    setEditId(null);
    fetchAttendance();
  } catch (e) {
    let message = 'Error saving attendance ❌';

    try {
      if (e.json) {
        const data = await e.json();
        message = data?.message || data?.errors?.[0] || message;
      }
    } catch {
      // ignore
    }

    toast.error(message);
  }
};


  const handleEdit = (index) => {
    const r = rows[index];
    // Convert CheckIn/Out from "hh:mm:ss" (server) to "HH:MM" for input
    const toHM = (t) => {
      if (!t) return '';
      // t could be "hh:mm:ss" or "hh:mm:ss.fffffff"
      const parts = t.split(':');
      return `${parts[0].padStart(2,'0')}:${parts[1].padStart(2,'0')}`;
    };

    const d = r.attendanceDate ? new Date(r.attendanceDate) : null;
    const yyyy = d ? d.getFullYear() : '';
    const mm = d ? String(d.getMonth()+1).padStart(2,'0') : '';
    const dd = d ? String(d.getDate()).padStart(2,'0') : '';

    setInitialValues({
      attendanceID: r.attendanceID,
      employeeID: r.employeeID,
      attendanceDate: d ? `${yyyy}-${mm}-${dd}` : '',
      checkIn: toHM(r.checkIn),
      checkOut: toHM(r.checkOut),
      status: r.status
    });
    setEditId(r.attendanceID);
  };

  const handleDelete = async (index) => {
    const id = rows[index].attendanceID;
    try {
      const res = await fetch(`http://localhost:5186/api/attendance/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.error('Attendance deleted ❌');
      fetchAttendance();
    } catch {
      toast.error('Failed to delete ❌');
    }
  };

  const columns = [
    'attendanceID',
    // 'employeeID',
    'employeeCode',
    'employeeName',
    'attendanceDate',
    'checkIn',
    'checkOut',
    'WorkingMinutes',
    'status',
    'actions'
  ];

  const niceTime = (t) => {
    if (!t) return '—';
    const [h,m] = t.split(':');
    return `${h.padStart(2,'0')}:${m.padStart(2,'0')}`;
  };

  const rowsForTable = rows.map((r, idx) => ({
    ...r,
    attendanceDate: r.attendanceDate
      ? new Date(r.attendanceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'N/A',
    checkIn: niceTime(r.checkIn),
    checkOut: niceTime(r.checkOut),
    WorkingMinutes: r.workingMinutes ?? r.WorkingMinutes ?? '—',
    actions: (
      <div className="action-buttons">
        <button className="btn edit-btn" onClick={() => handleEdit(idx)}>Edit</button>
        <button className="btn delete-btn" onClick={() => handleDelete(idx)}>Delete</button>
      </div>
    )
  }));

  return (
    <div>
      <h2>Attendance Management</h2>
      <FormBuilder
        fields={fields}
        onSubmit={handleSubmit}
        initialValues={initialValues}
        onFieldChange={handleFieldChange}
      />
      <DataTable columns={columns} rows={rowsForTable} />
    </div>
  );
}

export default AttendanceManagement;
