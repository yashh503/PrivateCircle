import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    length: 8
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  maxMembers: {
    type: Number,
    default: 2,
    max: 2
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  encryptionKey: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Generate unique room code
roomSchema.statics.generateRoomCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Check if room is full
roomSchema.methods.isFull = function() {
  return this.members.length >= this.maxMembers;
};

// Add member to room
roomSchema.methods.addMember = function(userId) {
  if (this.isFull()) {
    throw new Error('Room is full');
  }
  
  const existingMember = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  
  if (existingMember) {
    throw new Error('User is already a member of this room');
  }
  
  this.members.push({ user: userId });
  this.lastActivity = new Date();
  return this.save();
};

export default mongoose.model('Room', roomSchema);