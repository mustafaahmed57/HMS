import React, { useEffect, useState, useCallback } from "react";
import DataTable from "../components/DataTable";
import { toast } from "react-toastify";

function PayrollSummary() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [rows, setRows] = useState([]);

  // ============================
  // FETCH SUMMARY
  // ============================
  const fetchSummary = useCallback(() => {
    fetch(
      `http://localhost:5186/api/payroll/summary?year=${year}&month=${month}`
    )
      .then((res) => {
        if (!res.ok) throw res;
        return res.json();
      })
      .then((data) => setRows(data))
      .catch(async (e) => {
        let message = "Failed to load summary ❌";
        try {
          if (e.json) {
            const data = await e.json();
            message = data?.message || message;
          }
        } catch {
          // ignore
        }
        toast.error(message); // ✅ hamesha toast
      });
  }, [year, month]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // ============================
  // TABLE COLUMNS
  // ============================
  const columns = [
    "employeeCode",
    "employeeName",
    "daysPresent",
    "daysAbsent",
    "daysLeave",
    "daysHalfDay",
    "shortMinutesTotal",
    "basicSalary",
    "attendanceDeduction",
    "taskPenalty",
    "expectedTotalDeduction",
    "expectedNetSalary",
    "payrollStatus"
  ];

  // ============================
  // MAP BACKEND → TABLE ROWS
  // ============================
  const rowsForTable = rows.map((r) => {
    const att = r.attendance || {};
    const tasks = r.tasks || {};
    const payroll = r.payroll;

    return {
      employeeCode: r.employeeCode,
      employeeName: r.fullName, // 🔹 backend ka naam fullName hai
      daysPresent: att.daysPresent ?? 0,
      daysAbsent: att.daysAbsent ?? 0,
      daysLeave: att.daysLeave ?? 0,
      daysHalfDay: att.daysHalfDay ?? 0,
      shortMinutesTotal: att.shortMinutesTotal ?? 0, // total short minutes
      basicSalary: r.basicSalary?.toFixed(2),
      attendanceDeduction: att.attendanceDeduction?.toFixed(2),
      taskPenalty: tasks.taskPenalty?.toFixed(2),
      expectedTotalDeduction: r.expectedTotalDeduction?.toFixed(2),
      expectedNetSalary: r.expectedNetSalary?.toFixed(2),
      payrollStatus: payroll
        ? `Generated (${new Date(payroll.paymentDate).toLocaleDateString(
            "en-GB",
            { day: "2-digit", month: "short" }
          )})`
        : "Pending"
    };
  });

  return (
    <div className="payroll-summary-page">
      <h2>Payroll Summary</h2>

      {/* FILTERS */}
      <div className="filters">
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          <option value={2024}>2024</option>
          <option value={2025}>2025</option>
        </select>

        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
        >
          <option value={1}>Jan</option>
          <option value={2}>Feb</option>
          <option value={3}>Mar</option>
          <option value={4}>Apr</option>
          <option value={5}>May</option>
          <option value={6}>Jun</option>
          <option value={7}>Jul</option>
          <option value={8}>Aug</option>
          <option value={9}>Sep</option>
          <option value={10}>Oct</option>
          <option value={11}>Nov</option>
          <option value={12}>Dec</option>
        </select>

        <button className="btn primary-btn" onClick={fetchSummary}>
          Load Summary
        </button>
      </div>

      {/* TABLE WRAPPED IN SCROLL CONTAINER */}
      <div className="payroll-summary-table">
        <DataTable columns={columns} rows={rowsForTable} />
      </div>
    </div>
  );
}

export default PayrollSummary;
