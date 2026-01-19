const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer"); // Thư viện gửi mail
const cron = require("node-cron"); // Thư viện hẹn giờ
const db = require("./db"); // Trỏ đúng vào file db.js nằm cùng thư mục

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// CẤU HÌNH GỬI MAIL (GIỮ NGUYÊN)
// ==========================================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "sgmatkinh@gmail.com", 
    pass: "gmnzdccmkjigbrhv",    
  },
});

// Route gửi mail từng hóa đơn (GIỮ NGUYÊN)
const sendEmailRoute = async (req, res) => {
  const { invoiceId, total, customerName, items, discount, final_total, saleDate } = req.body;
  const itemRows = items && items.length > 0 
    ? items.map(item => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product_name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${Number(item.price).toLocaleString()}đ</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${Number(item.total).toLocaleString()}đ</td>
        </tr>`).join('')
    : '<tr><td colspan="4" style="padding: 10px; text-align: center;">Không có chi tiết sản phẩm</td></tr>';

  const mailOptions = {
    from: '"Hệ thống Thông báo" <no-reply@shop.com>',
    to: "nguyentm.tmn@gmail.com, nguyentm.abc@gmail.com, sgmatkinh@gmail.com", 
    subject: `🔔 SalesHub SaiGonOptic: #${invoiceId} - ${customerName || "Khách lẻ"}`,
    html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
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
          <tbody>${itemRows}</tbody>
        </table>
        <div style="text-align: right; margin-top: 15px; background: #fff4f4; padding: 10px; border-radius: 8px;">
          <p style="margin: 5px 0;">Tạm tính: <b>${Number(total || 0).toLocaleString()}đ</b></p>
          <p style="margin: 5px 0; color: #e74c3c;">Giảm giá: <b>-${Number(discount || 0).toLocaleString()}đ</b></p>
          <p style="margin: 5px 0; font-size: 18px; color: #2563eb;">Tổng thanh toán: <b>${Number(final_total || total).toLocaleString()} VNĐ</b></p>
        </div>
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Đã gửi mail thành công!" });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

app.post("/send-invoice-email", sendEmailRoute);
app.post("/api/send-invoice-email", sendEmailRoute);

// ==========================================
// 1. Import các routes (GIỮ NGUYÊN)
// ==========================================
const dashboardRoutes = require("./routes/dashboard");
const productRoutes = require("./routes/products");
const invoiceRoutes = require("./routes/invoices");
const customerRoutes = require("./routes/customers");

app.use("/dashboard", dashboardRoutes);
app.use("/products", productRoutes);
app.use("/invoices", invoiceRoutes);
app.use("/customers", customerRoutes);

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/products", productRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/customers", customerRoutes);

// ==========================================
// 2. TỰ ĐỘNG GỬI BÁO CÁO TỔNG KẾT (ĐÃ SỬA LỖI .ALL)
// ==========================================
cron.schedule("45 19 * * *", async () => {
    console.log("--- ĐANG TỔNG HỢP BÁO CÁO NGÀY ---");
    
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // SỬA: Cách lấy dữ liệu chuẩn cho better-sqlite3 (db.prepare().all())
        const rows = db.prepare(`SELECT * FROM invoices WHERE DATE(created_at) = ?`).all(today);

        if (!rows || rows.length === 0) {
            console.log("Hôm nay chưa có đơn hàng nào.");
            return;
        }

        const totalRevenue = rows.reduce((sum, inv) => sum + Number(inv.final_total || 0), 0);
        const totalOrders = rows.length;

        const tableRows = rows.map(inv => `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">#${inv.id}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${inv.customer_name || 'Khách lẻ'}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${Number(inv.final_total).toLocaleString()}đ</td>
            </tr>`).join('');

        const mailOptions = {
            from: '"SalesHub Báo Cáo" <sgmatkinh@gmail.com>',
            to: "nguyentm.tmn@gmail.com, nguyentm.abc@gmail.com, sgmatkinh@gmail.com",
            subject: `📊 Báo Cáo Tổng Kết ${new Date().toLocaleDateString('vi-VN')}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #2563eb; padding: 20px; border-radius: 15px;">
                    <h2 style="color: #2563eb; text-align: center;">KẾT QUẢ BÁN HÀNG HÔM NAY</h2>
                    <div style="background: #f1f5f9; padding: 15px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
                        <h1 style="color: #16a34a; margin: 0;">${totalRevenue.toLocaleString()} VNĐ</h1>
                        <p style="margin: 5px 0;">Tổng thu từ <b>${totalOrders} đơn hàng</b></p>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #e2e8f0;">
                                <th style="padding: 8px; border: 1px solid #ddd;">Mã đơn</th>
                                <th style="padding: 8px; border: 1px solid #ddd;">Khách hàng</th>
                                <th style="padding: 8px; border: 1px solid #ddd;">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                    <p style="font-size: 11px; color: #666; margin-top: 20px; text-align: center;">Báo cáo gửi tự động lúc 20:00 hàng ngày.</p>
                </div>`
        };

        await transporter.sendMail(mailOptions);
        console.log("=> Đã gửi mail báo cáo thành công!");

    } catch (err) {
        console.log("Lỗi hệ thống báo cáo: ", err.message);
    }
}, { timezone: "Asia/Ho_Chi_Minh" });

// 3. Xử lý lỗi 404
app.use((req, res) => {
  res.status(404).json({ message: "Không tìm thấy đường dẫn" });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`==========================================`);
  console.log(`    SERVER CHẠY TRÊN PORT ${PORT}         `);
  console.log(`    KẾT NỐI DATABASE THÀNH CÔNG           `);
  console.log(`==========================================`);
});