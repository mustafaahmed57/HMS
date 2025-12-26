import React, { useEffect, useState } from "react";
import FormBuilder from "../components/FormBuilder";
import DataTable from "../components/DataTable";
import { toast } from "react-toastify";
import InvoiceModal from "../components/InvoiceModal";

// 🔹 Helper: safely extract error message from backend
async function parseError(e, fallback = "Error saving payroll ❌") {
  try {
    // If it's a fetch Response (or response-like)
    if (e instanceof Response || typeof e?.json === "function") {
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

    // Normal JS error
    if (e?.message) return e.message;

    // String error
    if (typeof e === "string") return e;

    return fallback;
  } catch {
    return fallback;
  }
}

function PayrollProcessing() {
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [initialValues, setInitialValues] = useState({});
  const [editId, setEditId] = useState(null);
  const isEditing = !!editId;
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);

  const openPayrollInvoice = async (payrollID) => {
    try {
      const res = await fetch(
        `http://localhost:5186/api/payroll/${payrollID}/invoice`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSelectedPayroll(data);
      setIsInvoiceOpen(true);
    } catch {
      toast.error("Failed to load payroll invoice ❌");
    }
  };

  const fetchEmployees = () => {
    fetch("http://localhost:5186/api/payroll/employees-active")
      .then((res) => res.json())
      .then((data) => setEmployees(data))
      .catch(() => toast.error("Failed to load employees ❌"));
  };

  const fetchRows = () => {
    fetch("http://localhost:5186/api/payroll")
      .then((res) => res.json())
      .then((data) => setRows(data))
      .catch(() => toast.error("Failed to load payrolls ❌"));
  };

  useEffect(() => {
    fetchEmployees();
    fetchRows();
  }, []);

  // 🔹 Year dropdown (current + previous year)
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { value: currentYear, label: String(currentYear) },
    { value: currentYear - 1, label: String(currentYear - 1) },
  ];

  const fields = [
    {
      name: "employeeID",
      label: "Employee",
      type: "select",
      options: employees,
      required: true,
    },
    {
      name: "periodYear",
      label: "Year",
      type: "select",
      options: yearOptions,
      required: true,
    },
    {
      name: "periodMonth",
      label: "Month",
      type: "select",
      options: [
        { value: 1, label: "Jan" },
        { value: 2, label: "Feb" },
        { value: 3, label: "Mar" },
        { value: 4, label: "Apr" },
        { value: 5, label: "May" },
        { value: 6, label: "Jun" },
        { value: 7, label: "Jul" },
        { value: 8, label: "Aug" },
        { value: 9, label: "Sep" },
        { value: 10, label: "Oct" },
        { value: 11, label: "Nov" },
        { value: 12, label: "Dec" },
      ],
      required: true,
    },
    {
      name: "basicSalary",
      label: "Basic Salary",
      type: "number",
      disabled: true,
    },
    // { name: "deductions", label: "Deductions", type: "text" },
    { name: "netSalary", label: "Net Salary", type: "number", disabled: true },
    {
      name: "paymentDate",
      label: "Payment Date",
      type: "date",
      disabled: true,
    },
  ];

  const handleFieldChange = async (field, value, setFormValues) => {
    if (field === "employeeID") {
      try {
        const res = await fetch(`http://localhost:5186/api/Employees/${value}`);
        if (!res.ok) throw new Error();
        const emp = await res.json();
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;

        setFormValues((prev) => {
          const rawDed = prev?.deductions ?? ""; // string hi rehne do
          const dedNum = rawDed === "" || rawDed == null ? 0 : Number(rawDed);
          const basic = Number(emp.basicSalary || 0);

          return {
            ...prev,
            employeeID: value,
            basicSalary: basic,
            deductions: rawDed, // 👈 string
            netSalary: basic - (Number.isNaN(dedNum) ? 0 : dedNum),
            paymentDate: today.toISOString().split("T")[0],
            periodYear: prev.periodYear || year,
            periodMonth: prev.periodMonth || month,
          };
        });
      } catch {
        toast.error("Failed to fetch salary ❌");
      }
      return;
    }

    if (field === "deductions") {
      setFormValues((prev) => {
        const basic = Number(prev?.basicSalary || 0);
        const raw = value; // 👈 directly string
        const dedNum = raw === "" || raw == null ? 0 : Number(raw);

        return {
          ...prev,
          deductions: raw, // 👈 string store
          netSalary: basic - (Number.isNaN(dedNum) ? 0 : dedNum),
        };
      });
      return;
    }

    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const toPayload = (d) => {
    const payload = { ...d };

    payload.periodYear = Number(payload.periodYear);
    payload.periodMonth = Number(payload.periodMonth);

    const raw = payload.deductions;
    const ded = raw === "" || raw == null ? 0 : Number(raw);
    payload.deductions = Number.isNaN(ded) ? 0 : ded; // 0 allowed, default bhi 0

    delete payload.netSalary;
    delete payload.basicSalary;
    delete payload.paymentDate;

    return payload;
  };

  const validate = (d) => {
    if (!d.employeeID) return "Employee is required.";
    if (!d.periodYear) return "Year is required.";
    if (!d.periodMonth) return "Month is required.";

    const raw = d.deductions;
    const ded = raw === "" || raw == null ? 0 : Number(raw);

    if (Number.isNaN(ded)) return "Deductions must be a number.";
    if (ded < 0) return "Deductions cannot be negative."; // 0 ✔ allowed

    return null;
  };

  const handleSubmit = async (data) => {
    const err = validate(data);
    if (err) {
      toast.error(err);
      return;
    }
    const payload = toPayload(data);

    try {
      let res;
      if (isEditing) {
        payload.payrollID = initialValues.payrollID;
        res = await fetch(
          `http://localhost:5186/api/payroll/${initialValues.payrollID}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        if (!res.ok) throw res;
        toast.info("Payroll updated ✅");
      } else {
        res = await fetch("http://localhost:5186/api/payroll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw res;
        toast.success("Payroll created ✅");
      }
      setInitialValues({});
      setEditId(null);
      fetchRows();
    } catch (e) {
      const message = await parseError(e, "Error saving payroll ❌");
      toast.error(message); // ✅ ab joining-date wala message bhi aa jayega
    }
  };

  // const handleEdit = (index) => {
  //   const r = rows[index];
  //   const toYMD = (d) => {
  //     if (!d) return '';
  //     const dt = new Date(d);
  //     const yyyy = dt.getFullYear();
  //     const mm = String(dt.getMonth() + 1).padStart(2, '0');
  //     const dd = String(dt.getDate()).padStart(2, '0');
  //     return `${yyyy}-${mm}-${dd}`;
  //   };
  //   setInitialValues({
  //     payrollID: r.payrollID,
  //     employeeID: r.employeeID,
  //     periodYear: r.periodYear,
  //     periodMonth: r.periodMonth,
  //     basicSalary: r.basicSalary,
  //     deductions: r.deductions,
  //     netSalary: r.netSalary,
  //     paymentDate: toYMD(r.paymentDate)
  //   });
  //   setEditId(r.payrollID);
  // };

  // const handleDelete = async (index) => {
  //   const id = rows[index].payrollID;
  //   try {
  //     const res = await fetch(`http://localhost:5186/api/payroll/${id}`, { method: 'DELETE' });
  //     if (!res.ok) throw new Error();
  //     toast.error('Payroll deleted ❌');
  //     fetchRows();
  //   } catch {
  //     toast.error('Failed to delete ❌');
  //   }
  // };

  const columns = [
    "payrollID",
    "employeeCode",
    "employeeName",
    "periodYear",
    "periodMonth",
    "basicSalary",
    "deductions",
    "netSalary",
    "paymentDate",
    "actions",
  ];

  const rowsForTable = rows.map((r) => ({
    ...r,
    paymentDate: r.paymentDate
      ? new Date(r.paymentDate).toLocaleDateString("en-GB")
      : "—",

    actions: (
      <button
        className="btn btn-sm"
        onClick={() => openPayrollInvoice(r.payrollID)}
      >
        View Invoice
      </button>
    ),
  }));

  return (
    <div>
      <h2>Payroll Processing</h2>
      <FormBuilder
        fields={fields}
        onSubmit={handleSubmit}
        initialValues={initialValues}
        onFieldChange={handleFieldChange}
      />
      <DataTable columns={columns} rows={rowsForTable} />
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        title={`Payroll Invoice - ${selectedPayroll?.employeeName}`}
      >
        {selectedPayroll && (
          <div
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#111827",
              padding: "10px",
            }}
          >
            {/* ===== Header ===== */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>StayElite HMS</h2>
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  Payroll / Salary Slip
                </div>
              </div>
              <div style={{ textAlign: "right", fontSize: 13 }}>
                <div>
                  <b>Period:</b> {selectedPayroll.periodMonth}/
                  {selectedPayroll.periodYear}
                </div>
                <div>
                  <b>Payment Date:</b>{" "}
                  {new Date(selectedPayroll.paymentDate).toLocaleDateString(
                    "en-GB"
                  )}
                </div>
              </div>
            </div>

            {/* ===== Employee Card ===== */}
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 14,
                marginBottom: 20,
                background: "#f9fafb",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                <div>
                  <b>Employee:</b> {selectedPayroll.employeeName}
                </div>
                <div>
                  <b>Employee Code:</b> {selectedPayroll.employeeCode}
                </div>
                <div>
                  <b>Designation:</b> {selectedPayroll.designation}
                </div>
                <div>
                  <b>Payroll ID:</b> {selectedPayroll.payrollID}
                </div>
              </div>
            </div>

            {/* ===== Attendance Summary ===== */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ marginBottom: 8 }}>Attendance Summary</h4>
              <table style={{ width: "100%", fontSize: 14 }}>
                <tbody>
                  <tr>
                    <td>Days Present</td>
                    <td align="right">
                      {selectedPayroll.attendance.daysPresent}
                    </td>
                  </tr>
                  <tr>
                    <td>Days Absent</td>
                    <td align="right">
                      {selectedPayroll.attendance.daysAbsent}
                    </td>
                  </tr>
                  <tr>
                    <td>Half Days</td>
                    <td align="right">
                      {selectedPayroll.attendance.daysHalfDay}
                    </td>
                  </tr>
                  <tr>
                    <td>Short Minutes</td>
                    <td align="right">
                      {selectedPayroll.attendance.shortMinutesTotal}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ===== Salary Breakdown ===== */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ marginBottom: 8 }}>Salary Breakdown</h4>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 14,
                }}
              >
                <tbody>
                  <tr>
                    <td>Basic Salary</td>
                    <td align="right">
                      {selectedPayroll.basicSalary.toLocaleString()}
                    </td>
                  </tr>

                  <tr style={{ color: "#b91c1c" }}>
                    <td>Attendance Deduction</td>
                    <td align="right">
                      -
                      {selectedPayroll.attendance.attendanceDeduction.toLocaleString()}
                    </td>
                  </tr>

                  <tr style={{ color: "#b91c1c" }}>
                    <td>Task Penalty</td>
                    <td align="right">
                      -{selectedPayroll.tasks.taskPenalty.toLocaleString()}
                    </td>
                  </tr>

                  <tr style={{ color: "#b91c1c" }}>
                    <td>Manual Deductions</td>
                    <td align="right">
                      -{selectedPayroll.manualDeductions.toLocaleString()}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style={{
                        borderTop: "1px solid #e5e7eb",
                        paddingTop: 6,
                      }}
                    >
                      <b>Total Deductions</b>
                    </td>
                    <td
                      align="right"
                      style={{
                        borderTop: "1px solid #e5e7eb",
                        paddingTop: 6,
                      }}
                    >
                      <b>-{selectedPayroll.totalDeductions.toLocaleString()}</b>
                    </td>
                  </tr>

                  <tr>
                    <td
                      style={{
                        paddingTop: 10,
                        fontSize: 16,
                      }}
                    >
                      <b>Net Pay</b>
                    </td>
                    <td
                      align="right"
                      style={{
                        paddingTop: 10,
                        fontSize: 16,
                        color: "#065f46",
                      }}
                    >
                      <b>{selectedPayroll.netSalary.toLocaleString()}</b>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ===== Footer ===== */}
            <div
              style={{
                textAlign: "center",
                fontSize: 12,
                color: "#6b7280",
                marginTop: 30,
              }}
            >
              This is a system generated payslip and does not require a
              signature.
            </div>
          </div>
        )}
      </InvoiceModal>
    </div>
  );
}

export default PayrollProcessing;
