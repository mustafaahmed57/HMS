import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
// import axios from 'axios';

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
    totalPOs: 0,
    inventoryCount: 0,
    salesOrders: 0
  });

  useEffect(() => {
    const fetchData = async () => {
     try {
  const [productsRes, poRes, soRes, moRes] = await Promise.all([
    // axios.get('http://localhost:5186/api/products'),
    // axios.get('http://localhost:5186/api/purchaseorder'),
    // axios.get('http://localhost:5186/api/salesorder'),
    // axios.get('http://localhost:5186/api/manufacturingorder')
  ]);

  console.log("Products:", productsRes.data);
  console.log("POs:", poRes.data);
  console.log("Sales Orders:", soRes.data);
  console.log("Manufacturing Orders:", moRes?.data);

  const totalStock = productsRes.data.reduce((sum, item) => sum + (item.stock || 0), 0);
  const activeMOs = moRes?.data?.filter(mo => mo.status !== 'Completed').length || 0;

  setSummary({
    totalPOs: poRes.data.length,
    inventoryCount: totalStock,
    salesOrders: soRes.data.length,
    manufacturingOrders: activeMOs
  });
} catch (error) {
  console.error("Dashboard data fetch failed", error);
}
    }

    fetchData();
  }, []);

  return (
    <div className="dashboard">
      <h2>Welcome to StayElite HMS</h2>

      <div className="card-grid">
        <div className="dashboard-card">
          <h3>🛒 Rooms Orders</h3>
          <p>{summary.totalPOs}</p>
        </div>
        <div className="dashboard-card">
          <h3>🛍️ Sales Orders</h3>
          <p>{summary.salesOrders}</p>
        </div>
        <div className="dashboard-card">
          <h3>📦 Booking </h3>
          <p>{summary.inventoryCount}</p>
        </div>
       <div className="dashboard-card">
  <h3>🏭 Reservations</h3>
  <p>{summary.manufacturingOrders} Active Orders</p>
</div>
      </div>

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
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            <LineChart data={[
              { month: 'Jan', units: 100 },
              { month: 'Feb', units: 140 },
              { month: 'Mar', units: 120 },
              { month: 'Apr', units: 170 },
              { month: 'May', units: 160 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="units" stroke="#0A2647" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h4>Purchase Value Trend</h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={[
              { month: 'Jan', amount: 2500 },
              { month: 'Feb', amount: 4000 },
              { month: 'Mar', amount: 3000 },
              { month: 'Apr', amount: 4800 },
              { month: 'May', amount: 4600 }
            ]}>
              <defs>
                <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2C74B3" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#2C74B3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Area type="monotone" dataKey="amount" stroke="#2C74B3" fillOpacity={1} fill="url(#colorAmt)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
