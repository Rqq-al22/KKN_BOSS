document.addEventListener('DOMContentLoaded', () => {
  const membersProfileGrid = document.getElementById('membersProfileGrid');

  // Fetch and display members profile cards
  async function fetchAndRenderProfiles() {
    try {
      const response = await fetch('/api/members');
      const data = await response.json();

      if (data.success) {
        renderProfiles(data.members);
      } else {
        membersProfileGrid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--danger);">
            Gagal memuat profil anggota: ${data.message}
          </div>
        `;
      }
    } catch (err) {
      console.error('Error fetching member profiles:', err);
      membersProfileGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--danger);">
          Gagal menghubungi server untuk memuat profil.
        </div>
      `;
    }
  }

  function getInitials(name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return '?';
    
    const first = parts[0].charAt(0).toUpperCase();
    if (parts.length > 1) {
      const second = parts[parts.length - 1].charAt(0).toUpperCase();
      return first + second;
    }
    return first;
  }

  function renderProfiles(members) {
    membersProfileGrid.innerHTML = '';
    
    if (members.length === 0) {
      membersProfileGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary); background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 16px;">
          Belum ada profil anggota terdaftar. Admin dapat menambahkannya dari Dashboard Admin.
        </div>
      `;
      return;
    }

    members.forEach(member => {
      const initials = getInitials(member.name);
      
      const card = document.createElement('div');
      card.className = 'profile-card';
      card.innerHTML = `
        <div class="profile-avatar">${initials}</div>
        <div class="profile-name">${member.name}</div>
        <div class="profile-nim">${member.nim}</div>
        
        <div class="profile-details-list">
          <div class="profile-detail-item">
            <strong>Fakultas</strong>
            <span>${member.fakultas}</span>
          </div>
          <div class="profile-detail-item">
            <strong>Jurusan / Prodi</strong>
            <span>${member.jurusan}</span>
          </div>
        </div>
      `;
      membersProfileGrid.appendChild(card);
    });
  }

  fetchAndRenderProfiles();
});
