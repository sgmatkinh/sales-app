import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { 
  Search, Calendar, User, Phone, FileText, 
  Trash2, Eye, X, Printer, Save, Edit3, CheckCircle2 
} from "lucide-react";

// IMPORT ĐỂ IN
import InvoiceTemplate from "../components/InvoiceTemplate";
import { useReactToPrint } from "react-to-print";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState(null);

  // Ref dùng để in
  const componentRef = useRef(null);

  useEffect(() => {
    fetchInvoices();
    const savedConfig = localStorage.getItem("shopConfig");
    if (savedConfig) setConfig(JSON.parse(savedConfig));
  }, []);

  const fetchInvoices = () => {
    axios.get("/api/invoices").then(res => setInvoices(res.data));
  };

  const handleShowDetail = (id) => {
    axios.get(`/api/invoices/${id}`).then(res => {
      setSelectedInvoice(res.data);
      setIsEditing(false);
    });
  };

  // CẤU HÌNH HÀM IN
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `In_Lai_Hoa_Don_${selectedInvoice?.id}`,
    onAfterPrint: () => alert("Đã in lại thành công!")
  });

  const handleDelete = async (id) => {
    if (window.confirm("Mày có chắc muốn xóa hóa đơn này không? Mất luôn đó!")) {
      await axios.delete(`/api/invoices/${id}`);
      setSelectedInvoice(null);
      fetchInvoices();
    }
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`/api/invoices/${selectedInvoice.id}`, selectedInvoice);
      alert("Đã cập nhật thành công!");
      setIsEditing(false);
      fetchInvoices();
    } catch (err) {
      alert("Lỗi khi cập nhật!");
    }
  };

  // --- HÀM ĐỊNH DẠNG NGÀY GIỜ: FIX LỆCH 7 TIẾNG VÀ ĐỊNH DẠNG SQLITE ---
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "---";
    
    // Nếu là chuỗi từ SQLite (có dấu cách ở giữa), thay bằng 'T' để JS hiểu đúng múi giờ
    const fixedStr = (typeof dateStr === 'string' && dateStr.includes(' ') && !dateStr.includes('T')) 
      ? dateStr.replace(' ', 'T') 
      : dateStr;

    const d = new Date(fixedStr);
    if (isNaN(d.getTime())) return dateStr;

    // Ép về múi giờ VN và định dạng chuẩn
    return d.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.customer_name?.toLowerCase().includes(search.toLowerCase()) || 
    inv.customer_phone?.includes(search)
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-900">
      
      {/* VÙNG ẨN ĐỂ IN */}
      <div style={{ display: "none" }}>
        <div ref={componentRef}>
          {selectedInvoice && config && (
            <InvoiceTemplate 
              config={config} 
              data={{
                customerName: selectedInvoice.customer_name,
                customerPhone: selectedInvoice.customer_phone,
                note: selectedInvoice.note,
                date: formatDateTime(selectedInvoice.created_at),
                products: selectedInvoice.items.map(i => ({
                  name: i.product_name,
                  qty: i.quantity,
                  price: i.price,
                  discount: i.item_discount || 0
                })),
                orderDiscount: selectedInvoice.discount || 0,
                total: selectedInvoice.final_total
              }} 
            />
          )}
        </div>
      </div>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-800">Lịch sử hóa đơn</h1>
          <p className="text-slate-400 font-medium text-sm">Quản lý và tra cứu các giao dịch bán lẻ</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500 border-none font-bold text-lg"
            placeholder="Tìm tên hoặc SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b">
              <th className="p-6">Ngày tạo</th>
              <th className="p-6">Khách hàng</th>
              <th className="p-6 text-right">Tổng tiền</th>
              <th className="p-6 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredInvoices.map((inv) => {
              // Xử lý tách ngày và giờ từ chuỗi toLocaleString (thường là "dd/mm/yyyy, hh:mm")
              const formatted = formatDateTime(inv.created_at);
              const [datePart, timePart] = formatted.includes(', ') ? formatted.split(', ') : [formatted, ""];

              return (
                <tr key={inv.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="p-6">
                    <div className="font-bold text-slate-700">
                      {datePart}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">
                      {timePart}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="font-black text-slate-800 uppercase text-sm italic">{inv.customer_name}</div>
                    <div className="text-xs text-blue-500 font-bold">{inv.customer_phone}</div>
                  </td>
                  <td className="p-6 text-right">
                    <div className="font-black text-slate-900 text-lg">{(inv.final_total || 0).toLocaleString()}đ</div>
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleShowDetail(inv.id)} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Eye size={18} /></button>
                      <button onClick={() => handleDelete(inv.id)} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL CHI TIẾT */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Header Modal */}
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-2xl"><FileText size={24}/></div>
                <div>
                  <h2 className="text-xl font-black uppercase italic">Hóa đơn #{selectedInvoice.id}</h2>
                  <p className="text-blue-400 text-xs font-black uppercase tracking-widest">
                    Thời gian: {formatDateTime(selectedInvoice.created_at)}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X/></button>
            </div>

            {/* Nội dung Modal */}
            <div className="flex-1 overflow-auto p-8 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-2"><User size={14}/> Khách hàng</h3>
                  <div className="space-y-3">
                    <input disabled={!isEditing} className={`w-full p-4 rounded-2xl font-bold uppercase outline-none transition-all ${isEditing ? 'bg-blue-50 ring-2 ring-blue-200' : 'bg-slate-50'}`} value={selectedInvoice.customer_name} onChange={(e) => setSelectedInvoice({...selectedInvoice, customer_name: e.target.value})}/>
                    <input disabled={!isEditing} className={`w-full p-4 rounded-2xl font-bold outline-none transition-all ${isEditing ? 'bg-blue-50 ring-2 ring-blue-200' : 'bg-slate-50'}`} value={selectedInvoice.customer_phone} onChange={(e) => setSelectedInvoice({...selectedInvoice, customer_phone: e.target.value})}/>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-orange-500 tracking-widest flex items-center gap-2"><FileText size={14}/> Ghi chú</h3>
                  <textarea disabled={!isEditing} className={`w-full p-4 rounded-2xl font-bold text-sm h-full min-h-[100px] outline-none transition-all ${isEditing ? 'bg-orange-50 ring-2 ring-orange-100' : 'bg-slate-50'}`} value={selectedInvoice.note || ""} onChange={(e) => setSelectedInvoice({...selectedInvoice, note: e.target.value})} placeholder="Không có ghi chú..."/>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr className="text-[10px] font-black uppercase text-slate-400 text-center">
                      <th className="p-5 text-left">Sản phẩm</th>
                      <th className="p-5">SL</th>
                      <th className="p-5 text-right">Đơn giá</th>
                      <th className="p-5 text-right">Giảm món</th>
                      <th className="p-5 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {selectedInvoice.items?.map((item, idx) => (
                      <tr key={idx} className="text-sm font-bold text-slate-700">
                        <td className="p-5 uppercase italic">{item.product_name}</td>
                        <td className="p-5 text-center">{item.quantity}</td>
                        <td className="p-5 text-right">{(item.price || 0).toLocaleString()}đ</td>
                        <td className="p-5 text-right text-red-500">-{(item.item_discount || 0).toLocaleString()}đ</td>
                        <td className="p-5 text-right font-black text-slate-900">{(item.total || 0).toLocaleString()}đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-8 bg-white border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex gap-10">
                <div><p className="text-[10px] font-black uppercase text-slate-400">Tạm tính</p><p className="font-bold text-lg">{(selectedInvoice.total || 0).toLocaleString()}đ</p></div>
                <div><p className="text-[10px] font-black uppercase text-red-400">Giảm bill</p><p className="font-bold text-lg text-red-500">{(selectedInvoice.discount || 0).toLocaleString()}đ</p></div>
                <div><p className="text-[10px] font-black uppercase text-blue-600">Thực thu</p><p className="text-4xl font-black italic text-blue-600">{(selectedInvoice.final_total || 0).toLocaleString()}đ</p></div>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                {isEditing ? (
                  <>
                    <button onClick={() => setIsEditing(false)} className="flex-1 md:flex-none px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs">Hủy</button>
                    <button onClick={handleUpdate} className="flex-1 md:flex-none px-8 py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-green-100 flex items-center justify-center gap-2"><CheckCircle2 size={18}/> Lưu</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleDelete(selectedInvoice.id)} className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={20}/></button>
                    <button onClick={() => setIsEditing(true)} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs flex items-center gap-2"><Edit3 size={18}/> Sửa</button>
                    <button onClick={handlePrint} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-blue-200 flex items-center gap-2 hover:scale-105 transition-all"><Printer size={18}/> In lại hóa đơn</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}