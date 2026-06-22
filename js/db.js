// ═══════════════════════════════════════
// ECOWASTE — DATABASE (localStorage)
// Full data model with audit log
// ═══════════════════════════════════════

const DB = {
  _get(k) { try { return JSON.parse(localStorage.getItem('ew2_' + k)); } catch { return null; } },
  _set(k, v) { localStorage.setItem('ew2_' + k, JSON.stringify(v)); },

  init() {
    if (!this._get('users')) {
      this._set('users', [
        { id:1, name:'Admin User',      email:'admin@ewaste.com', password:'admin123',  role:'admin',     joined:'2024-01-01', phone:'9800000001' },
        { id:2, name:'Ravi Kumar',      email:'ravi@mail.com',    password:'user123',   role:'user',      joined:'2024-02-15', phone:'9800000002' },
        { id:3, name:'Priya Collector', email:'priya@mail.com',   password:'col123',    role:'collector', joined:'2024-03-01', phone:'9800000003' },
        { id:4, name:'Sunita Devi',     email:'sunita@mail.com',  password:'user123',   role:'user',      joined:'2024-04-10', phone:'9800000004' },
      ]);
    }
    if (!this._get('pickups')) {
      this._set('pickups', [
        { id:1, userId:2, item:'HP Laptop 2018',       category:'Laptop',   address:'42 Anna Nagar, Chennai 600040',     status:'Pending',   collectorId:null, qty:1, notes:'Screen is cracked', date:'2025-06-10' },
        { id:2, userId:2, item:'Samsung Galaxy S8',    category:'Mobile',   address:'15 Gandhinagar, Coimbatore 641012', status:'Assigned',  collectorId:3,    qty:1, notes:'Battery issues',   date:'2025-06-12' },
        { id:3, userId:2, item:'CRT Monitor',          category:'Monitor',  address:'7 MG Road, Bangalore 560001',       status:'Collected', collectorId:3,    qty:2, notes:'Heavy, 2 units',   date:'2025-06-08' },
        { id:4, userId:4, item:'Old Refrigerator',     category:'Refrigerator', address:'88 Civil Lines, Delhi 110001',  status:'Pending',   collectorId:null, qty:1, notes:'',               date:'2025-06-14' },
        { id:5, userId:2, item:'Epson Inkjet Printer', category:'Printer',  address:'42 Anna Nagar, Chennai 600040',     status:'Cancelled', collectorId:null, qty:1, notes:'Changed my mind', date:'2025-06-06' },
      ]);
    }
    if (!this._get('products')) {
      this._set('products', [
        { id:1, name:'Dell 22" Monitor FHD',       price:3200,  image:null, status:'Approved', sellerId:2, seller:'Ravi Kumar',   category:'Monitor',  condition:'Good',     contact:'9800000002', desc:'Full HD 1080p, VGA + HDMI, works perfectly.',     date:'2025-06-09' },
        { id:2, name:'Lenovo ThinkPad i5 8th Gen', price:19500, image:null, status:'Approved', sellerId:2, seller:'Ravi Kumar',   category:'Laptop',   condition:'Like New', contact:'9800000002', desc:'8GB RAM, 256GB SSD, charger included.',            date:'2025-06-11' },
        { id:3, name:'iPhone 11 (Screen Crack)',   price:9000,  image:null, status:'Approved', sellerId:4, seller:'Sunita Devi',  category:'Mobile',   condition:'Fair',     contact:'9800000004', desc:'Screen cracked at corner, touch works fine.',      date:'2025-06-12' },
        { id:4, name:'Canon DSLR 700D + 18-55mm', price:15000, image:null, status:'Approved', sellerId:4, seller:'Sunita Devi',  category:'Camera',   condition:'Good',     contact:'9800000004', desc:'2 batteries, bag, shutter count ~8000.',           date:'2025-06-13' },
        { id:5, name:'Samsung 32" Smart TV',       price:8500,  image:null, status:'Pending',  sellerId:2, seller:'Ravi Kumar',   category:'TV',       condition:'Good',     contact:'9800000002', desc:'Smart TV Android, remote included, minor scratch.', date:'2025-06-15' },
      ]);
    }
    if (!this._get('ids')) this._set('ids', { user:5, pickup:6, product:6 });
    if (!this._get('log'))  this._set('log', []);
  },

  nextId(type) {
    const ids = this._get('ids') || { user:5, pickup:6, product:6 };
    const id = ids[type];
    ids[type]++;
    this._set('ids', ids);
    return id;
  },

  log(action, detail='') {
    const logs = this._get('log') || [];
    const user = Auth.current();
    logs.unshift({ id:Date.now(), action, detail, user:user?.name || 'Guest', ts:new Date().toISOString() });
    if (logs.length > 200) logs.pop();
    this._set('log', logs);
  },

  // ── Session ──────────────────────────────────
  getSession()     { return this._get('session'); },
  setSession(u)    { this._set('session', u); },
  clearSession()   { localStorage.removeItem('ew2_session'); },

  // ── Users ─────────────────────────────────────
  getUsers()       { return this._get('users') || []; },
  getUserByEmail(e){ return this.getUsers().find(u => u.email.toLowerCase() === e.toLowerCase()); },
  getUserById(id)  { return this.getUsers().find(u => u.id === id); },
  addUser(data) {
    const users = this.getUsers();
    const user = { id:this.nextId('user'), ...data, role:'user', joined:today() };
    users.push(user);
    this._set('users', users);
    return user;
  },
  updateUser(id, updates) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) { users[idx] = { ...users[idx], ...updates }; this._set('users', users); return users[idx]; }
    return null;
  },

  // ── Pickups ───────────────────────────────────
  getPickups()          { return this._get('pickups') || []; },
  getPickupsByUser(uid) { return this.getPickups().filter(p => p.userId === uid); },
  getPendingPickups()   { return this.getPickups().filter(p => p.status === 'Pending'); },
  addPickup(data) {
    const pickups = this.getPickups();
    const p = { id:this.nextId('pickup'), ...data, status:'Pending', collectorId:null, date:today() };
    pickups.push(p);
    this._set('pickups', pickups);
    this.log('Pickup Requested', data.item);
    return p;
  },
  updatePickup(id, updates) {
    const pickups = this.getPickups();
    const idx = pickups.findIndex(p => p.id === id);
    if (idx !== -1) { pickups[idx] = { ...pickups[idx], ...updates }; this._set('pickups', pickups); }
  },
  cancelPickup(id) {
    this.updatePickup(id, { status:'Cancelled' });
    this.log('Pickup Cancelled', `ID ${id}`);
  },

  // ── Products ──────────────────────────────────
  getProducts()         { return this._get('products') || []; },
  getApprovedProducts() { return this.getProducts().filter(p => p.status === 'Approved'); },
  getPendingProducts()  { return this.getProducts().filter(p => p.status === 'Pending'); },
  addProduct(data) {
    const products = this.getProducts();
    const p = { id:this.nextId('product'), ...data, status:'Pending', date:today() };
    products.push(p);
    this._set('products', products);
    this.log('Product Listed', data.name);
    return p;
  },
  updateProduct(id, updates) {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) { products[idx] = { ...products[idx], ...updates }; this._set('products', products); }
  },
  deleteProduct(id) {
    this._set('products', this.getProducts().filter(p => p.id !== id));
    this.log('Product Deleted', `ID ${id}`);
  },
};

