const express = require('express');
const { body, validationResult, query: vquery } = require('express-validator');
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', vquery('threadKey').isString().isLength({ min: 1 }), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const threadKey = req.query.threadKey;
  const { rows } = await query(
    `SELECT c.id, c.text, c.created_at, c.parent_id, c.is_anonymous,
            u.full_name, u.email, u.profile_image_url
     FROM comments c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.thread_key = $1
     ORDER BY c.created_at ASC`,
    [threadKey]
  );
  const list = rows.map(r => ({
    id: r.id,
    author: r.is_anonymous ? 'Anonymous' : (r.full_name || r.email || 'User'),
    user: r.is_anonymous ? null : (r.full_name || r.email || 'User'),
    avatar: r.is_anonymous ? null : (r.profile_image_url || null),
    text: r.text,
    ts: r.created_at,
    parentId: r.parent_id || null,
  }));
  res.json(list);
});

router.post(
  '/',
  requireAuth,
  body('threadKey').isString().isLength({ min: 1 }),
  body('text').isString().isLength({ min: 1 }),
  body('parentId').optional().isInt({ min: 1 }),
  body('isAnonymous').optional().isBoolean(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { threadKey, text, parentId, isAnonymous = false } = req.body;
    const ins = await query(
      `INSERT INTO comments(thread_key, user_id, text, parent_id, is_anonymous)
       VALUES($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [threadKey, req.user.id, text, parentId || null, !!isAnonymous]
    );
    const row = ins.rows[0];
    const author = isAnonymous ? 'Anonymous' : (req.user.full_name || req.user.email || 'User');
    const avatar = isAnonymous ? null : (req.user.profile_image_url || null);
    res.status(201).json({
      id: row.id,
      author,
      user: isAnonymous ? null : author,
      avatar,
      text,
      ts: row.created_at,
      parentId: parentId || null,
    });
  }
);

module.exports = router;
