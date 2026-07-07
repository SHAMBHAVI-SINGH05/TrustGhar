const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const auth = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); },
});

const upload = multer({ storage });

async function runDocumentAnalysis(documentId, filePath, fileName) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', blob, fileName);

    const response = await fetch('http://localhost:8000/analyze-document', {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(300000),
    });

    if (!response.ok) throw new Error(`AI service error: ${response.status}`);

    const analysis = await response.json();
    await Document.findByIdAndUpdate(documentId, { analysis });
  } catch (err) {
    console.error('Document analysis failed:', err.message);
    await Document.findByIdAndUpdate(documentId, {
      analysis: { status: 'failed', error: err.message },
    });
  }
}

router.post('/analyze', auth, upload.single('file'), async (req, res) => {
  try {
    const { documentType, investigationId } = req.body;

    const document = await Document.create({
      userId: req.userId,
      investigationId: investigationId || null,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileType: documentType,
      analysis: { status: 'analyzing' },
    });

    runDocumentAnalysis(document._id, req.file.path, req.file.originalname);

    res.status(201).json({ message: 'Document uploaded', documentId: document._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, userId: req.userId });
    if (!document) return res.status(404).json({ message: 'Document not found' });
    res.json(document);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, userId: req.userId });
    if (!document) return res.status(404).json({ message: 'Document not found' });
    if (fs.existsSync(document.filePath)) fs.unlinkSync(document.filePath);
    await Document.findByIdAndDelete(document._id);
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
