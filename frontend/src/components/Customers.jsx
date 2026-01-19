import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedCust, setSelectedCust] = useState(null);

  // 1. Lấy danh sách khách từ API
  useEffect(() => {
    axios.get("/api/customers").then(res => setCustomers(res.data));
  }, []);

  // 2. Khi bấm vào 1 khách, lấy lịch sử và ghi chú
  const showHistory = (c) => {
    setSelectedCust(c);
    axios.get(`/api/customers/${c.phone}/history`)
      .then(res => setHistory(res.data));
  };

  return (
    <div className="flex p-6 gap-6 bg-gray-100 min-h-screen">
      {/* CỘT DANH SÁCH KHÁCH */}
      <div className="w-1/3 bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="p-4 bg-blue-700 text-white font-bold uppercase">Khách hàng</div>
        <div className="divide-y overflow-y-auto h-[500px]">
          {customers.map(c => (
            <div key={c.phone} onClick={() => showHistory(c)} 
                 className={`p-4 cursor-pointer hover:bg-blue-50 ${selectedCust?.phone === c.phone ? 'bg-blue-100' : ''}`}>
              <div className="font-bold">{c.name || "Không tên"}</div>
              <div className="text-sm text-gray-500">{c.phone}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CỘT CHI TIẾT LỊCH SỬ & GHI CHÚ */}
      <div className="flex-1 bg-white shadow-lg rounded-xl p-6">
        {selectedCust ? (
          <>
            <h2 className="text-xl font-black mb-4 uppercase border-b pb-2">
              Lịch sử mua hàng: {selectedCust.name}
            </h2>
            <div className="space-y-4">
              {history.map(h => (
                <div key={h.id} className="border p-4 rounded-lg bg-gray-50 border-l-4 border-l-blue-500">
                  <div className="flex justify-between font-bold text-blue-900">
                    <span>Mã đơn: #{h.id}</span>
                    <span>{Number(h.final_total).toLocaleString()}đ</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Ngày: {new Date(h.created_at).toLocaleString()}</div>
                  
                  {/* PHẦN GHI CHÚ MÀY CẦN ĐÂY */}
                  <div className="mt-2 p-2 bg-yellow-100 border border-yellow-200 rounded text-sm italic">
                    <strong>Ghi chú đơn này:</strong> {h.note || "Trống"}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400 mt-20 italic">Chọn khách hàng để xem chi tiết</div>
        )}
      </div>
    </div>
  );
}