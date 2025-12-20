import React, { useEffect, useState } from 'react';
import FormBuilder from '../components/FormBuilder';
import DataTable from '../components/DataTable';
import { toast } from 'react-toastify';
import { useLimitedDateRange } from "../components/useLimitedDateRange";

function EmployeeMaster() {
  const { minDateStr, maxDateStr } = useLimitedDateRange({
    allowPastDays: 1,
    allowFutureDays: 0,
  });

  const [employees, setEmployees] = useState([]);
  const [initialValues, setInitialValues] = useState({});
  const [editId, setEditId] = useState(null);
  const isEditing = !!editId;

  // 🔹 Hiring dropdown options (Selected candidates only)
  const [hiringOptions, setHiringOptions] = useState([]);

  // 🔹 History modal state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyEmployee, setHistoryEmployee] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  // ⭐ DESIGNATION FIELD (CREATE vs EDIT)
const designationField = isEditing
  ? {
      name: 'designation',
      label: 'Designation',
      type: 'select',
      options: [
        'General Manager (GM)',
  'Front Office Manager',
  'Housekeeping Supervisor',
  'Restaurant Manager',
  'Executive Chef',
  'Accounts Officer',
  'HR Officer',
      ],
      required: true
    }
  : {
      name: 'designation',
      label: 'Designation',
      type: 'text',
      disabled: true
    };


  // 🔹 NEW: warning ko loop se bachane ke liye
  const [lockToastShown, setLockToastShown] = useState(false);

  // 🔹 History date formatter
  const formatDate = (value) => {
    if (!value) return 'Present';
    const d = new Date(value);
    if (isNaN(d)) return 'N/A';
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // 🔁 Load Employees
  const fetchEmployees = () => {
    fetch('http://localhost:5186/api/employees')
      .then(res => {
        if (!res.ok) throw new Error('Fetch failed');
        return res.json();
      })
      .then(data => setEmployees(data))
      .catch(() => toast.error('Failed to load employees ❌'));
  };

  // 🔁 Load Selected Hiring candidates for dropdown
  const fetchHiringOptions = () => {
    fetch('http://localhost:5186/api/employees/hiring-dropdown')
      .then(res => {
        if (!res.ok) throw new Error('Fetch failed');
        return res.json();
      })
      .then(data => {
        setHiringOptions(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error('Failed to load selected candidates ❌'));
  };

  useEffect(() => {
    fetchEmployees();
    fetchHiringOptions();
  }, []);

  // 🧱 Form fields
  const fields = [
    // 🔹 From Hiring
   !isEditing && {
  name: 'hiringId',
  label: 'From Hiring (Selected Candidate)',
  type: 'select',
  options: hiringOptions,
  required: false
},
    { name: 'fullName', label: 'Full Name', type: 'text', required: true, maxLength: 30, disabled:true },
    { name: 'contact', label: 'Contact (11 digits)', type: 'text', required: true, maxLength: 11, pattern: '^\\d{11}$', disabled:true },
    { name: 'email', label: 'Email', type: 'email', required: true, maxLength: 50, disabled:true },
    { name: 'cnic', label: 'CNIC (13 digits)', type: 'text', required: true, maxLength: 13, pattern: '^\\d{13}$' },
    { name: 'basicSalary', label: 'Basic Salary', type: 'number', required: true, min: 0 },

    // Department & Designation – plain text, auto-fill from Hiring
    {
      name: 'department',
      label: 'Department',
      type: 'text',
      required: false,
      maxLength: 50,
      disabled:true
    },
    // {
    //   name: 'designation',
    //   label: 'Designation',
    //   type: 'text',
    //   required: false,
    //   maxLength: 50
    // },
    designationField,

    {
      name: 'joiningDate',
      label: 'Joining Date',
      type: 'date',
       min: !isEditing ? minDateStr : undefined,
  max: !isEditing ? maxDateStr : undefined,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: ['Active', 'Inactive'],
      required: true
    }
  ].filter(Boolean);

  // 🔐 Kaunse fields Hiring se lock honge
  const lockedFieldsFromHiring = [
    'fullName',
    'contact',
    // 'cnic',
    'email',
    'department',
    'designation'
  ];

  // 🔧 Field change handler
  const handleFieldChange = (fieldName, value, setFormValues) => {
    // ✅ 1) Hiring dropdown change → auto-fill + warning reset
    if (fieldName === 'hiringId') {
      const selectedId = Number(value);
      const selected = hiringOptions.find(h => h.value === selectedId);

      // naya candidate choose hua → warning flag reset
      setLockToastShown(false);

      if (selected) {
        setFormValues(prev => ({
          ...prev,
          hiringId: selected.value,
          fullName: selected.fullName || prev.fullName || '',
          contact: selected.contact || prev.contact || '',
          // agar CNIC API se bhejno to:
          // cnic: selected.cnic || prev.cnic || '',
          email: selected.email || prev.email || '',
          department: selected.department || '',
          designation: selected.designation || ''
        }));
      } else {
        // user ne blank select kiya
        setFormValues(prev => ({
          ...prev,
          hiringId: ''
        }));
      }
      return;
    }

    // ✅ 2) Agar field Hiring se aayi hai → lock + warning + revert
    if (lockedFieldsFromHiring.includes(fieldName)) {
      setFormValues(prev => {
        // sirf tab lock jab form me hiringId maujood ho
        if (prev.hiringId) {
          const selected = hiringOptions.find(h => h.value === Number(prev.hiringId));

          if (selected) {
            // WARNING SIRF PEHLI DAFa
            if (!lockToastShown) {
              toast.warning('This field comes from Hiring and cannot be changed.');
              setLockToastShown(true);
            }

            // map fieldName -> hiringOption property
            const map = {
              fullName: 'fullName',
              contact: 'contact',
              cnic: 'cnic',
              email: 'email',
              department: 'department',
              designation: 'designation'
            };

            const key = map[fieldName];
            const correct =
              (key && selected[key] !== undefined ? selected[key] : prev[fieldName]) || '';

            return {
              ...prev,
              [fieldName]: correct
            };
          }
        }

        // agar hiringId nahi hai to normal change allow
        return {
          ...prev,
          [fieldName]: value
        };
      });

      return;
    }

    // ✅ 3) Status empty ho to default Active
    if (fieldName === 'status' && (value === '' || value == null)) {
      setFormValues(prev => ({ ...prev, status: 'Active' }));
      return;
    }

    // ✅ 4) Normal fields
    setFormValues(prev => ({ ...prev, [fieldName]: value }));
  };

  // ✅ Validation
  const validate = (d) => {
    if (!d.fullName?.trim()) return 'Full Name is required.';
    if (!/^\d{11}$/.test(String(d.contact || ''))) return 'Contact must be 11 digits.';
    if (!/^\d{13}$/.test(String(d.cnic || ''))) return 'CNIC must be 13 digits.';
    if (!d.email?.trim()) return 'Email is required.';
    if (d.basicSalary == null || Number(d.basicSalary) < 0) return 'Basic Salary must be 0 or more.';
    if (!d.status || !['Active', 'Inactive'].includes(d.status)) return "Status must be 'Active' or 'Inactive'.";
    return null;
  };

  // 💾 Submit
 const handleSubmit = async (data) => {
  const trimmed = {
    ...data,
    fullName: data.fullName?.trim(),
    email: data.email?.trim(),
    status: data.status || 'Active'
  };

  const err = validate(trimmed);
  if (err) { toast.error(err); return; }

  // hiringId ko payload se nikal do (backend model me nahi hai)
  const { hiringId: _hiringId, ...payload } = trimmed;

  if (!payload.joiningDate) delete payload.joiningDate;

  try {
    let res;
    if (isEditing) {
      payload.employeeCode = initialValues.employeeCode;
      res = await fetch(`http://localhost:5186/api/employees/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...initialValues, ...payload, employeeID: editId })
      });
      if (!res.ok) throw res;
      toast.info('Employee updated ✅');
    } else {
      res = await fetch('http://localhost:5186/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw res;
      toast.success('Employee added ✅');
    }

    setInitialValues({});
    setEditId(null);
    setLockToastShown(false); // form reset → warning flag reset
    fetchEmployees();
  } catch (err) {
    let message = 'Error saving employee ❌';

    // 🔹 agar backend Response throw hua ho
    if (err instanceof Response) {
      try {
        const data = await err.json();
        if (data?.message) message = data.message;
        else if (data?.error) message = data.error;
        else if (Array.isArray(data?.errors) && data.errors.length > 0) {
          message = data.errors[0];
        }
      } catch {
        // json parse fail ho gaya to default message hi rahega
      }
    }
    // 🔹 normal JS Error
    else if (err && typeof err === 'object' && 'message' in err && err.message) {
      message = err.message;
    }
    // 🔹 agar string throw hui ho
    else if (typeof err === 'string') {
      message = err;
    }

    toast.error(message);
  }
};


  // ✏️ Edit row
  const handleEdit = (index) => {
    const e = employees[index];
    let j = e.joiningDate ? new Date(e.joiningDate) : null;
    const fmt = j
      ? `${j.getFullYear()}-${String(j.getMonth() + 1).padStart(2, '0')}-${String(j.getDate()).padStart(2, '0')}`
      : '';

    setInitialValues({
      employeeID: e.employeeID,
      employeeCode: e.employeeCode,
      fullName: e.fullName,
      contact: e.contact,
      cnic: e.cnic,
      email: e.email,
      basicSalary: e.basicSalary,
      department: e.department,
      designation: e.designation,
      joiningDate: fmt,
      status: e.status,
      hiringId: ''   // edit mode me Hiring link ko change nahi kar rahe
    });
    setEditId(e.employeeID);
    setLockToastShown(false); // naya edit start → flag reset
  };

  // 🗑️ Delete
  const handleDelete = async (index) => {
    const id = employees[index].employeeID;
    try {
      const res = await fetch(`http://localhost:5186/api/employees/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.error('Employee deleted ❌');
      fetchEmployees();
    } catch {
      toast.error('Failed to delete ❌');
    }
  };

  // 📜 History
  const handleViewHistory = async (index) => {
    const emp = employees[index];
    if (!emp) return;

    setHistoryEmployee(emp);
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError('');
    setHistoryData([]);

    try {
      const res = await fetch(`http://localhost:5186/api/employees/${emp.employeeID}/designation-history`);
      if (!res.ok) throw new Error('Failed to load history');
      const data = await res.json();

      const sorted = (data || []).sort(
        (a, b) => new Date(a.effectiveFrom) - new Date(b.effectiveFrom)
      );

      setHistoryData(sorted);
    } catch (err) {
      console.error(err);
      setHistoryError('Failed to load history ❌');
      toast.error('Failed to load history ❌');
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistory = () => {
    setHistoryOpen(false);
    setHistoryEmployee(null);
    setHistoryData([]);
    setHistoryError('');
  };

  // 📊 Table
  const columns = [
    'employeeCode',
    'fullName',
    'contact',
    'cnic',
    'email',
    'basicSalary',
    'joiningDate',
    'status',
    'actions'
  ];

  const rows = employees.map((e, idx) => ({
    ...e,
    joiningDate: e.joiningDate
      ? new Date(e.joiningDate).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      : 'N/A',
    actions: (
      <div className="action-buttons">
        <button className="btn edit-btn" onClick={() => handleEdit(idx)}>Edit</button>
        <button className="btn delete-btn" onClick={() => handleDelete(idx)}>Delete</button>
        <button className="btn history-btn" onClick={() => handleViewHistory(idx)}>History</button>
      </div>
    )
  }));

  return (
    <div>
      <h2>Employee Master</h2>
      <FormBuilder
        fields={fields}
        onSubmit={handleSubmit}
        initialValues={initialValues}
        onFieldChange={handleFieldChange}
      />
      <DataTable columns={columns} rows={rows} />

      {/* History Modal */}
      {historyOpen && (
        <div className="modal-overlay" onClick={closeHistory}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Designation History –{' '}
                {historyEmployee?.employeeCode} {historyEmployee?.fullName}
              </h3>
              <button className="modal-close" onClick={closeHistory}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {historyLoading && <p>Loading history...</p>}
              {!historyLoading && historyError && (
                <p className="error-text">{historyError}</p>
              )}

              {!historyLoading && !historyError && historyData.length === 0 && (
                <p>No history found.</p>
              )}

              {!historyLoading && !historyError && historyData.length > 0 && (
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>From</th>
                      <th>To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.map((h, i) => (
                      <tr key={h.historyID || i}>
                        <td>{i + 1}</td>
                        <td>{h.department}</td>
                        <td>{h.designation}</td>
                        <td>{formatDate(h.effectiveFrom)}</td>
                        <td>{formatDate(h.effectiveTo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeMaster;
