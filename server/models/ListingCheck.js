const mongoose = require('mongoose');

const listingCheckSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  url: { type: String, required: true },
  analysis: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('ListingCheck', listingCheckSchema);
