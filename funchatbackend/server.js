import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Models
import User from './models/User.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import friendRoutes from './routes/friends.js';
import chatRoutes from './routes/chat.js';
import uploadRoutes from './routes/upload.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// ✅ Allow CORS from anywhere
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.CLIENT_URL 
      : 'http://localhost:5173', // Vite's default port
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
  },
  path: '/socket.io/',
  transports: ['websocket', 'polling'],
  maxHttpBufferSize: 1e8, // 100 MB
  pingTimeout: 60000,
  pingInterval: 25000
});

// ✅ Express CORS setup
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Pre-flight requests
app.options('*', cors());

// Middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
mongoose.connect(process.env.mongodb_uri)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'FunChat Backend',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Socket.io middleware for authentication
io.use(async (socket, next) => {
  console.log('Socket authentication attempt');
  const token = socket.handshake.auth.token;
  if (!token) {
    console.log('Socket auth failed: No token provided');
    return next(new Error('Authentication token missing'));
  }
  try {
    // Get user ID from token
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
    const userId = payload.id || payload.userId || payload.sub;
    
    if (!userId) {
      throw new Error('Invalid token: no user ID found');
    }
    
    // Attach userId to socket
    socket.userId = userId;
    console.log('Socket auth successful for user:', userId);
    next();
  } catch (err) {
    console.log('Socket auth failed:', err.message);
    return next(new Error('Invalid token'));
  }
});

// Track online users
const onlineUsers = new Map(); // socket.id -> userId

// Socket.io error handling
io.engine.on('connection_error', (err) => {
  console.log('Socket.io connection error:', err);
});

// Socket.io Events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id, 'User ID:', socket.userId);
  
  // Add user to online users on connection
  if (socket.userId) {
    onlineUsers.set(socket.id, socket.userId);
    // Broadcast new user online to everyone
    const onlineUsersList = Array.from(new Set(onlineUsers.values()));
    io.emit('online-users', onlineUsersList);
    io.emit('user-online', socket.userId);
  }
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  socket.on('join-room', (userId) => {
    // Verify userId matches socket.userId for security
    if (userId === socket.userId) {
      socket.join(userId);
      console.log(`User ${userId} joined room`);
      
      // Send current online users list to the joining user
      const onlineUsersList = Array.from(new Set(onlineUsers.values()));
      socket.emit('online-users', onlineUsersList);
    } else {
      console.error('User tried to join unauthorized room:', userId);
    }
  });

  socket.on('send-message', async (data) => {
    try {
      // Get sender's information to include in the message
      const sender = await User.findById(socket.userId).select('name email avatar');
      const messageWithSender = {
        ...data,
        sender: sender,
        timestamp: new Date()
      };
      
      // Only emit to the receiver, not back to the sender
      socket.to(data.receiverId).emit('receive-message', messageWithSender);
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  socket.on('friend-request-sent', (data) => {
    console.log('Friend request sent:', data);
    // Broadcast to receiver
    io.to(data.receiverId).emit('new-friend-request', {
      ...data,
      timestamp: new Date(),
      type: 'new-friend-request'
    });
  });

  socket.on('friend-request-accepted', (data) => {
    console.log('Friend request accepted:', data);
    // Broadcast to sender
    io.to(data.senderId).emit('friend-request-accepted', {
      ...data,
      timestamp: new Date(),
      type: 'friend-request-accepted'
    });
    
    // Update online status for both users
    const onlineUsersList = Array.from(new Set(onlineUsers.values()));
    io.to(data.senderId).emit('online-users', onlineUsersList);
    io.to(data.receiverId).emit('online-users', onlineUsersList);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const userId = onlineUsers.get(socket.id);
    if (userId) {
      onlineUsers.delete(socket.id);
      // Broadcast the user-offline event
      io.emit('user-offline', userId);
      // Update online users list for everyone
      const onlineUsersList = Array.from(new Set(onlineUsers.values()));
      io.emit('online-users', onlineUsersList);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 FunChat Backend running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
});
