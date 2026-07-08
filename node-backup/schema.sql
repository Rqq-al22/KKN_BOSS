-- Skema Tabel Database PostgreSQL (Neon Website)
-- Catatan: Aplikasi akan membuat tabel-tabel ini secara otomatis saat dijalankan pertama kali.
-- Berkas ini disediakan untuk referensi struktur tabel Anda.

-- 1. Tabel Administrator
CREATE TABLE IF NOT EXISTS admin (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL
);

-- Inisialisasi password default: admin123
INSERT INTO admin (username, password_hash)
VALUES ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9')
ON CONFLICT (username) DO NOTHING;

-- 2. Tabel Konfigurasi Batas Absensi
CREATE TABLE IF NOT EXISTS config (
    key VARCHAR(50) PRIMARY KEY,
    value VARCHAR(256) NOT NULL
);

-- Inisialisasi batas waktu absensi default: 08:00 WIB
INSERT INTO config (key, value)
VALUES ('cutoffTime', '08:00')
ON CONFLICT (key) DO NOTHING;

-- 3. Tabel Daftar Profil Anggota KKN
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    nim VARCHAR(50) NOT NULL,
    fakultas VARCHAR(100) NOT NULL,
    jurusan VARCHAR(100) NOT NULL
);

-- 4. Tabel Log Rekapitulasi Kehadiran
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    nim VARCHAR(50) NOT NULL,
    fakultas VARCHAR(100) NOT NULL,
    jurusan VARCHAR(100) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL
);
