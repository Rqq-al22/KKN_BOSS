document.addEventListener('DOMContentLoaded', () => {
  // Sections
  const loginSection = document.getElementById('loginSection');
  const dashboardSection = document.getElementById('dashboardSection');

  // Login Form elements
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const loginAlert = document.getElementById('loginAlert');

  // General elements
  const logoutBtn = document.getElementById('logoutBtn');
  const adminAlert = document.getElementById('adminAlert');
  const navItems = document.querySelectorAll('.admin-nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');

  // Stats Card elements
  const statTotalMembers = document.getElementById('statTotalMembers');
  const statHadir = document.getElementById('statHadir');
  const statTelat = document.getElementById('statTelat');
  const statAbsent = document.getElementById('statAbsent');
  const summaryCutoffTime = document.getElementById('summaryCutoffTime');

  // Tab 2 (Anggota KKN) elements
  const addMemberForm = document.getElementById('addMemberForm');
  const newMemberName = document.getElementById('newMemberName');
  const newMemberNim = document.getElementById('newMemberNim');
  const newMemberFakultas = document.getElementById('newMemberFakultas');
  const newMemberJurusan = document.getElementById('newMemberJurusan');
  const bulkMemberForm = document.getElementById('bulkMemberForm');
  const bulkNamesInput = document.getElementById('bulkNames');
  const activeMembersCount = document.getElementById('activeMembersCount');
  const adminMembersContainer = document.getElementById('adminMembersContainer');

  // Tab 3 (Laporan/Logs) elements
  const logSearch = document.getElementById('logSearch');
  const statusFilter = document.getElementById('statusFilter');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const quickExportBtn = document.getElementById('quickExportBtn');
  const clearLogsBtn = document.getElementById('clearLogsBtn');
  const quickClearBtn = document.getElementById('quickClearBtn');
  const attendanceTableBody = document.getElementById('attendanceTableBody');

  // Tab 4 (Settings) elements
  const settingsConfigForm = document.getElementById('settingsConfigForm');
  const settingsCutoffTime = document.getElementById('settingsCutoffTime');
  const settingsPasswordForm = document.getElementById('settingsPasswordForm');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');

  // Application Data States
  let token = localStorage.getItem('adminToken') || '';
  let members = [];
  let attendanceLogs = [];
  let currentConfig = { cutoffTime: '08:00' };

  // --- AUTHENTICATION & INITIALIZATION ---

  // Check login state
  async function checkAuth() {
    if (!token) {
      showLogin();
      return;
    }
    try {
      const response = await fetch('/api/auth/verify', {
        headers: { 'Authorization': token }
      });
      if (response.ok) {
        showDashboard();
      } else {
        localStorage.removeItem('adminToken');
        token = '';
        showLogin();
      }
    } catch (err) {
      console.error('Error verifying auth token:', err);
      // Offline fallback: hide dashboard, allow re-login
      showLogin();
    }
  }

  function showLogin() {
    loginSection.style.display = 'block';
    dashboardSection.style.display = 'none';
  }

  function showDashboard() {
    loginSection.style.display = 'none';
    dashboardSection.style.display = 'flex';
    initDashboard();
  }

  // Handle Login form
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginAlert.style.display = 'none';
    loginBtn.disabled = true;
    loginBtn.textContent = 'Mencoba Masuk...';

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        token = data.token;
        localStorage.setItem('adminToken', token);
        loginForm.reset();
        showDashboard();
      } else {
        loginAlert.textContent = data.message || 'Login gagal';
        loginAlert.style.display = 'flex';
      }
    } catch (err) {
      console.error('Login request failed:', err);
      loginAlert.textContent = 'Gagal menghubungi server.';
      loginAlert.style.display = 'flex';
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Login';
    }
  });

  // Handle Logout
  logoutBtn.addEventListener('click', async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': token }
      });
    } catch (err) {
      console.error('Error logging out:', err);
    } finally {
      localStorage.removeItem('adminToken');
      token = '';
      showLogin();
    }
  });

  // --- ADMIN SYSTEM LOGIC ---

  // Load dashboard data
  async function initDashboard() {
    await fetchConfig();
    await fetchMembers();
    await fetchAttendanceLogs();
    calculateStats();
  }

  // Helper Alerts
  function showAdminAlert(type, message) {
    adminAlert.textContent = message;
    adminAlert.className = `alert ${type}`;
    adminAlert.style.display = 'flex';
    setTimeout(() => {
      adminAlert.style.display = 'none';
    }, 4000);
  }

  // 1. Fetch Config
  async function fetchConfig() {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      if (data.success) {
        currentConfig = data.config;
        summaryCutoffTime.textContent = currentConfig.cutoffTime;
        settingsCutoffTime.value = currentConfig.cutoffTime;
      }
    } catch (err) {
      console.error('Gagal fetch config:', err);
    }
  }

  // 2. Fetch Members list
  async function fetchMembers() {
    try {
      const response = await fetch('/api/members');
      const data = await response.json();
      if (data.success) {
        members = data.members;
        activeMembersCount.textContent = members.length;
        renderAdminMembers();
      }
    } catch (err) {
      console.error('Gagal fetch members:', err);
    }
  }

  // 3. Fetch Attendance Logs
  async function fetchAttendanceLogs() {
    try {
      const response = await fetch('/api/attendance', {
        headers: { 'Authorization': token }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          attendanceLogs = data.attendance;
          renderAttendanceTable();
        }
      }
    } catch (err) {
      console.error('Gagal fetch attendance logs:', err);
    }
  }

  // 4. Render Member management tab items
  function renderAdminMembers() {
    adminMembersContainer.innerHTML = '';
    if (members.length === 0) {
      adminMembersContainer.innerHTML = '<div style="padding: 20px; color: var(--text-secondary); text-align: center; font-size: 13px;">Belum ada anggota terdaftar.</div>';
      return;
    }

    members.forEach(member => {
      const row = document.createElement('div');
      row.className = 'member-item';
      row.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <span style="font-weight: 600; color: var(--text-primary);">${member.name}</span>
          <span style="font-size: 11px; color: var(--text-secondary);">${member.nim} - ${member.fakultas} (${member.jurusan})</span>
        </div>
        <button class="btn-delete-member" data-name="${member.name}" title="Hapus Anggota">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      `;

      row.querySelector('.btn-delete-member').addEventListener('click', () => {
        deleteMember(member.name);
      });

      adminMembersContainer.appendChild(row);
    });
  }

  // 5. Calculate statistics for today
  function calculateStats() {
    // Current date in Jakarta timezone (YYYY-MM-DD)
    const todayStr = new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });
    
    // Total members
    const totalCount = members.length;
    statTotalMembers.textContent = totalCount;

    // Filter today's attendance logs
    const todayLogs = attendanceLogs.filter(log => {
      const logDate = new Date(log.timestamp).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });
      return logDate === todayStr;
    });

    const onTimeCount = todayLogs.filter(log => log.status === 'Hadir').length;
    const lateCount = todayLogs.filter(log => log.status === 'Telat').length;
    const absentCount = Math.max(0, totalCount - todayLogs.length);

    statHadir.textContent = onTimeCount;
    statTelat.textContent = lateCount;
    statAbsent.textContent = absentCount;
  }

  // 6. Add Member (Single)
  addMemberForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = newMemberName.value.trim();
    const nim = newMemberNim.value.trim();
    const fakultas = newMemberFakultas.value.trim();
    const jurusan = newMemberJurusan.value.trim();

    if (!name || !nim || !fakultas || !jurusan) {
      alert('Semua data profil harus diisi!');
      return;
    }

    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ name, nim, fakultas, jurusan })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        showAdminAlert('success', `Berhasil mendaftarkan anggota KKN: ${name}`);
        addMemberForm.reset();
        await initDashboard();
      } else {
        showAdminAlert('error', data.message || 'Gagal menambahkan anggota');
      }
    } catch (err) {
      console.error(err);
      showAdminAlert('error', 'Gagal menghubungi server.');
    }
  });

  // 7. Add Members (Bulk)
  bulkMemberForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawLines = bulkNamesInput.value.trim();
    if (!rawLines) return;

    // Split on newlines, clean empty ones
    const lines = rawLines.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;

    let successCount = 0;
    let failCount = 0;
    
    // Use a loader button state
    const submitBtn = bulkMemberForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengimpor Data...';

    // Call API sequentially
    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length < 4) {
        failCount++;
        continue;
      }
      
      const [name, nim, fakultas, jurusan] = parts;

      try {
        const response = await fetch('/api/members', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          },
          body: JSON.stringify({ name, nim, fakultas, jurusan })
        });
        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        failCount++;
      }
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Import Anggota';
    bulkNamesInput.value = '';

    showAdminAlert(
      failCount === 0 ? 'success' : 'error',
      `Impor selesai! Berhasil: ${successCount}, Gagal: ${failCount}`
    );
    await initDashboard();
  });

  // 8. Delete Member
  async function deleteMember(name) {
    if (!confirm(`Apakah Anda yakin ingin menghapus anggota "${name}" dari daftar?`)) {
      return;
    }

    try {
      const response = await fetch('/api/members', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ name })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        showAdminAlert('success', `Berhasil menghapus anggota KKN: ${name}`);
        await initDashboard();
      } else {
        showAdminAlert('error', data.message || 'Gagal menghapus anggota');
      }
    } catch (err) {
      console.error(err);
      showAdminAlert('error', 'Gagal menghubungi server.');
    }
  }

  // 9. Render logs table with current filter and search criteria
  function renderAttendanceTable() {
    attendanceTableBody.innerHTML = '';
    const searchQuery = logSearch.value.toLowerCase().trim();
    const filterVal = statusFilter.value;

    // Filter items
    const filteredLogs = attendanceLogs.filter(log => {
      const matchSearch = log.name.toLowerCase().includes(searchQuery) ||
                          log.nim.toLowerCase().includes(searchQuery) ||
                          log.fakultas.toLowerCase().includes(searchQuery) ||
                          (log.jurusan && log.jurusan.toLowerCase().includes(searchQuery));

      const matchStatus = filterVal === 'ALL' || log.status === filterVal;

      return matchSearch && matchStatus;
    });

    if (filteredLogs.length === 0) {
      attendanceTableBody.innerHTML = `
        <tr>
          <td colspan="8" class="empty-state">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 12px; display: block;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M9 10.5h.008v.008H9V10.5zm6 0h.008v.008H15V10.5zm1.25-5.25h-8.5A2.25 2.25 0 005.25 7.5v11.5A2.25 2.25 0 007.5 21.25h9a2.25 2.25 0 002.25-2.25V7.5a2.25 2.25 0 00-2.25-2.25z" />
            </svg>
            Rekap absensi tidak ditemukan.
          </td>
        </tr>
      `;
      return;
    }

    filteredLogs.forEach((log, index) => {
      const dateObj = new Date(log.timestamp);
      // Format Date: DD/MM/YYYY
      const dateStr = dateObj.toLocaleDateString('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      // Format Time: HH.MM.SS WIB
      const timeStr = dateObj.toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) + ' WIB';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${dateStr}</td>
        <td style="font-weight:600; color:var(--text-primary);">${log.name}</td>
        <td>${log.nim}</td>
        <td>${log.fakultas}</td>
        <td>${log.jurusan || '-'}</td>
        <td>${timeStr}</td>
        <td><span class="badge ${log.status.toLowerCase()}">${log.status}</span></td>
      `;
      attendanceTableBody.appendChild(tr);
    });
  }

  // Listeners for filter/search logs
  logSearch.addEventListener('input', renderAttendanceTable);
  statusFilter.addEventListener('change', renderAttendanceTable);

  // 10. Reset/Clear logs
  async function clearLogs() {
    if (!confirm('PERINGATAN: Apakah Anda yakin ingin menghapus seluruh log kehadiran? Tindakan ini tidak dapat dibatalkan!')) {
      return;
    }

    try {
      const response = await fetch('/api/attendance/clear', {
        method: 'DELETE',
        headers: { 'Authorization': token }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        showAdminAlert('success', data.message);
        await initDashboard();
      } else {
        showAdminAlert('error', data.message || 'Gagal menghapus logs.');
      }
    } catch (err) {
      console.error(err);
      showAdminAlert('error', 'Gagal menghubungi server.');
    }
  }

  clearLogsBtn.addEventListener('click', clearLogs);
  quickClearBtn.addEventListener('click', clearLogs);

  // 11. Settings - Cutoff Config Form
  settingsConfigForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cutoffTime = settingsCutoffTime.value;

    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ cutoffTime })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        showAdminAlert('success', 'Batas jam absen harian berhasil disimpan!');
        await initDashboard();
      } else {
        showAdminAlert('error', data.message || 'Gagal menyimpan konfigurasi.');
      }
    } catch (err) {
      console.error(err);
      showAdminAlert('error', 'Gagal menghubungi server.');
    }
  });

  // 12. Settings - Password Change Form
  settingsPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (newPassword !== confirmPassword) {
      showAdminAlert('error', 'Konfirmasi password tidak cocok!');
      return;
    }

    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ newPassword })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        showAdminAlert('success', 'Password admin berhasil diubah!');
        settingsPasswordForm.reset();
      } else {
        showAdminAlert('error', data.message || 'Gagal mengubah password.');
      }
    } catch (err) {
      console.error(err);
      showAdminAlert('error', 'Gagal menghubungi server.');
    }
  });

  // 13. Export Logs to CSV File (Client-side generation)
  function exportToCsv() {
    if (attendanceLogs.length === 0) {
      alert('Tidak ada data kehadiran untuk diekspor.');
      return;
    }

    // CSV Headers
    let csvContent = '\uFEFF'; // Add BOM for Excel UTF-8 support
    csvContent += 'No,Tanggal,Nama Lengkap,NIM,Fakultas,Jurusan,Jam Absen,Status\n';

    attendanceLogs.forEach((log, index) => {
      const dateObj = new Date(log.timestamp);
      const dateStr = dateObj.toLocaleDateString('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const timeStr = dateObj.toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // Escape quotes in values for CSV safety
      const cleanName = `"${log.name.replace(/"/g, '""')}"`;
      const cleanNim = `"${log.nim.replace(/"/g, '""')}"`;
      const cleanFaculty = `"${log.fakultas.replace(/"/g, '""')}"`;
      const cleanJurusan = `"${(log.jurusan || '').replace(/"/g, '""')}"`;

      csvContent += `${index + 1},${dateStr},${cleanName},${cleanNim},${cleanFaculty},${cleanJurusan},${timeStr},${log.status}\n`;
    });

    // Create Download Link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Generate date string for filename
    const now = new Date();
    const dateFilename = now.toISOString().split('T')[0];

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rekap_Kehadiran_KKN_${dateFilename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportCsvBtn.addEventListener('click', exportToCsv);
  quickExportBtn.addEventListener('click', exportToCsv);

  // --- GENERAL TAB SWITCHING ---
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');
      if (!tabId) return; // Ignore on non-tab buttons

      // Set active nav
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Show active tab
      tabPanes.forEach(pane => {
        if (pane.id === tabId) {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      });
    });
  });

  // Run Auth Check
  checkAuth();
});
