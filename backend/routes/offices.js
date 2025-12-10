const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { permit, canManageOffice } = require('../middleware/authorize');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'offices');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const prefix = file.fieldname === 'headImage' ? 'ofc_head' : 'ofc';
    const fname = `${prefix}_${Date.now()}${ext || '.jpg'}`;
    cb(null, fname);
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

function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

router.get('/', async (req, res) => {
  const { rows } = await query(
    `SELECT id, name, slug, head, location, contact, map_query, image_url, head_image_url, lat, lng, description FROM offices ORDER BY id`
  );
  res.json(rows);
});

router.get('/slug/:slug', async (req, res) => {
  const { slug } = req.params;
  const { rows } = await query(
    'SELECT id, name, slug, head, location, contact, map_query, image_url, head_image_url, lat, lng, description FROM offices WHERE slug=$1',
    [slug]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await query(
    'SELECT id, name, slug, head, location, contact, map_query, image_url, head_image_url, lat, lng, description FROM offices WHERE id=$1',
    [id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

router.post(
  '/',
  requireAuth,
  permit(['superadmin', 'admin']),
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'headImage', maxCount: 1 }]),
  body('name').isString().isLength({ min: 2 }),
  body('description').optional().isString(),
  body('head').optional().isString(),
  body('location').optional().isString(),
  body('contact').optional().isString(),
  body('mapQuery').optional().isString(),
  body('lat').optional().isFloat(),
  body('lng').optional().isFloat(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, description, head, location, contact, mapQuery } = req.body;
    const exists = await query('SELECT 1 FROM offices WHERE name=$1', [name]);
    if (exists.rowCount) return res.status(409).json({ error: 'Office exists' });
    const slug = slugify(name);
    const imageUrl = req.files?.image?.[0] ? `/uploads/offices/${req.files.image[0].filename}` : null;
    const headImageUrl = req.files?.headImage?.[0] ? `/uploads/offices/${req.files.headImage[0].filename}` : null;
    const lat = req.body.lat !== undefined ? parseFloat(req.body.lat) : null;
    const lng = req.body.lng !== undefined ? parseFloat(req.body.lng) : null;
    const { rows } = await query(
      `INSERT INTO offices(name, slug, description, head, location, contact, map_query, image_url, head_image_url, lat, lng)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [name, slug, description || null, head || null, location || null, contact || null, mapQuery || null, imageUrl, headImageUrl, lat, lng]
    );
    res.status(201).json({ id: rows[0].id });
  }
);

router.put(
  '/:id',
  requireAuth,
  canManageOffice,
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'headImage', maxCount: 1 }]),
  body('name').optional().isString().isLength({ min: 2 }),
  body('description').optional().isString(),
  body('head').optional().isString(),
  body('location').optional().isString(),
  body('contact').optional().isString(),
  body('mapQuery').optional().isString(),
  body('lat').optional().isFloat(),
  body('lng').optional().isFloat(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const id = Number(req.params.id);
    const { name, description, head, location, contact, mapQuery } = req.body;
    const fields = [];
    const values = [];
    let i = 1;
    if (name) { fields.push(`name=$${i++}`); values.push(name); fields.push(`slug=$${i++}`); values.push(slugify(name)); }
    if (description !== undefined) { fields.push(`description=$${i++}`); values.push(description || null); }
    if (head !== undefined) { fields.push(`head=$${i++}`); values.push(head || null); }
    if (location !== undefined) { fields.push(`location=$${i++}`); values.push(location || null); }
    if (contact !== undefined) { fields.push(`contact=$${i++}`); values.push(contact || null); }
    if (mapQuery !== undefined) { fields.push(`map_query=$${i++}`); values.push(mapQuery || null); }
    if (req.files?.image?.[0]) { fields.push(`image_url=$${i++}`); values.push(`/uploads/offices/${req.files.image[0].filename}`); }
    if (req.files?.headImage?.[0]) { fields.push(`head_image_url=$${i++}`); values.push(`/uploads/offices/${req.files.headImage[0].filename}`); }
    if (req.body.lat !== undefined) { fields.push(`lat=$${i++}`); values.push(req.body.lat === '' ? null : parseFloat(req.body.lat)); }
    if (req.body.lng !== undefined) { fields.push(`lng=$${i++}`); values.push(req.body.lng === '' ? null : parseFloat(req.body.lng)); }
    if (!fields.length) return res.status(400).json({ error: 'No changes' });
    values.push(id);
    await query(`UPDATE offices SET ${fields.join(', ') } WHERE id=$${i}`, values);
    res.json({ ok: true });
  }
);

router.delete('/:id', requireAuth, permit(['superadmin', 'admin']), async (req, res) => {
  const id = Number(req.params.id);
  await query('DELETE FROM offices WHERE id=$1', [id]);
  res.json({ ok: true });
});

module.exports = router;
