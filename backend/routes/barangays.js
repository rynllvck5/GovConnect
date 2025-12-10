const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { permit, canManageBarangay } = require('../middleware/authorize');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'barangays');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const prefix = file.fieldname.startsWith('official_image_') ? 'brgy_official' : 'brgy';
    cb(null, `${prefix}_${Date.now()}${ext || '.jpg'}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /image\/(png|jpe?g|gif|webp)/i.test(file.mimetype);
    if (!ok) return cb(new Error('Only image files allowed'));
    cb(null, true);
  },
});

router.get('/', async (req, res) => {
  const { rows } = await query('SELECT id, name, description, image_url FROM barangays ORDER BY id');
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await query('SELECT id, name, description, image_url FROM barangays WHERE id=$1', [id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  const brgy = rows[0];
  const officials = await query('SELECT id, name, position, image_url, sort_order FROM barangay_officials WHERE barangay_id=$1 ORDER BY sort_order, id', [id]);
  brgy.officials = officials.rows;
  res.json(brgy);
});

router.post(
  '/',
  requireAuth,
  permit(['superadmin', 'admin']),
  upload.single('image'),
  body('name').isString().isLength({ min: 2 }),
  body('description').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, description } = req.body;
    const exists = await query('SELECT 1 FROM barangays WHERE name=$1', [name]);
    if (exists.rowCount) return res.status(409).json({ error: 'Barangay exists' });
    const imageUrl = req.file ? `/uploads/barangays/${req.file.filename}` : null;
    const { rows } = await query('INSERT INTO barangays(name, description, image_url) VALUES($1,$2,$3) RETURNING id', [name, description || null, imageUrl]);
    res.status(201).json({ id: rows[0].id });
  }
);

router.put(
  '/:id',
  requireAuth,
  canManageBarangay,
  upload.single('image'),
  body('name').optional().isString().isLength({ min: 2 }),
  body('description').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const id = Number(req.params.id);
    const { name, description } = req.body;
    const fields = [];
    const values = [];
    let i = 1;
    if (name) { fields.push(`name=$${i++}`); values.push(name); }
    if (description !== undefined) { fields.push(`description=$${i++}`); values.push(description || null); }
    if (req.file) { fields.push(`image_url=$${i++}`); values.push(`/uploads/barangays/${req.file.filename}`); }
    if (!fields.length) return res.status(400).json({ error: 'No changes' });
    values.push(id);
    await query(`UPDATE barangays SET ${fields.join(', ') } WHERE id=$${i}`, values);
    res.json({ ok: true });
  }
);

// Replace the entire set of officials for a barangay
router.put(
  '/:id/officials',
  requireAuth,
  canManageBarangay,
  upload.any(),
  body('officials').isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const id = Number(req.params.id);
    let officials;
    try {
      officials = JSON.parse(req.body.officials || '[]');
      if (!Array.isArray(officials)) officials = [];
    } catch {
      officials = [];
    }
    // Clear existing
    await query('DELETE FROM barangay_officials WHERE barangay_id=$1', [id]);
    // Insert all
    for (let idx = 0; idx < officials.length; idx++) {
      const o = officials[idx] || {};
      const key = o.key || String(idx);
      const f = (req.files || []).find(fl => fl.fieldname === `official_image_${key}`);
      const imageUrl = f ? `/uploads/barangays/${f.filename}` : (o.existingImageUrl || null);
      await query(
        'INSERT INTO barangay_officials (barangay_id, name, position, image_url, sort_order) VALUES($1,$2,$3,$4,$5)',
        [id, o.name || '', o.position || '', imageUrl, o.sort_order ?? idx]
      );
    }
    res.json({ ok: true });
  }
);

router.delete('/:id', requireAuth, permit(['superadmin', 'admin']), async (req, res) => {
  const id = Number(req.params.id);
  await query('DELETE FROM barangays WHERE id=$1', [id]);
  res.json({ ok: true });
});

module.exports = router;
