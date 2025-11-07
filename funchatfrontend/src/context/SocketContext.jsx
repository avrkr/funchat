import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socket';
import toast from 'react-hot-toast';

const SocketContext = createContext({
  socket: null,
  onlineUsers: new Set(),
  unreadMessages: new Map(),
  friendUpdates: false,
  isUserOnline: () => false,
  clearUnreadMessages: () => {},
  clearFriendUpdates: () => {}
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadMessages, setUnreadMessages] = useState(new Map());
  const [friendUpdates, setFriendUpdates] = useState(false);

  // Reset unread messages when navigating to chats
  const clearUnreadMessages = (userId) => {
    setUnreadMessages(prev => {
      const newMap = new Map(prev);
      if (userId) {
        newMap.delete(userId);
      } else {
        newMap.clear();
      }
      return newMap;
    });
  };

  // Reset friend updates when visiting friends page
  const clearFriendUpdates = () => {
    setFriendUpdates(false);
  };

  useEffect(() => {
    if (!user || !token) return;

    const socketInstance = socketService.connect(token);
    setSocket(socketInstance);

    // Join user room
    socketInstance.emit('join-room', user.id);

    // Listeners
    socketInstance.on('online-users', (users) => {
      setOnlineUsers(new Set(users));
      console.log('Initial online users:', users);
    });

    socketInstance.on('user-online', (userId) => {
      setOnlineUsers(prev => new Set(prev).add(userId));
      console.log('User online:', userId);
    });

    socketInstance.on('user-offline', (userId) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      console.log('User offline:', userId);
    });

    socketInstance.on('receive-message', (message) => {
      const currentPath = window.location.pathname;
      const isChatOpen = currentPath.includes(`/chat/${message.sender._id}`);

      if (!isChatOpen) {
        setUnreadMessages(prev => {
          const newMap = new Map(prev);
          const count = (newMap.get(message.sender._id) || 0) + 1;
          newMap.set(message.sender._id, count);
          return newMap;
        });

        toast.custom((t) => (
          <div className={`chat-notification ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
            <img
              src={message.sender.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender.name)}`}
              alt={message.sender.name}
              className="chat-notification-avatar"
            />
            <div className="chat-notification-content">
              <p className="chat-notification-name">{message.sender.name}</p>
              <p className="chat-notification-message">
                {message.messageType === 'image' ? 'Sent an image' : message.message}
              </p>
            </div>
          </div>
        ), { duration: 4000 });
      }
    });

    socketInstance.on('friend-status-update', () => {
      setFriendUpdates(true);
      toast.success('Friend list updated');
    });

    socketInstance.on('new-friend-request', () => {
      toast.success('New friend request received!', { duration: 5000, icon: 'wave' });
      window.dispatchEvent(new CustomEvent('friend-request-received'));
    });

    socketInstance.on('friend-request-accepted', () => {
      toast.success('Friend request accepted!', { duration: 5000, icon: 'party' });
      window.dispatchEvent(new CustomEvent('friend-request-accepted'));
    });

    socketInstance.on('reconnect', () => {
      console.log('Reconnected to server');
      socketInstance.emit('join-room', user.id);
    });

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
      setSocket(null);
      setOnlineUsers(new Set());
      setUnreadMessages(new Map());
      setFriendUpdates(false);
    };
  }, [user, token]);

  const isUserOnline = (userId) => onlineUsers.has(userId);

  const value = {
    socket,
    onlineUsers,
    unreadMessages,
    friendUpdates,
    isUserOnline,
    clearUnreadMessages,
    clearFriendUpdates
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;