const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { permit } = require('../middleware/authorize');

const router = express.Router();

const ADMIN_MANAGEABLE = ['officer', 'barangay_captain', 'constituent'];

router.get('/', requireAuth, permit(['superadmin', 'admin']), async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const where = isAdmin ? `WHERE r.name = ANY($1::text[])` : '';
  const params = isAdmin ? [ADMIN_MANAGEABLE] : [];
  const { rows } = await query(
    `SELECT u.id, u.full_name, u.email, r.name as role, u.office_id, u.barangay_id, u.is_active
     FROM users u JOIN roles r ON r.id=u.role_id ${where} ORDER BY u.id`,
    params
  );
  res.json(rows);
});

router.post(
  '/',
  requireAuth,
  permit(['superadmin', 'admin']),
  body('fullName').isString().isLength({ min: 2 }),
  body('email').isEmail(),
  body('password').isString().isLength({ min: 8 }),
  body('role').isString(),
  body('officeId').optional().isInt({ min: 1 }),
  body('barangayId').optional().isInt({ min: 1 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { fullName, email, password, role, officeId, barangayId } = req.body;
    if (req.user.role === 'admin' && !ADMIN_MANAGEABLE.includes(role)) return res.status(403).json({ error: 'Forbidden' });
    if (role === 'officer' && !officeId) return res.status(400).json({ error: 'officeId required for officer' });
    if (role === 'barangay_captain' && !barangayId) return res.status(400).json({ error: 'barangayId required for barangay_captain' });
    const exists = await query('SELECT 1 FROM users WHERE email=$1', [email]);
    if (exists.rowCount) return res.status(409).json({ error: 'Email already in use' });
    const roleRes = await query('SELECT id FROM roles WHERE name=$1', [role]);
    if (!roleRes.rowCount) return res.status(400).json({ error: 'Invalid role' });
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users(full_name, email, password_hash, role_id, office_id, barangay_id)
       VALUES($1,$2,$3,$4,$5,$6) RETURNING id`,
      [fullName, email, passwordHash, roleRes.rows[0].id, officeId || null, barangayId || null]
    );
    res.status(201).json({ id: rows[0].id });
  }
);

router.put(
  '/:id',
  requireAuth,
  permit(['superadmin', 'admin']),
  body('fullName').optional().isString().isLength({ min: 2 }),
  body('password').optional().isString().isLength({ min: 8 }),
  body('role').optional().isString(),
  body('officeId').optional().isInt({ min: 1 }),
  body('barangayId').optional().isInt({ min: 1 }),
  body('isActive').optional().isBoolean(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const id = Number(req.params.id);
    const { fullName, password, role, officeId, barangayId, isActive } = req.body;
    if (role && req.user.role === 'admin' && !ADMIN_MANAGEABLE.includes(role)) return res.status(403).json({ error: 'Forbidden' });
    let roleId = null;
    if (role) {
      const r = await query('SELECT id FROM roles WHERE name=$1', [role]);
      if (!r.rowCount) return res.status(400).json({ error: 'Invalid role' });
      roleId = r.rows[0].id;
    }
    let passwordHash = null;
    if (password) passwordHash = await bcrypt.hash(password, 10);
    const fields = [];
    const values = [];
    let i = 1;
    if (fullName) { fields.push(`full_name=$${i++}`); values.push(fullName); }
    if (passwordHash) { fields.push(`password_hash=$${i++}`); values.push(passwordHash); }
    if (roleId !== null) { fields.push(`role_id=$${i++}`); values.push(roleId); }
    if (officeId !== undefined) { fields.push(`office_id=$${i++}`); values.push(officeId || null); }
    if (barangayId !== undefined) { fields.push(`barangay_id=$${i++}`); values.push(barangayId || null); }
    if (typeof isActive === 'boolean') { fields.push(`is_active=$${i++}`); values.push(isActive); }
    if (!fields.length) return res.status(400).json({ error: 'No changes' });
    values.push(id);
    await query(`UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i}`, values);
    res.json({ ok: true });
  }
);

router.delete('/:id', requireAuth, permit(['superadmin', 'admin']), async (req, res) => {
  const id = Number(req.params.id);
  if (req.user.role === 'admin') {
    const { rows } = await query('SELECT r.name FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=$1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    if (!ADMIN_MANAGEABLE.includes(rows[0].name)) return res.status(403).json({ error: 'Forbidden' });
  }
  await query('DELETE FROM users WHERE id=$1', [id]);
  res.json({ ok: true });
});

module.exports = router;
