import React, { useEffect, useState } from "react";
import FormBuilder from "../components/FormBuilder";
import DataTable from "../components/DataTable";
import { toast } from "react-toastify";
import { useLimitedDateRange } from "../components/useLimitedDateRange";

// 🔹 Dropdown Options
const statusOptionsCreate = ["Active"]; // 🔒 create only
const statusOptionsEdit = ["Active", "Closed", "On Hold"];

const departmentOptions = [
  "Front Office",
  "Housekeeping",
  "Food & Beverage (F&B)",
  "Kitchen / Food Production",
  "Finance & Accounts",
  "Human Resources (HR)",
];

const designationOptions = [
  "General Manager (GM)",
  "Front Office Manager",
  "Housekeeping Supervisor",
  "Restaurant Manager",
  "Executive Chef",
  "Accounts Officer",
  "HR Officer",
];

const locationOptions = [
  // // Federal
  // 'Islamabad',

  // // Punjab
  // 'Rawalpindi',
  // 'Lahore',
  // 'Faisalabad',
  // 'Gujranwala',
  // 'Multan',
  // 'Sialkot',
  // 'Bahawalpur',
  // 'Sargodha',
  // 'Sheikhupura',

  // Sindh
  "Karachi",
  // 'Hyderabad',
  // 'Sukkur',
  // 'Larkana',
  // 'Mirpurkhas',

  // // Khyber Pakhtunkhwa (KPK)
  // 'Peshawar',
  // 'Mardan',
  // 'Abbottabad',
  // 'Swat',
  // 'Mansehra',
  // 'Dera Ismail Khan',

  // // Balochistan
  // 'Quetta',
  // 'Gwadar',
  // 'Turbat',
  // 'Khuzdar',

  // // Azad Kashmir
  // 'Muzaffarabad',
  // 'Mirpur (AJK)',
  // 'Rawalakot',

  // // Gilgit Baltistan
  // 'Gilgit',
  // 'Skardu',
];

const experienceOptions = ["6-month", "12-month", "24-month"];
const educationOptions = [
  "Matriculation",
  "Intermediate",
  "Bachelors",
  "Masters",
  "PhD",
];
const jobTypeOptions = ["Full-Time", "Part-Time", "Contract", "Internship"];
// const statusOptions = ["Active", "Closed", "On Hold"];
// options: isEditing ? statusOptionsEdit : statusOptionsCreate,

