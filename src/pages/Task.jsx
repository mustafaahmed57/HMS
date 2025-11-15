import React, { useEffect, useState } from 'react';
import FormBuilder from '../components/FormBuilder';
import DataTable from '../components/DataTable';
import { toast } from 'react-toastify';
import { useLimitedDateRange } from "../components/useLimitedDateRange";

function TaskManagement() {
  const { minDateStr, maxDateStr } = useLimitedDateRange({
        allowPastDays: 0,     // jitnay din back-date allow
        allowFutureDays: 5,   // future bilkul nahin
      });
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [initialValues, setInitialValues] = useState({});
  const [editId, setEditId] = useState(null);
  const isEditing = !!editId;

  const fetchEmployees = () => {
    fetch('http://localhost:5186/api/tasks/employees-active')
      .then(res => res.json())
      .then(data => setEmployees(data)) // [{value,label}]
      .catch(() => toast.error('Failed to load employees ❌'));
  };

  const fetchTasks = () => {
    fetch('http://localhost:5186/api/tasks')
      .then(res => res.json())
      .then(data => setRows(data))
      .catch(() => toast.error('Failed to load tasks ❌'));
  };

  useEffect(() => {
    fetchEmployees();
    fetchTasks();
  }, []);

  const fields = [
    // ⚠️ DB/Backend = AssignedTo
    { name: 'assignedTo', label: 'Employee', type: 'select', options: employees, required: true },
    // ⚠️ DB/Backend = TaskTitle
    { name: 'taskTitle', label: 'Task Title', type: 'select', required: true, options:[
  "Room Cleaning",
  "Guest Check-in",
  "Guest Check-out",
  "Room Service Delivery",
  "Laundry Collection",
  "Laundry Delivery",
  "Bathroom Cleaning",
  "AC / Maintenance Check",
  "Inventory Refill",
  "Handle Guest Requests"
]
 },
    
    {
      name: 'priority',
      label: 'Priority',
      type: 'select',
      options: ['Low', 'Medium', 'High'],
      required: true
    },
    {
      // ⚠️ Status is only Pending / Completed in your DB
      name: 'status',
      label: 'Status',
      type: 'select',
      options: ['Pending', 'Completed'],
      required: true
    },
    { name: 'dueDate', label: 'Due Date', type: 'date', min:minDateStr, max:maxDateStr },
    { name: 'description', label: 'Description', type: 'textarea', maxLength: 500 },
    // CreatedAt is server-side; no form field
  ];

  const handleFieldChange = (fieldName, value, setFormValues) => {
    setFormValues(prev => ({ ...prev, [fieldName]: value }));
  };

  const validate = (d) => {
    if (!d.assignedTo) return 'Employee is required.';
    if (!d.taskTitle?.trim()) return 'Task title is required.';
    if (!['Low','Medium','High'].includes(d.priority)) return 'Priority must be Low/Medium/High.';
    if (!['Pending','Completed'].includes(d.status)) return 'Status must be Pending/Completed.';
    return null;
  };

  const toPayload = (data) => {
    const payload = { ...data };
    payload.taskTitle = payload.taskTitle?.trim();
    if (!payload.description) delete payload.description;
    if (!payload.dueDate) delete payload.dueDate;
    return payload;
  };

  const handleSubmit = async (data) => {
    const payload = toPayload(data);
    const err = validate(payload);
    if (err) { toast.error(err); return; }

    try {
      let res;
      if (isEditing) {
        payload.taskID = initialValues.taskID;
        res = await fetch(`http://localhost:5186/api/tasks/${initialValues.taskID}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw res;
        toast.info('Task updated ✅');
      } else {
        res = await fetch('http://localhost:5186/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw res;
        toast.success('Task created ✅');
      }

      setInitialValues({});
      setEditId(null);
      fetchTasks();
    } catch (e) {
      let message = 'Error saving task ❌';
      try {
        const data = await e.json();
        message = data?.message || data?.errors?.[0] || message;
      } catch {
      toast.error(message);}
    }
  };

  const handleEdit = (index) => {
    const r = rows[index];
    const toYMD = (d) => {
      if (!d) return '';
      const dt = new Date(d);
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    setInitialValues({
      taskID: r.taskID,
      assignedTo: r.assignedTo,      // 👈 matches backend key
      taskTitle: r.taskTitle,        // 👈 matches backend key
      description: r.description || '',
      priority: r.priority,
      status: r.status,
      dueDate: toYMD(r.dueDate)
    });
    setEditId(r.taskID);
  };

  const handleDelete = async (index) => {
    const id = rows[index].taskID;
    try {
      const res = await fetch(`http://localhost:5186/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.error('Task deleted ❌');
      fetchTasks();
    } catch {
      toast.error('Failed to delete ❌');
    }
  };

  // Columns must match API response keys (camelCase)
  const columns = [
    'taskID',
    'employeeCode',
    'employeeName',
    'taskTitle',
    'priority',
    'status',
    'dueDate',
    'createdAt',
    'actions'
  ];

  const rowsForTable = rows.map((r, idx) => ({
    ...r,
    dueDate: r.dueDate
      ? new Date(r.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—',
    createdAt: r.createdAt
      ? new Date(r.createdAt).toLocaleString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        })
      : '—',
    actions: (
      <div className="action-buttons">
        <button className="btn edit-btn" onClick={() => handleEdit(idx)}>Edit</button>
        <button className="btn delete-btn" onClick={() => handleDelete(idx)}>Delete</button>
      </div>
    )
  }));

  return (
    <div>
      <h2>Task Management</h2>
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

export default TaskManagement;
