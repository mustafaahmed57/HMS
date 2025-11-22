import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const salesData = [
  { name: 'Jan', sales: 3000 },
  { name: 'Feb', sales: 5000 },
  { name: 'Mar', sales: 4000 },
  { name: 'Apr', sales: 6500 },
];

const inventoryData = [
  { name: 'Raw Material', value: 400 },
  { name: 'Finished Goods', value: 300 },
  { name: 'Work in Progress', value: 300 },
];

const COLORS = ['#0A2647', '#2C74B3', '#F1F6F9'];

function Dashboard() {
  const [summary, setSummary] = useState({
    totalEmployees: 0,
    attendanceActive: 0,
    tasksActive: 0,
    hiringCount: 0,
    payrollActive: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          employeesRes,
          attendanceRes,
          tasksRes,
          hiringRes,
          payrollRes,
        ] = await Promise.all([
          fetch('http://localhost:5186/api/employees'),
          fetch('http://localhost:5186/api/attendance/employees-active'),
          fetch('http://localhost:5186/api/tasks/employees-active'),
          fetch('http://localhost:5186/api/hiring'),
          fetch('http://localhost:5186/api/payroll/employees-active'),
        ]);

        if (
          !employeesRes.ok ||
          !attendanceRes.ok ||
          !tasksRes.ok ||
          !hiringRes.ok ||
          !payrollRes.ok
        ) {
          throw new Error('One or more dashboard API calls failed');
        }

        const [employees, attendance, tasks, hiring, payroll] =
          await Promise.all([
            employeesRes.json(),
            attendanceRes.json(),
            tasksRes.json(),
            hiringRes.json(),
            payrollRes.json(),
          ]);

        console.log('Employees:', employees);
        console.log('Attendance active:', attendance);
        console.log('Tasks active:', tasks);
        console.log('Hiring:', hiring);
        console.log('Payroll active:', payroll);

        setSummary({
          totalEmployees: Array.isArray(employees) ? employees.length : 0,
          attendanceActive: Array.isArray(attendance) ? attendance.length : 0,
          tasksActive: Array.isArray(tasks) ? tasks.length : 0,
          hiringCount: Array.isArray(hiring) ? hiring.length : 0,
          payrollActive: Array.isArray(payroll) ? payroll.length : 0,
        });
      } catch (error) {
        console.error('Dashboard data fetch failed', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="dashboard">
      <h2>Welcome to StayElite HMS</h2>

      {/* 🔹 HR KPIs */}
      <div className="card-grid">
        <div className="dashboard-card kpi-card">
          <div className="kpi-icon">👥</div>
          <div className="kpi-body">
            <p className="kpi-label">Total Employees</p>
            <p className="kpi-value">{summary.totalEmployees}</p>
          </div>
        </div>

        <div className="dashboard-card kpi-card">
          <div className="kpi-icon">📄</div>
          <div className="kpi-body">
            <p className="kpi-label">Active Hiring / Candidates</p>
            <p className="kpi-value">{summary.hiringCount}</p>
          </div>
        </div>

        <div className="dashboard-card kpi-card">
          <div className="kpi-icon">🟢</div>
          <div className="kpi-body">
            <p className="kpi-label">Attendance Active</p>
            <p className="kpi-value">{summary.attendanceActive}</p>
          </div>
        </div>

        <div className="dashboard-card kpi-card">
          <div className="kpi-icon">💰</div>
          <div className="kpi-body">
            <p className="kpi-label">Payroll Active Employees</p>
            <p className="kpi-value">{summary.payrollActive}</p>
          </div>
        </div>

        <div className="dashboard-card kpi-card">
          <div className="kpi-icon">📝</div>
          <div className="kpi-body">
            <p className="kpi-label">Open Tasks Assigned</p>
            <p className="kpi-value">{summary.tasksActive}</p>
          </div>
        </div>
      </div>

      {/* 🔹 Charts (same as before) */}
      <div className="charts">
        <div className="chart-box">
          <h4>Monthly Sales</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="#2C74B3" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h4>Inventory Breakdown</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={inventoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {inventoryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h4>Customers Output</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={[
                { month: 'Jan', units: 100 },
                { month: 'Feb', units: 140 },
                { month: 'Mar', units: 120 },
                { month: 'Apr', units: 170 },
                { month: 'May', units: 160 },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="units"
                stroke="#0A2647"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h4>Purchase Value Trend</h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={[
                { month: 'Jan', amount: 2500 },
                { month: 'Feb', amount: 4000 },
                { month: 'Mar', amount: 3000 },
                { month: 'Apr', amount: 4800 },
                { month: 'May', amount: 4600 },
              ]}
            >
              <defs>
                <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="#2C74B3"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="#2C74B3"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#2C74B3"
                fillOpacity={1}
                fill="url(#colorAmt)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
