const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  investigationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investigation', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  text: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
