const express = require('express');
const router = express.Router();
const Investigation = require('../models/Investigation');
const Job = require('../models/Job');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    const { listingUrl, propertyAddress, builderName, state } = req.body;

    const investigation = await Investigation.create({
      userId: req.userId,
      listingUrl,
      propertyAddress,
      status: 'pending',
    });

    const job = await Job.create({
      investigationId: investigation._id,
      userId: req.userId,
      status: 'queued',
    });

    res.status(201).json({ investigationId: investigation._id, jobId: job._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const investigations = await Investigation.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(investigations);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
router.get('/:id', auth, async (req, res) => {
  try {
    const investigation = await Investigation.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!investigation) {
      return res.status(404).json({ message: 'Investigation not found' });
    }

    res.json(investigation);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
