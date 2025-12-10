const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/signup',
  body('fullName').isString().isLength({ min: 2 }),
  body('email').isEmail(),
  body('password').isString().isLength({ min: 8 }),
  body('barangayId').optional().isInt({ min: 1 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { fullName, email, password, barangayId } = req.body;
    const existing = await query('SELECT 1 FROM users WHERE email=$1', [email]);
    if (existing.rowCount) return res.status(409).json({ error: 'Email already in use' });
    const roleRes = await query('SELECT id FROM roles WHERE name=$1', ['constituent']);
    if (!roleRes.rowCount) return res.status(500).json({ error: 'Roles not initialized' });
    const passwordHash = await bcrypt.hash(password, 10);
    const insertRes = await query(
      `INSERT INTO users(full_name, email, password_hash, role_id, barangay_id)
       VALUES($1,$2,$3,$4,$5) RETURNING id`,
      [fullName, email, passwordHash, roleRes.rows[0].id, barangayId || null]
    );
    const userId = insertRes.rows[0].id;
    const token = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return res.status(201).json({ token });
  }
);

router.post(
  '/login',
  body('email').isEmail(),
  body('password').isString().isLength({ min: 8 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password } = req.body;
    const { rows } = await query(
      `SELECT u.id, u.password_hash, u.is_active, u.office_id, u.barangay_id, r.name as role
       FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email = $1`,
      [email]
    );
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    if (!user.is_active) return res.status(403).json({ error: 'Account disabled' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { sub: user.id, role: user.role, officeId: user.office_id, barangayId: user.barangay_id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    return res.json({ token });
  }
);

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

module.exports = router;
