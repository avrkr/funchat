import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Ban, Check, X, Search } from 'lucide-react';
import { friendsAPI, usersAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Friends.css';

const Friends = () => {
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket, isUserOnline } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
    
    // Listen for friend request events
    const handleFriendRequestReceived = () => {
      loadData();
      if (activeTab !== 'requests') {
        // Update the requests count in the tab
        setActiveTab('requests');
      }
    };

    const handleFriendRequestAccepted = () => {
      loadData();
      if (activeTab !== 'friends') {
        // Update the friends list
        setActiveTab('friends');
      }
    };

    // Add event listeners
    window.addEventListener('friend-request-received', handleFriendRequestReceived);
    window.addEventListener('friend-request-accepted', handleFriendRequestAccepted);

    return () => {
      // Remove event listeners
      window.removeEventListener('friend-request-received', handleFriendRequestReceived);
      window.removeEventListener('friend-request-accepted', handleFriendRequestAccepted);
    };
  }, [activeTab]);

  const loadData = async () => {
    try {
      const [friendsResponse, requestsResponse, blockedResponse] = await Promise.all([
        friendsAPI.getFriends(),
        friendsAPI.getRequests(),
        friendsAPI.getBlockedUsers()
      ]);
      
      // Sort friends by name
      const sortedFriends = friendsResponse.data.sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      
      setFriends(sortedFriends);
      setFriendRequests(requestsResponse.data);
      setBlockedUsers(blockedResponse.data);
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
      const response = await friendsAPI.sendRequest({ recipientId: userId });
      const { data: requestData } = response;
      
      // Emit socket event
      socket.emit('friend-request-sent', {
        senderId: user.id,
        receiverId: userId,
        request: requestData
      });
      
      toast.success('Friend request sent!');
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    }
  };

  const handleAcceptRequest = async (requestId, senderId) => {
    try {
      const response = await friendsAPI.acceptRequest(requestId);
      setFriendRequests(prev => prev.filter(req => req._id !== requestId));
      
      // Emit socket event
      socket.emit('friend-request-accepted', {
        senderId: senderId,
        receiverId: user.id,
        request: response.data
      });
      
      await loadData(); // Reload friends list
      toast.success('Friend request accepted!');
    } catch (error) {
      toast.error('Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await friendsAPI.rejectRequest(requestId);
      setFriendRequests(prev => prev.filter(req => req._id !== requestId));
      toast.success('Friend request rejected');
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      await friendsAPI.blockUser({ userId });
      setFriends(prev => prev.filter(friend => friend._id !== userId));
      loadData(); // Reload blocked users list
      toast.success('User blocked');
    } catch (error) {
      toast.error('Failed to block user');
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      await friendsAPI.unblockUser({ userId });
      setBlockedUsers(prev => prev.filter(user => user.recipient._id !== userId));
      toast.success('User unblocked');
    } catch (error) {
      toast.error('Failed to unblock user');
    }
  };

  const tabs = [
    { id: 'friends', name: 'Friends', icon: Users, count: friends.length },
    { id: 'requests', name: 'Requests', icon: UserCheck, count: friendRequests.length },
    { id: 'blocked', name: 'Blocked', icon: Ban, count: blockedUsers.length },
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="friends-container">
      {/* Header */}
      <div className="friends-header">
        <div className="friends-header-content">
          <h1 className="friends-title">Friends Management</h1>
          <p className="friends-subtitle">
            Manage your friends, requests, and blocked users.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="search-section">
        <div className="search-content">
          <h3 className="search-section-title">Find New Friends</h3>
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
                  <div className="user-info">
                    <img
                      className="user-avatar"
                      src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=667eea&color=fff`}
                      alt={user.name}
                    />
                    <div className="user-details">
                      <h3>{user.name}</h3>
                      <p>
                        {user.email}
                        {isUserOnline(user._id) && (
                          <span className="online-indicator"></span>
                        )}
                      </p>
                    </div>
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

      {/* Tabs */}
      <div className="tabs-section">
        <div className="tabs-header">
          <nav className="tabs-nav">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <Icon />
                  <span>{tab.name}</span>
                  {tab.count > 0 && (
                    <span className="tab-count">{tab.count}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="tabs-content">
          {/* Friends List */}
          {activeTab === 'friends' && (
            <div className="tab-panel">
              {friends.length > 0 ? (
                friends.map((friend) => (
                  <div key={friend._id} className="friend-item">
                    <div className="user-info">
                      <img
                        className="user-avatar"
                        src={friend.avatar || `https://ui-avatars.com/api/?name=${friend.name}&background=667eea&color=fff`}
                        alt={friend.name}
                      />
                      <div className="user-details">
                        <h3>{friend.name}</h3>
                        <p>
                          <span className={`online-indicator ${isUserOnline(friend._id) ? 'online' : 'offline'}`}></span>
                          {isUserOnline(friend._id) ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                    <div className="user-actions">
                      <button
                        onClick={() => handleBlockUser(friend._id)}
                        className="btn-secondary"
                      >
                        <UserX />
                        Block
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <Users className="empty-icon" />
                  <p>No friends yet. Start by searching for users above!</p>
                </div>
              )}
            </div>
          )}

          {/* Friend Requests */}
          {activeTab === 'requests' && (
            <div className="tab-panel">
              {friendRequests.length > 0 ? (
                friendRequests.map((request) => (
                  <div key={request._id} className="request-item">
                    <div className="user-info">
                      <img
                        className="user-avatar"
                        src={request.requester.avatar || `https://ui-avatars.com/api/?name=${request.requester.name}&background=667eea&color=fff`}
                        alt={request.requester.name}
                      />
                      <div className="user-details">
                        <h3>{request.requester.name}</h3>
                        <p>{request.requester.email}</p>
                      </div>
                    </div>
                    <div className="user-actions">
                      <button
                        onClick={() => handleAcceptRequest(request._id, request.requester._id)}
                        className="btn-success"
                      >
                        <Check />
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request._id)}
                        className="btn-secondary"
                      >
                        <X />
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <UserCheck className="empty-icon" />
                  <p>No pending friend requests.</p>
                </div>
              )}
            </div>
          )}

          {/* Blocked Users */}
          {activeTab === 'blocked' && (
            <div className="tab-panel">
              {blockedUsers.length > 0 ? (
                blockedUsers.map((blocked) => (
                  <div key={blocked._id} className="blocked-item">
                    <div className="user-info">
                      <img
                        className="user-avatar"
                        src={blocked.recipient.avatar || `https://ui-avatars.com/api/?name=${blocked.recipient.name}&background=667eea&color=fff`}
                        alt={blocked.recipient.name}
                      />
                      <div className="user-details">
                        <h3>{blocked.recipient.name}</h3>
                        <p>{blocked.recipient.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnblockUser(blocked.recipient._id)}
                      className="btn-primary"
                    >
                      <UserCheck />
                      Unblock
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <Ban className="empty-icon" />
                  <p>No blocked users.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Friends;