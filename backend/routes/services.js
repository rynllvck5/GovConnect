const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const { query } = require('../db/pool');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'services');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.pdf';
    const fname = `svc_form_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, fname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
});

function parseJsonArray(str, fallback = []) {
  try {
    const v = JSON.parse(str || '[]');
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

// List all services with office info
router.get('/', async (req, res) => {
  const { rows } = await query(
    `SELECT s.id, s.office_id, o.name AS office_name, o.slug AS office_slug,
            s.name, s.description, s.venue, s.contact,
            s.requirements, s.steps, s.forms
     FROM services s
     JOIN offices o ON o.id = s.office_id
     ORDER BY o.name, s.name`
  );
  res.json(rows);
});

// Create service
router.post(
  '/',
  requireAuth,
  upload.array('forms'),
  body('name').isString().isLength({ min: 2 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const user = req.user || {};
    const isAdmin = user.role === 'admin' || user.role === 'superadmin';

    const name = String(req.body.name || '').trim();
    const description = req.body.description || '';
    const venue = req.body.venue || '';
    const contact = req.body.contact || '';

    let officeId = null;
    if (isAdmin) {
      officeId = req.body.office_id ? Number(req.body.office_id) : null;
    } else {
      officeId = user.office_id || user.officeId || null;
    }
    if (!officeId) return res.status(400).json({ error: 'Office is required' });

    const requirements = parseJsonArray(req.body.requirements);
    const steps = parseJsonArray(req.body.steps);

    let existingForms = parseJsonArray(req.body.formsExisting);
    if (!Array.isArray(existingForms)) existingForms = [];

    const labels = parseJsonArray(req.body.formLabels);
    const uploadedForms = (req.files || []).map((file, idx) => ({
      url: `/uploads/services/${file.filename}`,
      label: labels[idx] || file.originalname || 'Form',
    }));
    const forms = existingForms.concat(uploadedForms);

    const dup = await query('SELECT 1 FROM services WHERE name=$1 AND office_id=$2', [name, officeId]);
    if (dup.rowCount) return res.status(409).json({ error: 'Service exists' });

    const { rows } = await query(
      `INSERT INTO services (office_id, name, description, venue, contact, requirements, steps, forms)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb)
       RETURNING id`,
      [officeId, name, description, venue, contact, JSON.stringify(requirements), JSON.stringify(steps), JSON.stringify(forms)]
    );

    res.status(201).json({ id: rows[0].id });
  }
);

// Update service
router.put(
  '/:id',
  requireAuth,
  upload.array('forms'),
  async (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });

    const user = req.user || {};
    const isAdmin = user.role === 'admin' || user.role === 'superadmin';

    const { rows: existingRows } = await query('SELECT * FROM services WHERE id=$1', [id]);
    if (!existingRows.length) return res.status(404).json({ error: 'Not found' });
    const existing = existingRows[0];

    // Simple authorization: officers can only edit their own office
    if (!isAdmin && user.role === 'officer' && user.office_id && existing.office_id !== user.office_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const name = req.body.name ? String(req.body.name).trim() : existing.name;
    const description = req.body.description !== undefined ? req.body.description : existing.description;
    const venue = req.body.venue !== undefined ? req.body.venue : existing.venue;
    const contact = req.body.contact !== undefined ? req.body.contact : existing.contact;

    const requirements = req.body.requirements !== undefined
      ? parseJsonArray(req.body.requirements, existing.requirements || [])
      : existing.requirements || [];
    const steps = req.body.steps !== undefined
      ? parseJsonArray(req.body.steps, existing.steps || [])
      : existing.steps || [];

    let existingForms = req.body.formsExisting !== undefined
      ? parseJsonArray(req.body.formsExisting, existing.forms || [])
      : (existing.forms || []);
    if (!Array.isArray(existingForms)) existingForms = [];

    const labels = parseJsonArray(req.body.formLabels);
    const uploadedForms = (req.files || []).map((file, idx) => ({
      url: `/uploads/services/${file.filename}`,
      label: labels[idx] || file.originalname || 'Form',
    }));
    const forms = existingForms.concat(uploadedForms);

    await query(
      `UPDATE services
       SET name=$1, description=$2, venue=$3, contact=$4,
           requirements=$5::jsonb, steps=$6::jsonb, forms=$7::jsonb, updated_at=NOW()
       WHERE id=$8`,
      [name, description, venue, contact, JSON.stringify(requirements), JSON.stringify(steps), JSON.stringify(forms), id]
    );

    res.json({ ok: true });
  }
);

// Delete service
router.delete('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  await query('DELETE FROM services WHERE id=$1', [id]);
  res.json({ ok: true });
});

module.exports = router;
