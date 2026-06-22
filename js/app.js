// ═══════════════════════════════════════
// ECOWASTE — APP ROUTER & UTILITIES
// ═══════════════════════════════════════

const App = {
  current: null,

  navigate(page, data = {}) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (!target) { console.warn('Page not found:', page); return; }
    target.classList.add('active');
    this.current = page;
    window.scrollTo(0, 0);
    closeMobileMenu();
    this.updateNav();

    const map = {
      home:        Pages.home,
      login:       Pages.login,
      register:    Pages.register,
      dashboard:   Pages.dashboard,
      pickup:      Pages.pickup,
      'my-requests': Pages.myRequests,
      marketplace: Pages.marketplace,
      sell:        Pages.sell,
      'my-listings': Pages.myListings,
      profile:     Pages.profile,
      admin:       Pages.admin,
      collector:   Pages.collector,
    };
    if (map[page]) map[page](data);
  },

  updateNav() {
    const user = Auth.current();
    const navAuth = document.getElementById('nav-auth');
    const navUser = document.getElementById('nav-user');
    if (!navAuth || !navUser) return;

    if (user) {
      navAuth.style.display = 'none';
      navUser.style.display = 'flex';
      const first = user.name.split(' ')[0];
      setText('nav-username', first);
      setText('nav-avatar-text', user.name[0].toUpperCase());
      setText('dropdown-name', user.name);
      setText('dropdown-role', user.role);
    } else {
      navAuth.style.display = 'flex';
      navUser.style.display = 'none';
    }

    // Active link
    document.querySelectorAll('.nav-link').forEach(el => {
      el.classList.toggle('active', el.dataset.page === this.current);
    });
  }
};

// ── Nav helpers ──────────────────────────────────
function navigateHome() {
  const user = Auth.current();
  if (!user) { App.navigate('home'); return; }
  if (user.role === 'admin')     App.navigate('admin');
  else if (user.role === 'collector') App.navigate('collector');
  else App.navigate('dashboard');
}

function goToDashboard() {
  const user = Auth.current();
  if (!user) { App.navigate('login'); return; }
  if (user.role === 'admin')     App.navigate('admin');
  else if (user.role === 'collector') App.navigate('collector');
  else App.navigate('dashboard');
}

// Mobile menu
function toggleMobileMenu() {
  document.getElementById('nav-links')?.classList.toggle('open');
  document.getElementById('hamburger')?.classList.toggle('open');
}
function closeMobileMenu() {
  document.getElementById('nav-links')?.classList.remove('open');
  document.getElementById('hamburger')?.classList.remove('open');
}

// Mobile sidebar toggle
function toggleSidebar() {
  document.querySelector('.sidebar')?.classList.toggle('open');
}

// User dropdown
function toggleUserMenu() {
  document.getElementById('user-dropdown')?.classList.toggle('open');
}
function closeUserMenu() {
  document.getElementById('user-dropdown')?.classList.remove('open');
}
document.addEventListener('click', e => {
  const wrap = document.getElementById('nav-avatar-wrap');
  if (wrap && !wrap.contains(e.target)) closeUserMenu();
});

// ── Toast ────────────────────────────────────────
function toast(msg, type = 'success') {
  const icons = { success:'✅', error:'❌', info:'ℹ️', warning:'⚠️' };
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]||'•'}</span><span class="toast-msg">${msg}</span><button class="toast-close" onclick="this.closest('.toast').remove()">✕</button>`;
  container.appendChild(el);
  setTimeout(() => el?.remove(), 4000);
}

// ── Modals ───────────────────────────────────────
function openModal(id) {
  document.getElementById('modal-overlay')?.classList.add('open');
  document.getElementById(id)?.classList.add('open');
}
function closeAllModals() {
  document.getElementById('modal-overlay')?.classList.remove('open');
  document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
}
function confirmModal(message, onConfirm) {
  setText('modal-confirm-msg', message);
  const btn = document.getElementById('modal-confirm-ok');
  btn.onclick = () => { closeAllModals(); onConfirm(); };
  openModal('modal-confirm');
}

// ── Sidebar tab helpers ───────────────────────────
function setSidebarActive(btn, dashId) {
  document.querySelectorAll(`#page-${dashId} .sidebar-item`).forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ── Password toggle ───────────────────────────────
function togglePwd(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
  btn.textContent = input.type === 'password' ? '👁' : '🙈';
}

