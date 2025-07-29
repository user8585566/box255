const mongoose = require('mongoose');

const GameTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'], // credit: إضافة، debit: خصم
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  gameType: {
    type: String
  },
  sessionId: {
    type: String
  },
  details: {
    type: Object // تفاصيل إضافية (نتيجة اللعبة، إلخ)
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('GameTransaction', GameTransactionSchema); 