function JobPostingManagement() {
  const [rows, setRows] = useState([]);
  const [initialValues, setInitialValues] = useState({});
  const [editId, setEditId] = useState(null);
  const isEditing = !!editId;

  const { minDateStr, maxDateStr } = useLimitedDateRange({
    allowPastDays: 1,
    allowFutureDays: 15,
  });

  useEffect(() => {
    fetch("http://localhost:5186/api/jobposting")
      .then((res) => res.json())
      .then(setRows)
      .catch(() => toast.error("Failed to load job postings"));
  }, []);

  // 🔹 FORM FIELDS
  const fields = [
    {
      name: "department",
      label: "Department",
      type: "select",
      options: departmentOptions,
      required: true,
      disabled: isEditing,
    },
    {
      name: "designation",
      label: "Designation",
      type: "select",
      options: designationOptions,
      required: true,
      disabled: isEditing,
    },
    {
      name: "numberOfPositions",
      label: "Number of Positions",
      type: "number",
      required: true,
      disabled: isEditing,
    },
    {
      name: "jobDescription",
      label: "Job Description",
      type: "textarea",
      required: true,
      disabled: isEditing,
    },
    {
      name: "requiredSkills",
      label: "Required Skills",
      type: "textarea",
      disabled: isEditing,
    },
    {
      name: "experienceRequired",
      label: "Experience Required",
      type: "select",
      options: experienceOptions,
      disabled: isEditing,
    },
    {
      name: "educationRequired",
      label: "Education Required",
      type: "select",
      options: educationOptions,
      disabled: isEditing,
    },
    {
      name: "jobType",
      label: "Job Type",
      type: "select",
      options: jobTypeOptions,
      required: true,
      disabled: isEditing,
    },
    {
      name: "salaryMin",
      label: "Salary Min",
      type: "number",
      disabled: isEditing,
    },
    {
      name: "salaryMax",
      label: "Salary Max",
      type: "number",
      disabled: isEditing,
    },
    {
      name: "location",
      label: "Location",
      type: "select",
      options: locationOptions,
      required: true,
      disabled: isEditing,
    },
    {
      name: "postedDate",
      label: "Posted Date",
      type: "date",
      required: true,
      min: minDateStr,
      max: maxDateStr,
      disabled: isEditing,
    },
    {
      name: "closingDate",
      label: "Closing Date",
      type: "date",
      required: true,
      min: minDateStr,
      max: maxDateStr,
      disabled: isEditing,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      // options: statusOptions,
      options: isEditing ? statusOptionsEdit : statusOptionsCreate,
      required: true,
      disabled: isEditing && initialValues?.status === "Closed",
    },
  ];

  const handleSubmit = async (data) => {
    // 🔹 Salary validation (frontend)
    const salaryMin = Number(data.salaryMin);
    const salaryMax = Number(data.salaryMax);

    if (!salaryMin || salaryMin <= 0) {
      toast.error("Minimum salary must be greater than 0");
      return;
    }

    if (!salaryMax || salaryMax <= 0) {
      toast.error("Maximum salary must be greater than 0");
      return;
    }

    if (salaryMax < salaryMin) {
      toast.error("Maximum salary cannot be less than minimum salary");
      return;
    }

    try {
      // 🔒 FRONTEND LOCK: Closed jobs cannot be changed
      if (isEditing && initialValues?.status === "Closed") {
        toast.warning("This job is closed and cannot be changed.");
        return;
      }

      // =========================
      // ✏️ EDIT MODE (STATUS ONLY)
      // =========================
      if (isEditing) {
        const payload = {
          Status: data.status,
        };

        const res = await fetch(
          `http://localhost:5186/api/jobposting/${data.jobPostingID}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (!res.ok) throw new Error();

        toast.info("Status updated ✅");

        // 🔄 Refresh table
        const refreshed = await fetch("http://localhost:5186/api/jobposting");
        setRows(await refreshed.json());

        // 🧹 Exit edit mode
        setEditId(null);
        setInitialValues({});
        return;
      }

      // =========================
      // ➕ CREATE MODE
      // =========================
      const payload = {
        Department: data.department,
        Designation: data.designation,
        NumberOfPositions: Number(data.numberOfPositions),
        JobDescription: data.jobDescription,
        RequiredSkills: data.requiredSkills,
        ExperienceRequired: data.experienceRequired,
        EducationRequired: data.educationRequired,
        JobType: data.jobType,
        SalaryMin: data.salaryMin || null,
        SalaryMax: data.salaryMax || null,
        Location: data.location,
        PostedDate: data.postedDate,
        ClosingDate: data.closingDate,
        // Status: data.status,
        Status: "Active",
      };

      const res = await fetch("http://localhost:5186/api/jobposting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      toast.success("Job created ✅");

      // 🔄 Refresh table
      const refreshed = await fetch("http://localhost:5186/api/jobposting");
      setRows(await refreshed.json());

      // 🧹 Reset form
      setInitialValues({});
    } catch {
      toast.error("Operation failed ❌");
    }
  };

  const handleEdit = (index) => {
    const r = rows[index];
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
      salaryMin: r.salaryMin,
      salaryMax: r.salaryMax,
      location: r.location,
      postedDate: r.postedDate?.slice(0, 10),
      closingDate: r.closingDate?.slice(0, 10),
      status: r.status,
    });
    setEditId(r.jobPostingID);
  };

  const columns = [
    "jobPostingID",
    "department",
    "designation",
    "jobType",
    "location",
    "status",
    "actions",
  ];

  const rowsForTable = rows.map((r, i) => ({
    ...r,
    actions: (
      <button
        className="btn edit-btn"
        disabled={r.status === "Closed"}
        onClick={() => handleEdit(i)}
        title={r.status === "Closed" ? "Closed jobs cannot be edited" : "Edit"}
      >
        Edit
      </button>
    ),
  }));

  return (
    <div>
      <h2>Job Posting Management</h2>
      <FormBuilder
        fields={fields}
        initialValues={initialValues}
        onSubmit={handleSubmit}
      />
      <DataTable columns={columns} rows={rowsForTable} />
    </div>
  );
}

export default JobPostingManagement;
