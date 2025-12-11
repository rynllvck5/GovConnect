const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const { query } = require('../db/pool');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'forms');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '').toLowerCase();
    const fname = `form_${Date.now()}_${Math.random().toString(36).slice(2)}${ext || ''}`;
    cb(null, fname);
  },
});

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/webp',
]);
const ALLOWED_EXTS = new Set(['.pdf','.doc','.docx','.xls','.xlsx','.ppt','.pptx','.txt','.csv','.png','.jpg','.jpeg','.webp']);

const upload = multer({
  storage,
  limits: { fileSize: 16 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    try {
      const mimeOk = ALLOWED_MIMES.has(String(file.mimetype || '').toLowerCase());
      const ext = (path.extname(file.originalname) || '').toLowerCase();
      const extOk = ALLOWED_EXTS.has(ext);
      if (!mimeOk || !extOk) return cb(new Error('Only documents and standard images are allowed.'));
      return cb(null, true);
    } catch (e) {
      return cb(new Error('Invalid file.'));
    }
  },
});

function isAdmin(user) {
  return !!user && (user.role === 'admin' || user.role === 'superadmin');
}

// List forms (public)
router.get('/', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT 
         f.id,
         f.office_id,
         o.name AS office_name,
         o.slug AS office_slug,
         f.title,
         f.description,
         f.file_url,
         f.created_at,
         f.updated_at,
         COALESCE(
           JSON_AGG(
             JSON_BUILD_OBJECT(
               'id', d.id,
               'file_url', d.file_url,
               'original_name', d.original_name,
               'mime_type', d.mime_type,
               'size', d.size
             )
             ORDER BY d.id
           ) FILTER (WHERE d.id IS NOT NULL),
           '[]'::json
         ) AS files
       FROM downloadable_forms f
       JOIN offices o ON o.id = f.office_id
       LEFT JOIN downloadable_form_files d ON d.form_id = f.id
       GROUP BY f.id, o.name, o.slug
       ORDER BY o.name ASC, f.title ASC`
    );
    return res.json(rows);
  } catch (e) {
    if (e && (e.code === '42P01' || /relation .* does not exist/i.test(e.message || ''))) {
      const { rows } = await query(
        `SELECT 
           f.id,
           f.office_id,
           o.name AS office_name,
           o.slug AS office_slug,
           f.title,
           f.description,
           f.file_url,
           f.created_at,
           f.updated_at,
           '[]'::json AS files
         FROM downloadable_forms f
         JOIN offices o ON o.id = f.office_id
         ORDER BY o.name ASC, f.title ASC`
      );
      return res.json(rows);
    }
    throw e;
  }
});

// Create form (admin or officer of an office)
router.post(
  '/',
  requireAuth,
  upload.single('file'),
  body('title').isString().isLength({ min: 2 }),
  body('description').optional().isString(),
  body('officeId').optional().isInt({ min: 1 }),
  body('office_id').optional().isInt({ min: 1 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const user = req.user || {};
    const admin = isAdmin(user);
    let officeId = null;
    if (admin) {
      officeId = req.body.officeId ? Number(req.body.officeId) : (req.body.office_id ? Number(req.body.office_id) : null);
    } else if (user.role === 'officer') {
      officeId = user.office_id || user.officeId || null;
    }
    if (!officeId) return res.status(400).json({ error: 'Office is required' });
    if (!req.file) return res.status(400).json({ error: 'File is required' });

    const fileUrl = `/uploads/forms/${req.file.filename}`;
    const title = String(req.body.title).trim();
    const description = req.body.description || null;

    const { rows } = await query(
      `INSERT INTO downloadable_forms(office_id, title, description, file_url)
       VALUES($1,$2,$3,$4) RETURNING id`,
      [officeId, title, description, fileUrl]
    );
    return res.status(201).json({ id: rows[0].id });
  }
);

// Update form (admin can edit any; officer only forms from own office)
router.put(
  '/:id',
  requireAuth,
  upload.single('file'),
  body('title').optional().isString().isLength({ min: 2 }),
  body('description').optional().isString(),
  body('officeId').optional().isInt({ min: 1 }),
  body('office_id').optional().isInt({ min: 1 }),
  async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const user = req.user || {};
    const admin = isAdmin(user);

    const cur = await query('SELECT * FROM downloadable_forms WHERE id=$1', [id]);
    if (!cur.rowCount) return res.status(404).json({ error: 'Not found' });
    const row = cur.rows[0];

    if (!admin && user.role === 'officer' && (row.office_id !== (user.office_id || user.officeId))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const fields = [];
    const values = [];
    let i = 1;

    if (req.body.title) { fields.push(`title=$${i++}`); values.push(String(req.body.title).trim()); }
    if (req.body.description !== undefined) { fields.push(`description=$${i++}`); values.push(req.body.description || null); }
    if (admin) {
      if (req.body.officeId !== undefined || req.body.office_id !== undefined) {
        const oid = req.body.officeId ? Number(req.body.officeId) : Number(req.body.office_id);
        fields.push(`office_id=$${i++}`); values.push(oid || null);
      }
    }

    if (req.file) { fields.push(`file_url=$${i++}`); values.push(`/uploads/forms/${req.file.filename}`); }

    if (!fields.length) return res.status(400).json({ error: 'No changes' });
    values.push(id);
    await query(`UPDATE downloadable_forms SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i}`, values);
    res.json({ ok: true });
  }
);

// Delete form
router.delete('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
  const user = req.user || {};
  const admin = isAdmin(user);
  const cur = await query('SELECT * FROM downloadable_forms WHERE id=$1', [id]);
  if (!cur.rowCount) return res.status(404).json({ error: 'Not found' });
  const row = cur.rows[0];
  if (!admin && user.role === 'officer' && (row.office_id !== (user.office_id || user.officeId))) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await query('DELETE FROM downloadable_forms WHERE id=$1', [id]);
  res.json({ ok: true });
});

module.exports = router;
