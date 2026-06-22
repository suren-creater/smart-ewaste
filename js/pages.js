// ═══════════════════════════════════════
// ECOWASTE — PAGE RENDERERS
// ═══════════════════════════════════════

const Pages = {};

// ── HOME ─────────────────────────────────────────
Pages.home = function() {};

// ── LOGIN ─────────────────────────────────────────
Pages.login = function() {
  document.getElementById('login-form')?.reset();
  hideAlert('login-alert');
};

// ── REGISTER ─────────────────────────────────────
Pages.register = function() {
  document.getElementById('register-form')?.reset();
  hideAlert('register-alert');
};

// ── USER DASHBOARD ───────────────────────────────
Pages.dashboard = function() {
  const user = Auth.require('user'); if (!user) return;
  const pickups  = DB.getPickupsByUser(user.id);
  const pending  = pickups.filter(p => p.status === 'Pending').length;
  const collected= pickups.filter(p => p.status === 'Collected').length;
  const products = DB.getProducts().filter(p => p.sellerId === user.id).length;

  setText('dash-name', user.name.split(' ')[0]);
  setText('stat-total',    pickups.length);
  setText('stat-pending',  pending);
  setText('stat-collected',collected);
  setText('stat-products', products);

  // Pending badge on sidebar
  const badge = document.getElementById('sb-pending-count');
  if (badge) { badge.textContent = pending || ''; badge.style.display = pending ? '' : 'none'; }

  // Recent pickups table
  const recent = pickups.slice().reverse().slice(0,5);
  const rows = recent.map(p => `<tr>
    <td><span style="font-size:1rem">${catIcon[p.category]||'♻️'}</span> ${p.item}</td>
    <td><span class="badge badge-blue">${p.category}</span></td>
    <td>${statusBadge(p.status)}</td>
    <td style="color:var(--text-muted);font-size:.8rem">${fmtDate(p.date)}</td>
  </tr>`).join('') || emptyRow(4, 'No pickup requests yet — schedule your first one!');
  setHTML('dash-recent-pickups', rows);
};

// ── PICKUP REQUEST ───────────────────────────────
Pages.pickup = function() {
  const user = Auth.require('user'); if (!user) return;
  document.getElementById('pickup-form')?.reset();
  hideAlert('pickup-alert');
};

// ── MY REQUESTS ──────────────────────────────────
Pages.myRequests = function() {
  const user = Auth.require('user'); if (!user) return;
  _myReqData = DB.getPickupsByUser(user.id).slice().reverse();
  _myReqPage = 1;
  // Reset filters
  const s = document.getElementById('req-search'); if(s) s.value='';
  const f = document.getElementById('req-status-filter'); if(f) f.value='';
  renderMyRequestsPage();
};

// ── MARKETPLACE ───────────────────────────────────
Pages.marketplace = function() {
  const q      = (document.getElementById('market-search')?.value || '').toLowerCase();
  const filter = document.getElementById('market-filter')?.value || '';
  const sort   = document.getElementById('market-sort')?.value || 'newest';

  let products = DB.getApprovedProducts().filter(p =>
    (!q      || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.description||'').toLowerCase().includes(q)) &&
    (!filter || p.category === filter)
  );

  if (sort === 'price-asc')  products.sort((a,b) => a.price - b.price);
  if (sort === 'price-desc') products.sort((a,b) => b.price - a.price);
  if (sort === 'newest')     products.reverse();

  _mktData = products;
  _mktPage = 1;
  renderMarketPage();
};

// ── SELL ITEM ─────────────────────────────────────
Pages.sell = function() {
  const user = Auth.require('user'); if (!user) return;
  document.getElementById('sell-form')?.reset();
  hideAlert('sell-alert');
};

// ── MY LISTINGS ───────────────────────────────────
Pages.myListings = function() {
  const user = Auth.require('user'); if (!user) return;
  const listings = DB.getProducts().filter(p => p.sellerId === user.id).slice().reverse();
  const rows = listings.map(p => `<tr>
    <td>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:1.1rem">${catIcon[p.category]||'♻️'}</span>
        <div style="font-weight:500;font-size:.875rem">${p.name}</div>
      </div>
    </td>
    <td><span class="badge badge-blue">${p.category}</span></td>
    <td style="color:var(--green-bright);font-weight:600">${fmtINR(p.price)}</td>
    <td><span class="badge badge-gray">${p.condition||'—'}</span></td>
    <td>${statusBadge(p.status)}</td>
    <td style="color:var(--text-muted);font-size:.8rem">${fmtDate(p.date)}</td>
    <td>
      <div style="display:flex;gap:6px">
        <button class="btn btn-ghost btn-sm" onclick="showProductModal(${p.id})">View</button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteMyListing(${p.id})" title="Remove">🗑</button>
      </div>
    </td>
  </tr>`).join('') || emptyRow(7, 'You have no listings yet. Start selling!');
  setHTML('my-listings-table', rows);
};

