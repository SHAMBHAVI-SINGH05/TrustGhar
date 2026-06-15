const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  investigationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investigation', required: true },
  type: { type: String, enum: ['rera_complaint', 'court_case', 'possession_overdue', 'score_change'], required: true },
  severity: { type: String, enum: ['critical', 'warning', 'info'], required: true },
  message: { type: String, required: true },
  diff: { type: Object, default: {} },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
