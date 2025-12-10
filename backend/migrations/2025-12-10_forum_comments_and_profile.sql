BEGIN;

-- Add profile image URL column for users (for avatars)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Forum posts table
CREATE TABLE IF NOT EXISTS forum_posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT,
  location TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Optional images per post (stores server-relative URLs)
CREATE TABLE IF NOT EXISTS forum_post_images (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts (created_at);
CREATE INDEX IF NOT EXISTS idx_forum_post_images_post_id ON forum_post_images (post_id);

-- Generic comments table that can be used across the site via a thread key
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  thread_key TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  parent_id INTEGER REFERENCES comments(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_thread_key ON comments (thread_key);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments (parent_id);

COMMIT;
