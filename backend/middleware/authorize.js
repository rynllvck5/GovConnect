const { query } = require('../db/pool');

function permit(roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const role = req.user.role;
    const allowed = roles.includes(role) || (role === 'superadmin' && roles.includes('admin'));
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

function canManageOffice(req, res, next) {
  const id = Number(req.params.id);
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role === 'superadmin' || req.user.role === 'admin') return next();
  if (req.user.role === 'officer' && req.user.office_id && Number(req.user.office_id) === id) return next();
  return res.status(403).json({ error: 'Forbidden' });
}

function canManageBarangay(req, res, next) {
  const id = Number(req.params.id);
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role === 'superadmin' || req.user.role === 'admin') return next();
  if (req.user.role === 'barangay_captain' && req.user.barangay_id && Number(req.user.barangay_id) === id) return next();
  return res.status(403).json({ error: 'Forbidden' });
}

async function canManageGovEntry(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role === 'superadmin' || req.user.role === 'admin') return next();
  if (req.user.role === 'officer') {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    try {
      const { rows } = await query('SELECT manager_user_id FROM gov_entries WHERE id=$1', [id]);
      if (rows.length && Number(rows[0].manager_user_id) === Number(req.user.id)) return next();
    } catch {}
  }
  return res.status(403).json({ error: 'Forbidden' });
}

module.exports = { permit, canManageOffice, canManageBarangay, canManageGovEntry };
