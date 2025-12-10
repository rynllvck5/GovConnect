function permit(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
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

module.exports = { permit, canManageOffice, canManageBarangay };
