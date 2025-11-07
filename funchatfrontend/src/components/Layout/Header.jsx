import React from 'react';
import { Menu, Bell, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './Header.css';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  return (
    <div className="header">
      <button
        className="mobile-menu-btn"
        onClick={onMenuClick}
      >
        <Menu className="menu-icon" />
      </button>
      
      <div className="header-content">
        <div className="header-title-section">
          <h1 className="header-title">FunChat</h1>
        </div>
        
        <div className="header-actions">
          <button className="header-action-btn">
            <Bell className="action-icon" />
          </button>

          <button
            onClick={handleProfile}
            className="header-action-btn"
            title="Profile"
          >
            <User className="action-icon" />
          </button>

          <button
            onClick={handleLogout}
            className="header-action-btn"
            title="Logout"
          >
            <LogOut className="action-icon" />
          </button>

          <div className="header-user">
            <img
              className="header-user-avatar"
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=667eea&color=fff`}
              alt={user?.name}
            />
            <div className="header-user-info">
              <p className="header-user-name">{user?.name}</p>
              <p className="header-user-email">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;