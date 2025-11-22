import React, { useEffect, useState } from 'react';
import FormBuilder from '../components/FormBuilder';
import DataTable from '../components/DataTable';
import { toast } from 'react-toastify';

// 🔹 Helper: backend error message nikalna
async function parseError(e, fallback = 'Error saving hiring record ❌') {
  try {
    if (e instanceof Response || typeof e?.json === 'function') {
      const data = await e.json();
      if (data?.message) return data.message;
      if (data?.error) return data.error;
      if (data?.errors) {
        const firstKey = Object.keys(data.errors)[0];
        if (firstKey && Array.isArray(data.errors[firstKey])) {
          return data.errors[firstKey][0];
        }
      }
      return fallback;
    }

    if (e?.message) return e.message;
    if (typeof e === 'string') return e;

    return fallback;
  } catch {
    return fallback;
  }
}

function HiringManagement() {
  const [rows, setRows] = useState([]);
  const [initialValues, setInitialValues] = useState({});
  const [editId, setEditId] = useState(null);
  const isEditing = !!editId;

  // 🔁 Load Hiring records
  const fetchRows = () => {
    fetch('http://localhost:5186/api/hiring')
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => setRows(data))
      .catch(() => toast.error('Failed to load hiring records ❌'));
  };

  useEffect(() => {
    fetchRows();
  }, []);

  // 🔹 Dropdown options
  const departmentOptions = [
    'Front Office',
    'Housekeeping',
    'Food & Beverage (F&B)',
    'Kitchen / Food Production',
    'Finance & Accounts',
    'Human Resources (HR)',
  ];

  const designationOptions = [
    'General Manager (GM)',
    'Front Office Manager',
    'Housekeeping Supervisor',
    'Restaurant Manager (F&B)',
    'Executive Chef',
    'Accounts Officer / Accountant',
  ];

  const statusOptions = [
    'New',
    'Shortlisted',
    'Interviewed',
    'Selected',
    'Rejected',
  ];

  // 🧱 Form fields (FormBuilder)
  const baseFields = [
    {
      name: 'department',
      label: 'Department',
      type: 'select',
      options: departmentOptions,
      required: true,
      disabled: isEditing   // edit pe lock
    },
    {
      name: 'designation',
      label: 'Designation',
      type: 'select',
      options: designationOptions,
      required: true,
      disabled: isEditing
    },

    {
      name: 'candidateName',
      label: 'Candidate Name',
      type: 'text',
      required: true,
      maxLength: 100,
      disabled: isEditing
    },
    {
      name: 'candidateContact',
      label: 'Contact (11 digits)',
      type: 'text',
      required: true,
      maxLength: 11,
      pattern: '^\\d{11}$',
      disabled: isEditing
    },
    {
      name: 'candidateEmail',
      label: 'Email',
      type: 'email',
      required: true,
      maxLength: 100,
      disabled: isEditing
    },

    {
      name: 'applicationDate',
      label: 'Application Date',
      type: 'date',
      required: true,
      disabled: isEditing
    },
    {
      name: 'interviewDate',
      label: 'Interview Date',
      type: 'date',
      required: true,
      disabled: isEditing
    },
    {
      name: 'interviewer',
      label: 'Interviewer',
      type: 'text',
      required: true,
      disabled: isEditing
    },

    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: statusOptions,
      required: true,
      disabled: false        // 🔥 sirf yeh editable in edit mode
    },

    {
      name: 'remarks',
      label: 'Remarks',
      type: 'textarea',
      required: true,
      minLength: 10,
      disabled: isEditing    // remarks bhi lock
    }
  ];

  // CV field sirf CREATE pe dikhana
  const fields = isEditing
    ? baseFields
    : [
        ...baseFields,
        {
          name: 'cvFile',
          label: 'Upload CV (PDF only)',
          type: 'file',
          accept: 'application/pdf',
          required: true
        }
      ];

  // 🔧 Field change handler
  const handleFieldChange = (fieldName, value, setFormValues) => {
    if (fieldName === 'cvFile') {
      setFormValues(prev => ({ ...prev, cvFile: value || null }));
      return;
    }
    setFormValues(prev => ({ ...prev, [fieldName]: value }));
  };

  // ✅ Front-end validation
  const validate = (d) => {
    // 🔹 EDIT MODE: sirf status validate karo
    if (isEditing) {
      if (!d.status) return 'Status is required.';
      return null;
    }

    // 🔹 CREATE MODE: full validation
    if (!d.department) return 'Department is required.';
    if (!d.designation) return 'Designation is required.';
    if (!d.candidateName?.trim()) return 'Candidate Name is required.';
    if (!/^\d{11}$/.test(String(d.candidateContact || ''))) return 'Contact must be 11 digits.';
    if (!d.candidateEmail?.trim()) return 'Candidate Email is required.';
    if (!d.applicationDate) return 'Application Date is required.';
    if (!d.interviewDate) return 'Interview Date is required.';
    if (!d.interviewer?.trim()) return 'Interviewer is required.';
    if (!d.status) return 'Status is required.';
    if (!d.remarks || d.remarks.trim().length < 10) return 'Remarks must be at least 10 characters.';

    const app = new Date(d.applicationDate);
    const intv = new Date(d.interviewDate);
    if (intv < app) return 'Interview Date cannot be before Application Date.';

    if (!d.cvFile) return 'CV (PDF) is required.';

    if (d.cvFile) {
      const file = d.cvFile;
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        return 'Only PDF files are allowed for CV.';
      }
      if (file.size > 2 * 1024 * 1024) {
        return 'CV size must be less than 2 MB.';
      }
    }

    return null;
  };

  // 🔄 Convert form values → FormData (multipart/form-data)
  const toFormData = (d) => {
    const fd = new FormData();

    if (d.hiringID) {
      fd.append('HiringID', d.hiringID);
    }

    fd.append('Department', d.department || '');
    fd.append('Designation', d.designation || '');
    fd.append('CandidateName', d.candidateName || '');
    fd.append('CandidateContact', d.candidateContact || '');
    fd.append('CandidateEmail', d.candidateEmail || '');
    fd.append('ApplicationDate', d.applicationDate || '');
    fd.append('InterviewDate', d.interviewDate || '');
    fd.append('Interviewer', d.interviewer || '');
    fd.append('Status', d.status || '');
    fd.append('Remarks', d.remarks || '');

    if (d.cvFile) {
      fd.append('cvFile', d.cvFile);
    }

    return fd;
  };

  // 💾 Submit
  const handleSubmit = async (data) => {
    const err = validate(data);
    if (err) { toast.error(err); return; }

    const formData = toFormData(data);

    try {
      let res;
      if (isEditing) {
        res = await fetch(`http://localhost:5186/api/hiring/${data.hiringID}`, {
          method: 'PUT',
          body: formData
        });
        if (!res.ok) throw res;
        toast.info('Hiring record updated ✅');
      } else {
        res = await fetch('http://localhost:5186/api/hiring', {
          method: 'POST',
          body: formData
        });
        if (!res.ok) throw res;
        toast.success('Hiring record created ✅');
      }

      setInitialValues({});
      setEditId(null);
      fetchRows();
    } catch (e) {
      const message = await parseError(e, 'Error saving hiring record ❌');
      toast.error(message);
    }
  };

  // ✏️ Edit row
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
      hiringID: r.hiringID,
      department: r.department,
      designation: r.designation,
      candidateName: r.candidateName,
      candidateContact: r.candidateContact,
      candidateEmail: r.candidateEmail,
      applicationDate: toYMD(r.applicationDate),
      interviewDate: toYMD(r.interviewDate),
      interviewer: r.interviewer,
      status: r.status,
      remarks: r.remarks,
      // cvFile: null  // edit pe CV nahi chhedna
    });
    setEditId(r.hiringID);
  };

  // 🗑️ Delete row
  const handleDelete = async (index) => {
    const id = rows[index].hiringID;
    try {
      const res = await fetch(`http://localhost:5186/api/hiring/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.error('Hiring record deleted ❌');
      fetchRows();
    } catch {
      toast.error('Failed to delete ❌');
    }
  };

  // 📊 Table columns
  const columns = [
    'hiringID',
    'department',
    'designation',
    'candidateName',
    'candidateContact',
    'candidateEmail',
    'applicationDate',
    'interviewDate',
    // 'interviewer',
    'status',
    'actions'
  ];

  const rowsForTable = rows.map((r, idx) => ({
    ...r,
    applicationDate: r.applicationDate
      ? new Date(r.applicationDate).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      : '—',
    interviewDate: r.interviewDate
      ? new Date(r.interviewDate).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
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
      <h2>Hiring Management</h2>
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

export default HiringManagement;
