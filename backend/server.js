require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const officeRoutes = require('./routes/offices');
const barangayRoutes = require('./routes/barangays');
const forumRoutes = require('./routes/forum');
const commentRoutes = require('./routes/comments');
const profileRoutes = require('./routes/profile');
const servicesRoutes = require('./routes/services');
const govRoutes = require('./routes/gov');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
// Simple directory listing for /uploads/* to aid debugging (directories only)
app.get('/uploads/*', (req, res, next) => {
  const rel = req.path.replace(/^\/uploads\//, 'uploads/');
  const full = path.join(__dirname, rel);
  try {
    const stat = require('fs').statSync(full);
    if (stat.isDirectory()) {
      const entries = require('fs').readdirSync(full).filter((n) => !n.startsWith('.'));
      const baseUrl = req.originalUrl.replace(/\/?$/, '/');
      const links = entries.map((e) => `<li><a href="${baseUrl}${encodeURIComponent(e)}">${e}</a></li>`).join('');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(`<!doctype html><meta charset="utf-8"><title>Index of ${baseUrl}</title><h1>Index of ${baseUrl}</h1><ul>${links}</ul>`);
    }
  } catch {}
  return next();
});

// Static file serving for uploads (profile images, etc.)
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/offices', officeRoutes);
app.use('/api/barangays', barangayRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/gov', govRoutes);

// Test route
app.get('/api', (req, res) => {
  res.json({ message: 'Hello from GovConnect API!' });
});

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