// ── Utility ───────────────────────────────────────
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
function setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}
function showAlert(id, msg, type = 'success') {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `form-alert ${type}`;
  el.innerHTML = (type === 'error' ? '⚠️ ' : '✅ ') + msg;
  el.style.display = 'flex';
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}
function hideAlert(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

// ── Pagination helper ─────────────────────────────
function buildPagination(containerId, total, perPage, current, onPage) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) { setHTML(containerId, ''); return; }
  let html = '';
  for (let i = 1; i <= pages; i++) {
    html += `<button class="page-btn${i===current?' active':''}" onclick="(${onPage})(${i})">${i}</button>`;
  }
  setHTML(containerId, html);
}

// ── Export ────────────────────────────────────────
function exportData() {
  const data = {
    users:    DB.getUsers().map(u => ({ ...u, password: '***' })),
    pickups:  DB.getPickups(),
    products: DB.getProducts(),
    exported: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ecowaste-export-${today()}.json`;
  a.click();
  toast('Data exported successfully');
}

// ── Admin tab helpers ─────────────────────────────
function renderAdminTab(tab) {
  document.querySelectorAll('#page-admin .tab').forEach(t => t.classList.toggle('active', t.dataset.atab === tab));
  document.querySelectorAll('#page-admin .tab-content').forEach(c => c.classList.toggle('active', c.id === 'admin-tab-' + tab));
  document.querySelectorAll('#page-admin .sidebar-item').forEach(b => b.classList.toggle('active', b.dataset.atab === tab));

  if (tab === 'overview')  renderAdminOverview();
  if (tab === 'users')     renderAdminUsers();
  if (tab === 'pickups')   renderAdminPickups();
  if (tab === 'products')  renderAdminProducts();
}

// ── Collector tab helpers ─────────────────────────
function renderCollectorTab(tab) {
  document.querySelectorAll('#page-collector .tab').forEach(t => t.classList.toggle('active', t.dataset.ctab === tab));
  document.querySelectorAll('#page-collector .tab-content').forEach(c => c.classList.toggle('active', c.id === 'col-tab-' + tab));
  document.querySelectorAll('#page-collector .sidebar-item[data-ctab]').forEach(b => b.classList.toggle('active', b.dataset.ctab === tab));

  if (tab === 'requests') renderColRequests();
  if (tab === 'myjobs')   renderColMyJobs();
  if (tab === 'history')  renderColHistory();
}

// ── Login/Register handlers ───────────────────────
function doLogin() {
  const email = document.getElementById('login-email')?.value.trim();
  const pass  = document.getElementById('login-pass')?.value;
  if (!email || !pass) { showAlert('login-alert', 'Please fill all fields.', 'error'); return; }
  const user = Auth.login(email, pass);
  if (!user) { showAlert('login-alert', 'Invalid email or password.', 'error'); return; }
  toast(`Welcome back, ${user.name.split(' ')[0]}! 👋`);
  if (user.role === 'admin')          App.navigate('admin');
  else if (user.role === 'collector') App.navigate('collector');
  else                                App.navigate('dashboard');
}

function doRegister() {
  const name    = document.getElementById('reg-name')?.value.trim();
  const email   = document.getElementById('reg-email')?.value.trim();
  const pass    = document.getElementById('reg-pass')?.value;
  const confirm = document.getElementById('reg-confirm')?.value;
  if (!name || !email || !pass)       { showAlert('register-alert', 'Please fill all fields.', 'error'); return; }
  if (pass !== confirm)               { showAlert('register-alert', 'Passwords do not match.', 'error'); return; }
  if (pass.length < 6)               { showAlert('register-alert', 'Password must be at least 6 characters.', 'error'); return; }
  if (DB.getUserByEmail(email))       { showAlert('register-alert', 'Email already registered.', 'error'); return; }
  const user = DB.addUser({ name, email, password:pass, phone:'' });
  Auth.login(email, pass);
  toast('Welcome to EcoWaste! ♻️');
  App.navigate('dashboard');
}

function doPickup() {
  const user = Auth.require('user'); if (!user) return;
  const item     = document.getElementById('pickup-item')?.value.trim();
  const category = document.getElementById('pickup-category')?.value;
  const address  = document.getElementById('pickup-address')?.value.trim();
  const notes    = document.getElementById('pickup-notes')?.value.trim();
  const qty      = parseInt(document.getElementById('pickup-qty')?.value) || 1;
  if (!item || !address || !category) { showAlert('pickup-alert', 'Please fill all required fields.', 'error'); return; }
  DB.addPickup({ userId:user.id, item, category, address, notes, qty });
  toast('Pickup requested! A collector will be assigned soon. 🚛');
  document.getElementById('pickup-form')?.reset();
  // Update sidebar badge
  Pages.dashboard && updatePendingBadge(user.id);
  App.navigate('my-requests');
}

function doSell() {
  const user = Auth.require('user'); if (!user) return;
  const name      = document.getElementById('sell-name')?.value.trim();
  const category  = document.getElementById('sell-category')?.value;
  const price     = document.getElementById('sell-price')?.value;
  const condition = document.getElementById('sell-condition')?.value;
  const contact   = document.getElementById('sell-contact')?.value.trim();
  const desc      = document.getElementById('sell-desc')?.value.trim();
  if (!name || !price || !category || !condition || !contact) { showAlert('sell-alert', 'Please fill all required fields.', 'error'); return; }
  if (isNaN(price) || Number(price) <= 0)                     { showAlert('sell-alert', 'Enter a valid price.', 'error'); return; }
  DB.addProduct({ name, category, price:Number(price), condition, contact, description:desc, sellerId:user.id, seller:user.name });
  toast('Listing submitted! Admin will review within 24h. ✅');
  document.getElementById('sell-form')?.reset();
  App.navigate('my-listings');
}

// Admin actions
function adminUpdatePickup(id, status) {
  const user = Auth.current();
  DB.updatePickup(id, { status, collectorId: status === 'Assigned' ? null : undefined });
  DB.log(`Pickup ${status}`, `ID ${id}`);
  toast(`Pickup marked as ${status}`);
  renderAdminPickups();
  updateAdminStats();
}
function approveProduct(id) {
  DB.updateProduct(id, { status:'Approved' });
  DB.log('Product Approved', `ID ${id}`);
  toast('Product approved ✅');
  renderAdminProducts();
  updateAdminStats();
}
function rejectProduct(id) {
  DB.updateProduct(id, { status:'Rejected' });
  DB.log('Product Rejected', `ID ${id}`);
  toast('Product rejected');
  renderAdminProducts();
  updateAdminStats();
}
function deleteProduct(id) {
  confirmModal('Are you sure you want to delete this product? This cannot be undone.', () => {
    DB.deleteProduct(id);
    toast('Product deleted');
    renderAdminProducts();
    updateAdminStats();
  });
}

// Collector actions
function acceptPickup(id) {
  const user = Auth.current();
  DB.updatePickup(id, { status:'Assigned', collectorId:user.id });
  DB.log('Job Accepted', `Pickup ID ${id}`);
  toast('Pickup accepted! Added to your jobs 🚛');
  Pages.collector();
}
function markCollected(id) {
  DB.updatePickup(id, { status:'Collected' });
  DB.log('Job Completed', `Pickup ID ${id}`);
  toast('Marked as collected! Great work ✅');
  Pages.collector();
}

// User: cancel pickup
function cancelPickup(id) {
  confirmModal('Cancel this pickup request?', () => {
    DB.cancelPickup(id);
    toast('Pickup request cancelled');
    Pages.myRequests();
  });
}

// Seller: delete own listing
function deleteMyListing(id) {
  confirmModal('Remove this listing from the marketplace?', () => {
    DB.deleteProduct(id);
    toast('Listing removed');
    Pages.myListings();
  });
}

// Contact seller modal
function showContactModal(productId) {
  const p = DB.getProducts().find(x => x.id === productId);
  if (!p) return;
  setHTML('modal-contact-body', `
    <div style="display:flex;flex-direction:column;gap:.75rem;">
      <div><strong>${p.name}</strong> — ${fmtINR(p.price)}</div>
      <div style="padding:.75rem;background:var(--bg-raised);border-radius:8px;">
        <div style="font-size:.78rem;color:var(--text-muted);margin-bottom:.3rem">Seller</div>
        <div style="font-weight:600">${p.seller}</div>
        <div style="font-size:.875rem;color:var(--text-secondary);margin-top:.25rem">📞 ${p.contact || 'Not provided'}</div>
      </div>
      <div style="font-size:.82rem;color:var(--text-muted)">Contact the seller directly to arrange payment and delivery. EcoWaste is not responsible for transactions.</div>
    </div>
  `);
  openModal('modal-contact');
}

// Product detail modal
function showProductModal(productId) {
  const p = DB.getProducts().find(x => x.id === productId);
  if (!p) return;
  setText('modal-product-title', p.name);
  setHTML('modal-product-body', `
    <div style="display:flex;align-items:center;justify-content:center;height:120px;background:var(--bg-raised);border-radius:10px;font-size:4rem;margin-bottom:1rem;">${catIcon[p.category]||'♻️'}</div>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.75rem">
      <span class="badge badge-blue">${p.category}</span>
      <span class="badge badge-gray">${p.condition}</span>
      ${statusBadge(p.status)}
    </div>
    <div style="font-size:1.3rem;font-weight:700;color:var(--green-bright);margin-bottom:.5rem">${fmtINR(p.price)}</div>
    <div style="font-size:.82rem;color:var(--text-muted);margin-bottom:.75rem">Sold by ${p.seller} · Listed ${fmtDate(p.date)}</div>
    ${p.description ? `<p style="font-size:.875rem;color:var(--text-secondary);line-height:1.6">${p.description}</p>` : ''}
  `);
  const contactBtn = document.getElementById('modal-product-contact-btn');
  if (p.status === 'Approved') {
    contactBtn.style.display = 'flex';
    contactBtn.onclick = () => { closeAllModals(); showContactModal(productId); };
  } else {
    contactBtn.style.display = 'none';
  }
  openModal('modal-product');
}

// Update sidebar pending badge
function updatePendingBadge(userId) {
  const cnt = DB.getPickupsByUser(userId).filter(p => p.status === 'Pending').length;
  const el = document.getElementById('sb-pending-count');
  if (el) { el.textContent = cnt || ''; el.style.display = cnt ? '' : 'none'; }
}

// Update admin pending badge
function updateAdminStats() {
  const pending = DB.getPendingProducts().length;
  const el = document.getElementById('admin-pending-badge');
  if (el) { el.textContent = pending || ''; el.style.display = pending ? '' : 'none'; }
  setText('admin-stat-users',    DB.getUsers().filter(u => u.role === 'user').length);
  setText('admin-stat-pickups',  DB.getPickups().length);
  setText('admin-stat-products', DB.getProducts().length);
  setText('admin-stat-pending',  pending);
}

// ── Admin renderers ───────────────────────────────
function renderAdminOverview() {
  const recent = DB.getPickups().slice(-8).reverse();
  const rows = recent.map(p => {
    const u = DB.getUserById(p.userId);
    return `<tr>
      <td><span style="font-size:1rem">${catIcon[p.category]||'♻️'}</span> ${p.item}</td>
      <td>${u?.name||'Unknown'}</td>
      <td>${statusBadge(p.status)}</td>
      <td style="color:var(--text-muted);font-size:.8rem">${fmtDate(p.date)}</td>
    </tr>`;
  }).join('') || emptyRow(4, 'No activity yet');
  setHTML('admin-recent-table', rows);
}

function renderAdminUsers() {
  const q    = document.getElementById('admin-user-search')?.value.toLowerCase() || '';
  const role = document.getElementById('admin-user-role')?.value || '';
  let users  = DB.getUsers().filter(u => {
    if (role && u.role !== role) return false;
    if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    return true;
  });
  const rows = users.map(u => `<tr>
    <td><div style="display:flex;align-items:center;gap:10px"><div class="avatar avatar-sm">${u.name[0]}</div><div><div style="font-weight:500">${u.name}</div><div style="font-size:.75rem;color:var(--text-muted)">#${u.id}</div></div></div></td>
    <td style="color:var(--text-secondary)">${u.email}</td>
    <td>${roleBadge(u.role)}</td>
    <td style="color:var(--text-muted);font-size:.8rem">${fmtDate(u.joined)}</td>
    <td>
      ${u.role === 'user' ? `<button class="btn btn-ghost btn-sm" onclick="promoteToCollector(${u.id})">Make Collector</button>` : ''}
    </td>
  </tr>`).join('') || emptyRow(5, 'No users found');
  setHTML('admin-users-table', rows);
}

function promoteToCollector(id) {
  confirmModal('Promote this user to Collector role?', () => {
    DB.updateUser(id, { role:'collector' });
    DB.log('User Promoted', `User ID ${id}`);
    toast('User promoted to Collector');
    renderAdminUsers();
  });
}

function renderAdminPickups() {
  const q      = document.getElementById('admin-pickup-search')?.value.toLowerCase() || '';
  const status = document.getElementById('admin-pickup-status')?.value || '';
  let pickups  = DB.getPickups().slice().reverse().filter(p => {
    if (status && p.status !== status) return false;
    if (q && !p.item.toLowerCase().includes(q) && !p.address.toLowerCase().includes(q)) return false;
    return true;
  });
  const rows = pickups.map(p => {
    const u = DB.getUserById(p.userId);
    const actions = p.status === 'Pending'
      ? `<button class="btn btn-amber btn-sm" onclick="adminUpdatePickup(${p.id},'Assigned')">Assign</button>`
      : p.status === 'Assigned'
      ? `<button class="btn btn-primary btn-sm" onclick="adminUpdatePickup(${p.id},'Collected')">Mark Collected</button>`
      : '';
    return `<tr>
      <td><span style="font-size:1rem">${catIcon[p.category]||'♻️'}</span> ${p.item}</td>
      <td style="color:var(--text-secondary);font-size:.82rem">${u?.name||'?'}</td>
      <td style="color:var(--text-muted);font-size:.78rem;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.address}</td>
      <td>${statusBadge(p.status)}</td>
      <td style="color:var(--text-muted);font-size:.78rem">${fmtDate(p.date)}</td>
      <td>${actions}</td>
    </tr>`;
  }).join('') || emptyRow(6, 'No pickups found');
  setHTML('admin-pickups-table', rows);
}

function renderAdminProducts() {
  const q      = document.getElementById('admin-prod-search')?.value.toLowerCase() || '';
  const status = document.getElementById('admin-prod-status')?.value || '';
  let products = DB.getProducts().slice().reverse().filter(p => {
    if (status && p.status !== status) return false;
    if (q && !p.name.toLowerCase().includes(q) && !p.seller.toLowerCase().includes(q)) return false;
    return true;
  });
  const rows = products.map(p => `<tr>
    <td>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:1.1rem">${catIcon[p.category]||'♻️'}</span>
        <div><div style="font-weight:500">${p.name}</div><div style="font-size:.75rem;color:var(--text-muted)">${p.category}</div></div>
      </div>
    </td>
    <td style="color:var(--text-secondary)">${p.seller}</td>
    <td style="color:var(--green-bright);font-weight:600">${fmtINR(p.price)}</td>
    <td><span class="badge badge-gray">${p.condition||'—'}</span></td>
    <td>${statusBadge(p.status)}</td>
    <td>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${p.status === 'Pending'
          ? `<button class="btn btn-primary btn-sm" onclick="approveProduct(${p.id})">Approve</button>
             <button class="btn btn-danger btn-sm" onclick="rejectProduct(${p.id})">Reject</button>`
          : ''}
        <button class="btn btn-ghost btn-sm" onclick="showProductModal(${p.id})">View</button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteProduct(${p.id})" title="Delete">🗑</button>
      </div>
    </td>
  </tr>`).join('') || emptyRow(6, 'No products found');
  setHTML('admin-products-table', rows);
  updateAdminStats();
}

// ── Collector renderers ───────────────────────────
function renderColRequests() {
  const pending = DB.getPendingPickups();
  const rows = pending.map(p => `<tr>
    <td><span style="font-size:1rem">${catIcon[p.category]||'♻️'}</span> ${p.item} ${p.qty > 1 ? `<span class="badge badge-gray">x${p.qty}</span>` : ''}</td>
    <td><span class="badge badge-blue">${p.category}</span></td>
    <td style="color:var(--text-secondary);font-size:.82rem;max-width:180px">${p.address}</td>
    <td style="color:var(--text-muted);font-size:.8rem">${fmtDate(p.date)}</td>
    <td><button class="btn btn-primary btn-sm" onclick="acceptPickup(${p.id})">Accept Job</button></td>
  </tr>`).join('') || emptyRow(5, 'No pending requests — all clear! 🎉');
  setHTML('col-requests-table', rows);
}

function renderColMyJobs() {
  const user = Auth.current();
  const jobs = DB.getPickups().filter(p => p.collectorId === user?.id && p.status === 'Assigned').reverse();
  const rows = jobs.map(p => `<tr>
    <td><span style="font-size:1rem">${catIcon[p.category]||'♻️'}</span> ${p.item}</td>
    <td><span class="badge badge-blue">${p.category}</span></td>
    <td style="color:var(--text-secondary);font-size:.82rem;max-width:160px">${p.address}</td>
    <td>${statusBadge(p.status)}</td>
    <td><button class="btn btn-primary btn-sm" onclick="markCollected(${p.id})">Mark Collected ✓</button></td>
  </tr>`).join('') || emptyRow(5, 'No active jobs. Accept requests from Pending tab.');
  setHTML('col-myjobs-table', rows);
}

function renderColHistory() {
  const user = Auth.current();
  const done = DB.getPickups().filter(p => p.collectorId === user?.id && p.status === 'Collected').reverse();
  const rows = done.map(p => `<tr>
    <td><span style="font-size:1rem">${catIcon[p.category]||'♻️'}</span> ${p.item}</td>
    <td style="color:var(--text-secondary);font-size:.82rem">${p.address}</td>
    <td style="color:var(--text-muted);font-size:.8rem">${fmtDate(p.date)}</td>
  </tr>`).join('') || emptyRow(3, 'No completed jobs yet.');
  setHTML('col-history-table', rows);
}

// ── Empty row helper ──────────────────────────────
function emptyRow(cols, msg) {
  return `<tr><td colspan="${cols}"><div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-title">${msg}</div></div></td></tr>`;
}

// ── Filter my requests ────────────────────────────
let _myReqData = [], _myReqPage = 1;
const PER_PAGE = 8;

function filterMyRequests() {
  const q      = document.getElementById('req-search')?.value.toLowerCase() || '';
  const status = document.getElementById('req-status-filter')?.value || '';
  const user   = Auth.current();
  let items    = DB.getPickupsByUser(user?.id).reverse().filter(p => {
    if (status && p.status !== status) return false;
    if (q && !p.item.toLowerCase().includes(q) && !p.address.toLowerCase().includes(q)) return false;
    return true;
  });
  _myReqData = items;
  _myReqPage = 1;
  renderMyRequestsPage();
}

function renderMyRequestsPage() {
  const items  = _myReqData;
  const page   = _myReqPage;
  const slice  = items.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const rows   = slice.map(p => `<tr>
    <td><span style="font-size:1rem">${catIcon[p.category]||'♻️'}</span> ${p.item}</td>
    <td><span class="badge badge-blue">${p.category}</span></td>
    <td style="color:var(--text-secondary);font-size:.82rem;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.address}</td>
    <td>${statusBadge(p.status)}</td>
    <td style="color:var(--text-muted);font-size:.8rem">${fmtDate(p.date)}</td>
    <td>
      ${p.status === 'Pending'
        ? `<button class="btn btn-danger btn-sm" onclick="cancelPickup(${p.id})">Cancel</button>`
        : '<span style="color:var(--text-muted);font-size:.8rem">—</span>'}
    </td>
  </tr>`).join('') || emptyRow(6, 'No pickup requests found.');
  setHTML('my-requests-table', rows);
  buildPagination('req-pagination', items.length, PER_PAGE, page, `(p)=>{_myReqPage=p;renderMyRequestsPage()}`);
}

// ── Market pagination ─────────────────────────────
let _mktData = [], _mktPage = 1;
const MKT_PER = 12;

function renderMarketPage() {
  const slice = _mktData.slice((_mktPage-1)*MKT_PER, _mktPage*MKT_PER);
  if (!slice.length) {
    setHTML('marketplace-grid', `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🛒</div><div class="empty-state-title">No products found</div><div class="empty-state-desc">Try different search terms or check back later.</div></div>`);
    setHTML('market-pagination', '');
    return;
  }
  setHTML('marketplace-grid', slice.map(p => `
    <div class="product-card">
      <div class="product-img">${catIcon[p.category]||'♻️'}</div>
      <div class="product-body">
        <div class="product-cat"><span class="badge badge-blue">${p.category}</span></div>
        <div class="product-name">${p.name}</div>
        <div class="product-price">${fmtINR(p.price)}</div>
        <div class="product-seller">By ${p.seller}</div>
        <div class="product-condition"><span class="badge badge-gray">${p.condition||'Good'}</span></div>
        <div class="product-actions">
          <button class="btn btn-primary btn-sm" style="flex:1;justify-content:center" onclick="showProductModal(${p.id})">View Details</button>
          <button class="btn btn-ghost btn-sm btn-icon" onclick="showContactModal(${p.id})" title="Contact Seller">📞</button>
        </div>
      </div>
    </div>
  `).join(''));
  buildPagination('market-pagination', _mktData.length, MKT_PER, _mktPage, `(p)=>{_mktPage=p;renderMarketPage()}`);
}
