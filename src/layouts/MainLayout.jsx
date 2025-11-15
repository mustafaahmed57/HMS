import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Outlet, useLocation } from 'react-router-dom';

function MainLayout({ userRole }) {
  const location = useLocation();

  return (
    <div className="main-layout">
      {/* ✅ Pass userRole to Sidebar */}
      <Sidebar userRole={userRole} />
      <div className="main-content">
        <Header />
        <div className="page-content">
          <Outlet key={location.pathname} />
        </div>
        <footer className="footer">
          copyright ownership with the year © 2025 StayElite HMS
        </footer>
      </div>
    </div>
  );}

export default MainLayout;
