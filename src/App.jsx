import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import MainLayout from './layouts/MainLayout';
import NotFound from './pages/NotFound';  
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TaskManagement from './pages/Task';
import EmployeeMaster from './pages/EmployeeMaster.jsx';
import AttendanceManagement from './pages/Attendance';
import PayrollProcessing from './pages/Payroll';
import PayrollSummary from './pages/PayrollSummary.jsx';
import HiringManagement from './pages/HiringManagement.jsx';
import Users from './pages/Users.jsx';
import RoomTypesManagement from './pages/RoomTypesManagement.jsx';
import RoomsManagement from './pages/RoomsManagement.jsx';
import ReceptionRoomsStatus from './pages/ReceptionRoomsStatus.jsx';
import ReservationsManagement from './pages/ReservationsManagement.jsx';
import InvoicesManagement from './pages/InvoicesManagement.jsx';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(''); // ✅ Stores current user's role

  return (
    <>
      <BrowserRouter>
        <Routes>

          {/* ✅ Public Routes */}
          <Route path="/" element={<Login setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} />} />

          {/* ✅ Protected Routes */}
          {isLoggedIn ? (
            <Route path="/" element={<MainLayout userRole={userRole} />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="/employees" element={<EmployeeMaster />} />
              <Route path="/attendance" element={<AttendanceManagement />} />
              <Route path="/payroll" element={<PayrollProcessing />} />
              <Route path="/tasks" element={<TaskManagement />} />
              <Route path="/hr-summary" element={<PayrollSummary />} />
              <Route path="/room-type" element={<RoomTypesManagement />} />
              <Route path="/room-management" element={<RoomsManagement />} />
              <Route path="/Reception-Rooms-Status" element={<ReceptionRoomsStatus />} />
              <Route path="/hiring" element={<HiringManagement />} />
              <Route path="/users" element={<Users />} />
              <Route path="/reservations-management" element={<ReservationsManagement />} />
              <Route path="/invoices-management" element={<InvoicesManagement />} />


            </Route>
          ) : (
            // ✅ Redirect if not logged in
            <Route path="*" element={<Navigate to="/" />} />
          )}

          {/* ✅ 404 Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>

      <ToastContainer position="top-right" autoClose={2000} />
    </>
  );
}

export default App;
