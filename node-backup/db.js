const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

// Load environment variables (useful if dotenv is loaded in server.js)
require('dotenv').config();

const dbDir = path.join(__dirname, 'data');
const dbPath = path.join(dbDir, 'data.json');

// --- POSTGRESQL (NEON) DATABASE SETUP ---
let pgPool = null;
let usePostgres = !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('your-neon-host.neon.tech');

if (usePostgres) {
  console.log('Database Mode: PostgreSQL (Neon Website) detected.');
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Neon secure connection
  });
  
  // Auto-initialize PostgreSQL tables
  initPostgresTables().catch(err => {
    console.error('Koneksi PostgreSQL (Neon) gagal. Beralih ke fallback JSON lokal.', err);
    usePostgres = false;
  });
} else {
  console.log('Database Mode: Fallback ke JSON File lokal (data/data.json).');
}

async function initPostgresTables() {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Admin table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(256) NOT NULL
      )
    `);

    // Insert default admin if not exists
    const defaultHash = crypto.createHash('sha256').update('admin123').digest('hex');
    await client.query(`
      INSERT INTO admin (username, password_hash)
      VALUES ('admin', $1)
      ON CONFLICT (username) DO NOTHING
    `, [defaultHash]);

    // 2. Config table
    await client.query(`
      CREATE TABLE IF NOT EXISTS config (
        key VARCHAR(50) PRIMARY KEY,
        value VARCHAR(256) NOT NULL
      )
    `);

    // Insert default cutoff time if not exists
    await client.query(`
      INSERT INTO config (key, value)
      VALUES ('cutoffTime', '08:00')
      ON CONFLICT (key) DO NOTHING
    `);

    // 3. Members table
    await client.query(`
      CREATE TABLE IF NOT EXISTS members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        nim VARCHAR(50) NOT NULL,
        fakultas VARCHAR(100) NOT NULL,
        jurusan VARCHAR(100) NOT NULL
      )
    `);

    // Prepopulate default members if table is empty
    const membersCount = await client.query('SELECT COUNT(*) FROM members');
    if (parseInt(membersCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO members (name, nim, fakultas, jurusan) VALUES
        ('Ahmad Fauzi', '120120001', 'Fakultas Teknik', 'Teknik Informatika'),
        ('Budi Santoso', '120120002', 'Fakultas Ekonomi', 'Manajemen'),
        ('Citra Lestari', '120120003', 'Fakultas Hukum', 'Ilmu Hukum'),
        ('Dewi Sartika', '120120004', 'Fakultas Ilmu Budaya', 'Sastra Indonesia'),
        ('Eko Prasetyo', '120120005', 'Fakultas Ilmu Sosial', 'Sosiologi')
      `);
    }

    // 4. Attendance table
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        nim VARCHAR(50) NOT NULL,
        fakultas VARCHAR(100) NOT NULL,
        jurusan VARCHAR(100) NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL,
        status VARCHAR(20) NOT NULL
      )
    `);

    await client.query('COMMIT');
    console.log('Tabel PostgreSQL berhasil diinisialisasi pada database Neon.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Gagal menginisialisasi tabel PostgreSQL:', err);
  } finally {
    client.release();
  }
}

// --- LOCAL JSON FALLBACK SETUP ---

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function initJSONDB() {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    const defaultData = {
      admin: {
        username: 'admin',
        passwordHash: hashPassword('admin123')
      },
      config: {
        cutoffTime: '08:00'
      },
      members: [
        { name: 'Ahmad Fauzi', nim: '120120001', fakultas: 'Fakultas Teknik', jurusan: 'Teknik Informatika' },
        { name: 'Budi Santoso', nim: '120120002', fakultas: 'Fakultas Ekonomi', jurusan: 'Manajemen' },
        { name: 'Citra Lestari', nim: '120120003', fakultas: 'Fakultas Hukum', jurusan: 'Ilmu Hukum' },
        { name: 'Dewi Sartika', nim: '120120004', fakultas: 'Fakultas Ilmu Budaya', jurusan: 'Sastra Indonesia' },
        { name: 'Eko Prasetyo', nim: '120120005', fakultas: 'Fakultas Ilmu Sosial', jurusan: 'Sosiologi' }
      ],
      attendance: []
    };
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

function readJSONDB() {
  initJSONDB();
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    const parsed = JSON.parse(data);
    
    // Migrasi data lama (jika array members berupa string)
    if (parsed.members && parsed.members.length > 0 && typeof parsed.members[0] === 'string') {
      parsed.members = parsed.members.map((name, i) => ({
        name,
        nim: `12012000${i+1}`,
        fakultas: 'Fakultas Teknik',
        jurusan: 'Sistem Informasi'
      }));
      fs.writeFileSync(dbPath, JSON.stringify(parsed, null, 2), 'utf8');
    }
    return parsed;
  } catch (err) {
    console.error('Error membaca JSON db:', err);
    return { admin: {}, config: {}, members: [], attendance: [] };
  }
}

function writeJSONDB(data) {
  initJSONDB();
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error menulis ke JSON db:', err);
    return false;
  }
}

// --- DUAL DATABASE API INTERFACE ---

module.exports = {
  hashPassword,

  // Get Members list
  getMembers: async () => {
    if (usePostgres) {
      try {
        const res = await pgPool.query('SELECT * FROM members ORDER BY name ASC');
        return res.rows;
      } catch (err) {
        console.error('Error getMembers dari PG:', err);
        return [];
      }
    } else {
      const db = readJSONDB();
      return db.members || [];
    }
  },

  // Add Member Profile
  addMember: async (member) => {
    const { name, nim, fakultas, jurusan } = member;
    const cleanName = name.trim();
    if (!cleanName) return { success: false, message: 'Nama tidak boleh kosong' };
    
    if (usePostgres) {
      try {
        // Check conflict
        const check = await pgPool.query('SELECT name FROM members WHERE name = $1', [cleanName]);
        if (check.rows.length > 0) {
          return { success: false, message: 'Anggota sudah terdaftar' };
        }
        await pgPool.query(
          'INSERT INTO members (name, nim, fakultas, jurusan) VALUES ($1, $2, $3, $4)',
          [cleanName, nim, fakultas, jurusan]
        );
        const all = await pgPool.query('SELECT * FROM members ORDER BY name ASC');
        return { success: true, members: all.rows };
      } catch (err) {
        console.error('Error addMember ke PG:', err);
        return { success: false, message: 'Database error' };
      }
    } else {
      const db = readJSONDB();
      const exists = db.members.some(m => m.name.toLowerCase() === cleanName.toLowerCase());
      if (exists) {
        return { success: false, message: 'Anggota sudah terdaftar' };
      }
      db.members.push({ name: cleanName, nim, fakultas, jurusan });
      db.members.sort((a, b) => a.name.localeCompare(b.name));
      writeJSONDB(db);
      return { success: true, members: db.members };
    }
  },

  // Delete Member
  deleteMember: async (name) => {
    if (usePostgres) {
      try {
        await pgPool.query('DELETE FROM members WHERE name = $1', [name]);
        const all = await pgPool.query('SELECT * FROM members ORDER BY name ASC');
        return { success: true, members: all.rows };
      } catch (err) {
        console.error('Error deleteMember dari PG:', err);
        return { success: false, message: 'Database error' };
      }
    } else {
      const db = readJSONDB();
      const index = db.members.findIndex(m => m.name === name);
      if (index === -1) {
        return { success: false, message: 'Anggota tidak ditemukan' };
      }
      db.members.splice(index, 1);
      writeJSONDB(db);
      return { success: true, members: db.members };
    }
  },

  // Get Cutoff Config
  getConfig: async () => {
    if (usePostgres) {
      try {
        const res = await pgPool.query("SELECT value FROM config WHERE key = 'cutoffTime'");
        return { cutoffTime: res.rows[0]?.value || '08:00' };
      } catch (err) {
        console.error('Error getConfig dari PG:', err);
        return { cutoffTime: '08:00' };
      }
    } else {
      return readJSONDB().config || { cutoffTime: '08:00' };
    }
  },

  // Update Config
  updateConfig: async (newCutoff) => {
    if (usePostgres) {
      try {
        await pgPool.query("UPDATE config SET value = $1 WHERE key = 'cutoffTime'", [newCutoff]);
        return { success: true, config: { cutoffTime: newCutoff } };
      } catch (err) {
        console.error('Error updateConfig PG:', err);
        return { success: false, message: 'Database error' };
      }
    } else {
      const db = readJSONDB();
      db.config.cutoffTime = newCutoff;
      writeJSONDB(db);
      return { success: true, config: db.config };
    }
  },

  // Get All Attendance Logs
  getAttendance: async () => {
    if (usePostgres) {
      try {
        const res = await pgPool.query('SELECT * FROM attendance ORDER BY timestamp DESC');
        return res.rows;
      } catch (err) {
        console.error('Error getAttendance dari PG:', err);
        return [];
      }
    } else {
      return readJSONDB().attendance || [];
    }
  },

  // Submit Attendance Record
  addAttendance: async (record) => {
    const { name, nim, fakultas, jurusan } = record;
    if (!name || !nim || !fakultas || !jurusan) {
      return { success: false, message: 'Semua field (Nama, NIM, Fakultas, Jurusan) harus diisi' };
    }

    // Determine status (Hadir vs Telat)
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const [nowHour, nowMin] = formatter.format(now).split(/[.:]/);
    const nowTimeVal = parseInt(nowHour) * 60 + parseInt(nowMin);

    let cutoffTime = '08:00';
    
    // Check if already attended today (by name and date in Jakarta time)
    const todayStr = now.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });

    if (usePostgres) {
      try {
        // Get Cutoff
        const cfg = await pgPool.query("SELECT value FROM config WHERE key = 'cutoffTime'");
        cutoffTime = cfg.rows[0]?.value || '08:00';

        // Check duplicate
        // PostgreSQL query checking name and date of timestamp casted to Jakarta timezone
        const check = await pgPool.query(`
          SELECT id FROM attendance 
          WHERE name = $1 AND DATE(timestamp AT TIME ZONE 'Asia/Jakarta') = DATE($2 AT TIME ZONE 'Asia/Jakarta')
        `, [name, now.toISOString()]);

        if (check.rows.length > 0) {
          return { success: false, message: 'Anda sudah mengisi absen hari ini!' };
        }
      } catch (err) {
        console.error('Error checking duplicate/cutoff in PG:', err);
        return { success: false, message: 'Database error' };
      }
    } else {
      const db = readJSONDB();
      cutoffTime = db.config.cutoffTime;
      const alreadyAttended = db.attendance.some(att => {
        const attDate = new Date(att.timestamp).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });
        return att.name === name && attDate === todayStr;
      });

      if (alreadyAttended) {
        return { success: false, message: 'Anda sudah mengisi absen hari ini!' };
      }
    }

    const [cutoffHour, cutoffMin] = cutoffTime.split(':');
    const cutoffTimeVal = parseInt(cutoffHour) * 60 + parseInt(cutoffMin);

    let status = 'Hadir';
    if (nowTimeVal > cutoffTimeVal) {
      status = 'Telat';
    }

    const newRecord = {
      id: crypto.randomUUID(),
      name,
      nim,
      fakultas,
      jurusan,
      timestamp: now.toISOString(),
      status
    };

    if (usePostgres) {
      try {
        await pgPool.query(`
          INSERT INTO attendance (id, name, nim, fakultas, jurusan, timestamp, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [newRecord.id, newRecord.name, newRecord.nim, newRecord.fakultas, newRecord.jurusan, newRecord.timestamp, newRecord.status]);
        return { success: true, record: newRecord };
      } catch (err) {
        console.error('Error insert attendance ke PG:', err);
        return { success: false, message: 'Database error' };
      }
    } else {
      const db = readJSONDB();
      db.attendance.push(newRecord);
      writeJSONDB(db);
      return { success: true, record: newRecord };
    }
  },

  // Clear Attendance records
  clearAttendance: async () => {
    if (usePostgres) {
      try {
        await pgPool.query('DELETE FROM attendance');
        return { success: true };
      } catch (err) {
        console.error('Error clearAttendance dari PG:', err);
        return { success: false };
      }
    } else {
      const db = readJSONDB();
      db.attendance = [];
      writeJSONDB(db);
      return { success: true };
    }
  },

  // Admin login check
  verifyAdmin: async (username, password) => {
    const hash = hashPassword(password);
    if (usePostgres) {
      try {
        const res = await pgPool.query('SELECT id FROM admin WHERE username = $1 AND password_hash = $2', [username, hash]);
        return res.rows.length > 0;
      } catch (err) {
        console.error('Error verifyAdmin di PG:', err);
        return false;
      }
    } else {
      const db = readJSONDB();
      return db.admin.username === username && db.admin.passwordHash === hash;
    }
  },

  // Update Admin Password
  updateAdminPassword: async (newPassword) => {
    const hash = hashPassword(newPassword);
    if (usePostgres) {
      try {
        await pgPool.query("UPDATE admin SET password_hash = $1 WHERE username = 'admin'", [hash]);
        return { success: true };
      } catch (err) {
        console.error('Error updateAdminPassword di PG:', err);
        return { success: false };
      }
    } else {
      const db = readJSONDB();
      db.admin.passwordHash = hash;
      writeJSONDB(db);
      return { success: true };
    }
  }
};
