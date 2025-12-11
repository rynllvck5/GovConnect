const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { permit, canManageGovEntry } = require('../middleware/authorize');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'gov');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const fname = `gov_${Date.now()}_${Math.random().toString(36).slice(2)}${ext || ''}`;
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

router.get('/categories', async (req, res) => {
  const { rows } = await query(
    `SELECT c.id, c.slug, c.title, c.description, c.schema_json, c.layout_json, c.is_active, c.sort_order,
            COALESCE((SELECT COUNT(1) FROM gov_entries e WHERE e.category_id = c.id AND e.published = TRUE), 0) AS entries_count
       FROM gov_categories c
      WHERE c.is_active = TRUE
      ORDER BY c.sort_order ASC, c.title ASC`
  );
  res.json(rows);
});

router.get('/categories/:slug', async (req, res) => {
  const { slug } = req.params;
  const { rows } = await query(
    `SELECT id, slug, title, description, schema_json, layout_json, is_active, sort_order
     FROM gov_categories WHERE slug=$1`,
    [slug]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

router.get('/categories/:id/entries', async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await query(
    `SELECT id, category_id, title, content_json, published, sort_order, manager_user_id
     FROM gov_entries WHERE category_id=$1 AND published = TRUE ORDER BY sort_order ASC, id ASC`,
    [id]
  );
  res.json(rows);
});

router.get('/entries/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await query(
    `SELECT id, category_id, title, content_json, published, sort_order, manager_user_id
     FROM gov_entries WHERE id=$1`,
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
    const layoutJson = parseMaybeJson(req.body.layout, {});
    const sortOrder = req.body.sortOrder != null ? Number(req.body.sortOrder) : 0;
    const isActive = req.body.isActive != null ? !!req.body.isActive : true;
    const exists = await query('SELECT 1 FROM gov_categories WHERE slug=$1', [slug]);
    if (exists.rowCount) return res.status(409).json({ error: 'Category exists' });
    const { rows } = await query(
      `INSERT INTO gov_categories(slug, title, description, schema_json, layout_json, is_active, sort_order)
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
    await query(`UPDATE gov_categories SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i}` , values);
    res.json({ ok: true });
  }
);

router.delete('/categories/:id', requireAuth, permit(['superadmin', 'admin']), async (req, res) => {
  const id = Number(req.params.id);
  await query('DELETE FROM gov_categories WHERE id=$1', [id]);
  res.json({ ok: true });
});

router.post(
  '/categories/:id/entries',
  requireAuth,
  permit(['superadmin', 'admin']),
  upload.any(),
  async (req, res) => {
    const id = Number(req.params.id);
    const cat = await query('SELECT schema_json FROM gov_categories WHERE id=$1', [id]);
    if (!cat.rowCount) return res.status(404).json({ error: 'Category not found' });
    const schema = cat.rows[0].schema_json || {};
    let content = parseMaybeJson(req.body.content, {});
    const title = (req.body.title && String(req.body.title).trim()) || content.name || null;
    const files = req.files || [];
    const grouped = files.reduce((acc, f) => { (acc[f.fieldname] ||= []).push(f); return acc; }, {});
    const fields = Array.isArray(schema.fields) ? schema.fields : [];
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
        const url = `/uploads/gov/${arr[0].filename}`;
        content[key] = url;
      } else if (type === 'file') {
        const url = `/uploads/gov/${arr[0].filename}`;
        content[key] = url;
        const lbl = req.body[`${key}_label`];
        if (lbl !== undefined) content[`${key}_label`] = String(lbl).trim().slice(0, 200);
      } else if (type === 'images' || type === 'gallery') {
        if (arr.some(fl => !String(fl.mimetype || '').startsWith('image/'))) {
          return res.status(400).json({ error: `Field ${key} only accepts image files.` });
        }
        content[key] = arr.map(fl => `/uploads/gov/${fl.filename}`);
      } else if (type === 'files') {
        content[key] = arr.map(fl => `/uploads/gov/${fl.filename}`);
      }
    }
    const missing = fields.filter((f) => !!f.required && isEmpty(content[f.key]));
    if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.map(m=>m.key).join(', ')}` });
    let managerUserId = null;
    if (req.body.managerUserId != null) managerUserId = Number(req.body.managerUserId) || null;
    else if (req.body.manager_user_id != null) managerUserId = Number(req.body.manager_user_id) || null;
    if (managerUserId) {
      const chk = await query('SELECT 1 FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=$1 AND r.name=$2', [managerUserId, 'officer']);
      if (!chk.rowCount) return res.status(400).json({ error: 'Manager must be an officer user.' });
    }
    const published = req.body.published !== undefined ? !!req.body.published : true;
    const sortOrder = req.body.sortOrder !== undefined ? Number(req.body.sortOrder) : 0;
    const ins = await query(
      `INSERT INTO gov_entries(category_id, title, content_json, published, sort_order, manager_user_id)
       VALUES($1,$2,$3::jsonb,$4,$5,$6) RETURNING id`,
      [id, title, JSON.stringify(content), published, sortOrder, managerUserId]
    );
    res.status(201).json({ id: ins.rows[0].id });
  }
);

