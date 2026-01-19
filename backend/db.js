const Database = require("better-sqlite3");
const db = new Database("database/database.db");

// 1. Bảng sản phẩm
db.prepare(`
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  sku TEXT,
  price REAL,
  unit TEXT,
  stock INTEGER,
  barcode TEXT
)
`).run();

// 2. BẢNG KHÁCH HÀNG
db.prepare(`
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  phone TEXT UNIQUE,
  address TEXT,
  total_spent REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now','localtime'))
)
`).run();

// 3. Bảng hóa đơn
db.prepare(`
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    final_total REAL DEFAULT 0,
    customer_name TEXT,
    customer_phone TEXT,
    note TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )
`).run();

// 4. Bảng chi tiết hóa đơn - THÊM CỘT item_discount
db.prepare(`
CREATE TABLE IF NOT EXISTS invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER,
  product_name TEXT,
  price REAL,
  quantity INTEGER,
  total REAL,
  item_discount REAL DEFAULT 0, -- DÒNG QUAN TRỌNG ĐỂ LƯU GIẢM GIÁ MÓN
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
)
`).run();

// --- HÀM CẬP NHẬT CẤU TRÚC (CƯỠNG ÉP) ---
const addColumn = (table, column, type) => {
  try {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
    console.log(`[DB] Đã kiểm tra/thêm cột ${column} vào bảng ${table}`);
  } catch (err) {
    // Cột đã có thì bỏ qua
  }
};

// Đảm bảo các bảng luôn đủ cột
addColumn("invoices", "customer_name", "TEXT");
addColumn("invoices", "customer_phone", "TEXT");
addColumn("invoices", "note", "TEXT"); 
addColumn("invoices", "final_total", "REAL DEFAULT 0");

// CƯỠNG ÉP THÊM CỘT GIẢM GIÁ VÀO CHI TIẾT HÓA ĐƠN
addColumn("invoice_items", "item_discount", "REAL DEFAULT 0");

module.exports = db;