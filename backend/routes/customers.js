const express = require("express");
const router = express.Router();
const db = require("../db");

// 1. Lấy danh sách tất cả khách hàng
router.get("/", (req, res) => {
  try {
    const customers = db.prepare(`
      SELECT 
        c.id,
        c.name,
        c.phone,
        c.address,
        c.total_spent,
        (SELECT COUNT(id) FROM invoices WHERE customer_phone = c.phone) as total_orders,
        (SELECT MAX(created_at) FROM invoices WHERE customer_phone = c.phone) as last_order
      FROM customers c
      ORDER BY c.total_spent DESC
    `).all();
    
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Lấy lịch sử mua hàng chi tiết của 1 khách hàng
router.get("/:phone/history", (req, res) => {
  try {
    const { phone } = req.params;
    const history = db.prepare(`
      SELECT * FROM invoices 
      WHERE customer_phone = ? 
      ORDER BY created_at DESC
    `).all(phone);
    
    const fullHistory = history.map(inv => {
      const items = db.prepare(`
        SELECT * FROM invoice_items WHERE invoice_id = ?
      `).all(inv.id);
      return { ...inv, items };
    });

    res.json(fullHistory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Sửa thông tin khách hàng (FIXED & ADDED)
router.put("/:oldPhone", (req, res) => {
  try {
    const { oldPhone } = req.params;
    const { name, phone } = req.body;

    // Bắt đầu một Transaction để đảm bảo tính toàn vẹn dữ liệu
    const updateTransaction = db.transaction(() => {
      // Cập nhật bảng khách hàng
      db.prepare("UPDATE customers SET name = ?, phone = ? WHERE phone = ?")
        .run(name, phone, oldPhone);

      // Cập nhật luôn số điện thoại ở bảng hóa đơn để không bị mất liên kết lịch sử
      db.prepare("UPDATE invoices SET customer_name = ?, customer_phone = ? WHERE customer_phone = ?")
        .run(name, phone, oldPhone);
    });

    updateTransaction();
    res.json({ success: true, message: "Cập nhật thành công" });
  } catch (err) {
    console.error("Lỗi PUT:", err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Xóa khách hàng (FIXED: Xóa theo SĐT để khớp với Frontend)
router.delete("/:phone", (req, res) => {
  try {
    const { phone } = req.params;

    // Transaction: Xóa cả hóa đơn và khách hàng để tránh lỗi Foreign Key
    const deleteTransaction = db.transaction(() => {
      // 1. Xóa các mặt hàng trong các hóa đơn của khách này trước
      db.prepare(`
        DELETE FROM invoice_items 
        WHERE invoice_id IN (SELECT id FROM invoices WHERE customer_phone = ?)
      `).run(phone);

      // 2. Xóa các hóa đơn của khách này
      db.prepare("DELETE FROM invoices WHERE customer_phone = ?").run(phone);

      // 3. Cuối cùng mới xóa khách hàng
      db.prepare("DELETE FROM customers WHERE phone = ?").run(phone);
    });

    deleteTransaction();
    res.json({ success: true, message: "Đã xóa sạch dữ liệu khách hàng" });
  } catch (err) {
    console.error("Lỗi DELETE:", err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Tìm khách hàng theo SĐT (Autofill)
router.get("/find/:phone", (req, res) => {
  try {
    const { phone } = req.params;
    const customer = db.prepare("SELECT name FROM customers WHERE phone = ?").get(phone);
    res.json(customer || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;