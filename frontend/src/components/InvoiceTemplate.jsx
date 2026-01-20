import React, { forwardRef } from "react";

// Mày đã dùng forwardRef là chuẩn rồi, tao giữ nguyên cấu trúc này
const InvoiceTemplate = forwardRef(({ config, data }, ref) => {
  // Tránh render lỗi nếu dữ liệu chưa kịp đổ về
  if (!config || !data) return null;

  return (
    <div 
      ref={ref} 
      className="invoice-print-area p-2 bg-white text-black font-sans mx-auto antialiased" 
      style={{ 
        width: "80mm", 
        minHeight: "100mm", // Thêm minHeight để tránh frame trống
        fontSize: "14px", 
        lineHeight: "1.3",
        color: "#000",
        backgroundColor: "#fff"
      }}
    >
      <style>{`
        /* CSS dành riêng cho lúc bấm nút In */
        @media print {
          @page { 
            size: 80mm auto; 
            margin: 0; 
          }
          body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
            background-color: white !important;
          }
          /* Đảm bảo không bị ẩn khi in */
          .invoice-print-area {
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
          }
          .print-container { margin-left: 2mm !important; } 
        }
      `}</style>

      {/* 1. LOGO & HEADER */}
      <div className="flex flex-col items-center text-center mb-4 w-full print-container">
        {/* Thêm crossOrigin và cố định kích thước để tránh trắng trang do ảnh chưa load */}
        <img 
          src="/logo-shop-net.png" 
          alt="logo shop" 
          className="w-20 h-20 object-contain mb-2 mx-auto block"
          style={{ display: 'block', maxWidth: '80px' }}
          onError={(e) => e.target.style.display = 'none'} 
        />
        <h1 className="text-xl font-black uppercase w-full">{config.shopName}</h1>
        <p className="text-[12px] leading-tight px-2 w-full">{config.address}</p>
        <p className="text-[13px] font-bold w-full">Hotline: {config.phone}</p>
      </div>

      <div className="border-b-2 border-black mb-3"></div>

      {/* 2. THÔNG TIN KHÁCH HÀNG */}
      <div className="mb-3 space-y-1 text-[13px] print-container">
        <div className="flex justify-between">
          <span className="font-medium">Khách hàng:</span>
          <span className="font-bold uppercase">{data.customerName}</span>
        </div>
        <div className="flex justify-between">
          <span>Điện thoại:</span>
          <span>{data.customerPhone}</span>
        </div>
      </div>

      {/* 3. BẢNG SẢN PHẨM */}
      <table className="w-full mb-4 border-collapse print-container">
        <thead>
          <tr className="border-b-2 border-black text-left uppercase text-[12px] font-black">
            <th style={{ width: "55%" }} className="py-2 text-left">Mặt hàng</th>
            <th style={{ width: "15%" }} className="py-2 text-center">SL</th>
            <th style={{ width: "30%" }} className="py-2 text-right">T.Tiền</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-400">
          {data.products?.map((item, index) => (
            <tr key={index} className="align-top text-[13px]">
              <td className="py-2 pr-1">
                <div className="font-bold uppercase leading-tight">{item.name}</div>
                {(item.discount || 0) > 0 && (
                  <div className="text-[11px] italic">- Giảm: {item.discount.toLocaleString()}đ</div>
                )}
              </td>
              <td className="py-2 text-center font-bold">{item.qty}</td>
              <td className="py-2 text-right font-black">
                {(item.price || 0).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 4. TỔNG CỘNG */}
      <div className="border-t-2 border-black pt-2 space-y-1 print-container">
        <div className="flex justify-between text-[13px]">
          <span>Tạm tính:</span>
          <span className="font-bold">{((data.total || 0) + (data.orderDiscount || 0)).toLocaleString()}đ</span>
        </div>
        {(data.orderDiscount || 0) > 0 && (
          <div className="flex justify-between italic text-[13px]">
            <span>Giảm bill:</span>
            <span>-{(data.orderDiscount || 0).toLocaleString()}đ</span>
          </div>
        )}
        <div className="flex justify-between text-xl font-black uppercase pt-1 border-t border-dashed border-black">
          <span>Tổng cộng:</span>
          <span>{(data.total || 0).toLocaleString()}đ</span>
        </div>
      </div>

      {/* 6. QR CODE */}
      <div className="mt-6 flex flex-col items-center text-center w-full print-container">
        <p className="text-[12px] font-black uppercase mb-1">Thanh toán chuyển khoản</p>
        <img 
          src="/qr-thanh-toan.png" 
          alt="QR" 
          className="w-32 h-32 object-contain mb-3 border border-black p-1 mx-auto block"
          style={{ display: 'block', maxWidth: '128px' }}
          onError={(e) => e.target.style.display = 'none'} 
        />
        <p className="font-black italic uppercase text-sm border-t border-black w-full pt-2">Cảm ơn & Hẹn gặp lại!</p>
        <p className="text-[10px] mt-1 uppercase tracking-tighter">Powered by NguyenTM</p>
      </div>
    </div>
  );
});

export default InvoiceTemplate;