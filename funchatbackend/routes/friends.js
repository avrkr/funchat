import express from 'express';
import Friend from '../models/Friend.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import { sendEmail } from '../utils/email.js';

const router = express.Router();

// Send friend request
router.post('/request', auth, async (req, res) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.user.id;

    if (requesterId === recipientId) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }

    // Check if friend request already exists
    const existingRequest = await Friend.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Friend request already exists' });
    }

    // Create friend request
    const friendRequest = await Friend.create({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending'
    });

    // Create notification
    await Notification.create({
      user: recipientId,
      type: 'friend_request',
      title: 'New Friend Request',
      message: `${req.user.name} sent you a friend request`,
      relatedUser: requesterId
    });

    // Get recipient details for email
    const recipient = await User.findById(recipientId);
    const requester = await User.findById(requesterId);

    // Send email notification if user is offline
    if (recipient.status === 'offline') {
      await sendEmail({
        to: recipient.email,
        subject: 'New Friend Request - FunChat',
        html: `
          <h2>New Friend Request</h2>
          <p>${requester.name} sent you a friend request on FunChat.</p>
          <p>Login to your account to accept or decline the request.</p>
        `
      });
    }

    // Populate and return the request
    await friendRequest.populate('requester', 'name email avatar');
    await friendRequest.populate('recipient', 'name email avatar');

    res.status(201).json(friendRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get friend requests
router.get('/requests', auth, async (req, res) => {
  try {
    const friendRequests = await Friend.find({
      recipient: req.user.id,
      status: 'pending'
    }).populate('requester', 'name email avatar status lastActive');

    res.json(friendRequests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Accept friend request
router.put('/accept/:requestId', auth, async (req, res) => {
  try {
    const friendRequest = await Friend.findOne({
      _id: req.params.requestId,
      recipient: req.user.id,
      status: 'pending'
    });

    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    // Update the request status to accepted
    friendRequest.status = 'accepted';
    await friendRequest.save();

    // Populate the saved request with user details
    await friendRequest.populate('requester', 'name email avatar status lastActive');
    await friendRequest.populate('recipient', 'name email avatar status lastActive');

    // Create notification for requester
    const user = await User.findById(req.user.id);
    await Notification.create({
      user: friendRequest.requester,
      type: 'friend_request',
      title: 'Friend Request Accepted',
      message: `${user.name} accepted your friend request`,
      relatedUser: req.user.id
    });

    await friendRequest.populate('requester', 'name email avatar');
    await friendRequest.populate('recipient', 'name email avatar');

    res.json(friendRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject friend request
router.delete('/reject/:requestId', auth, async (req, res) => {
  try {
    await Friend.findOneAndDelete({
      _id: req.params.requestId,
      recipient: req.user.id,
      status: 'pending'
    });

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Block user
router.post('/block', auth, async (req, res) => {
  try {
    const { userId } = req.body;

    // Remove existing friend relationship
    await Friend.findOneAndDelete({
      $or: [
        { requester: req.user.id, recipient: userId },
        { requester: userId, recipient: req.user.id }
      ]
    });

    // Create blocked relationship
    const blocked = await Friend.create({
      requester: req.user.id,
      recipient: userId,
      status: 'blocked',
      blockedBy: req.user.id
    });

    await blocked.populate('recipient', 'name email avatar');

    res.json(blocked);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Unblock user
router.post('/unblock', auth, async (req, res) => {
  try {
    const { userId } = req.body;

    await Friend.findOneAndDelete({
      requester: req.user.id,
      recipient: userId,
      status: 'blocked'
    });

    // Emit socket event for friend status update
    req.app.get('io').to(userId).emit('friend-status-update', {
      type: 'unblocked',
      userId: req.user.id
    });

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get friends list
router.get('/list', auth, async (req, res) => {
  try {
    console.log('Current user ID:', req.user.id);
    
    const friends = await Friend.find({
      $or: [
        { requester: req.user.id, status: 'accepted' },
        { recipient: req.user.id, status: 'accepted' }
      ]
    })
    .populate('requester', 'name email avatar status lastActive')
    .populate('recipient', 'name email avatar status lastActive');

    console.log('Found friends:', friends);

    const friendsList = friends.map(friend => {
      // Determine which user in the friendship is the friend (not the current user)
      console.log('Processing friend document:', {
        friendId: friend._id,
        requesterId: friend.requester._id.toString(),
        recipientId: friend.recipient._id.toString(),
        currentUserId: req.user.id.toString()
      });
      
      const isRequester = friend.requester._id.toString() === req.user.id.toString();
      const friendUser = isRequester ? friend.recipient : friend.requester;
      
      return {
        _id: friendUser._id,
        name: friendUser.name,
        email: friendUser.email,
        avatar: friendUser.avatar,
        status: friendUser.status,
        lastActive: friendUser.lastActive,
        friendship: {
          id: friend._id,
          isRequester: isRequester,
          status: friend.status,
          createdAt: friend.createdAt
        }
      };
    });

    res.json(friendsList);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get blocked users
router.get('/blocked', auth, async (req, res) => {
  try {
    const blockedUsers = await Friend.find({
      requester: req.user.id,
      status: 'blocked'
    }).populate('recipient', 'name email avatar');

    res.json(blockedUsers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;