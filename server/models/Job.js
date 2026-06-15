const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  investigationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investigation', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['queued', 'processing', 'done', 'failed'], default: 'queued' },
  attempts: { type: Number, default: 0 },
  startedAt: { type: Date },
  completedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
