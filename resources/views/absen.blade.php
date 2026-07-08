<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Presensi Kehadiran KKN 2026</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>

  <div class="container" style="animation: fadeIn 0.6s ease-out;">
    <h1>Presensi Anggota KKN</h1>
    <p class="subtitle">Silakan pilih nama Anda dan masukkan NIM, Fakultas, serta Jurusan untuk mencatat kehadiran hari ini.</p>

    <!-- Time & Deadline Display -->
    <div class="time-display">
      <div id="liveClock" class="time-clock">00:00:00</div>
      <div id="liveDate" class="time-date">Memuat waktu...</div>
      <div id="cutoffBadge" class="cutoff-badge">Batas Absen: Memuat...</div>
    </div>

    <!-- Attendance Form -->
    <form id="attendanceForm">
      
      <!-- Custom Searchable Dropdown for Member Name -->
      <div class="form-group">
        <label for="memberNameSearch">Nama Anggota KKN</label>
        <div class="search-select-container">
          <input type="text" id="memberNameSearch" placeholder="Cari atau pilih nama..." autocomplete="off" required>
          <input type="hidden" id="selectedName" name="name" required>
          
          <!-- Dropdown Options List -->
          <div id="dropdownList" class="member-list" style="display: none; position: absolute; width: 100%; z-index: 10; background: #1e1b4b; border: 1px solid var(--glass-border); border-top: none; max-height: 200px; overflow-y: auto;">
            <!-- Options populated by JS -->
          </div>
        </div>
      </div>

      <!-- NIM Input -->
      <div class="form-group">
        <label for="studentNim">NIM (Nomor Induk Mahasiswa)</label>
        <input type="text" id="studentNim" name="nim" placeholder="Masukkan NIM Anda..." required>
      </div>

      <!-- Fakultas Input -->
      <div class="form-group">
        <label for="faculty">Fakultas</label>
        <input type="text" id="faculty" name="fakultas" placeholder="Masukkan Fakultas Anda..." required>
      </div>

      <!-- Jurusan Input -->
      <div class="form-group">
        <label for="studentJurusan">Jurusan / Program Studi</label>
        <input type="text" id="studentJurusan" name="jurusan" placeholder="Masukkan Jurusan Anda..." required>
      </div>

      <!-- Submit Button -->
      <button type="submit" id="submitBtn" class="btn-submit">Kirim Kehadiran</button>
    </form>

    <!-- Navigation shortcut -->
    <div class="admin-shortcut" style="display: flex; justify-content: space-between; margin-top: 24px;">
      <a href="index.html">&larr; Beranda Profil</a>
      <a href="admin.html">Kelola Absensi (Admin) &rarr;</a>
    </div>
  </div>

  <footer>
    &copy; 2026 KKN Mandiri Reguler. Made with &hearts;
  </footer>

  <!-- Modal Result Popup -->
  <div id="resultModal" class="modal-overlay">
    <div class="modal">
      <div id="modalIcon" class="modal-icon success">&#10004;</div>
      <div id="modalTitle" class="modal-title">Absen Berhasil!</div>
      <div id="modalMessage" class="modal-message">Kehadiran Anda telah berhasil dicatat pada sistem.</div>
      
      <div class="modal-details">
        <p>Nama: <span id="resName">-</span></p>
        <p>NIM: <span id="resNim">-</span></p>
        <p>Fakultas: <span id="resFaculty">-</span></p>
        <p>Jurusan: <span id="resJurusan">-</span></p>
        <p>Waktu: <span id="resTime">-</span></p>
        <p>Status: <span id="resStatus">-</span></p>
      </div>

      <button id="closeModalBtn" class="btn-close-modal">Selesai</button>
    </div>
  </div>

  <script src="js/app.js"></script>
</body>
</html>
