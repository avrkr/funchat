import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace('/api', '');

class SocketService {
  constructor() {
    this.socket = null;
  }

  getUserIdFromToken(token) {
    try {
      // Basic JWT parsing (assuming JWT token)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      return payload.id || payload.userId || payload.sub;
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  }

  connect(token) {
    this.socket = io(SOCKET_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: true,
      path: '/socket.io/',
      forceNew: true,
      timeout: 10000
    });

    this.socket.on('connect', () => {
      console.log('Connected to server:', this.socket.id);
      // Re-join room on reconnection
      const userId = this.getUserIdFromToken(token);
      if (userId) {
        this.socket.emit('join-room', userId);
      }
      if (this.socket.auth?.token) {
        const userId = this.getUserIdFromToken(this.socket.auth.token);
        if (userId) {
          this.joinRoom(userId);
        }
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      if (error.message === 'Invalid token') {
        console.error('Authentication failed');
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.socket.connect();
      }
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(userId) {
    if (this.socket) {
      this.socket.emit('join-room', userId);
    }
  }

  sendMessage(data) {
    if (this.socket) {
      this.socket.emit('send-message', data);
    }
  }

  sendFriendRequest(data) {
    if (this.socket) {
      this.socket.emit('friend-request-sent', data);
    }
  }

  acceptFriendRequest(data) {
    if (this.socket) {
      this.socket.emit('friend-request-accepted', data);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default new SocketService();