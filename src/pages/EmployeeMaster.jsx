import React, { useEffect, useState } from 'react';
import FormBuilder from '../components/FormBuilder';
import DataTable from '../components/DataTable';
import { toast } from 'react-toastify';
import { useLimitedDateRange } from "../components/useLimitedDateRange";


function EmployeeMaster() {
   const { minDateStr, maxDateStr } = useLimitedDateRange({
      allowPastDays: 1,     // jitnay din back-date allow
      allowFutureDays: 0,   // future bilkul nahin
    });
  const [employees, setEmployees] = useState([]);
  const [initialValues, setInitialValues] = useState({});
  const [editId, setEditId] = useState(null);
  const isEditing = !!editId;

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

  useEffect(() => {
    fetchEmployees();
  }, []);

  // 🧱 Form fields
  const fields = [
    // { name: 'employeeCode', label: 'Employee Code', type: 'text', disabled: true },
    { name: 'fullName', label: 'Full Name', type: 'text', required: true, maxLength: 20 },

    { name: 'contact', label: 'Contact (11 digits)', type: 'text', required: true, maxLength: 11, pattern: '^\\d{11}$' },
    { name: 'cnic', label: 'CNIC (13 digits)', type: 'text', required: true, maxLength: 13, pattern: '^\\d{13}$' },

    { name: 'email', label: 'Email', type: 'email', required: true, maxLength: 50 },
    { name: 'basicSalary', label: 'Basic Salary', type: 'number', required: true, min: 0 },

    { name: 'department', label: 'Department', type: 'select', options:['Front Office',
  'Housekeeping',
  'Food & Beverage (F&B)',
  'Kitchen / Food Production',
  'Finance & Accounts',
  'Human Resources (HR)'] },
    { name: 'designation', label: 'Designation', type: 'select', options:['General Manager (GM)',
  'Front Office Manager',
  'Housekeeping Supervisor',
  'Restaurant Manager (F&B)',
  'Executive Chef',
  'Accounts Officer / Accountant'] },

    { name: 'joiningDate', label: 'Joining Date', type: 'date', min: minDateStr,   // 🔥 hook se aa raha
    max: maxDateStr },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: ['Active', 'Inactive'], // must match DB CHECK
      required: true
    }
  ];

  // 🔧 Handle field changes (DeliveryNote-style signature)
  const handleFieldChange = (fieldName, value, setFormValues) => {
    if (fieldName === 'status' && (value === '' || value == null)) {
      // default Active if empty
      setFormValues(prev => ({ ...prev, status: 'Active' }));
      return;
    }
    setFormValues(prev => ({ ...prev, [fieldName]: value }));
  };

  // ✅ Validate before POST/PUT (lightweight, mirrors backend)
  const validate = (d) => {
    if (!d.fullName?.trim()) return 'Full Name is required.';
    if (!/^\d{11}$/.test(String(d.contact || ''))) return 'Contact must be 11 digits.';
    if (!/^\d{13}$/.test(String(d.cnic || ''))) return 'CNIC must be 13 digits.';
    if (!d.email?.trim()) return 'Email is required.';
    if (d.basicSalary == null || Number(d.basicSalary) < 0) return 'Basic Salary must be 0 or more.';
    if (!d.status || !['Active','Inactive'].includes(d.status)) return "Status must be 'Active' or 'Inactive'.";
    return null;
  };

  // 💾 Submit (POST/PUT)
  const handleSubmit = async (data) => {
    const payload = {
      ...data,
      fullName: data.fullName?.trim(),
      email: data.email?.trim(),
      status: data.status || 'Active'
    };

    const err = validate(payload);
    if (err) { toast.error(err); return; }

    // backend will set default joiningDate if empty
    if (!payload.joiningDate) delete payload.joiningDate;

    try {
      let res;
      if (isEditing) {
        // Prevent code change (read-only anyway)
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
      fetchEmployees();
    } catch (e) {
      // Try to extract backend message
      let message = 'Error saving employee ❌';
      try {
        const data = await e.json();
        message = data?.message || data?.errors?.[0] || message;
      } catch { /* ignore */ }
      toast.error(message);
    }
  };

  // ✏️ Edit row
  const handleEdit = (index) => {
    const e = employees[index];
    // format joiningDate to YYYY-MM-DD for date input
    let j = e.joiningDate ? new Date(e.joiningDate) : null;
    const fmt = j ? `${j.getFullYear()}-${String(j.getMonth()+1).padStart(2,'0')}-${String(j.getDate()).padStart(2,'0')}` : '';

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
      status: e.status
    });
    setEditId(e.employeeID);
  };

  // 🗑️ Delete row
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

  // 📊 Table
  const columns = [
    'employeeCode',
    'fullName',
    'contact',
    'cnic',
    'email',
    'basicSalary',
    'department',
    'designation',
    'joiningDate',
    'status',
    'actions'
  ];

  const rows = employees.map((e, idx) => ({
    ...e,
    joiningDate: e.joiningDate
      ? new Date(e.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'N/A',
    actions: (
      <div className="action-buttons">
        <button className="btn edit-btn" onClick={() => handleEdit(idx)}>Edit</button>
        <button className="btn delete-btn" onClick={() => handleDelete(idx)}>Delete</button>
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
    </div>
  );
}

export default EmployeeMaster;
