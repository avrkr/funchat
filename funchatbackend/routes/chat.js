import express from 'express';
import Message from '../models/Message.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get chat history with a user
router.get('/history/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
    .populate('sender', 'name avatar')
    .populate('receiver', 'name avatar')
    .sort({ createdAt: 1 })
    .limit(100);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send message
router.post('/send', auth, async (req, res) => {
  try {
    const { receiverId, message, messageType = 'text', fileUrl, fileName, fileSize } = req.body;

    const newMessage = await Message.create({
      sender: req.user.id,
      receiver: receiverId,
      message,
      messageType,
      fileUrl,
      fileName,
      fileSize
    });

    await newMessage.populate('sender', 'name avatar');
    await newMessage.populate('receiver', 'name avatar');

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark messages as read
router.put('/read/:senderId', auth, async (req, res) => {
  try {
    const { senderId } = req.params;

    await Message.updateMany(
      {
        sender: senderId,
        receiver: req.user.id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get unread message count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiver: req.user.id,
      isRead: false
    });

    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;