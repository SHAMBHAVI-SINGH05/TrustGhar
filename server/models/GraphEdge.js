const mongoose = require('mongoose');

const graphEdgeSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'GraphNode', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'GraphNode', required: true },
  relationship: { type: String, enum: ['LINKED_TO', 'OWNS', 'DIRECTOR_OF', 'HAS_COMPLAINT'], required: true },
  weight: { type: Number, default: 1 },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('GraphEdge', graphEdgeSchema);
