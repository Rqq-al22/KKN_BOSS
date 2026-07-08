document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const liveClock = document.getElementById('liveClock');
  const liveDate = document.getElementById('liveDate');
  const cutoffBadge = document.getElementById('cutoffBadge');
  const attendanceForm = document.getElementById('attendanceForm');
  const nameSearchInput = document.getElementById('memberNameSearch');
  const selectedNameInput = document.getElementById('selectedName');
  const dropdownList = document.getElementById('dropdownList');
  const nimInput = document.getElementById('studentNim');
  const facultyInput = document.getElementById('faculty');
  const jurusanInput = document.getElementById('studentJurusan');
  const submitBtn = document.getElementById('submitBtn');

  // Modal Elements
  const resultModal = document.getElementById('resultModal');
  const modalIcon = document.getElementById('modalIcon');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const resName = document.getElementById('resName');
  const resNim = document.getElementById('resNim');
  const resFaculty = document.getElementById('resFaculty');
  const resJurusan = document.getElementById('resJurusan');
  const resTime = document.getElementById('resTime');
  const resStatus = document.getElementById('resStatus');
  const closeModalBtn = document.getElementById('closeModalBtn');

  let membersList = [];

  // 1. Live Clock & Date in Jakarta/WIB Time
  function updateTime() {
    const now = new Date();
    
    // Formatting time
    const timeOptions = {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    liveClock.textContent = new Intl.DateTimeFormat('id-ID', timeOptions).format(now).replace(/\./g, ':');

    // Formatting date
    const dateOptions = {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    liveDate.textContent = new Intl.DateTimeFormat('id-ID', dateOptions).format(now);
  }
  updateTime();
  setInterval(updateTime, 1000);

  // 2. Fetch Config & Cutoff Time
  async function fetchConfig() {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      if (data.success) {
        cutoffBadge.textContent = `Batas Absen: ${data.config.cutoffTime} WIB`;
      }
    } catch (err) {
      console.error('Gagal mengambil konfigurasi waktu batas:', err);
      cutoffBadge.textContent = 'Batas Absen: Error';
    }
  }

  // 3. Fetch Members list for Custom Dropdown
  async function fetchMembers() {
    try {
      const response = await fetch('/api/members');
      const data = await response.json();
      if (data.success) {
        membersList = data.members;
        renderDropdown(membersList);
      }
    } catch (err) {
      console.error('Gagal mengambil daftar anggota:', err);
    }
  }

  // 4. Render Custom Dropdown Options
  function renderDropdown(list) {
    dropdownList.innerHTML = '';
    if (list.length === 0) {
      dropdownList.innerHTML = '<div style="padding: 12px; color: var(--text-secondary); text-align: center; font-size: 13px;">Anggota tidak ditemukan</div>';
      return;
    }

    list.forEach(member => {
      const optionDiv = document.createElement('div');
      optionDiv.className = 'member-item';
      optionDiv.style.cursor = 'pointer';
      optionDiv.innerHTML = `<span class="member-item-name">${member.name}</span>`;
      
      optionDiv.addEventListener('mousedown', (e) => {
        // Prevent input blur before selecting
        e.preventDefault();
        selectMember(member);
      });

      dropdownList.appendChild(optionDiv);
    });
  }

  // Select Member from list
  function selectMember(member) {
    nameSearchInput.value = member.name;
    selectedNameInput.value = member.name;
    nimInput.value = member.nim;
    facultyInput.value = member.fakultas;
    jurusanInput.value = member.jurusan;
    dropdownList.style.display = 'none';
  }

  // Dropdown filtering and interactivity
  nameSearchInput.addEventListener('focus', () => {
    filterMembers();
    dropdownList.style.display = 'block';
  });

  nameSearchInput.addEventListener('blur', () => {
    // If the input value doesn't match the selected value, clear it
    setTimeout(() => {
      if (nameSearchInput.value !== selectedNameInput.value) {
        // Find if there is a partial match or reset
        const exactMatch = membersList.find(m => m.name.toLowerCase() === nameSearchInput.value.trim().toLowerCase());
        if (exactMatch) {
          selectMember(exactMatch);
        } else {
          nameSearchInput.value = '';
          selectedNameInput.value = '';
          nimInput.value = '';
          facultyInput.value = '';
          jurusanInput.value = '';
        }
      }
      dropdownList.style.display = 'none';
    }, 200);
  });

  nameSearchInput.addEventListener('input', () => {
    selectedNameInput.value = ''; // Reset selection on typing
    filterMembers();
  });

  function filterMembers() {
    const query = nameSearchInput.value.toLowerCase().trim();
    const filtered = membersList.filter(member => member.name.toLowerCase().includes(query));
    renderDropdown(filtered);
  }

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-select-container')) {
      dropdownList.style.display = 'none';
    }
  });

  // 5. Submit Form Handler
  attendanceForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = selectedNameInput.value;
    const nim = nimInput.value.trim();
    const fakultas = facultyInput.value.trim();
    const jurusan = jurusanInput.value.trim();

    if (!name) {
      alert('Silakan pilih nama Anda dari daftar!');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengirim...';

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, nim, fakultas, jurusan })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showSuccessModal(data.record);
        attendanceForm.reset();
        nameSearchInput.value = '';
        selectedNameInput.value = '';
      } else {
        showErrorModal(data.message || 'Gagal merekam absensi.');
      }
    } catch (err) {
      console.error('Error saat submit absensi:', err);
      showErrorModal('Koneksi internet bermasalah. Gagal menghubungi server.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Kirim Kehadiran';
    }
  });

  // 6. Modal Functions
  function showSuccessModal(record) {
    const timeFormatted = new Date(record.timestamp).toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + ' WIB';

    resName.textContent = record.name;
    resNim.textContent = record.nim;
    resFaculty.textContent = record.fakultas;
    resJurusan.textContent = record.jurusan;
    resTime.textContent = timeFormatted;
    
    // Status color rendering
    resStatus.className = ''; 
    if (record.status === 'Hadir') {
      modalIcon.className = 'modal-icon success';
      modalIcon.innerHTML = '&#10004;';
      modalTitle.textContent = 'Absen Berhasil!';
      modalMessage.textContent = 'Kehadiran Anda telah berhasil dicatat tepat waktu pada hari ini.';
      resStatus.textContent = 'HADIR (Tepat Waktu)';
      resStatus.style.color = 'var(--success)';
    } else {
      modalIcon.className = 'modal-icon late';
      modalIcon.innerHTML = '&#9888;';
      modalTitle.textContent = 'Absen Telat!';
      modalMessage.textContent = 'Kehadiran Anda dicatat tetapi melewati batas waktu yang ditentukan.';
      resStatus.textContent = 'TELAT';
      resStatus.style.color = 'var(--danger)';
    }

    resultModal.classList.add('active');
  }

  function showErrorModal(message) {
    modalIcon.className = 'modal-icon error';
    modalIcon.innerHTML = '&#10008;';
    modalTitle.textContent = 'Gagal Absen!';
    modalMessage.textContent = message;
    
    resName.textContent = '-';
    resNim.textContent = '-';
    resFaculty.textContent = '-';
    resJurusan.textContent = '-';
    resTime.textContent = '-';
    resStatus.textContent = 'GAGAL';
    resStatus.style.color = 'var(--danger)';

    resultModal.classList.add('active');
  }

  closeModalBtn.addEventListener('click', () => {
    resultModal.classList.remove('active');
  });

  // Run initialization
  fetchConfig();
  fetchMembers();
});
