const express = require('express');
const router = express.Router();
const Investigation = require('../models/Investigation');
const Job = require('../models/Job');
const auth = require('../middleware/auth');

function computeTrustScore(result) {
  let score = 70;
  const text = JSON.stringify(result).toLowerCase();
  if (text.includes('fraud') || text.includes('scam') || text.includes('fake')) score -= 20;
  if (text.includes('complaint')) score -= 10;
  if (text.includes('delay') || text.includes('overdue')) score -= 5;
  if (text.includes('warning') || text.includes('red flag') || text.includes('risk')) score -= 8;
  if (text.includes('rera registered') || text.includes('compliant') || text.includes('verified')) score += 10;
  if (text.includes('no complaint') || text.includes('clean record') || text.includes('no red flag')) score += 8;
  if (text.includes('low risk') || text.includes('safe') || text.includes('trusted')) score += 5;
  return Math.max(10, Math.min(100, score));
}

async function runInvestigation(address, investigationId) {
  try {
    await Investigation.findByIdAndUpdate(investigationId, { status: 'running' });

    const response = await fetch('http://localhost:8000/investigate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
      signal: AbortSignal.timeout(600000),
    });

    if (!response.ok) throw new Error(`AI service responded with ${response.status}`);

    const result = await response.json();
    const trustScore = result.trust_score || computeTrustScore(result);

    await Investigation.findByIdAndUpdate(investigationId, {
      status: 'complete',
      trustScore,
      agentOutputs: {
        rera_status: result.rera_status,
        fraud_status: result.fraud_status,
        document_status: result.document_status,
        rera_score: result.rera_score,
        fraud_score: result.fraud_score,
        document_score: result.document_score,
      },
      report: result.final_report,
    });

    await Job.findOneAndUpdate(
      { investigationId },
      { status: 'done', completedAt: new Date() }
    );
  } catch (err) {
    console.error('Investigation failed:', err.message);
    await Investigation.findByIdAndUpdate(investigationId, { status: 'failed' });
    await Job.findOneAndUpdate({ investigationId }, { status: 'failed' });
  }
}

router.post('/', auth, async (req, res) => {
  try {
    const { listingUrl, propertyAddress, builderName, state } = req.body;
    const address = propertyAddress || listingUrl || builderName || 'Unknown property';

    const investigation = await Investigation.create({
      userId: req.userId,
      listingUrl,
      propertyAddress: address,
      status: 'pending',
    });

    const job = await Job.create({
      investigationId: investigation._id,
      userId: req.userId,
      status: 'queued',
    });

    runInvestigation(address, investigation._id);

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
    if (!investigation) return res.status(404).json({ message: 'Investigation not found' });
    res.json(investigation);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
