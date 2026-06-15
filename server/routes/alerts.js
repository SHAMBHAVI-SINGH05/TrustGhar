const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const alerts = await Alert.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Alert.countDocuments({ userId: req.userId, isRead: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.patch('/:id/read', auth, async (req, res) => {
  try {
    await Alert.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isRead: true }
    );
    res.json({ message: 'Alert marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.patch('/read-all', auth, async (req, res) => {
  try {
    await Alert.updateMany({ userId: req.userId, isRead: false }, { isRead: true });
    res.json({ message: 'All alerts marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
