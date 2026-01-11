const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { permit, canManageTourismEntry } = require('../middleware/authorize');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'tourism');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const fname = `tourism_${Date.now()}_${Math.random().toString(36).slice(2)}${ext || ''}`;
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

// Categories
router.get('/categories', async (req, res) => {
  const { rows } = await query(
    `SELECT c.id, c.slug, c.title, c.description, c.schema_json, c.layout_json, c.is_active, c.sort_order,
            COALESCE((SELECT COUNT(1) FROM tourism_entries e WHERE e.category_id = c.id AND e.published = TRUE), 0) AS entries_count
       FROM tourism_categories c
      WHERE c.is_active = TRUE
      ORDER BY c.sort_order ASC, c.title ASC`
  );
  res.json(rows);
});

// Entry by category slug and entry slug
router.get('/categories/:slug/entries/:entrySlug', async (req, res) => {
  const { slug, entrySlug } = req.params;
  const cat = await query('SELECT id, slug, title FROM tourism_categories WHERE slug=$1', [slug]);
  if (!cat.rowCount) return res.status(404).json({ error: 'Category not found' });
  const catId = cat.rows[0].id;
  const { rows } = await query(
    `SELECT e.id, e.category_id, e.slug, e.barangay_id, b.name AS barangay_name, e.title, e.content_json, e.published, e.sort_order
       FROM tourism_entries e
       LEFT JOIN barangays b ON b.id = e.barangay_id
      WHERE e.category_id=$1 AND e.slug=$2`,
    [catId, entrySlug]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json({ category: cat.rows[0], entry: rows[0] });
});

router.get('/categories/:slug', async (req, res) => {
  const { slug } = req.params;
  const { rows } = await query(
    `SELECT id, slug, title, description, schema_json, layout_json, is_active, sort_order
     FROM tourism_categories WHERE slug=$1`,
    [slug]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

router.get('/categories/:id/entries', async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await query(
    `SELECT e.id, e.category_id, e.slug, e.barangay_id, b.name AS barangay_name, e.title, e.content_json, e.published, e.sort_order
       FROM tourism_entries e
       LEFT JOIN barangays b ON b.id = e.barangay_id
      WHERE e.category_id = $1 AND e.published = TRUE
      ORDER BY e.sort_order ASC, e.id ASC`,
    [id]
  );
  res.json(rows);
});

router.get('/entries/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await query(
    `SELECT e.id, e.category_id, e.slug, e.barangay_id, b.name AS barangay_name, e.title, e.content_json, e.published, e.sort_order
       FROM tourism_entries e
       LEFT JOIN barangays b ON b.id = e.barangay_id
      WHERE e.id=$1`,
    [id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

router.post(
  '/categories',
  requireAuth,
  permit(['superadmin', 'admin']),
  body('title').isString().isLength({ min: 2 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const title = String(req.body.title).trim();
    const slug = (req.body.slug && String(req.body.slug).trim()) || slugify(title);
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({ error: 'Link name must use only lowercase letters, numbers, and hyphens.' });
    }
    const description = req.body.description || null;
    let schemaJson = parseMaybeJson(req.body.schema, {});
    const hasFields = schemaJson && Array.isArray(schemaJson.fields) && schemaJson.fields.length > 0;
    if (hasFields) {
      const keys = new Set();
      for (const f of schemaJson.fields) {
        const k = String(f.key || '').trim();
        if (!k) return res.status(400).json({ error: 'Every field needs a Field ID.' });
        if (!/^[a-z0-9_-]+$/.test(k)) return res.status(400).json({ error: `Invalid Field ID: ${k}. Use lowercase letters, numbers, hyphens or underscores.` });
        if (keys.has(k)) return res.status(400).json({ error: `Duplicate Field ID: ${k}` });
        keys.add(k);
      }
    } else {
      schemaJson = {
        fields: [
          { key: 'name', label: 'Name', type: 'text', required: true },
          { key: 'image', label: 'Image', type: 'image', required: false },
          { key: 'description', label: 'Description', type: 'text', required: false },
        ],
      };
    }
    const layoutJson = parseMaybeJson(req.body.layout, {});
    const sortOrder = req.body.sortOrder != null ? Number(req.body.sortOrder) : 0;
    const isActive = req.body.isActive != null ? !!req.body.isActive : true;
    const exists = await query('SELECT 1 FROM tourism_categories WHERE slug=$1', [slug]);
    if (exists.rowCount) return res.status(409).json({ error: 'Category exists' });
    const { rows } = await query(
      `INSERT INTO tourism_categories(slug, title, description, schema_json, layout_json, is_active, sort_order)
       VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7) RETURNING id`,
      [slug, title, description, JSON.stringify(schemaJson), JSON.stringify(layoutJson), isActive, sortOrder]
    );
    res.status(201).json({ id: rows[0].id });
  }
);

router.put(
  '/categories/:id',
  requireAuth,
  permit(['superadmin', 'admin']),
  async (req, res) => {
    const id = Number(req.params.id);
    const fields = [];
    const values = [];
    let i = 1;
    if (req.body.title) { fields.push(`title=$${i++}`); values.push(String(req.body.title).trim()); }
    if (req.body.slug) {
      const s = String(req.body.slug).trim();
      if (!/^[a-z0-9-]+$/.test(s)) return res.status(400).json({ error: 'Link name must use only lowercase letters, numbers, and hyphens.' });
      fields.push(`slug=$${i++}`);
      values.push(s);
    }
    if (req.body.description !== undefined) { fields.push(`description=$${i++}`); values.push(req.body.description || null); }
    if (req.body.schema !== undefined) {
      const schemaJson = parseMaybeJson(req.body.schema, {});
      if (schemaJson && Array.isArray(schemaJson.fields)) {
        const keys = new Set();
        for (const f of schemaJson.fields) {
          const k = String(f.key || '').trim();
          if (!k) return res.status(400).json({ error: 'Every field needs a Field ID.' });
          if (!/^[a-z0-9_-]+$/.test(k)) return res.status(400).json({ error: `Invalid Field ID: ${k}. Use lowercase letters, numbers, hyphens or underscores.` });
          if (keys.has(k)) return res.status(400).json({ error: `Duplicate Field ID: ${k}` });
          keys.add(k);
        }
      }
      fields.push(`schema_json=$${i++}`);
      values.push(JSON.stringify(schemaJson));
    }
    if (req.body.layout !== undefined) { fields.push(`layout_json=$${i++}`); values.push(JSON.stringify(parseMaybeJson(req.body.layout, {}))); }
    if (req.body.isActive !== undefined) { fields.push(`is_active=$${i++}`); values.push(!!req.body.isActive); }
    if (req.body.sortOrder !== undefined) { fields.push(`sort_order=$${i++}`); values.push(Number(req.body.sortOrder) || 0); }
    if (!fields.length) return res.status(400).json({ error: 'No changes' });
    values.push(id);
    await query(`UPDATE tourism_categories SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i}` , values);
    res.json({ ok: true });
  }
);

router.delete('/categories/:id', requireAuth, permit(['superadmin', 'admin']), async (req, res) => {
  const id = Number(req.params.id);
  await query('DELETE FROM tourism_categories WHERE id=$1', [id]);
  res.json({ ok: true });
});

router.post(
  '/categories/:id/entries',
  requireAuth,
  permit(['superadmin', 'admin']),
  upload.any(),
  async (req, res) => {
    const id = Number(req.params.id);
    const cat = await query('SELECT schema_json FROM tourism_categories WHERE id=$1', [id]);
    if (!cat.rowCount) return res.status(404).json({ error: 'Category not found' });
    const schema = cat.rows[0].schema_json || {};
    let content = parseMaybeJson(req.body.content, {});
    const title = (req.body.title && String(req.body.title).trim()) || content.name || null;
    let barangayId = null;
    if (req.body.barangayId != null) barangayId = Number(req.body.barangayId) || null;
    else if (req.body.barangay_id != null) barangayId = Number(req.body.barangay_id) || null;
    if (!barangayId) return res.status(400).json({ error: 'Barangay is required' });
    const brgy = await query('SELECT 1 FROM barangays WHERE id=$1', [barangayId]);
    if (!brgy.rowCount) return res.status(400).json({ error: 'Invalid barangay' });

    const files = req.files || [];
    const grouped = files.reduce((acc, f) => { (acc[f.fieldname] ||= []).push(f); return acc; }, {});
    let fields = Array.isArray(schema.fields) ? schema.fields : [];
    if (!fields.length) {
      fields = [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'image', label: 'Image', type: 'image', required: false },
        { key: 'description', label: 'Description', type: 'text', required: false },
      ];
    }
    const isEmpty = (v) => v == null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);
    for (const f of fields) {
      const key = f.key;
      const type = f.type;
      if (!key || !type) continue;
      const arr = grouped[key] || [];
      if (!arr.length) continue;
      if (type === 'image') {
        if (arr.some(fl => !String(fl.mimetype || '').startsWith('image/'))) {
          return res.status(400).json({ error: `Field ${key} only accepts image files.` });
        }
        const url = `/uploads/tourism/${arr[0].filename}`;
        content[key] = url;
      } else if (type === 'file') {
        const url = `/uploads/tourism/${arr[0].filename}`;
        content[key] = url;
        const lbl = req.body[`${key}_label`];
        if (lbl !== undefined) content[`${key}_label`] = String(lbl).trim().slice(0, 200);
      } else if (type === 'images' || type === 'gallery') {
        if (arr.some(fl => !String(fl.mimetype || '').startsWith('image/'))) {
          return res.status(400).json({ error: `Field ${key} only accepts image files.` });
        }
        content[key] = arr.map(fl => `/uploads/tourism/${fl.filename}`);
      } else if (type === 'files') {
        content[key] = arr.map(fl => `/uploads/tourism/${fl.filename}`);
      }
    }
    const missing = fields.filter((f) => !!f.required && isEmpty(content[f.key]));
    if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.map(m=>m.key).join(', ')}` });

    // entry slug
    let entrySlug = (req.body.slug && String(req.body.slug).trim()) || slugify(title || content.name || '');
    if (!entrySlug) return res.status(400).json({ error: 'Entry title or slug required' });
    if (!/^[a-z0-9-]+$/.test(entrySlug)) return res.status(400).json({ error: 'Invalid entry link name' });
    const dup = await query('SELECT 1 FROM tourism_entries WHERE category_id=$1 AND slug=$2', [id, entrySlug]);
    if (dup.rowCount) return res.status(409).json({ error: 'Entry slug already exists in this category' });

    const published = req.body.published !== undefined ? !!req.body.published : true;
    const sortOrder = req.body.sortOrder !== undefined ? Number(req.body.sortOrder) : 0;
    const ins = await query(
      `INSERT INTO tourism_entries(category_id, slug, barangay_id, title, content_json, published, sort_order)
       VALUES($1,$2,$3,$4,$5::jsonb,$6,$7) RETURNING id`,
      [id, entrySlug, barangayId, title, JSON.stringify(content), published, sortOrder]
    );
    res.status(201).json({ id: ins.rows[0].id });
  }
);

router.put(
  '/entries/:id',
  requireAuth,
  canManageTourismEntry,
  upload.any(),
  async (req, res) => {
    const id = Number(req.params.id);
    const existing = await query('SELECT e.*, c.schema_json FROM tourism_entries e JOIN tourism_categories c ON c.id=e.category_id WHERE e.id=$1', [id]);
    if (!existing.rowCount) return res.status(404).json({ error: 'Not found' });
    const row = existing.rows[0];
    const schema = row.schema_json || {};
    let content = parseMaybeJson(req.body.content, row.content_json || {});
    let title = req.body.title !== undefined ? String(req.body.title) : (content && content.name ? String(content.name) : row.title);
    const files = req.files || [];
    const grouped = files.reduce((acc, f) => { (acc[f.fieldname] ||= []).push(f); return acc; }, {});
    let fields = Array.isArray(schema.fields) ? schema.fields : [];
    if (!fields.length) {
      fields = [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'image', label: 'Image', type: 'image', required: false },
        { key: 'description', label: 'Description', type: 'text', required: false },
      ];
    }
    const isEmpty = (v) => v == null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);
    for (const f of fields) {
      const key = f.key;
      const type = f.type;
      if (!key || !type) continue;
      const arr = grouped[key] || [];
      if (!arr.length) continue;
      if (type === 'image') {
        if (arr.some(fl => !String(fl.mimetype || '').startsWith('image/'))) {
          return res.status(400).json({ error: `Field ${key} only accepts image files.` });
        }
        const url = `/uploads/tourism/${arr[0].filename}`;
        content[key] = url;
      } else if (type === 'file') {
        const url = `/uploads/tourism/${arr[0].filename}`;
        content[key] = url;
        const lbl = req.body[`${key}_label`];
        if (lbl !== undefined) content[`${key}_label`] = String(lbl).trim().slice(0, 200);
      } else if (type === 'images' || type === 'gallery') {
        if (arr.some(fl => !String(fl.mimetype || '').startsWith('image/'))) {
          return res.status(400).json({ error: `Field ${key} only accepts image files.` });
        }
        content[key] = arr.map(fl => `/uploads/tourism/${fl.filename}`);
      } else if (type === 'files') {
        content[key] = arr.map(fl => `/uploads/tourism/${fl.filename}`);
      }
    }
    const missing = fields.filter((f) => !!f.required && isEmpty(content[f.key]));
    if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.map(m=>m.key).join(', ')}` });

    let published = row.published;
    let sortOrder = row.sort_order;
    let barangayId = row.barangay_id;
    let entrySlug = row.slug;
    const isAdmin = req.user && (req.user.role === 'superadmin' || req.user.role === 'admin');
    if (isAdmin) {
      if (req.body.published !== undefined) published = !!req.body.published;
      if (req.body.sortOrder !== undefined) sortOrder = Number(req.body.sortOrder);
      if (req.body.barangayId !== undefined || req.body.barangay_id !== undefined) {
        const newBrgyId = req.body.barangayId != null ? Number(req.body.barangayId) : Number(req.body.barangay_id);
        const brgy = await query('SELECT 1 FROM barangays WHERE id=$1', [newBrgyId]);
        if (!brgy.rowCount) return res.status(400).json({ error: 'Invalid barangay' });
        barangayId = newBrgyId;
      }
      if (req.body.slug) {
        const s = String(req.body.slug).trim();
        if (!/^[a-z0-9-]+$/.test(s)) return res.status(400).json({ error: 'Invalid entry link name' });
        const dup = await query('SELECT 1 FROM tourism_entries WHERE category_id=$1 AND slug=$2 AND id<>$3', [row.category_id, s, id]);
        if (dup.rowCount) return res.status(409).json({ error: 'Entry slug already exists in this category' });
        entrySlug = s;
      }
    }

    await query(
      `UPDATE tourism_entries SET slug=$1, barangay_id=$2, title=$3, content_json=$4::jsonb, published=$5, sort_order=$6, updated_at=NOW() WHERE id=$7` ,
      [entrySlug, barangayId, title, JSON.stringify(content), published, sortOrder, id]
    );
    res.json({ ok: true });
  }
);

router.delete('/entries/:id', requireAuth, permit(['superadmin', 'admin']), async (req, res) => {
  const id = Number(req.params.id);
  await query('DELETE FROM tourism_entries WHERE id=$1', [id]);
  res.json({ ok: true });
});

module.exports = router;
