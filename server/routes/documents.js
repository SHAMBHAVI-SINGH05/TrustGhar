const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Document = require('../models/Document');
const auth = require('../middleware/auth');

  const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post('/analyze', auth, upload.single('file'), async (req, res) => {
  try {
    const { documentType, investigationId } = req.body;

    const document = await Document.create({
      userId: req.userId,
      investigationId: investigationId || null,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileType: documentType,
      analysis: {},
    });

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

module.exports = router;
