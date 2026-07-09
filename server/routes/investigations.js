const express = require('express');
const { Readable } = require('stream');
const router = express.Router();
const Investigation = require('../models/Investigation');
const Job = require('../models/Job');
const auth = require('../middleware/auth');
const { getIO } = require('../socket');

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
  const io = getIO();
  const roomId = investigationId.toString();

  try {
    await Investigation.findByIdAndUpdate(investigationId, { status: 'running' });

    const response = await fetch('http://localhost:8000/investigate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
      signal: AbortSignal.timeout(600000),
    });

    if (!response.ok) throw new Error(`AI service responded with ${response.status}`);

    // The AI service streams one JSON line per finished agent. We merge
    // each one into `accumulated` as it arrives, and broadcast it live.
    const accumulated = {};
    let buffer = '';

    for await (const chunk of Readable.fromWeb(response.body)) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;
        const update = JSON.parse(line);
        const nodeName = Object.keys(update)[0];
        const nodeOutput = update[nodeName];
        Object.assign(accumulated, nodeOutput);
        io.to(roomId).emit('agent-update', { node: nodeName, output: nodeOutput });
      }
    }

    const trustScore = accumulated.trust_score || computeTrustScore(accumulated);

    const updated = await Investigation.findByIdAndUpdate(investigationId, {
      status: 'complete',
      trustScore,
      agentOutputs: {
        rera_status: accumulated.rera_status,
        fraud_status: accumulated.fraud_status,
        document_status: accumulated.document_status,
        rera_score: accumulated.rera_score,
        fraud_score: accumulated.fraud_score,
        document_score: accumulated.document_score,
      },
      report: accumulated.final_report,
    }, { new: true });

    await Job.findOneAndUpdate(
      { investigationId },
      { status: 'done', completedAt: new Date() }
    );

    io.to(roomId).emit('investigation-complete', updated);
  } catch (err) {
    console.error('Investigation failed:', err.message);
    await Investigation.findByIdAndUpdate(investigationId, { status: 'failed' });
    await Job.findOneAndUpdate({ investigationId }, { status: 'failed' });
    io.to(roomId).emit('investigation-failed', { message: err.message });
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
