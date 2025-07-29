import express from 'express';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkRoomAccess } from '../middleware/roomAuth.js';
import crypto from 'crypto';

const router = express.Router();

// Get user's rooms
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const rooms = await Room.find({
      'members.user': userId,
      isActive: true
    })
    .populate('members.user', 'username email')
    .sort({ lastActivity: -1 });

    // Get last message for each room
    const roomsWithLastMessage = await Promise.all(
      rooms.map(async (room) => {
        const lastMessage = await Message.findOne({
          room: room._id,
          deletedAt: null
        })
        .populate('sender', 'username')
        .sort({ createdAt: -1 });

        return {
          ...room.toJSON(),
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            sender: lastMessage.sender.username,
            createdAt: lastMessage.createdAt
          } : null
        };
      })
    );

    res.json(roomsWithLastMessage);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create room
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user._id;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    // Generate unique room code
    let roomCode;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      roomCode = Room.generateRoomCode();
      const existingRoom = await Room.findOne({ code: roomCode });
      if (!existingRoom) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ error: 'Failed to generate unique room code' });
    }

    // Generate encryption key for the room
    const encryptionKey = crypto.randomBytes(32).toString('hex');

    // Create room
    const room = new Room({
      name: name.trim().toUpperCase(),
      code: roomCode,
      members: [{ user: userId }],
      encryptionKey
    });

    await room.save();

    // Add room to user's rooms
    await User.findByIdAndUpdate(userId, {
      $push: { rooms: room._id }
    });

    // Populate members for response
    await room.populate('members.user', 'username email');

    res.status(201).json({
      message: 'Room created successfully',
      room: room.toJSON()
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Join room by code
router.post('/join', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user._id;

    if (!code) {
      return res.status(400).json({ error: 'Room code is required' });
    }

    const room = await Room.findOne({ 
      code: code.toUpperCase(),
      isActive: true 
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.isFull()) {
      return res.status(400).json({ error: 'Room is full' });
    }

    // Check if user is already a member
    const isMember = room.members.some(member => 
      member.user.toString() === userId.toString()
    );

    if (isMember) {
      return res.status(400).json({ error: 'You are already a member of this room' });
    }

    // Add user to room
    await room.addMember(userId);

    // Add room to user's rooms
    await User.findByIdAndUpdate(userId, {
      $push: { rooms: room._id }
    });

    // Populate members for response
    await room.populate('members.user', 'username email');

    res.json({
      message: 'Joined room successfully',
      room: room.toJSON()
    });
  } catch (error) {
    console.error('Join room error:', error);
    if (error.message === 'Room is full' || error.message === 'User is already a member of this room') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Get room details
router.get('/:roomId', authenticateToken, checkRoomAccess, async (req, res) => {
  try {
    const room = req.room;
    await room.populate('members.user', 'username email');
    
    res.json(room.toJSON());
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get room messages
router.get('/:roomId/messages', authenticateToken, checkRoomAccess, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      room: roomId,
      deletedAt: null
    })
    .populate('sender', 'username')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    res.json(messages.reverse()); // Reverse to get chronological order
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Leave room
router.post('/:roomId/leave', authenticateToken, checkRoomAccess, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const room = await Room.findById(roomId);
    
    // Remove user from room
    room.members = room.members.filter(member => 
      member.user.toString() !== userId.toString()
    );

    // If no members left, deactivate room
    if (room.members.length === 0) {
      room.isActive = false;
    }

    await room.save();

    // Remove room from user's rooms
    await User.findByIdAndUpdate(userId, {
      $pull: { rooms: roomId }
    });

    res.json({ message: 'Left room successfully' });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;