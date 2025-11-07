import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Users, Search } from 'lucide-react';
import { friendsAPI, usersAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = () => {
  const [friends, setFriends] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isUserOnline } = useSocket();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [friendsResponse, usersResponse] = await Promise.all([
        friendsAPI.getFriends(),
        usersAPI.getAllUsers()
      ]);
      
      setFriends(friendsResponse.data);
      // For demo, using first 5 friends as recent chats
      setRecentChats(friendsResponse.data.slice(0, 5));
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 2) {
      try {
        const response = await usersAPI.getAllUsers(query);
        setSearchResults(response.data);
      } catch (error) {
        console.error('Search failed:', error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await friendsAPI.sendRequest({ recipientId: userId });
      toast.success('Friend request sent!');
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Welcome Section */}
      <div className="welcome-card">
        <div className="welcome-content">
          <div className="welcome-header">
            <div className="welcome-icon">
              <MessageCircle />
            </div>
            <div className="welcome-text">
              <h3 className="welcome-title">
                Welcome to FunChat!
              </h3>
              <p className="welcome-subtitle">
                Start chatting with your friends or make new ones.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Users */}
      <div className="search-card">
        <div className="search-content">
          <h3 className="search-title">Find Users</h3>
          <div className="search-input-container">
            <div className="search-input-icon">
              <Search />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              className="search-input"
              placeholder="Search users by name or email..."
            />
          </div>

          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((user) => (
                <div key={user._id} className="search-result-item">
                  <div className="search-result-user">
                    <img
                      className="search-result-avatar"
                      src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=667eea&color=fff`}
                      alt={user.name}
                    />
                    <div className="search-result-info">
                      <p className="search-result-name">{user.name}</p>
                      <p className="search-result-email">{user.email}</p>
                    </div>
                    {isUserOnline(user._id) && (
                      <span className="online-indicator"></span>
                    )}
                  </div>
                  <button
                    onClick={() => handleSendRequest(user._id)}
                    className="btn-primary"
                  >
                    Add Friend
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Recent Chats */}
        <div className="chat-card">
          <div className="chat-content">
            <h3 className="chat-title">Recent Chats</h3>
            <div className="chat-list">
              {recentChats.length > 0 ? (
                recentChats.map((friend) => (
                  <Link
                    key={friend._id}
                    to={`/chat/${friend._id}`}
                    className="chat-item"
                  >
                    <img
                      className="chat-avatar"
                      src={friend.avatar || `https://ui-avatars.com/api/?name=${friend.name}&background=667eea&color=fff`}
                      alt={friend.name}
                    />
                    <div className="chat-info">
                      <p className="chat-name">{friend.name}</p>
                      <p className="chat-preview">Click to start chatting...</p>
                    </div>
                    {isUserOnline(friend._id) && (
                      <span className="online-indicator"></span>
                    )}
                  </Link>
                ))
              ) : (
                <div className="empty-state">
                  <MessageCircle className="empty-icon" />
                  <p>No recent chats</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Friends List */}
        <div className="friends-card">
          <div className="friends-content">
            <h3 className="friends-title">Friends</h3>
            <div className="friends-list">
              {friends.length > 0 ? (
                friends.map((friend) => (
                  <div key={friend._id} className="friend-item">
                    <div className="friend-info">
                      <img
                        className="friend-avatar"
                        src={friend.avatar || `https://ui-avatars.com/api/?name=${friend.name}&background=667eea&color=fff`}
                        alt={friend.name}
                      />
                      <div>
                        <p className="friend-name">{friend.name}</p>
                        <p className="friend-status">
                          {isUserOnline(friend._id) ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/chat/${friend._id}`}
                      className="btn-primary"
                    >
                      Chat
                    </Link>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <Users className="empty-icon" />
                  <p>No friends yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;