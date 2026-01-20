const express = require("express");
const router = express.Router();
const db = require("../db");

/* =====================================================
    1. LẤY DANH SÁCH HÓA ĐƠN
===================================================== */
router.get("/", (req, res) => {
  try {
    const invoices = db.prepare(`
      SELECT 
        id,
        customer_name,
        customer_phone,
        total,
        discount,
        note,
        IFNULL(final_total, (total - discount)) AS final_total,
        IFNULL(final_total, (total - discount)) AS total_amount,
        created_at
      FROM invoices
      ORDER BY created_at DESC
    `).all();

    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
    2. TẠO HÓA ĐƠN (HỖ TRỢ CHỌN NGÀY GIỜ TÙY CHỈNH)
===================================================== */
router.post("/", (req, res) => {
  try {
    const {
      customer_name,
      customer_phone,
      items = [],
      discount = 0,
      final_total: final_total_req, 
      note,
      created_at // Nhận ngày giờ từ Frontend gửi lên
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Hóa đơn không có sản phẩm" });
    }

    // A. TÍNH TOÁN LẠI TỔNG TIỀN
    let totalRaw = 0;
    items.forEach(i => {
      const price = Number(i.price) || 0;
      const q = Number(i.quantity || i.qty || 0);
      totalRaw += price * q;
    });

    const discountValue = Number(discount) || 0;
    const final_total = Number(final_total_req) || (totalRaw - discountValue);

    // B. XỬ LÝ KHÁCH HÀNG & CẬP NHẬT CHI TIÊU
    if (customer_phone) {
      const existingCustomer = db.prepare("SELECT phone FROM customers WHERE phone = ?").get(customer_phone);
      if (!existingCustomer) {
        db.prepare("INSERT INTO customers (name, phone, total_spent) VALUES (?, ?, ?)").run(
          customer_name || "Khách lẻ", 
          customer_phone,
          final_total
        );
      } else {
        db.prepare("UPDATE customers SET total_spent = total_spent + ? WHERE phone = ?").run(
          final_total, 
          customer_phone
        );
      }
    }

    // C. INSERT HÓA ĐƠN TỔNG
    // SỬA TẠI ĐÂY: Lấy giờ Việt Nam định dạng YYYY-MM-DD HH:mm:ss
    const nowVN = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
    
    const result = db.prepare(`
      INSERT INTO invoices (
        customer_name, customer_phone, total, discount, final_total, note, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, ?))
    `).run(
      customer_name || "Khách lẻ",
      customer_phone || "",
      totalRaw,
      discountValue,
      final_total,
      note || "",
      created_at, // Ưu tiên ngày từ Frontend
      nowVN       // Nếu không có mới dùng giờ chuẩn Việt Nam
    );

    const invoiceId = result.lastInsertRowid;

    // D. INSERT CHI TIẾT SẢN PHẨM
    const stmt = db.prepare(`
      INSERT INTO invoice_items (
        invoice_id, product_name, price, quantity, item_discount, total
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    items.forEach(i => {
      const p = Number(i.price) || 0;
      const q = Number(i.quantity || i.qty || 1);
      const itemDisc = Number(i.item_discount) || 0;
      
      stmt.run(
        invoiceId,
        i.product_name || i.name || "Sản phẩm",
        p,
        q,
        itemDisc,
        (p * q) - itemDisc
      );
    });

    res.json({ success: true, id: invoiceId });

  } catch (err) {
    console.error("LỖI LƯU HÓA ĐƠN:", err.message);
    res.status(500).json({ message: "Lỗi lưu hóa đơn: " + err.message });
  }
});

/* =====================================================
    3. CHI TIẾT HÓA ĐƠN
===================================================== */
router.get("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const invoice = db.prepare(`SELECT * FROM invoices WHERE id = ?`).get(id);

    if (!invoice) {
      return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
    }

    const items = db.prepare(`SELECT * FROM invoice_items WHERE invoice_id = ?`).all(id);

    res.json({
      ...invoice,
      items: items || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
    4. CÁC HÀM KHÁC (BIỂU ĐỒ & XÓA)
===================================================== */
router.get("/dashboard/chart", (req, res) => {
  try {
    const data = db.prepare(`
      SELECT date(created_at) as day, IFNULL(SUM(final_total), 0) as revenue
      FROM invoices
      WHERE created_at >= date('now', '-6 days')
      GROUP BY date(created_at) 
      ORDER BY day ASC
    `).all();
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;
    db.prepare(`DELETE FROM invoice_items WHERE invoice_id = ?`).run(id);
    db.prepare(`DELETE FROM invoices WHERE id = ?`).run(id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* =====================================================
    5. CẬP NHẬT HÓA ĐƠN (SỬA ĐƠN HÀNG)
===================================================== */
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { customer_name, customer_phone, note, items, discount, final_total, created_at } = req.body;

  try {
    const updateInvoice = db.transaction(() => {
      // 1. Cập nhật bảng invoices
      db.prepare(`
        UPDATE invoices 
        SET customer_name = ?, customer_phone = ?, note = ?, total = ?, discount = ?, final_total = ?, created_at = COALESCE(?, created_at)
        WHERE id = ?
      `).run(customer_name, customer_phone, note, (Number(final_total) + Number(discount)), discount, final_total, created_at, id);

      // 2. Xóa sạch items cũ rồi thêm lại mới
      db.prepare(`DELETE FROM invoice_items WHERE invoice_id = ?`).run(id);

      const stmt = db.prepare(`
        INSERT INTO invoice_items (invoice_id, product_name, price, quantity, item_discount, total)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      items.forEach(i => {
        stmt.run(id, i.product_name, i.price, i.quantity, i.item_discount, i.total);
      });
    });

    updateInvoice();
    res.json({ success: true, message: "Đã cập nhật hóa đơn" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;