// ── PROFILE ───────────────────────────────────────
Pages.profile = function() {
  const user = Auth.current(); if (!user) { App.navigate('login'); return; }
  const pickups  = DB.getPickupsByUser(user.id);
  const listed   = DB.getProducts().filter(p => p.sellerId === user.id);
  const approved = listed.filter(p => p.status === 'Approved');

  setHTML('profile-content', `
    <div class="profile-grid">
      <div>
        <div class="profile-card">
          <div class="profile-avatar">${user.name[0].toUpperCase()}</div>
          <div class="profile-name">${user.name}</div>
          <div class="profile-email">${user.email}</div>
          <div class="profile-role">${roleBadge(user.role)}</div>
          <div class="profile-stats">
            <div class="pstat"><div class="pstat-val">${pickups.length}</div><div class="pstat-lbl">Pickups</div></div>
            <div class="pstat"><div class="pstat-val">${pickups.filter(p=>p.status==='Collected').length}</div><div class="pstat-lbl">Collected</div></div>
            <div class="pstat"><div class="pstat-val">${approved.length}</div><div class="pstat-lbl">Sold</div></div>
          </div>
        </div>
        <div class="content-card" style="margin-top:1rem;padding:1rem">
          <div style="font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:.75rem">Account Info</div>
          <div style="font-size:.85rem;color:var(--text-secondary);display:flex;flex-direction:column;gap:.5rem">
            <div>📧 ${user.email}</div>
            <div>📞 ${user.phone || 'Not provided'}</div>
            <div>📅 Joined ${fmtDate(user.joined)}</div>
            <div>🔑 Role: ${user.role}</div>
          </div>
        </div>
      </div>
      <div>
        <div class="content-card">
          <div class="content-card-header">
            <span class="content-card-title">Update Profile</span>
          </div>
          <div style="padding:1.25rem">
            <div id="profile-alert" class="form-alert" style="display:none"></div>
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input id="prof-name" class="form-input" value="${user.name}">
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input id="prof-phone" class="form-input" value="${user.phone||''}" placeholder="Your contact number">
            </div>
            <hr class="card-divider">
            <div style="font-size:.82rem;font-weight:600;color:var(--text-secondary);margin-bottom:.75rem">Change Password</div>
            <div class="form-group">
              <label class="form-label">Current Password</label>
              <input id="prof-current-pass" type="password" class="form-input" placeholder="Current password">
            </div>
            <div class="form-group">
              <label class="form-label">New Password</label>
              <input id="prof-new-pass" type="password" class="form-input" placeholder="New password (min 6 chars)">
            </div>
            <button class="btn btn-primary" onclick="saveProfile()">Save Changes</button>
          </div>
        </div>
        <div class="content-card" style="margin-top:1rem">
          <div class="content-card-header"><span class="content-card-title">My Environmental Impact</span></div>
          <div style="padding:1.25rem;display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div style="background:var(--bg-raised);border-radius:10px;padding:1rem;text-align:center">
              <div style="font-size:2rem;margin-bottom:.4rem">♻️</div>
              <div style="font-family:'Space Grotesk',sans-serif;font-size:1.4rem;font-weight:700;color:var(--green-bright)">${pickups.filter(p=>p.status==='Collected').length}</div>
              <div style="font-size:.75rem;color:var(--text-muted)">Devices Recycled</div>
            </div>
            <div style="background:var(--bg-raised);border-radius:10px;padding:1rem;text-align:center">
              <div style="font-size:2rem;margin-bottom:.4rem">🌍</div>
              <div style="font-family:'Space Grotesk',sans-serif;font-size:1.4rem;font-weight:700;color:var(--green-bright)">${(pickups.filter(p=>p.status==='Collected').length * 2.4).toFixed(1)} kg</div>
              <div style="font-size:.75rem;color:var(--text-muted)">CO₂ Saved (est.)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `);
};

function saveProfile() {
  const user    = Auth.current(); if (!user) return;
  const name    = document.getElementById('prof-name')?.value.trim();
  const phone   = document.getElementById('prof-phone')?.value.trim();
  const curPass = document.getElementById('prof-current-pass')?.value;
  const newPass = document.getElementById('prof-new-pass')?.value;

  if (!name) { showAlert('profile-alert', 'Name cannot be empty.', 'error'); return; }

  const updates = { name, phone };

  if (newPass) {
    if (curPass !== user.password) { showAlert('profile-alert', 'Current password is incorrect.', 'error'); return; }
    if (newPass.length < 6)        { showAlert('profile-alert', 'New password must be at least 6 characters.', 'error'); return; }
    updates.password = newPass;
  }

  const updated = DB.updateUser(user.id, updates);
  DB.setSession({ ...user, ...updates });
  App.updateNav();
  DB.log('Profile Updated');
  showAlert('profile-alert', 'Profile updated successfully!', 'success');
  toast('Profile saved ✅');
}

// ── ADMIN PANEL ───────────────────────────────────
Pages.admin = function() {
  const user = Auth.require('admin'); if (!user) return;
  updateAdminStats();
  renderAdminTab('overview');
};

// ── COLLECTOR PANEL ───────────────────────────────
Pages.collector = function() {
  const user = Auth.require('collector'); if (!user) return;
  const pending  = DB.getPendingPickups();
  const myJobs   = DB.getPickups().filter(p => p.collectorId === user.id);
  const done     = myJobs.filter(p => p.status === 'Collected');
  const active   = myJobs.filter(p => p.status === 'Assigned');

  setText('col-stat-pending', pending.length);
  setText('col-stat-myjobs',  active.length);
  setText('col-stat-done',    done.length);

  // Sidebar badge
  const badge = document.getElementById('col-pending-sidebar');
  if (badge) { badge.textContent = pending.length || ''; badge.style.display = pending.length ? '' : 'none'; }

  renderCollectorTab('requests');
};
