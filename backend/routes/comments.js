const express = require('express');
const { body, validationResult, query: vquery } = require('express-validator');
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function hashString(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function generateAlias(userId, threadKey) {
  const adjectives = ['Misty','Brave','Silent','Crimson','Golden','Wandering','Swift','Calm','Bright','Hidden','Gentle','Bold','Lively','Clever','Lucky'];
  const animals = ['Falcon','Fox','Dolphin','Panda','Otter','Wolf','Hawk','Sparrow','Tiger','Lynx','Heron','Orca','Seal','Eagle','Ibis'];
  const n = hashString(`${threadKey}:${userId}`);
  const adj = adjectives[n % adjectives.length];
  const ani = animals[(Math.floor(n / adjectives.length)) % animals.length];
  const num = (n % 9000) + 1000;
  return `${adj} ${ani} #${num}`;
}

router.get('/', vquery('threadKey').isString().isLength({ min: 1 }), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const threadKey = req.query.threadKey;
  const { rows } = await query(
    `SELECT c.id, c.text, c.created_at, c.parent_id, c.is_anonymous, c.user_id,
            u.full_name, u.email, u.profile_image_url
     FROM comments c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.thread_key = $1
     ORDER BY c.created_at ASC`,
    [threadKey]
  );
  const list = rows.map(r => {
    const alias = r.is_anonymous ? generateAlias(r.user_id, threadKey) : null;
    return {
      id: r.id,
      author: r.is_anonymous ? alias : (r.full_name || r.email || 'User'),
      userId: r.user_id,
      avatar: r.is_anonymous ? null : (r.profile_image_url || null),
      isAnonymous: !!r.is_anonymous,
      text: r.text,
      ts: r.created_at,
      parentId: r.parent_id || null,
    };
  });
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
    const author = isAnonymous ? generateAlias(req.user.id, threadKey) : (req.user.full_name || req.user.email || 'User');
    const avatar = isAnonymous ? null : (req.user.profile_image_url || null);
    res.status(201).json({
      id: row.id,
      author,
      userId: req.user.id,
      avatar,
      isAnonymous: !!isAnonymous,
      text,
      ts: row.created_at,
      parentId: parentId || null,
    });
  }
);

// Edit own comment
router.put(
  '/:id',
  requireAuth,
  body('text').isString().isLength({ min: 1 }),
  body('isAnonymous').optional().isBoolean(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const id = Number(req.params.id);
    const { rows } = await query('SELECT user_id, thread_key FROM comments WHERE id=$1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const isAnon = req.body.isAnonymous !== undefined ? !!req.body.isAnonymous : undefined;
    const fields = ['text=$1'];
    const vals = [String(req.body.text)];
    let i = 2;
    if (isAnon !== undefined) { fields.push(`is_anonymous=$${i++}`); vals.push(isAnon); }
    vals.push(id);
    await query(`UPDATE comments SET ${fields.join(', ')}, created_at=created_at, parent_id=parent_id WHERE id=$${i}` , vals);
    const author = (isAnon ?? undefined) ? generateAlias(req.user.id, rows[0].thread_key) : (req.user.full_name || req.user.email || 'User');
    const avatar = (isAnon ?? undefined) ? null : (req.user.profile_image_url || null);
    res.json({ id, author, userId: req.user.id, avatar, isAnonymous: (isAnon ?? undefined) ?? undefined, text: String(req.body.text), ts: new Date().toISOString() });
  }
);

// Delete own comment
router.delete('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await query('SELECT user_id FROM comments WHERE id=$1', [id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  // Cascade delete the entire subtree using a recursive CTE
  await query(
    `WITH RECURSIVE to_delete AS (
       SELECT id FROM comments WHERE id = $1
       UNION ALL
       SELECT c.id FROM comments c INNER JOIN to_delete td ON c.parent_id = td.id
     )
     DELETE FROM comments WHERE id IN (SELECT id FROM to_delete)`,
    [id]
  );
  res.json({ ok: true });
});

module.exports = router;
