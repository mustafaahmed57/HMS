import React, { useEffect, useState } from 'react';
import FormBuilder from '../components/FormBuilder';
import DataTable from '../components/DataTable';
import { toast } from 'react-toastify';
import { useLimitedDateRange } from "../components/useLimitedDateRange";


// 🔹 Helper: backend error parse
async function parseError(e, fallback = 'Error saving job posting ❌') {
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

function JobPostingManagement() {
  const [rows, setRows] = useState([]);
  const [initialValues, setInitialValues] = useState({});
  const [editId, setEditId] = useState(null);
  const isEditing = !!editId;

   const { minDateStr, maxDateStr } = useLimitedDateRange({
    allowPastDays: 1,     // jitnay din back-date allow
    allowFutureDays: 15,   // future bilkul nahin
  });

  const fetchRows = () => {
    fetch('http://localhost:5186/api/jobposting')
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => setRows(data))
      .catch(() => toast.error('Failed to load job postings ❌'));
  };


  useEffect(() => {
    fetchRows();
  }, []);

//   // 🔹 Dropdown options
//   const departmentOptions = [
//     'Front Office',
//     'Housekeeping',
//     'Food & Beverage (F&B)',
//     'Kitchen / Food Production',
//     'Finance & Accounts',
//     'Human Resources (HR)',
//   ];

//   const designationOptions = [
//     'General Manager (GM)',
//     'Front Office Manager',
//     'Housekeeping Supervisor',
//     'Restaurant Manager (F&B)',
//     'Executive Chef',
//     'Accounts Officer / Accountant',
//     'HR Officer',
//   ];
const educationoptions = [
    'Marticulations',
    'Intermediate',
    'Bachelors BS',
    'Masters MS',
    'PHD',
  ];

  const jobTypeOptions = ['Full-Time', 'Part-Time', 'Contract', 'Internship'];

  const statusOptions = ['Active', 'Closed', 'On Hold'];

  // 🧱 Form fields
  const fields = [
    {
      name: 'department',
      label: 'Department',
      type: 'text',
    //   options: departmentOptions,
      required: true,
    },
    {
      name: 'designation',
      label: 'Designation',
      type: 'text',
    //   options: designationOptions,
      required: true,
    },
    {
      name: 'numberOfPositions',
      label: 'Number of Positions',
      type: 'number',
      required: true,
      min: 1,
    },
    {
      name: 'jobDescription',
      label: 'Job Description',
      type: 'textarea',
      required: true,
      minLength: 10,
    },
    {
      name: 'requiredSkills',
      label: 'Required Skills',
      type: 'textarea',
    },
    {
      name: 'experienceRequired',
      label: 'Experience Required',
      type: 'number',
    },
    {
      name: 'educationRequired',
      label: 'Education Required',
      type: 'select',
      options:educationoptions,
    },
    {
      name: 'jobType',
      label: 'Job Type',
      type: 'select',
      options: jobTypeOptions,
      required: true,
    },
    {
      name: 'salaryMin',
      label: 'Salary Min',
      type: 'number',
      step: '0.01',
    },
    {
      name: 'salaryMax',
      label: 'Salary Max',
      type: 'number',
      step: '0.01',
    },
    {
      name: 'location',
      label: 'Location',
      type: 'text',
      required: true,
    },
    {
      name: 'postedDate',
      label: 'Posted Date',
      type: 'date',
      required: true,
      min: minDateStr,
      max: maxDateStr,
    },
    {
      name: 'closingDate',
      label: 'Closing Date',
      type: 'date',
      required: true,
      min: minDateStr,
      max: maxDateStr,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: statusOptions,
      required: true,
    },
  ];

  const handleFieldChange = (fieldName, value, setFormValues) => {
    setFormValues(prev => ({ ...prev, [fieldName]: value }));
  };

  // ✅ Front-end validation
  const validate = (d) => {
    if (!d.department) return 'Department is required.';
    if (!d.designation) return 'Designation is required.';
    if (!d.numberOfPositions || Number(d.numberOfPositions) <= 0)
      return 'Number of Positions must be greater than 0.';
    if (!d.jobDescription || d.jobDescription.trim().length < 10)
      return 'Job Description must be at least 10 characters.';
    if (!d.jobType) return 'Job Type is required.';
    if (!d.location || d.location.trim() === '')
      return 'Location is required.';
    if (!d.postedDate) return 'Posted Date is required.';
    if (!d.closingDate) return 'Closing Date is required.';
    if (!d.status) return 'Status is required.';

    const posted = new Date(d.postedDate);
    const closing = new Date(d.closingDate);
    if (closing < posted) return 'Closing Date cannot be before Posted Date.';

    if (d.salaryMin && d.salaryMax && Number(d.salaryMin) > Number(d.salaryMax))
      return 'Salary Min cannot be greater than Salary Max.';

    return null;
  };

  // 🔄 Map to backend payload (C# property names)
  const toPayload = (d) => ({
    JobPostingID: d.jobPostingID || 0,
    Department: d.department || '',
    Designation: d.designation || '',
    NumberOfPositions: Number(d.numberOfPositions || 0),
    JobDescription: d.jobDescription || '',
    RequiredSkills: d.requiredSkills || null,
    ExperienceRequired: d.experienceRequired || null,
    EducationRequired: d.educationRequired || null,
    JobType: d.jobType || '',
    SalaryMin: d.salaryMin !== '' && d.salaryMin != null ? Number(d.salaryMin) : null,
    SalaryMax: d.salaryMax !== '' && d.salaryMax != null ? Number(d.salaryMax) : null,
    Location: d.location || '',
    PostedDate: d.postedDate || '',
    ClosingDate: d.closingDate || '',
    Status: d.status || '',
  });

  // 💾 Submit
  const handleSubmit = async (data) => {
    const err = validate(data);
    if (err) { toast.error(err); return; }

    const payload = toPayload(data);

    try {
      let res;
      if (isEditing) {
        res = await fetch(`http://localhost:5186/api/jobposting/${data.jobPostingID}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw res;
        toast.info('Job posting updated ✅');
      } else {
        res = await fetch('http://localhost:5186/api/jobposting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw res;
        toast.success('Job posting created ✅');
      }

      setInitialValues({});
      setEditId(null);
      fetchRows();
    } catch (e) {
      const message = await parseError(e, 'Error saving job posting ❌');
      toast.error(message);
    }
  };

  // ✏️ Edit
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
      jobPostingID: r.jobPostingID,
      department: r.department,
      designation: r.designation,
      numberOfPositions: r.numberOfPositions,
      jobDescription: r.jobDescription,
      requiredSkills: r.requiredSkills,
      experienceRequired: r.experienceRequired,
      educationRequired: r.educationRequired,
      jobType: r.jobType,
      salaryMin: r.salaryMin ?? '',
      salaryMax: r.salaryMax ?? '',
      location: r.location,
      postedDate: toYMD(r.postedDate),
      closingDate: toYMD(r.closingDate),
      status: r.status,
    });
    setEditId(r.jobPostingID);
  };

  // 🗑️ Delete
  const handleDelete = async (index) => {
    const id = rows[index].jobPostingID;
    try {
      const res = await fetch(`http://localhost:5186/api/jobposting/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.error('Job posting deleted ❌');
      fetchRows();
    } catch {
      toast.error('Failed to delete ❌');
    }
  };

  // 📊 Table columns
  const columns = [
    'jobPostingID',
    'department',
    'designation',
    'numberOfPositions',
    'jobType',
    'location',
    'postedDate',
    'closingDate',
    'status',
    'actions',
  ];

  const rowsForTable = rows.map((r, idx) => ({
    ...r,
    postedDate: r.postedDate
      ? new Date(r.postedDate).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '—',
    closingDate: r.closingDate
      ? new Date(r.closingDate).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '—',
    actions: (
      <div className="action-buttons">
        <button className="btn edit-btn" onClick={() => handleEdit(idx)}>Edit</button>
        <button className="btn delete-btn" onClick={() => handleDelete(idx)}>Delete</button>
      </div>
    ),
  }));

  return (
    <div>
      <h2>Job Posting Management</h2>
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

export default JobPostingManagement;
