import React, { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import { toast } from 'react-toastify';

/* ===============================
   Helpers: Date & Time Formatting
================================ */
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const formatTime = (timeStr) => {
  if (!timeStr) return "-";
  return new Date(`1970-01-01T${timeStr}`).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
};

function EmployeeTasks() {
  const user = JSON.parse(localStorage.getItem('loggedInUser'));
  const userID = user?.userID;

  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    console.log("🔹 EmployeeTasks mounted");
    console.log("🔹 userID:", userID);

    if (!userID) {
      toast.error("Invalid login session ❌");
      return;
    }

    const load = async () => {
      try {
        // ===============================
        // 1️⃣ USER → EMPLOYEE
        // ===============================
        const empRes = await fetch(
          `http://localhost:5186/api/employees/by-user/${userID}`
        );

        if (!empRes.ok) throw new Error("Employee API failed");

        const emp = await empRes.json();
        const empId = emp.employeeID;

        if (!empId) throw new Error("EmployeeID missing");

        // ===============================
        // 2️⃣ EMPLOYEE → TASKS
        // ===============================
        const taskRes = await fetch(
          `http://localhost:5186/api/tasks/my/${empId}`
        );

        if (!taskRes.ok) {
          setTasks([]);
          return;
        }

        const taskData = await taskRes.json();
        setTasks(taskData);

      } catch (error) {
        console.error(error);
        toast.error("Failed to load employee tasks ❌");
      }
    };

    load();
  }, [userID]); // ✅ ESLint happy

  return (
    <div>
      <h2>My Assigned Tasks</h2>

      <DataTable
        columns={[
          "taskTitle",
          "description",
          "priority",
          "status",
          "dueDate",
          "dueTime"
        ]}
        rows={tasks.map(t => ({
          taskTitle: t.taskTitle,
          description: t.description || "-",
          priority: t.priority,
          status: t.status,
          dueDate: formatDate(t.dueDate),
          dueTime: formatTime(t.dueTime)
        }))}
      />
    </div>
  );
}

export default EmployeeTasks;
