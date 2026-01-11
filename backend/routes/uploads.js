const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const { permit } = require('../middleware/authorize');

const router = express.Router();

const ALLOWED_BUCKETS = new Set(['tourism', 'projects']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const bucket = String(req.params.bucket || '').toLowerCase();
    if (!ALLOWED_BUCKETS.has(bucket)) return cb(new Error('Invalid bucket'));
    const dir = path.join(__dirname, '..', 'uploads', bucket);
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const bucket = String(req.params.bucket || 'misc').toLowerCase();
    const ext = path.extname(file.originalname || '').toLowerCase();
    const name = `${bucket}_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({ storage, limits: { fileSize: 16 * 1024 * 1024 } });

router.post('/:bucket', requireAuth, permit(['superadmin','admin','barangay_captain']), upload.array('images', 20), (req, res) => {
  const bucket = String(req.params.bucket || '').toLowerCase();
  if (!ALLOWED_BUCKETS.has(bucket)) return res.status(400).json({ error: 'Invalid bucket' });
  const files = req.files || [];
  if (!files.length) return res.status(400).json({ error: 'No files uploaded' });
  const urls = files.map(f => `/uploads/${bucket}/${f.filename}`);
  res.status(201).json({ urls });
});

module.exports = router;