router.put(
  '/entries/:id',
  requireAuth,
  canManageGovEntry,
  upload.any(),
  async (req, res) => {
    const id = Number(req.params.id);
    const existing = await query('SELECT e.*, c.schema_json FROM gov_entries e JOIN gov_categories c ON c.id=e.category_id WHERE e.id=$1', [id]);
    if (!existing.rowCount) return res.status(404).json({ error: 'Not found' });
    const row = existing.rows[0];
    const schema = row.schema_json || {};
    let content = parseMaybeJson(req.body.content, row.content_json || {});
    const title = req.body.title !== undefined ? String(req.body.title) : row.title;
    const files = req.files || [];
    const grouped = files.reduce((acc, f) => { (acc[f.fieldname] ||= []).push(f); return acc; }, {});
    const fields = Array.isArray(schema.fields) ? schema.fields : [];
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
        const url = `/uploads/gov/${arr[0].filename}`;
        content[key] = url;
      } else if (type === 'file') {
        const url = `/uploads/gov/${arr[0].filename}`;
        content[key] = url;
        const lbl = req.body[`${key}_label`];
        if (lbl !== undefined) content[`${key}_label`] = String(lbl).trim().slice(0, 200);
      } else if (type === 'images' || type === 'gallery') {
        if (arr.some(fl => !String(fl.mimetype || '').startsWith('image/'))) {
          return res.status(400).json({ error: `Field ${key} only accepts image files.` });
        }
        content[key] = arr.map(fl => `/uploads/gov/${fl.filename}`);
      } else if (type === 'files') {
        content[key] = arr.map(fl => `/uploads/gov/${fl.filename}`);
      }
    }
    const missing = fields.filter((f) => !!f.required && isEmpty(content[f.key]));
    if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.map(m=>m.key).join(', ')}` });
    const published = req.body.published !== undefined ? !!req.body.published : row.published;
    const sortOrder = req.body.sortOrder !== undefined ? Number(req.body.sortOrder) : row.sort_order;
    let managerUserId = row.manager_user_id;
    if (req.user.role === 'officer') {
      // Officers can edit only entries they manage; do not allow changing manager
      managerUserId = row.manager_user_id;
    } else {
      if (req.body.managerUserId !== undefined) managerUserId = req.body.managerUserId ? Number(req.body.managerUserId) : null;
      else if (req.body.manager_user_id !== undefined) managerUserId = req.body.manager_user_id ? Number(req.body.manager_user_id) : null;
      if (managerUserId) {
        const chk = await query('SELECT 1 FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=$1 AND r.name=$2', [managerUserId, 'officer']);
        if (!chk.rowCount) return res.status(400).json({ error: 'Manager must be an officer user.' });
      }
    }
    await query(
      `UPDATE gov_entries SET title=$1, content_json=$2::jsonb, published=$3, sort_order=$4, manager_user_id=$5, updated_at=NOW() WHERE id=$6` ,
      [title, JSON.stringify(content), published, sortOrder, managerUserId, id]
    );
    res.json({ ok: true });
  }
);

// Municipal Officials CRUD
router.get('/municipal-officials', async (req, res) => {
  const { rows } = await query('SELECT id, name, position, image_url, sort_order FROM municipal_officials ORDER BY sort_order ASC, id ASC');
  res.json(rows);
});

router.post(
  '/municipal-officials',
  requireAuth,
  permit(['superadmin', 'admin']),
  upload.single('image'),
  body('name').isString().isLength({ min: 2 }),
  body('position').isString().isLength({ min: 2 }),
  body('sortOrder').optional().isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const name = String(req.body.name).trim();
    const position = String(req.body.position).trim();
    const sortOrder = req.body.sortOrder != null ? Number(req.body.sortOrder) : 0;
    const imageUrl = req.file ? `/uploads/gov/${req.file.filename}` : null;
    const { rows } = await query(
      'INSERT INTO municipal_officials(name, position, image_url, sort_order) VALUES($1,$2,$3,$4) RETURNING id',
      [name, position, imageUrl, sortOrder]
    );
    res.status(201).json({ id: rows[0].id });
  }
);

router.put(
  '/municipal-officials/:id',
  requireAuth,
  permit(['superadmin', 'admin']),
  upload.single('image'),
  body('name').optional().isString().isLength({ min: 2 }),
  body('position').optional().isString().isLength({ min: 2 }),
  body('sortOrder').optional().isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const id = Number(req.params.id);
    const fields = [];
    const values = [];
    let i = 1;
    if (req.body.name) { fields.push(`name=$${i++}`); values.push(String(req.body.name).trim()); }
    if (req.body.position) { fields.push(`position=$${i++}`); values.push(String(req.body.position).trim()); }
    if (req.body.sortOrder !== undefined) { fields.push(`sort_order=$${i++}`); values.push(Number(req.body.sortOrder) || 0); }
    if (req.file) { fields.push(`image_url=$${i++}`); values.push(`/uploads/gov/${req.file.filename}`); }
    if (!fields.length) return res.status(400).json({ error: 'No changes' });
    values.push(id);
    await query(`UPDATE municipal_officials SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i}`, values);
    res.json({ ok: true });
  }
);

router.delete('/municipal-officials/:id', requireAuth, permit(['superadmin', 'admin']), async (req, res) => {
  const id = Number(req.params.id);
  await query('DELETE FROM municipal_officials WHERE id=$1', [id]);
  res.json({ ok: true });
});

router.delete('/entries/:id', requireAuth, permit(['superadmin', 'admin']), async (req, res) => {
  const id = Number(req.params.id);
  await query('DELETE FROM gov_entries WHERE id=$1', [id]);
  res.json({ ok: true });
});

module.exports = router;
