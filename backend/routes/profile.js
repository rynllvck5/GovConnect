const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const { query } = require('../db/pool');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'avatars');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const fname = `u${req.user.id}_${Date.now()}${ext || '.jpg'}`;
    cb(null, fname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /image\/(png|jpe?g|gif|webp)/i.test(file.mimetype);
    if (!ok) return cb(new Error('Only image files are allowed'));
    cb(null, true);
  },
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    fullName: req.user.full_name,
    role: req.user.role,
    officeId: req.user.office_id,
    barangayId: req.user.barangay_id,
    profileImageUrl: req.user.profile_image_url || null,
  });
});

router.put('/me', requireAuth, async (req, res) => {
  const { fullName } = req.body || {};
  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) return res.status(400).json({ error: 'Invalid fullName' });
  await query('UPDATE users SET full_name=$1, updated_at=NOW() WHERE id=$2', [fullName.trim(), req.user.id]);
  res.json({ ok: true });
});

router.post('/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const publicUrl = `/uploads/avatars/${req.file.filename}`;
  await query('UPDATE users SET profile_image_url=$1, updated_at=NOW() WHERE id=$2', [publicUrl, req.user.id]);
  res.status(201).json({ url: publicUrl });
});

module.exports = router;
