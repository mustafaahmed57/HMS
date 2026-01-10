import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#16a34a", "#dc2626", "#f59e0b", "#64748b", "#7c3aed"];

function Dashboard() {
  const [summary, setSummary] = useState({
    totalEmployees: 0,
    attendanceActive: 0,
    tasksActive: 0,
    hiringCount: 0,
    payrollActive: 0,
  });

  const [roomsDashboard, setRoomsDashboard] = useState(null);
  const [salesDashboard, setSalesDashboard] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [
          employeesRes,
          attendanceRes,
          tasksRes,
          payrollRes,
          hiringRes,
          roomsRes,
          salesRes,
        ] = await Promise.all([
          fetch("http://localhost:5186/api/employees"),
          fetch("http://localhost:5186/api/attendance"), // FULL TABLE
          fetch("http://localhost:5186/api/tasks"), // FULL TABLE
          fetch("http://localhost:5186/api/payroll"), // FULL TABLE
          fetch("http://localhost:5186/api/hiring"),
          fetch("http://localhost:5186/api/rooms/dashboard"),
          fetch("http://localhost:5186/api/invoices/dashboard"),
        ]);

        const employees = await employeesRes.json();
        const attendance = await attendanceRes.json();
        const tasks = await tasksRes.json();
        const payroll = await payrollRes.json();
        const hiring = await hiringRes.json();
        const rooms = await roomsRes.json();
        const sales = await salesRes.json();

        // 🔍 DEBUG (optional)
        console.log("Attendance table:", attendance);
        console.log("Tasks table:", tasks);
        console.log("Payroll table:", payroll);

        setSummary({
          totalEmployees: Array.isArray(employees) ? employees.length : 0,
          attendanceActive: Array.isArray(attendance) ? attendance.length : 0,
          tasksActive: Array.isArray(tasks) ? tasks.length : 0,
          payrollActive: Array.isArray(payroll) ? payroll.length : 0,
          hiringCount: Array.isArray(hiring) ? hiring.length : 0,
        });

        setRoomsDashboard(rooms);
        setSalesDashboard(sales);
      } catch (err) {
        console.error("Dashboard load failed", err);
      }
    };

    fetchDashboard();
  }, []);

  const roomPieData = roomsDashboard
    ? [
        { name: "Available", value: roomsDashboard.rooms.available },
        { name: "Occupied", value: roomsDashboard.rooms.occupied },
        { name: "Cleaning", value: roomsDashboard.rooms.cleaning },
        { name: "Out of Service", value: roomsDashboard.rooms.outOfService },
        { name: "Blocked", value: roomsDashboard.rooms.blocked },
      ]
    : [];

  return (
    <div className="dashboard">
      <h2 className="dashboard-title">🏨 StayElite HMS Dashboard</h2>

      {/* ================= KPI CARDS ================= */}
      <div className="card-grid">
        <KPI icon="👥" label="Employees" value={summary.totalEmployees} />
        <KPI icon="📄" label="Hiring" value={summary.hiringCount} />
        <KPI
          icon="🟢"
          label="Attendance Active"
          value={summary.attendanceActive}
        />
        <KPI icon="💰" label="Payroll Active" value={summary.payrollActive} />
        <KPI icon="📝" label="Open Tasks" value={summary.tasksActive} />

        {salesDashboard && (
          <>
            <KPI
              icon="💵"
              label="Total Revenue"
              value={`Rs ${salesDashboard.totalRevenue?.toLocaleString()}`}
            />
            <KPI
              icon="🧾"
              label="Invoices"
              value={salesDashboard.totalInvoices}
            />
            <KPI icon="✅" label="Paid" value={salesDashboard.paidInvoices} />
            <KPI
              icon="❌"
              label="Unpaid"
              value={salesDashboard.unpaidInvoices}
            />
          </>
        )}
      </div>

      {/* ================= ROOM KPIs ================= */}
      {roomsDashboard && (
        <>
          <h3 className="section-title">🏨 Rooms Overview</h3>
          <div className="card-grid">
            <KPI
              icon="🛏️"
              label="Total Rooms"
              value={roomsDashboard.rooms.total}
            />
            <KPI
              icon="✅"
              label="Available"
              value={roomsDashboard.rooms.available}
            />
            <KPI
              icon="❌"
              label="Occupied"
              value={roomsDashboard.rooms.occupied}
            />
            <KPI
              icon="🧹"
              label="Cleaning"
              value={roomsDashboard.rooms.cleaning}
            />
            <KPI
              icon="🚫"
              label="Out of Service"
              value={roomsDashboard.rooms.outOfService}
            />
          </div>
        </>
      )}

      {/* ================= CHARTS ================= */}
      <div className="charts">
        <ChartBox title="Room Occupancy Status">
          <PieChartWrapper data={roomPieData} />
        </ChartBox>

        <ChartBox title="Floor Wise Rooms">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={roomsDashboard?.floors || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="floor" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalRooms" fill="#0A2647" />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox title="Monthly Revenue">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesDashboard?.monthlyRevenue || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#16a34a"
                fill="#bbf7d0"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox title="Invoice Payment Status">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: "Paid", value: salesDashboard?.paidInvoices || 0 },
                  {
                    name: "Unpaid",
                    value: salesDashboard?.unpaidInvoices || 0,
                  },
                ]}
                dataKey="value"
                outerRadius={100}
                label
              >
                <Cell fill="#16a34a" />
                <Cell fill="#dc2626" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
    </div>
  );
}

/* ================= REUSABLE COMPONENTS ================= */

function KPI({ icon, label, value }) {
  return (
    <div className="dashboard-card">
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}

function ChartBox({ title, children }) {
  return (
    <div className="chart-box">
      <h4>{title}</h4>
      {children}
    </div>
  );
}

function PieChartWrapper({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="value" outerRadius={110} label>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default Dashboard;
