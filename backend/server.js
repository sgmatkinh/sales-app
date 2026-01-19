const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 1. KHỞI TẠO BẢNG USER & ADMIN
// ==========================================
try {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `).run();

  const user = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
  if (!user) {
    db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run("admin", "123456");
    console.log("=> ĐÃ KHỞI TẠO TÀI KHOẢN ADMIN MẶC ĐỊNH (admin/123456)");
  }
} catch (err) {
  console.error("Lỗi khởi tạo bảo mật:", err.message);
}

// ==========================================
// 2. API ĐĂNG NHẬP & EMAIL
// ==========================================
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  try {
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password);
    if (user) {
      res.json({ success: true, message: "Đăng nhập thành công" });
    } else {
      res.status(401).json({ success: false, message: "Sai tài khoản hoặc mật khẩu" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// Giữ nguyên logic gửi mail của mày
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "sgmatkinh@gmail.com", 
    pass: "gmnzdccmkjigbrhv",    
  },
});

const sendEmailRoute = async (req, res) => {
  const { invoiceId, total, customerName, items, discount, final_total, saleDate } = req.body;
  const itemRows = items && items.length > 0 
    ? items.map(item => `<tr><td>${item.product_name}</td><td>${item.quantity}</td><td>${Number(item.price).toLocaleString()}đ</td></tr>`).join('')
    : '<tr><td>Không có sản phẩm</td></tr>';

  const mailOptions = {
    from: '"Hệ thống Thông báo" <no-reply@shop.com>',
    to: "nguyentm.tmn@gmail.com, nguyentm.abc@gmail.com, sgmatkinh@gmail.com", 
    subject: `🔔 SalesHub SaiGonOptic: #${invoiceId}`,
    html: `<h2>ĐƠN HÀNG MỚI #${invoiceId}</h2><table>${itemRows}</table><p>Tổng: ${Number(final_total).toLocaleString()}đ</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};
app.post("/send-invoice-email", sendEmailRoute);

// ==========================================
// 3. QUAN TRỌNG: KHAI BÁO CÁC ROUTE DỮ LIỆU
// ==========================================
const dashboardRoutes = require("./routes/dashboard");
const productRoutes = require("./routes/products");
const invoiceRoutes = require("./routes/invoices");
const customerRoutes = require("./routes/customers");

// Đặt trước 404 và Listen để dữ liệu Dashboard hiện lên
app.use("/dashboard", dashboardRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use("/products", productRoutes);
app.use("/api/products", productRoutes);

app.use("/invoices", invoiceRoutes);
app.use("/api/invoices", invoiceRoutes);

app.use("/customers", customerRoutes);
app.use("/api/customers", customerRoutes);

// ==========================================
// 4. HẸN GIỜ BÁO CÁO (GIỮ NGUYÊN)
// ==========================================
cron.schedule("45 19 * * *", async () => {
    console.log("--- ĐANG TỔNG HỢP BÁO CÁO NGÀY ---");
    // ... (Giữ nguyên logic cron cũ của mày)
}, { timezone: "Asia/Ho_Chi_Minh" });

// ==========================================
// 5. XỬ LÝ LỖI 404 (PHẢI ĐẶT SAU CÙNG CỦA CÁC ROUTE)
// ==========================================
app.use((req, res) => {
  console.log("Lỗi 404 tại đường dẫn:", req.originalUrl);
  res.status(404).json({ message: "Không tìm thấy đường dẫn" });
});

// ==========================================
// 6. KHỞI CHẠY SERVER
// ==========================================
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`==========================================`);
  console.log(`    SERVER CHẠY TRÊN PORT ${PORT}          `);
  console.log(`    KẾT NỐI DATABASE THÀNH CÔNG            `);
  console.log(`==========================================`);
});