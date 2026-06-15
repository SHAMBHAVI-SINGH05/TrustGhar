const mongoose = require('mongoose');

const graphNodeSchema = new mongoose.Schema({
  type: { type: String, enum: ['Builder', 'Company', 'Person', 'Property'], required: true },
  name: { type: String, required: true },
  reraId: { type: String },
  cin: { type: String },
  trustScore: { type: Number, default: 0 },
  state: { type: String },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('GraphNode', graphNodeSchema);
