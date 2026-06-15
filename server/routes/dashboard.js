const express = require('express');
const router = express.Router();
const Investigation = require('../models/Investigation');
const Alert = require('../models/Alert');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const recentInvestigations = await Investigation.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(5);

    const unreadAlerts = await Alert.countDocuments({ userId: req.userId, isRead: false });

    const monitoredCount = await Investigation.countDocuments({ userId: req.userId, isMonitored: true });

    res.json({ recentInvestigations, unreadAlerts, monitoredCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
