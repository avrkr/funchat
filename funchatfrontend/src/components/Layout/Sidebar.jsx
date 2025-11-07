import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageCircle, Users, User, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import './Sidebar.css';

const Sidebar = ({ onClose }) => {
  const { user } = useAuth();
  const { socket, unreadMessages = new Map(), friendUpdates = false } = useSocket();
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { 
      name: 'Chats', 
      href: '/', 
      icon: MessageCircle,
      badge: (unreadMessages?.size || 0) > 0 ? Array.from(unreadMessages?.values() || []).reduce((a, b) => a + b, 0) : 0
    },
    { 
      name: 'Friends', 
      href: '/friends', 
      icon: Users,
      badge: friendUpdates ? '!' : 0
    },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const handleNavClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <div className="sidebar-header">
          <div className="sidebar-user">
            <img
              className="sidebar-user-avatar"
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=667eea&color=fff`}
              alt={user?.name}
            />
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">{user?.name}</p>
              <p className="sidebar-user-email">{user?.email}</p>
            </div>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? 'active' : ''}`
                }
                style={{ position: 'relative' }}
              >
                <Icon className="sidebar-nav-icon" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;