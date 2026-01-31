const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET; // must be set in Render

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ================= HEALTH CHECK =================
app.get('/', (req, res) => {
  res.send('CityFix API running 🚀');
});

// ================= DATABASE =================
const db = new sqlite3.Database(path.join(__dirname, 'cityfix.db'));

// ================= CREATE TABLES =================
db.serialize(() => {

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'citizen',
    location TEXT,
    latitude REAL,
    longitude REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    category TEXT NOT NULL,
    photo TEXT,
    location TEXT,
    latitude REAL,
    longitude REAL,
    description TEXT,
    status TEXT DEFAULT 'submitted',
    assigned_worker_id INTEGER,
    admin_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (assigned_worker_id) REFERENCES users (id)
  )`);

  // ================= CREATE OR UPDATE ADMIN =================
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(
    `INSERT INTO users (name, email, password, role)
     VALUES ('Admin', 'admin@cityfix.com', ?, 'admin')
     ON CONFLICT(email) DO UPDATE SET password=excluded.password`,
    [adminPassword],
    (err) => {
      if (err) console.error('Error creating admin:', err.message);
      else console.log('Admin user ensured in DB');
    }
  );
});

// ================= UPLOADS FOLDER =================
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// ================= MULTER =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname))
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

// ================= AUTH MIDDLEWARE =================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ================= AUTH ROUTES =================

// Register
app.post('/api/register', async (req, res) => {
  const { name, email, password, role = 'citizen' } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE'))
            return res.status(400).json({ error: 'Email already exists' });
          return res.status(500).json({ error: 'Registration failed' });
        }

        const token = jwt.sign(
          { id: this.lastID, email, role },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({ token, user: { id: this.lastID, name, email, role } });
      }
    );
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Server error' });

    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });
});

// ================= REPORT ROUTES =================
app.post('/api/reports', authenticateToken, upload.single('photo'), (req, res) => {
  const { category, location, latitude, longitude, description } = req.body;
  const photo = req.file ? req.file.filename : null;

  db.run(
    `INSERT INTO reports (user_id, category, photo, location, latitude, longitude, description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, category, photo, location, latitude, longitude, description],
    function (err) {
      if (err) return res.status(500).json({ error: 'Report failed' });
      res.json({ reportId: this.lastID });
    }
  );
});

// ================= SERVER =================
app.listen(PORT, () => {
  console.log(`🚀 CityFix server running on port ${PORT}`);
});
