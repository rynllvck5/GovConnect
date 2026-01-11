const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { permit } = require('../middleware/authorize');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'projects');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const fname = `projects_${Date.now()}_${Math.random().toString(36).slice(2)}${ext || ''}`;
    cb(null, fname);
  },
});
const upload = multer({ storage, limits: { fileSize: 16 * 1024 * 1024 } });

function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function parseMaybeJson(val, fallback) {
  if (val == null) return fallback;
  if (typeof val === 'object') return val;
  try { const v = JSON.parse(String(val)); return v; } catch { return fallback; }
}

router.get('/', async (req, res) => {
  const { rows } = await query(
    `SELECT id, slug, title, department, budget, status, start_date, end_date, image_url, content_json, published, sort_order
       FROM projects
      WHERE published = TRUE
      ORDER BY sort_order ASC, id ASC`
  );
  res.json(rows);
});

router.get('/:slug', async (req, res) => {
  const slug = String(req.params.slug);
  const { rows } = await query(
    `SELECT id, slug, title, department, budget, status, start_date, end_date, image_url, content_json, published, sort_order
       FROM projects WHERE slug=$1`,
    [slug]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

router.post(
  '/',
  requireAuth,
  permit(['superadmin', 'admin']),
  upload.any(),
  body('title').isString().isLength({ min: 2 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const title = String(req.body.title).trim();
    const slug = (req.body.slug && String(req.body.slug).trim()) || slugify(title);
    if (!/^[a-z0-9-]+$/.test(slug)) return res.status(400).json({ error: 'Invalid link name' });
    const exists = await query('SELECT 1 FROM projects WHERE slug=$1', [slug]);
    if (exists.rowCount) return res.status(409).json({ error: 'Project exists' });

    const files = req.files || [];
    const grouped = files.reduce((acc, f) => { (acc[f.fieldname] ||= []).push(f); return acc; }, {});
    let content = parseMaybeJson(req.body.content, {});
    const department = req.body.department || null;
    const budget = req.body.budget != null ? Number(req.body.budget) : null;
    const status = req.body.status || null;
    const startDate = req.body.startDate || null;
    const endDate = req.body.endDate || null;

    if (grouped.image && grouped.image.length) {
      const f = grouped.image[0];
      if (!String(f.mimetype || '').startsWith('image/')) return res.status(400).json({ error: 'Image must be an image file' });
      content.image = `/uploads/projects/${f.filename}`;
    }
    let imageUrl = content.image || null;
    if (grouped.gallery && grouped.gallery.length) {
      if (grouped.gallery.some(fl => !String(fl.mimetype || '').startsWith('image/'))) return res.status(400).json({ error: 'Gallery only accepts images' });
      const add = grouped.gallery.map(fl => `/uploads/projects/${fl.filename}`);
      const prev = Array.isArray(content.gallery) ? content.gallery.slice() : [];
      content.gallery = [...prev, ...add];
    }

    const ins = await query(
      `INSERT INTO projects(slug, title, department, budget, status, start_date, end_date, image_url, content_json, published, sort_order)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11) RETURNING id`,
      [slug, title, department, budget, status, startDate, endDate, imageUrl, JSON.stringify(content), true, 0]
    );
    res.status(201).json({ id: ins.rows[0].id });
  }
);

router.put(
  '/:id',
  requireAuth,
  permit(['superadmin', 'admin']),
  upload.any(),
  async (req, res) => {
    const id = Number(req.params.id);
    const ex = await query('SELECT * FROM projects WHERE id=$1', [id]);
    if (!ex.rowCount) return res.status(404).json({ error: 'Not found' });
    const row = ex.rows[0];

    const files = req.files || [];
    const grouped = files.reduce((acc, f) => { (acc[f.fieldname] ||= []).push(f); return acc; }, {});
    let content = parseMaybeJson(req.body.content, row.content_json || {});

    let slug = row.slug;
    let title = req.body.title !== undefined ? String(req.body.title) : row.title;
    let department = req.body.department !== undefined ? req.body.department : row.department;
    let budget = req.body.budget !== undefined ? Number(req.body.budget) : row.budget;
    let status = req.body.status !== undefined ? req.body.status : row.status;
    let startDate = req.body.startDate !== undefined ? req.body.startDate : row.start_date;
    let endDate = req.body.endDate !== undefined ? req.body.endDate : row.end_date;
    let imageUrl = row.image_url;

    if (req.body.slug) {
      const s = String(req.body.slug).trim();
      if (!/^[a-z0-9-]+$/.test(s)) return res.status(400).json({ error: 'Invalid link name' });
      const dup = await query('SELECT 1 FROM projects WHERE slug=$1 AND id<>$2', [s, id]);
      if (dup.rowCount) return res.status(409).json({ error: 'Project slug exists' });
      slug = s;
    }

    if (grouped.image && grouped.image.length) {
      const f = grouped.image[0];
      if (!String(f.mimetype || '').startsWith('image/')) return res.status(400).json({ error: 'Image must be an image file' });
      imageUrl = `/uploads/projects/${f.filename}`;
    }

    if (grouped.gallery && grouped.gallery.length) {
      if (grouped.gallery.some(fl => !String(fl.mimetype || '').startsWith('image/'))) return res.status(400).json({ error: 'Gallery only accepts images' });
      const add = grouped.gallery.map(fl => `/uploads/projects/${fl.filename}`);
      const prev = Array.isArray(content.gallery) ? content.gallery.slice() : [];
      content.gallery = [...prev, ...add];
    }

    await query(
      `UPDATE projects
         SET slug=$1, title=$2, department=$3, budget=$4, status=$5, start_date=$6, end_date=$7, image_url=$8, content_json=$9::jsonb, updated_at=NOW()
       WHERE id=$10`,
      [slug, title, department, budget, status, startDate, endDate, imageUrl, JSON.stringify(content), id]
    );
    res.json({ ok: true });
  }
);

router.delete('/:id', requireAuth, permit(['superadmin', 'admin']), async (req, res) => {
  const id = Number(req.params.id);
  await query('DELETE FROM projects WHERE id=$1', [id]);
  res.json({ ok: true });
});

module.exports = router;
