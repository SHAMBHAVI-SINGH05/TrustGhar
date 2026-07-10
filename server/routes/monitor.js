const express = require('express');
const router = express.Router();
const Investigation = require('../models/Investigation');
const auth = require('../middleware/auth');
const { checkInvestigation } = require('../watchdog');

router.post('/', auth, async (req, res) => {
  try {
    const { investigationId } = req.body;
    await Investigation.findOneAndUpdate(
      { _id: investigationId, userId: req.userId },
      { isMonitored: true }
    );
    res.json({ message: 'Monitoring started' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const monitored = await Investigation.find({ userId: req.userId, isMonitored: true });
    res.json(monitored);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/:id/check-now', auth, async (req, res) => {
  try {
    const investigation = await Investigation.findOne({ _id: req.params.id, userId: req.userId });
    if (!investigation) return res.status(404).json({ message: 'Investigation not found' });
    if (!investigation.isMonitored) return res.status(400).json({ message: 'This property is not being monitored' });

    const { oldScore, newScore } = await checkInvestigation(investigation);
    res.json({ message: 'Check complete', oldScore, newScore });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Investigation.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isMonitored: false }
    );
    res.json({ message: 'Monitoring stopped' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
