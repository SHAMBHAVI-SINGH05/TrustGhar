const express = require('express');
const router = express.Router();
const ListingCheck = require('../models/ListingCheck');
const auth = require('../middleware/auth');

async function runListingCheck(listingCheckId, url) {
  try {
    const response = await fetch('http://localhost:8000/check-listing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(300000),
    });

    if (!response.ok) throw new Error(`AI service error: ${response.status}`);

    const analysis = await response.json();
    await ListingCheck.findByIdAndUpdate(listingCheckId, { analysis });
  } catch (err) {
    console.error('Listing check failed:', err.message);
    await ListingCheck.findByIdAndUpdate(listingCheckId, {
      analysis: { status: 'failed', error: err.message },
    });
  }
}

router.post('/check', auth, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required' });

    const listingCheck = await ListingCheck.create({
      userId: req.userId,
      url,
      analysis: { status: 'analyzing' },
    });

    runListingCheck(listingCheck._id, url);

    res.status(201).json({ message: 'Listing check started', listingCheckId: listingCheck._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const listingChecks = await ListingCheck.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(listingChecks);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const listingCheck = await ListingCheck.findOne({ _id: req.params.id, userId: req.userId });
    if (!listingCheck) return res.status(404).json({ message: 'Listing check not found' });
    res.json(listingCheck);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const listingCheck = await ListingCheck.findOne({ _id: req.params.id, userId: req.userId });
    if (!listingCheck) return res.status(404).json({ message: 'Listing check not found' });
    await ListingCheck.findByIdAndDelete(listingCheck._id);
    res.json({ message: 'Listing check deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
