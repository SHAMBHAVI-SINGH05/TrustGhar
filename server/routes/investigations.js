const express = require('express');
const { Readable } = require('stream');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const Investigation = require('../models/Investigation');
const Job = require('../models/Job');
const ChatMessage = require('../models/ChatMessage');
const auth = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const { getIO } = require('../socket');

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); },
});
const upload = multer({ storage });

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

async function runInvestigation(address, investigationId, type, filePath) {
  const io = getIO();
  const roomId = investigationId.toString();

  try {
    await Investigation.findByIdAndUpdate(investigationId, { status: 'running' });

    let response;
    if (filePath) {
      const fileBuffer = fs.readFileSync(filePath);
      const blob = new Blob([fileBuffer], { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('address', address);
      formData.append('type', type);
      formData.append('file', blob, path.basename(filePath));

      response = await fetch(`${process.env.AI_SERVICE_URL}/investigate-with-document`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(600000),
      });
    } else {
      response = await fetch(`${process.env.AI_SERVICE_URL}/investigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, type }),
        signal: AbortSignal.timeout(600000),
      });
    }

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
        if (update.error) throw new Error(update.error);
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
      fraudGraph: accumulated.fraud_graph || {},
      report: accumulated.final_report,
    }, { new: true });

    await Job.findOneAndUpdate(
      { investigationId },
      { status: 'done', completedAt: new Date() }
    );

    io.to(roomId).emit('investigation-complete', updated);
  } catch (err) {
    console.error('Investigation failed:', err.message);
    await Investigation.findByIdAndUpdate(investigationId, { status: 'failed', error: err.message });
    await Job.findOneAndUpdate({ investigationId }, { status: 'failed' });
    io.to(roomId).emit('investigation-failed', { message: err.message });
  }
}

router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    const { listingUrl, propertyAddress, builderName, state, type } = req.body;
    const address = propertyAddress || listingUrl || builderName || 'Unknown property';

    const investigation = await Investigation.create({
      userId: req.userId,
      listingUrl,
      propertyAddress: address,
      status: 'pending',
      type: type || 'full',
    });

    const job = await Job.create({
      investigationId: investigation._id,
      userId: req.userId,
      status: 'queued',
    });

    runInvestigation(address, investigation._id, investigation.type, req.file?.path);

    res.status(201).json({ investigationId: investigation._id, jobId: job._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const investigations = await Investigation.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(investigations);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/:id', auth, validateObjectId, async (req, res) => {
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

router.get('/:id/chat', auth, validateObjectId, async (req, res) => {
  try {
    const investigation = await Investigation.findOne({ _id: req.params.id, userId: req.userId });
    if (!investigation) return res.status(404).json({ message: 'Investigation not found' });

    const messages = await ChatMessage.find({ investigationId: req.params.id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/:id/chat', auth, validateObjectId, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const investigation = await Investigation.findOne({ _id: req.params.id, userId: req.userId });
    if (!investigation) return res.status(404).json({ message: 'Investigation not found' });
    if (investigation.status !== 'complete') {
      return res.status(400).json({ message: 'Chat is only available once the report is complete' });
    }

    const priorMessages = await ChatMessage.find({ investigationId: req.params.id }).sort({ createdAt: 1 });
    const chatHistory = priorMessages.map((m) => ({ role: m.role, text: m.text }));

    await ChatMessage.create({
      investigationId: req.params.id,
      userId: req.userId,
      role: 'user',
      text: question,
    });

    let reportContext = investigation.report || '';
    const { rera_status, fraud_status, document_status } = investigation.agentOutputs || {};
    if (rera_status) reportContext += `\n\nRERA CHECK:\n${rera_status}`;
    if (fraud_status) reportContext += `\n\nFRAUD CHECK:\n${fraud_status}`;
    if (document_status) reportContext += `\n\nDOCUMENT RISK:\n${document_status}`;

    const response = await fetch(`${process.env.AI_SERVICE_URL}/report-qa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: investigation.propertyAddress,
        report_context: reportContext,
        question,
        chat_history: chatHistory,
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) throw new Error(`AI service responded with ${response.status}`);
    const { answer } = await response.json();

    const assistantMessage = await ChatMessage.create({
      investigationId: req.params.id,
      userId: req.userId,
      role: 'assistant',
      text: answer,
    });

    res.status(201).json(assistantMessage);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
