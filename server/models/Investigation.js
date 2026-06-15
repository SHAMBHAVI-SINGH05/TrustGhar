const mongoose = require('mongoose');

const investigationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  propertyAddress: { type: String },
  listingUrl: { type: String },
  status: { type: String, enum: ['pending', 'running', 'complete', 'failed'], default: 'pending' },
  trustScore: { type: Number, default: 0 },
  agentOutputs: { type: Object, default: {} },
  fraudGraph: { type: Object, default: {} },
  report: { type: String },
  isMonitored: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Investigation', investigationSchema);
