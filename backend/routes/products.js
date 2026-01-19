const express = require("express");
const router = express.Router();
const db = require("../db");

// 1. Lấy danh sách sản phẩm
router.get("/", (req, res) => {
  try {
    const products = db.prepare("SELECT * FROM products ORDER BY id DESC").all();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. TÌM SẢN PHẨM THEO SKU (Dùng cho máy quét Barcode từ Excel)
router.get("/find-by-sku/:sku", (req, res) => {
  try {
    const { sku } = req.params;
    // Tìm chính xác theo SKU (mã mà mày in ra từ Excel)
    const product = db.prepare("SELECT * FROM products WHERE sku = ?").get(sku);
    
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: "Không tìm thấy mã sản phẩm này" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Thêm sản phẩm mới
router.post("/", (req, res) => {
  try {
    const { name, sku, price, unit, stock } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO products (name, sku, price, unit, stock)
      VALUES (?, ?, ?, ?, ?)
    `);

    const info = stmt.run(name, sku, Number(price), unit, Number(stock));

    res.json({
      id: info.lastInsertRowid,
      name,
      sku,
      price: Number(price),
      unit,
      stock: Number(stock)
    });
  } catch (err) {
    // Nếu trùng SKU, SQLite sẽ báo lỗi vì mày đã set nó là duy nhất (nếu có UNIQUE)
    res.status(500).json({ error: "Lỗi: SKU đã tồn tại hoặc dữ liệu không hợp lệ" });
  }
});

// 4. Sửa thông tin sản phẩm (Mày cần cái này để cập nhật SKU cho sản phẩm cũ)
router.put("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { name, sku, price, unit, stock } = req.body;

    db.prepare(`
      UPDATE products 
      SET name = ?, sku = ?, price = ?, unit = ?, stock = ? 
      WHERE id = ?
    `).run(name, sku, Number(price), unit, Number(stock), id);

    res.json({ success: true, message: "Cập nhật thành products công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Xóa sản phẩm
router.delete("/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM products WHERE id=?").run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;