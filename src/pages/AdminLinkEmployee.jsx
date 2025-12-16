import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

function AdminLinkEmployee() {
  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);

  const [employeeId, setEmployeeId] = useState("");
  const [userId, setUserId] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEmployees();
    loadUsers();
  }, []);

  const loadEmployees = async () => {
    try {
      const res = await fetch("http://localhost:5186/api/employees");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEmployees(data);
    } catch {
      toast.error("❌ Failed to load employees");
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch("http://localhost:5186/api/users?role=Employee");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data);
    } catch {
      toast.error("❌ Failed to load users");
    }
  };

  const linkEmployeeUser = async () => {
    if (!employeeId || !userId) {
      toast.warning("⚠️ Please select both Employee and User");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `http://localhost:5186/api/employees/link-user/${employeeId}/${userId}`,
        { method: "POST" }
      );

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg);
      }

      toast.success("✅ Employee linked successfully");

      setEmployeeId("");
      setUserId("");

    } catch {
      toast.error("❌ Employee already linked.");
    } finally {
      setLoading(false);
    }
  };

  return (
    
    <div
      style={{
        maxWidth: 520,
        margin: "40px auto",
        background: "#ffffff",
        padding: "24px",
        borderRadius: "10px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
      }}
    >
        
      <h2 style={{ marginBottom: 8 }}>Link Employee with User</h2>
      <p style={{ marginBottom: 20, color: "#666", fontSize: 14 }}>
        Assign a system login to an existing employee
      </p>

      {/* EMPLOYEE */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Employee</label>
        <select
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          style={selectStyle}
        >
          <option value="">Select employee</option>
          {employees.map((e) => (
            <option key={e.employeeID} value={e.employeeID}>
              {e.fullName} ({e.employeeCode})
            </option>
          ))}
        </select>
      </div>

      {/* USER */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>User Account</label>
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          style={selectStyle}
        >
          <option value="">Select user</option>
          {users.map((u) => (
            <option key={u.userID} value={u.userID}>
              {u.email}
            </option>
          ))}
        </select>
      </div>

      {/* ACTION */}
      <button
        onClick={linkEmployeeUser}
        disabled={loading || !employeeId || !userId}
        style={{
          width: "100%",
          padding: "10px",
          background: loading ? "#999" : "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: 15,
          fontWeight: 500,
        }}
      >
        {loading ? "Linking..." : "Link User"}
      </button>
      <div style={{ marginBottom: 20, fontSize: 14, color: "#555" }}>
        <br/>
  <strong>Steps to Link Employee:</strong>
  <ol style={{ marginTop: 8, paddingLeft: 18 }}>
    <li>Create Employee in Employee Master</li>
    <li>Create User with role <b>Employee</b></li>
    <li>Select Employee and User from dropdowns</li>
    <li>Click <b>Link User</b> to complete</li>
  </ol>
</div>

    </div>
  );
}

/* 🔹 Reusable styles */
const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontSize: 14,
  fontWeight: 500,
};

const selectStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: 14,
};

export default AdminLinkEmployee;
