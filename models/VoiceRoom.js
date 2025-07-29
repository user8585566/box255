const mongoose = require('mongoose');

const VoiceRoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  users: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now }
  }],
  maxUsers: {
    type: Number,
    default: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('VoiceRoom', VoiceRoomSchema); 