// ═══════════════════════════════════════
// AUTH
// ═══════════════════════════════════════
const Auth = {
  login(email, password) {
    const user = DB.getUserByEmail(email);
    if (!user || user.password !== password) return null;
    DB.setSession(user);
    DB.log('Login');
    return user;
  },
  logout() {
    DB.log('Logout');
    DB.clearSession();
    App.navigate('home');
  },
  current()  { return DB.getSession(); },
  require(role) {
    const user = this.current();
    if (!user) { App.navigate('login'); return null; }
    if (role && user.role !== role) { App.navigate('home'); return null; }
    return user;
  },
};

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════
function today()   { return new Date().toISOString().split('T')[0]; }
function fmtDate(d){ return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }); }
function fmtINR(n) { return '₹' + Number(n).toLocaleString('en-IN'); }

const catIcon = { Laptop:'💻', Mobile:'📱', Monitor:'🖥️', Printer:'🖨️', Camera:'📷', TV:'📺', Refrigerator:'🧊', Other:'♻️' };

function statusBadge(status) {
  const cls = { Pending:'amber', Assigned:'blue', Collected:'green', Approved:'green', Rejected:'red', Cancelled:'gray' };
  return `<span class="badge badge-${cls[status]||'gray'}">${status}</span>`;
}

function roleBadge(role) {
  const cls = { admin:'red', collector:'blue', user:'green' };
  return `<span class="badge badge-${cls[role]||'gray'}">${role}</span>`;
}

function requireLoginThen(page) {
  if (!Auth.current()) { toast('Please login first', 'info'); App.navigate('login'); return; }
  App.navigate(page);
}
