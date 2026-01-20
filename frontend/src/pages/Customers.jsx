import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Search, User, Phone, ShoppingBag, Calendar, MessageSquare, FileUp, FileDown, Download, Star, Crown, Edit3, X, Save, Filter, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [history, setHistory] = useState([]);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({ name: "", phone: "", oldPhone: "" });
  const [filterType, setFilterType] = useState("all");

  const fileInputRef = useRef(null);

  // Load dữ liệu và sắp xếp người mới lên đầu
  const loadAndFixData = async () => {
    try {
      const res = await axios.get("/api/customers");
      // SẮP XẾP: Đảo ngược mảng để người mới nhất (ID cao nhất) lên đầu
      const baseCustomers = res.data.reverse(); 
      
      const fixedCustomers = await Promise.all(
        baseCustomers.map(async (c) => {
          try {
            const historyRes = await axios.get(`/api/customers/${c.phone}/history`);
            const realTotal = historyRes.data.reduce((sum, inv) => sum + (inv.final_total || 0), 0);
            return { ...c, total_spent: realTotal };
          } catch { return { ...c, total_spent: 0 }; }
        })
      );
      setCustomers(fixedCustomers);
    } catch (err) { console.error("Lỗi tải dữ liệu:", err); }
  };

  useEffect(() => {
    loadAndFixData();
  }, []);

  const fetchHistory = (customer) => {
    setSelectedPhone(customer.phone);
    setSelectedCustomer(customer);
    axios.get(`/api/customers/${customer.phone}/history`).then(res => {
      // Sắp xếp lịch sử giao dịch: Đơn mới nhất lên trên cùng
      const sortedHistory = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setHistory(sortedHistory);
      const actualTotal = res.data.reduce((sum, inv) => sum + (inv.final_total || 0), 0);
      setSelectedCustomer(prev => ({ ...prev, total_spent: actualTotal }));
    });
  };

  // --- XỬ LÝ CHỈNH SỬA ---
  const handleOpenEdit = (customer) => {
    const target = customer || selectedCustomer;
    setEditData({ name: target.name, phone: target.phone, oldPhone: target.phone });
    setIsEditModalOpen(true);
  };

  const handleUpdateCustomer = async () => {
    try {
      await axios.put(`/api/customers/${editData.oldPhone}`, {
        name: editData.name,
        phone: editData.phone
      });
      
      // Cập nhật lại danh sách tại chỗ
      setCustomers(prev => prev.map(c => 
        c.phone === editData.oldPhone ? { ...c, name: editData.name, phone: editData.phone } : c
      ));

      if (selectedPhone === editData.oldPhone) {
        setSelectedPhone(editData.phone);
        setSelectedCustomer(prev => ({ ...prev, name: editData.name, phone: editData.phone }));
      }

      setIsEditModalOpen(false);
      alert("Cập nhật thành công!");
    } catch (err) { alert("Lỗi khi cập nhật!"); }
  };

  // --- XỬ LÝ XÓA ---
  const handleDeleteCustomer = async (e, customer) => {
    e.stopPropagation(); 
    if (!window.confirm(`Xóa khách hàng ${customer.name || customer.phone}? Toàn bộ lịch sử mua hàng sẽ bị xóa vĩnh viễn!`)) return;
    
    try {
      await axios.delete(`/api/customers/${customer.phone}`);
      setCustomers(prev => prev.filter(item => item.phone !== customer.phone));
      
      if (selectedPhone === customer.phone) {
        setSelectedPhone(null);
        setSelectedCustomer(null);
        setHistory([]);
      }
      
      alert("Đã xóa khách hàng thành công!");
    } catch (err) { 
        console.error("Lỗi xóa:", err);
        alert("Không thể xóa!"); 
    }
  };

  // --- EXCEL ---
  const downloadTemplate = () => {
    const template = [{ "Họ tên": "Nguyễn Văn A", "Số điện thoại": "0901234567" }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau");
    XLSX.writeFile(wb, "Mau_Khach_Hang.xlsx");
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(customers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DanhSach");
    XLSX.writeFile(wb, "Danh_Sach_Khach_Hang.xlsx");
  };

  // Logic filter và hiển thị
  const filteredCustomers = customers
    .filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone?.includes(searchTerm))
    .filter(c => filterType === "all" || (filterType === "vip" && c.total_spent > 5000000));

  return (
    <div className="p-8 bg-[#F1F5F9] min-h-screen flex gap-8 font-sans text-slate-900 relative">
      
      {/* MODAL SỬA */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-800 uppercase italic">Sửa thông tin</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={24}/></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Họ và tên</label>
                <input value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold"/>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Số điện thoại</label>
                <input value={editData.phone} onChange={(e) => setEditData({...editData, phone: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold"/>
              </div>
              <button onClick={handleUpdateCustomer} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
                <Save size={20}/> Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DANH SÁCH BÊN TRÁI */}
      <div className="w-[420px] bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white flex flex-col overflow-hidden">
        <div className="p-7 border-b border-slate-100">
          <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2 italic">
            <Star className="text-amber-400 fill-amber-400" size={24} /> KHÁCH HÀNG
          </h2>
          <div className="flex gap-2 mb-6">
            <button onClick={downloadTemplate} className="flex-1 flex flex-col items-center gap-1 bg-slate-100 py-3 rounded-2xl hover:bg-slate-200 transition-all"><Download size={18} /><span className="text-[10px] font-black uppercase">Mẫu</span></button>
            <button onClick={() => fileInputRef.current.click()} className="flex-1 flex flex-col items-center gap-1 bg-emerald-50 text-emerald-600 py-3 rounded-2xl hover:bg-emerald-100 transition-all"><FileUp size={18} /><span className="text-[10px] font-black uppercase">Nhập</span></button>
            <button onClick={exportToExcel} className="flex-1 flex flex-col items-center gap-1 bg-blue-50 text-blue-600 py-3 rounded-2xl hover:bg-blue-100 transition-all"><FileDown size={18} /><span className="text-[10px] font-black uppercase">Xuất</span></button>
            <input type="file" ref={fileInputRef} className="hidden" />
          </div>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setFilterType("all")} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase border ${filterType === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-400 border-slate-100'}`}>Tất cả ({customers.length})</button>
            <button onClick={() => setFilterType("vip")} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase border ${filterType === 'vip' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-100' : 'bg-white text-slate-400 border-slate-100'}`}>Hạng VIP</button>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder="Tìm kiếm tên hoặc SĐT..." className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner" onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filteredCustomers.length > 0 ? filteredCustomers.map(c => (
            <div 
              key={c.phone} 
              onClick={() => fetchHistory(c)} 
              className={`group p-4 rounded-3xl cursor-pointer transition-all flex items-center justify-between border relative ${selectedPhone === c.phone ? 'bg-blue-600 text-white shadow-xl scale-[1.02]' : 'bg-white text-slate-700 border-transparent hover:bg-blue-50'}`}
            >
              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl border-2 ${selectedPhone === c.phone ? 'bg-white/20 border-white/30' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                  {c.name ? c.name.charAt(0).toUpperCase() : "K"}
                </div>
                <div>
                  <p className="font-black text-sm truncate w-24 uppercase">{c.name || "Khách lẻ"}</p>
                  <p className="text-[10px] opacity-70">{c.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 relative z-10">
                <div className={`flex gap-1 transition-all duration-300 ${selectedPhone === c.phone ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(c); }} className={`p-2 rounded-xl ${selectedPhone === c.phone ? 'bg-white/20 hover:bg-white/40' : 'bg-slate-100 hover:bg-blue-100 text-slate-400 hover:text-blue-600'}`}><Edit3 size={14}/></button>
                  <button onClick={(e) => handleDeleteCustomer(e, c)} className={`p-2 rounded-xl ${selectedPhone === c.phone ? 'bg-white/20 hover:bg-red-500' : 'bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500'}`}><Trash2 size={14}/></button>
                </div>
                <div className="text-right ml-2 min-w-[60px]">
                  <p className="text-[8px] font-black uppercase opacity-60">Tổng chi</p>
                  <p className="font-black text-xs">{(c.total_spent || 0).toLocaleString()}đ</p>
                </div>
              </div>
            </div>
          )) : <div className="text-center py-10 text-slate-400 text-sm italic">Không tìm thấy khách hàng</div>}
        </div>
      </div>

      {/* CHI TIẾT BÊN PHẢI */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedCustomer ? (
          <>
            <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-white mb-6 flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-[2rem] bg-blue-600 text-white flex items-center justify-center shadow-lg"><User size={40} /></div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-black text-slate-800 uppercase italic">{selectedCustomer.name}</h1>
                    {selectedCustomer.total_spent > 5000000 && <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1"><Crown size={12}/> VIP</span>}
                  </div>
                  <div className="text-slate-500 font-bold flex items-center gap-2"><Phone size={14} className="text-blue-500"/> {selectedCustomer.phone}</div>
                </div>
              </div>
              <div className="text-right border-l pl-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tích lũy trọn đời</p>
                <p className="text-4xl font-black text-blue-700 italic">{(selectedCustomer.total_spent || 0).toLocaleString()}đ</p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-8 shadow-2xl border border-white flex-1 overflow-hidden flex flex-col">
              <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2 uppercase italic tracking-tight"><Calendar size={20} className="text-blue-600"/> Lịch sử giao dịch</h3>
              <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                {history.map((inv) => (
                  <div key={inv.id} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-4">
                      <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-black">MÃ ĐƠN #{inv.id}</span>
                      <span className="text-2xl font-black text-blue-800 italic">{inv.final_total.toLocaleString()}đ</span>
                    </div>
                    <p className="text-xs text-slate-400 font-bold mb-4">{new Date(inv.created_at).toLocaleString("vi-VN")}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {inv.items?.map((item, i) => (
                        <div key={i} className="bg-slate-50 p-3 rounded-xl flex justify-between text-xs font-bold">
                          <span>{item.product_name} <span className="text-blue-500">x{item.quantity}</span></span>
                          <span className="text-slate-400">{(item.price * item.quantity).toLocaleString()}đ</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="h-full bg-white/40 rounded-[3rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
             <User size={64} className="mb-4 opacity-20" />
             <p className="font-black uppercase italic tracking-widest">Chọn khách hàng để xem chi tiết</p>
          </div>
        )}
      </div>
    </div>
  );
}