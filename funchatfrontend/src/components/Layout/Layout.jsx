import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      {/* Sidebar for mobile */}
      <div className={`mobile-sidebar-overlay ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="mobile-sidebar-overlay-bg" onClick={() => setSidebarOpen(false)}></div>
        <div className="mobile-sidebar">
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Sidebar for desktop */}
      <div className="desktop-sidebar">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="layout-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="main-content">
          <div className="main-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;