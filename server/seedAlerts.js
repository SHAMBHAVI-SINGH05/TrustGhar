require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Investigation = require('./models/Investigation');
const Alert = require('./models/Alert');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const user = await User.findOne().sort({ createdAt: -1 });
  if (!user) {
    console.log('No user found — register an account first.');
    return process.exit(1);
  }

  const investigation = await Investigation.findOne({ userId: user._id }).sort({ createdAt: -1 });
  if (!investigation) {
    console.log('No investigation found — create one from New Investigation first.');
    return process.exit(1);
  }

  await Alert.create([
    {
      userId: user._id,
      investigationId: investigation._id,
      type: 'rera_complaint',
      severity: 'critical',
      message: `New complaint filed against builder for ${investigation.propertyAddress}`,
    },
    {
      userId: user._id,
      investigationId: investigation._id,
      type: 'possession_overdue',
      severity: 'warning',
      message: `Possession date for ${investigation.propertyAddress} is now overdue`,
    },
    {
      userId: user._id,
      investigationId: investigation._id,
      type: 'score_change',
      severity: 'info',
      message: `Trust score updated for ${investigation.propertyAddress}`,
    },
  ]);

  console.log('3 test alerts created for', user.email);
  process.exit(0);
}

seed();
