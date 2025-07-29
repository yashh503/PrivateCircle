import Room from '../models/Room.js';

export const checkRoomAccess = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const isMember = room.members.some(member => 
      member.user.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied to this room' });
    }

    req.room = room;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const checkSocketRoomAccess = async (socket, roomId) => {
  try {
    const userId = socket.user._id;
    const room = await Room.findById(roomId);
    
    if (!room) {
      return false;
    }

    const isMember = room.members.some(member => 
      member.user.toString() === userId.toString()
    );

    return isMember;
  } catch (error) {
    return false;
  }
};