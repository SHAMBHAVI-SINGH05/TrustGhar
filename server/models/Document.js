const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  investigationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investigation' },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileType: { type: String },
  analysis: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
