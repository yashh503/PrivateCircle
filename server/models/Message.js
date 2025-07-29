import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'call'],
    default: 'text'
  },
  encrypted: {
    type: Boolean,
    default: true
  },
  editedAt: {
    type: Date
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

// Soft delete method
messageSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  this.content = 'This message was deleted';
  return this.save();
};

export default mongoose.model('Message', messageSchema);