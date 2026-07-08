require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));

// In-memory Session Store for Admin
const activeSessions = new Set();

// Authentication Middleware for Admin routes
function requireAdmin(req, res, next) {
  const token = req.headers.authorization;
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ success: false, message: 'Akses ditolak. Silakan login kembali.' });
  }
  next();
}

// --- API ENDPOINTS ---

// 1. Admin Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username dan Password harus diisi' });
  }

  const isValid = await db.verifyAdmin(username, password);
  if (isValid) {
    const token = crypto.randomUUID();
    activeSessions.add(token);
    return res.json({ success: true, token, message: 'Login berhasil' });
  } else {
    return res.status(401).json({ success: false, message: 'Username atau Password salah' });
  }
});

// 2. Admin Verify Session
app.get('/api/auth/verify', (req, res) => {
  const token = req.headers.authorization;
  if (token && activeSessions.has(token)) {
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false });
});

// 3. Admin Logout
app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization;
  if (token) {
    activeSessions.delete(token);
  }
  return res.json({ success: true, message: 'Logout berhasil' });
});

// 4. Get Members (Public - for homepage and dropdown)
app.get('/api/members', async (req, res) => {
  const members = await db.getMembers();
  return res.json({ success: true, members });
});

// 5. Add Member Profile (Admin Protected)
app.post('/api/members', requireAdmin, async (req, res) => {
  const { name, nim, fakultas, jurusan } = req.body;
  if (!name || !nim || !fakultas || !jurusan) {
    return res.status(400).json({ success: false, message: 'Semua profil (Nama, NIM, Fakultas, Jurusan) harus diisi' });
  }
  const result = await db.addMember({ name, nim, fakultas, jurusan });
  if (result.success) {
    return res.json(result);
  } else {
    return res.status(400).json(result);
  }
});

// 6. Delete Member (Admin Protected)
app.delete('/api/members', requireAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Nama harus dicantumkan' });
  }
  const result = await db.deleteMember(name);
  if (result.success) {
    return res.json(result);
  } else {
    return res.status(400).json(result);
  }
});

// 7. Get Config (Public - to show cutoff time)
app.get('/api/config', async (req, res) => {
  const config = await db.getConfig();
  return res.json({ success: true, config });
});

// 8. Update Config (Admin Protected - cutoff and password change)
app.post('/api/config', requireAdmin, async (req, res) => {
  const { cutoffTime, newPassword } = req.body;
  
  if (cutoffTime) {
    await db.updateConfig(cutoffTime);
  }

  if (newPassword) {
    if (newPassword.trim().length < 4) {
      return res.status(400).json({ success: false, message: 'Password minimal 4 karakter' });
    }
    await db.updateAdminPassword(newPassword);
  }

  const freshConfig = await db.getConfig();
  return res.json({ success: true, message: 'Konfigurasi berhasil disimpan', config: freshConfig });
});

// 9. Submit Attendance (Public)
app.post('/api/attendance', async (req, res) => {
  const { name, nim, fakultas, jurusan } = req.body;
  const result = await db.addAttendance({ name, nim, fakultas, jurusan });
  if (result.success) {
    return res.json(result);
  } else {
    return res.status(400).json(result);
  }
});

// 10. Get Attendance Records (Admin Protected)
app.get('/api/attendance', requireAdmin, async (req, res) => {
  const attendance = await db.getAttendance();
  return res.json({ success: true, attendance });
});

// 11. Clear Attendance Logs (Admin Protected)
app.delete('/api/attendance/clear', requireAdmin, async (req, res) => {
  const result = await db.clearAttendance();
  if (result.success) {
    return res.json({ success: true, message: 'Semua rekap absensi berhasil dihapus' });
  } else {
    return res.status(500).json({ success: false, message: 'Gagal menghapus rekap absensi' });
  }
});

// Fallback to serve index.html for undefined frontend routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server Absensi KKN berjalan di http://localhost:${PORT}`);
});
