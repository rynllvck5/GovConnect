const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// List posts (public)
router.get('/posts', async (req, res) => {
  const { rows } = await query(
    `SELECT p.id, p.title, p.message, p.category, p.location, p.is_anonymous,
            p.created_at,
            u.full_name, u.email, u.id as user_id, u.profile_image_url,
            COALESCE(
              (SELECT json_agg(i.url ORDER BY i.sort_order ASC)
               FROM forum_post_images i WHERE i.post_id = p.id), '[]'::json
            ) AS images
     FROM forum_posts p
     JOIN users u ON u.id = p.user_id
     ORDER BY p.id DESC`
  );
  const formatted = rows.map(r => ({
    id: r.id,
    title: r.title,
    message: r.message,
    category: r.category,
    location: r.location,
    images: r.images || [],
    ts: new Date(r.created_at).getTime(),
    author: r.is_anonymous ? 'Anonymous' : (r.full_name || r.email),
    user_id: r.user_id,
    avatar: r.is_anonymous ? null : (r.profile_image_url || null),
    user: r.is_anonymous ? null : (r.full_name || r.email)
  }));
  res.json(formatted);
});

// Create a post (auth required)
router.post(
  '/posts',
  requireAuth,
  body('title').isString().isLength({ min: 1 }),
  body('message').isString().isLength({ min: 1 }),
  body('category').optional().isString(),
  body('location').optional().isString(),
  body('isAnonymous').optional().isBoolean(),
  body('images').optional().isArray(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { title, message, category, location, isAnonymous = false, images = [] } = req.body;
    const ins = await query(
      `INSERT INTO forum_posts(user_id, title, message, category, location, is_anonymous)
       VALUES($1,$2,$3,$4,$5,$6)
       RETURNING id`,
      [req.user.id, title, message, category || null, location || null, !!isAnonymous]
    );
    const postId = ins.rows[0].id;
    let i = 0;
    for (const url of images.slice(0, 4)) {
      await query('INSERT INTO forum_post_images(post_id, url, sort_order) VALUES($1,$2,$3)', [postId, url, i++]);
    }
    res.status(201).json({ id: postId });
  }
);

module.exports = router;
