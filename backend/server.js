const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer"); // Thư viện gửi mail

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// CẤU HÌNH GỬI MAIL (PHẦN THÊM MỚI)
// ==========================================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "sgmatkinh@gmail.com", // Gmail của mày
    pass: "gmnzdccmkjigbrhv",    // Mật khẩu ứng dụng 16 ký tự
  },
});

// Route gửi mail thông báo hóa đơn thành công
const sendEmailRoute = async (req, res) => {
  // Nhận thêm các trường items, discount, final_total và saleDate từ Frontend
  const { invoiceId, total, customerName, items, discount, final_total, saleDate } = req.body;

  // Tạo hàng cho từng sản phẩm trong bảng
  const itemRows = items && items.length > 0 
    ? items.map(item => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product_name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${Number(item.price).toLocaleString()}đ</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${Number(item.total).toLocaleString()}đ</td>
        </tr>
      `).join('')
    : '<tr><td colspan="4" style="padding: 10px; text-align: center;">Không có chi tiết sản phẩm</td></tr>';

  const mailOptions = {
    from: '"Hệ thống Thông báo" <no-reply@shop.com>',
    // Mày có thể thêm nhiều mail vào đây cách nhau bằng dấu phẩy
    to: "nguyentm.tmn@gmail.com, nguyentm.abc@gmail.com, sgmatkinh@gmail.com", 
    subject: `🔔 SalesHub SaiGonOptic: #${invoiceId} - ${customerName || "Khách lẻ"}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #2c3e50; text-align: center;">THÔNG BÁO ĐƠN HÀNG MỚI</h2>
        <p><b>Mã hóa đơn:</b> #${invoiceId}</p>
        <p><b>Khách hàng:</b> ${customerName || "Khách lẻ"}</p>
        <p><b>Thời gian bán:</b> ${saleDate ? new Date(saleDate).toLocaleString('vi-VN') : "Vừa xong"}</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Sản phẩm</th>
              <th style="padding: 10px; border-bottom: 2px solid #ddd;">SL</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Giá</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Tổng</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <div style="text-align: right; margin-top: 15px; background: #fff4f4; padding: 10px; border-radius: 8px;">
          <p style="margin: 5px 0;">Tạm tính: <b>${Number(total || 0).toLocaleString()}đ</b></p>
          <p style="margin: 5px 0; color: #e74c3c;">Giảm giá: <b>-${Number(discount || 0).toLocaleString()}đ</b></p>
          <p style="margin: 5px 0; font-size: 18px; color: #2563eb;">Tổng thanh toán: <b>${Number(final_total || total).toLocaleString()} VNĐ</b></p>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #7f8c8d; text-align: center;">Vào hệ thống để kiểm tra chi tiết đơn hàng ngay nhé!</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Đã gửi mail thông báo thành công!" });
  } catch (error) {
    console.error("Lỗi gửi mail:", error);
    res.status(500).json({ success: false, message: "Lỗi gửi mail nhưng hóa đơn vẫn thành công." });
  }
};

// Đăng ký route gửi mail vào cả 2 kiểu đường dẫn cho chắc ăn
app.post("/send-invoice-email", sendEmailRoute);
app.post("/api/send-invoice-email", sendEmailRoute);

// ==========================================
// 1. Import các routes (CODE CŨ GIỮ NGUYÊN)
// ==========================================
const dashboardRoutes = require("./routes/dashboard");
const productRoutes = require("./routes/products");
const invoiceRoutes = require("./routes/invoices");
const customerRoutes = require("./routes/customers");

// 2. ĐỊNH NGHĨA ROUTE
app.use("/dashboard", dashboardRoutes);
app.use("/products", productRoutes);
app.use("/invoices", invoiceRoutes);
app.use("/customers", customerRoutes);

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/products", productRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/customers", customerRoutes);

// 3. Xử lý lỗi 404
app.use((req, res) => {
  console.log(`[VẪN SAI] Đường dẫn này không tồn tại: ${req.originalUrl}`);
  res.status(404).json({ message: "Không tìm thấy đường dẫn này trên Server" });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`==========================================`);
  console.log(`    BACKEND SQLITE CHẤP MỌI ĐƯỜNG DẪN      `);
  console.log(`    Server đang chạy tại cổng: ${PORT}      `);
  console.log(`==========================================`);
});