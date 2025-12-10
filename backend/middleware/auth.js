const jwt = require('jsonwebtoken');
const { query } = require('../db/pool');

async function requireAuth(req, res, next) {
  try {
    const auth = req.headers['authorization'] || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await query(
      `SELECT u.id, u.email, u.full_name, u.profile_image_url, u.role_id, u.office_id, u.barangay_id, u.is_active, r.name AS role
       FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1`,
      [payload.sub]
    );
    if (!rows.length || !rows[0].is_active) return res.status(401).json({ error: 'Unauthorized' });
    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = { requireAuth };
