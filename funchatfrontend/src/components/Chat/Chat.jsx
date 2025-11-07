import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Image, Smile, Paperclip } from 'lucide-react';
import { chatAPI, usersAPI, uploadAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getFileUrl, getAvatarUrl } from '../../utils/url';
import toast from 'react-hot-toast';
import './Chat.css';

const Chat = () => {
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const { socket, isUserOnline } = useSocket();

  useEffect(() => {
    loadChatData();
  }, [userId]);

  useEffect(() => {
    if (socket && userId) {
      socket.on('receive-message', handleReceiveMessage);
      
      return () => {
        socket.off('receive-message', handleReceiveMessage);
      };
    }
  }, [socket, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatData = async () => {
    try {
      const [messagesResponse, userResponse] = await Promise.all([
        chatAPI.getHistory(userId),
        usersAPI.getUserById(userId)
      ]);
      
      const otherUserData = userResponse.data;
      setOtherUser(otherUserData);

      // Transform messages to include proper sender/receiver info
      const processedMessages = messagesResponse.data.map(message => {
        const isSentByMe = message.sender._id === user.id;
        return {
          ...message,
          isSender: isSentByMe,
          displayName: isSentByMe ? 'You' : otherUserData.name,
          sender: {
            ...message.sender,
            name: isSentByMe ? 'You' : otherUserData.name
          },
          messageType: message.messageType || 'text' // Ensure messageType is set
        };
      });
      
      setMessages(processedMessages);
    } catch (error) {
      toast.error('Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveMessage = (message) => {
    // Only process messages if they're from the current chat partner
    if (message.sender._id === userId) {
      const processedMessage = {
        ...message,
        isSender: false,  // Received messages are never from us
        displayName: otherUser?.name || message.sender.name
      };
      setMessages(prev => [...prev, processedMessage]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    setSending(true);
    
    const messageData = {
      receiverId: userId,
      message: newMessage.trim(),
      messageType: 'text'
    };

    try {
      const response = await chatAPI.sendMessage(messageData);
      // Add the sent message to our state immediately
      const processedMessage = {
        ...response.data,
        isSender: true,
        displayName: 'You',
        sender: {
          ...response.data.sender,
          _id: user.id,
          name: user.name,
          avatar: user.avatar
        }
      };
      setMessages(prev => [...prev, processedMessage]);
      
      // Send the message through socket.io
      if (socket) {
        socket.emit('send-message', {
          ...response.data,
          receiverId: userId,
          sender: { ...user }  // Include sender info
        });
      }
      
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (fileUploading) return;

    setFileUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadResponse = await uploadAPI.uploadFile(formData);
      const { fileUrl, fileName, fileSize } = uploadResponse.data;

      const messageData = {
        receiverId: userId,
        message: fileName,
        messageType: file.type.startsWith('image/') ? 'image' : 'file',
        fileUrl,
        fileName,
        fileSize
      };

      const response = await chatAPI.sendMessage(messageData);
      const processedMessage = {
        ...response.data,
        isSender: true,
        displayName: 'You',
        sender: {
          ...response.data.sender,
          _id: user.id,
          name: user.name,
          avatar: user.avatar
        }
      };
      setMessages(prev => [...prev, processedMessage]);
      
      if (socket) {
        socket.emit('send-message', {
          ...response.data,
          receiverId: userId
        });
      }
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setFileUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      handleFileUpload(file);
    }
    e.target.value = '';
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="loading-container">
        <p className="text-gray-500">User not found</p>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* Chat Header */}
      <div className="chat-header">
        <img
          className="chat-user-avatar"
          src={otherUser.avatar || `https://ui-avatars.com/api/?name=${otherUser.name}&background=667eea&color=fff`}
          alt={otherUser.name}
        />
        <div className="chat-user-info">
          <h2 className="chat-user-name">{otherUser.name}</h2>
          <p className="chat-user-status">
            <span className={`status-indicator ${isUserOnline(userId) ? 'status-online' : 'status-offline'}`}></span>
            {isUserOnline(userId) ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length > 0 ? (
          messages.map((message) => (
            <div
              key={message._id}
              className={`message-row ${message.isSender ? 'message-right' : 'message-left'}`}
            >
              <div className="message-content">
                <p className="message-sender">{message.displayName}</p>
                <div
                  className={`message-bubble ${message.isSender ? 'sent' : 'received'}`}
                >
                  {message.messageType === 'image' && (
                    <img
                      src={getFileUrl(message.fileUrl)}
                      alt={message.fileName}
                      className="message-image"
                      onError={(e) => {
                        console.error('Image failed to load:', message.fileUrl);
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  
                  {message.messageType === 'file' && (
                    <div className="message-file">
                      <a
                        href={getFileUrl(message.fileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="message-file-link"
                      >
                        <Paperclip />
                        {message.fileName}
                      </a>
                    </div>
                  )}
                  
                  <p className="message-text">{message.message}</p>
                  <p className="message-time">
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="chat-input-container">
        <form onSubmit={handleSendMessage} className="chat-form">
          <div className="chat-toolbar">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={fileUploading}
              className="chat-toolbar-btn"
            >
              {fileUploading ? (
                <div className="loading-spinner"></div>
              ) : (
                <Paperclip />
              )}
            </button>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={fileUploading}
              className="chat-toolbar-btn"
            >
              <Image />
            </button>
            
            <button
              type="button"
              className="chat-toolbar-btn"
            >
              <Smile />
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="file-input"
          />

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="chat-input"
          />

          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="chat-send-btn"
          >
            {sending ? (
              <div className="loading-spinner"></div>
            ) : (
              <Send />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;