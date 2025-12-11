require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { query, pool } = require('../db/pool');

async function ensureEnv(vars) {
  const missing = vars.filter((v) => !process.env[v]);
  if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`);
}

async function ensureDatabaseExists() {
  // Try a simple query; if DB missing (3D000), create it by connecting to 'postgres'
  try {
    await query('SELECT 1');
  } catch (e) {
    if (e.code === '3D000' || /database .* does not exist/i.test(e.message || '')) {
      const host = process.env.PGHOST || process.env.DB_HOST || 'localhost';
      const port = Number(process.env.PGPORT || process.env.DB_PORT || 5432);
      const user = process.env.PGUSER || process.env.DB_USER || undefined;
      const password = process.env.PGPASSWORD || process.env.DB_PASSWORD || undefined;
      const ssl = (process.env.PGSSL || process.env.DB_SSL) === 'true' ? { rejectUnauthorized: false } : false;
      const dbName = process.env.PGDATABASE || process.env.DB_NAME || 'govconnect';
      const adminPool = new Pool({ host, port, database: 'postgres', user, password, ssl });
      try {
        await adminPool.query(`CREATE DATABASE ${dbName}`);
        console.log(`Database ${dbName} created.`);
      } finally {
        await adminPool.end();
      }
    } else {
      throw e;
    }
  }
}

async function run() {
  await ensureDatabaseExists();
  await ensureEnv([
    'JWT_SECRET',
    'SEED_SUPERADMIN_EMAIL', 'SEED_SUPERADMIN_PASSWORD', 'SEED_SUPERADMIN_NAME',
    'SEED_ADMIN_EMAIL', 'SEED_ADMIN_PASSWORD', 'SEED_ADMIN_NAME',
    'SEED_OFFICER_EMAIL', 'SEED_OFFICER_PASSWORD', 'SEED_OFFICER_NAME',
    'SEED_BARANGAY_CAPTAIN_EMAIL', 'SEED_BARANGAY_CAPTAIN_PASSWORD', 'SEED_BARANGAY_CAPTAIN_NAME',
    'SEED_CONSTITUENT_EMAIL', 'SEED_CONSTITUENT_PASSWORD', 'SEED_CONSTITUENT_NAME',
    'SEED_OFFICE_NAME', 'SEED_OFFICE_DESC',
    'SEED_BARANGAY_NAME', 'SEED_BARANGAY_DESC'
  ]);

  await query(`CREATE TABLE IF NOT EXISTS roles(
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
  )`);

  await query(`CREATE TABLE IF NOT EXISTS offices(
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT,
    head TEXT,
    location TEXT,
    contact TEXT,
    map_query TEXT,
    image_url TEXT,
    head_image_url TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    description TEXT
  )`);
  // Backfill columns if table already existed
  await query('ALTER TABLE offices ADD COLUMN IF NOT EXISTS slug TEXT');
  await query('ALTER TABLE offices ADD COLUMN IF NOT EXISTS head TEXT');
  await query('ALTER TABLE offices ADD COLUMN IF NOT EXISTS location TEXT');
  await query('ALTER TABLE offices ADD COLUMN IF NOT EXISTS contact TEXT');
  await query('ALTER TABLE offices ADD COLUMN IF NOT EXISTS map_query TEXT');
  await query('ALTER TABLE offices ADD COLUMN IF NOT EXISTS image_url TEXT');
  await query('ALTER TABLE offices ADD COLUMN IF NOT EXISTS head_image_url TEXT');
  await query('ALTER TABLE offices ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION');
  await query('ALTER TABLE offices ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION');
  await query('CREATE UNIQUE INDEX IF NOT EXISTS idx_offices_slug_unique ON offices(slug)');

  await query(`CREATE TABLE IF NOT EXISTS barangays(
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT
  )`);
  await query('ALTER TABLE barangays ADD COLUMN IF NOT EXISTS image_url TEXT');

  await query(`CREATE TABLE IF NOT EXISTS barangay_officials (
    id SERIAL PRIMARY KEY,
    barangay_id INTEGER NOT NULL REFERENCES barangays(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    image_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`);
  await query('CREATE INDEX IF NOT EXISTS idx_barangay_officials_barangay_id ON barangay_officials (barangay_id)');

  // Services
  await query(`CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    office_id INTEGER NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    venue TEXT,
    contact TEXT,
    requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    forms JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`);
  // Backfill columns if table already existed
  await query('ALTER TABLE services ADD COLUMN IF NOT EXISTS description TEXT');
  await query('ALTER TABLE services ADD COLUMN IF NOT EXISTS venue TEXT');
  await query('ALTER TABLE services ADD COLUMN IF NOT EXISTS contact TEXT');
  await query("ALTER TABLE services ADD COLUMN IF NOT EXISTS requirements JSONB NOT NULL DEFAULT '[]'::jsonb");
  await query("ALTER TABLE services ADD COLUMN IF NOT EXISTS steps JSONB NOT NULL DEFAULT '[]'::jsonb");
  await query("ALTER TABLE services ADD COLUMN IF NOT EXISTS forms JSONB NOT NULL DEFAULT '[]'::jsonb");

  // Dynamic Government CMS tables
  await query(`CREATE TABLE IF NOT EXISTS gov_categories (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    schema_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    layout_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`);
  await query('CREATE UNIQUE INDEX IF NOT EXISTS idx_gov_categories_slug_unique ON gov_categories(slug)');

  await query(`CREATE TABLE IF NOT EXISTS gov_entries (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES gov_categories(id) ON DELETE CASCADE,
    title TEXT,
    content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    published BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`);
  await query('CREATE INDEX IF NOT EXISTS idx_gov_entries_category_id ON gov_entries(category_id)');
  await query('ALTER TABLE gov_entries ADD COLUMN IF NOT EXISTS manager_user_id INTEGER REFERENCES users(id)');

  // Municipal officials (for Government section)
  await query(`CREATE TABLE IF NOT EXISTS municipal_officials (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    image_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`);
  await query('CREATE INDEX IF NOT EXISTS idx_municipal_officials_sort ON municipal_officials (sort_order)');
  await query('ALTER TABLE municipal_officials ADD COLUMN IF NOT EXISTS image_url TEXT');
  await query('ALTER TABLE municipal_officials ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0');
  await query("ALTER TABLE municipal_officials ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW()");
  await query("ALTER TABLE municipal_officials ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()");

  // Downloadable Forms (separate from services forms array)
  await query(`CREATE TABLE IF NOT EXISTS downloadable_forms (
    id SERIAL PRIMARY KEY,
    office_id INTEGER NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`);
  await query('CREATE INDEX IF NOT EXISTS idx_downloadable_forms_office_id ON downloadable_forms(office_id)');

  await query(`CREATE TABLE IF NOT EXISTS downloadable_form_files (
    id SERIAL PRIMARY KEY,
    form_id INTEGER NOT NULL REFERENCES downloadable_forms(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    original_name TEXT,
    mime_type TEXT,
    size BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`);
  await query('CREATE INDEX IF NOT EXISTS idx_downloadable_form_files_form_id ON downloadable_form_files(form_id)');
 
  await query(`
    INSERT INTO downloadable_form_files(form_id, file_url)
    SELECT f.id, f.file_url
    FROM downloadable_forms f
    WHERE f.file_url IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM downloadable_form_files d WHERE d.form_id = f.id
      )
  `);

  await query(`CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    office_id INTEGER REFERENCES offices(id),
    barangay_id INTEGER REFERENCES barangays(id),
    profile_image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`);

  // Forum posts and images
  await query(`CREATE TABLE IF NOT EXISTS forum_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT,
    location TEXT,
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`);

  await query(`CREATE TABLE IF NOT EXISTS forum_post_images (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`);

  await query('CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts (created_at)');
  await query('CREATE INDEX IF NOT EXISTS idx_forum_post_images_post_id ON forum_post_images (post_id)');

  // Generic comments table
  await query(`CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    thread_key TEXT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    parent_id INTEGER REFERENCES comments(id) ON DELETE SET NULL,
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`);
  await query('CREATE INDEX IF NOT EXISTS idx_comments_thread_key ON comments (thread_key)');
  await query('CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments (parent_id)');

  const roleNames = ['superadmin','admin','officer','barangay_captain','constituent'];
  for (const r of roleNames) {
    await query('INSERT INTO roles(name) VALUES($1) ON CONFLICT (name) DO NOTHING', [r]);
  }

  const officeName = process.env.SEED_OFFICE_NAME;
  const officeDesc = process.env.SEED_OFFICE_DESC;
  const brgyName = process.env.SEED_BARANGAY_NAME;
  const brgyDesc = process.env.SEED_BARANGAY_DESC;

  function slugify(name) {
    return String(name || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  const officeSlug = slugify(officeName) || null;
  const officeIns = await query(
    `INSERT INTO offices(name, slug, description)
     VALUES($1,$2,$3)
     ON CONFLICT(name) DO UPDATE SET slug=COALESCE(EXCLUDED.slug, offices.slug), description=EXCLUDED.description
     RETURNING id`,
    [officeName, officeSlug, officeDesc]
  );
  const officeId = officeIns.rows[0].id;
  const brgyIns = await query('INSERT INTO barangays(name, description) VALUES($1,$2) ON CONFLICT(name) DO UPDATE SET description=EXCLUDED.description RETURNING id', [brgyName, brgyDesc]);
  const barangayId = brgyIns.rows[0].id;

  async function upsertUser({ fullName, email, password, role, officeId, barangayId }) {
    const roleRes = await query('SELECT id FROM roles WHERE name=$1', [role]);
    const roleId = roleRes.rows[0].id;
    const passwordHash = await bcrypt.hash(password, 10);
    const existing = await query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rowCount) {
      await query('UPDATE users SET full_name=$1, password_hash=$2, role_id=$3, office_id=$4, barangay_id=$5, updated_at=NOW() WHERE id=$6', [fullName, passwordHash, roleId, officeId || null, barangayId || null, existing.rows[0].id]);
      return existing.rows[0].id;
    } else {
      const ins = await query('INSERT INTO users(full_name, email, password_hash, role_id, office_id, barangay_id) VALUES($1,$2,$3,$4,$5,$6) RETURNING id', [fullName, email, passwordHash, roleId, officeId || null, barangayId || null]);
      return ins.rows[0].id;
    }
  }

  await upsertUser({
    fullName: process.env.SEED_SUPERADMIN_NAME,
    email: process.env.SEED_SUPERADMIN_EMAIL,
    password: process.env.SEED_SUPERADMIN_PASSWORD,
    role: 'superadmin'
  });

  await upsertUser({
    fullName: process.env.SEED_ADMIN_NAME,
    email: process.env.SEED_ADMIN_EMAIL,
    password: process.env.SEED_ADMIN_PASSWORD,
    role: 'admin'
  });

  await upsertUser({
    fullName: process.env.SEED_OFFICER_NAME,
    email: process.env.SEED_OFFICER_EMAIL,
    password: process.env.SEED_OFFICER_PASSWORD,
    role: 'officer',
    officeId
  });

  await upsertUser({
    fullName: process.env.SEED_BARANGAY_CAPTAIN_NAME,
    email: process.env.SEED_BARANGAY_CAPTAIN_EMAIL,
    password: process.env.SEED_BARANGAY_CAPTAIN_PASSWORD,
    role: 'barangay_captain',
    barangayId
  });

  await upsertUser({
    fullName: process.env.SEED_CONSTITUENT_NAME,
    email: process.env.SEED_CONSTITUENT_EMAIL,
    password: process.env.SEED_CONSTITUENT_PASSWORD,
    role: 'constituent',
    barangayId
  });

  await pool.end();
  console.log('Database initialized and seed users created.');
}

run().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
