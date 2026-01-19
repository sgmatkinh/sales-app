import React, { useState, useEffect } from "react";
import { 
  FiSave, FiLayout, FiInfo, FiCreditCard, FiEye, 
  FiAlignLeft, FiAlignCenter, FiAlignRight, 
  FiBold, FiItalic, FiUnderline, FiChevronDown, FiType 
} from "react-icons/fi";
import InvoiceTemplate from "../components/InvoiceTemplate";

export default function Settings() {
  const defaultConfig = {
    shopName: "SaigonOptics",
    address: "71 Hiệp Bình - P. Hiệp Bình Phước - Thủ Đức",
    phone: "0707.827.837",
    bankName: "VIB",
    stk: "707.837.837",
    accountHolder: "TỐNG MINH NGUYÊN",
    logoUrl: "/LogoBo.png",
    qrStaticUrl: "",
    themeColor: "#2563eb",
    fontFamily: "'Inter', sans-serif",
    lineHeight: 1.4,
    items: {
      logo: { show: true, size: 60, align: "center" },
      shopName: { show: true, size: 22, align: "center", bold: true, italic: false, underline: false },
      shopAddress: { show: true, size: 12, align: "center", bold: false, italic: false, underline: false },
      shopPhone: { show: true, size: 12, align: "center", bold: true, italic: false, underline: false },
      invoiceTitle: { show: true, size: 18, align: "center", bold: true, italic: false, underline: false },
      customerName: { show: true, size: 13, align: "left", bold: true, italic: false, underline: false },
      customerInfo: { show: true, size: 12, align: "left", bold: false, italic: false, underline: false },
      productTable: { show: true, size: 14, align: "left", bold: false, italic: false, underline: false },
      productDiscount: { show: true, size: 11, align: "right", bold: false, italic: true, underline: false },
      totalSection: { show: true, size: 16, align: "right", bold: true, italic: false, underline: false },
      orderDiscount: { show: true, size: 14, align: "right", bold: false, italic: false, underline: false },
      qrCode: { show: true, size: 120, align: "center" },
      bankInfo: { show: true, size: 12, align: "center", bold: true, italic: false, underline: false },
      footer: { show: true, size: 11, align: "center", bold: false, italic: true, underline: false }
    }
  };

  const [config, setConfig] = useState(defaultConfig);
  const [activeTab, setActiveTab] = useState("info");
  const [editingKey, setEditingKey] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("shopConfig");
    if (saved) {
      const parsed = JSON.parse(saved);
      setConfig(prev => ({
        ...prev,
        ...parsed,
        items: { ...prev.items, ...(parsed.items || {}) }
      }));
    }
  }, []);

  const save = () => {
    localStorage.setItem("shopConfig", JSON.stringify(config));
    alert("🚀 Cấu hình đã được áp dụng toàn hệ thống!");
    window.location.reload(); 
  };

  const updateItem = (key, field, value) => {
    setConfig(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [key]: { ...prev.items[key], [field]: value }
      }
    }));
  };

  return (
    <div className="p-8 bg-[#F8FAFC] min-h-screen font-sans text-slate-900">
      {/* CSS INLINE ĐỂ BỎ SCROLLBAR */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* BÊN TRÁI: CÀI ĐẶT */}
        <div className="flex-1 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-blue-100/50 border border-white">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Thiết Lập Giao Diện</h2>
                <p className="text-slate-400 text-sm font-bold">Thiết kế hóa đơn chuyên nghiệp</p>
              </div>
              <button 
                onClick={save} 
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl font-black shadow-[0_10px_20px_-5px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_25px_-5px_rgba(59,130,246,0.4)] hover:from-blue-600 hover:to-blue-500 transition-all active:scale-90"
              >
                <FiSave size={20} /> LƯU LẠI
              </button>
            </div>

            <div className="flex gap-2 p-1.5 bg-slate-100 rounded-[1.5rem] mb-8 shadow-inner">
              <TabBtn active={activeTab === "info"} onClick={() => setActiveTab("info")} icon={<FiInfo />} label="Cơ bản" />
              <TabBtn active={activeTab === "design"} onClick={() => setActiveTab("design")} icon={<FiLayout />} label="Bố cục" />
              <TabBtn active={activeTab === "payment"} onClick={() => setActiveTab("payment")} icon={<FiCreditCard />} label="Ngân hàng" />
            </div>

            {/* TAB: THÔNG TIN */}
            {activeTab === "info" && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
                <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="Tên cửa hàng" value={config.shopName} onChange={v => setConfig({...config, shopName: v})} />
                    <InputGroup label="Số điện thoại" value={config.phone} onChange={v => setConfig({...config, phone: v})} />
                </div>
                <InputGroup label="Địa chỉ cửa hàng" value={config.address} onChange={v => setConfig({...config, address: v})} />
                
                <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2 block mb-2 tracking-widest">Kiểu chữ (Font)</label>
                        <select 
                            className="w-full p-4 bg-white rounded-2xl border-none shadow-sm font-bold outline-none ring-2 ring-transparent focus:ring-blue-500 transition-all cursor-pointer"
                            value={config.fontFamily}
                            onChange={(e) => setConfig({...config, fontFamily: e.target.value})}
                        >
                            <option value="'Inter', sans-serif">Hiện đại (Inter)</option>
                            <option value="'Oswald', sans-serif">Mạnh mẽ (Oswald)</option>
                            <option value="'Courier New', monospace">Máy tính cũ (Courier)</option>
                            <option value="'Be Vietnam Pro', sans-serif">Tiếng Việt chuẩn</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2 block mb-2 tracking-widest">Màu thương hiệu</label>
                        <div className="flex gap-3 items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                            <input type="color" className="w-12 h-10 rounded-xl cursor-pointer border-none" value={config.themeColor} onChange={e => setConfig({...config, themeColor: e.target.value})} />
                            <span className="font-mono font-bold text-sm uppercase text-slate-600">{config.themeColor}</span>
                        </div>
                    </div>
                </div>
              </div>
            )}

            {/* TAB: THIẾT KẾ BỐ CỤC */}
            {activeTab === "design" && (
              <div className="space-y-3 animate-in fade-in">
                <div className="p-6 bg-blue-50 rounded-[2rem] flex items-center justify-between mb-6 shadow-sm border border-blue-100">
                  <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Độ giãn dòng</p>
                    <p className="text-xs text-blue-400 font-bold">Tối ưu hóa không gian in</p>
                  </div>
                  <input type="range" min="1" max="2.5" step="0.1" className="w-48 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600" value={config.lineHeight} onChange={e => setConfig({...config, lineHeight: e.target.value})} />
                </div>

                <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[500px] pr-2 no-scrollbar">
                    {Object.keys(config.items).map(key => (
                    <div key={key} className={`transition-all duration-300 rounded-[1.8rem] border ${editingKey === key ? 'bg-white border-blue-200 shadow-xl' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button 
                                  onClick={() => setEditingKey(editingKey === key ? null : key)} 
                                  className={`p-2.5 rounded-xl transition-all shadow-sm ${editingKey === key ? 'bg-blue-600 text-white rotate-180 shadow-blue-200' : 'bg-white text-slate-400 hover:text-blue-500'}`}
                                >
                                    <FiChevronDown size={18} />
                                </button>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{key.replace(/([A-Z])/g, ' $1')}</p>
                                    <p className="text-sm font-bold text-slate-700">Size: {config.items[key].size}px</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="relative inline-flex items-center cursor-pointer scale-110">
                                    <input type="checkbox" className="sr-only peer" checked={config.items[key].show} onChange={e => updateItem(key, "show", e.target.checked)} />
                                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5 shadow-inner"></div>
                                </label>
                            </div>
                        </div>
                        {editingKey === key && (
                        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-wrap gap-8 animate-in slide-in-from-top-2 duration-300">
                            <div className="space-y-3">
                                <p className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-1"><FiType/> Cỡ chữ</p>
                                <input type="number" className="w-20 p-3 bg-white border-none shadow-md rounded-xl font-black text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none" value={config.items[key].size} onChange={e => updateItem(key, "size", Number(e.target.value))} />
                            </div>
                            <div className="space-y-3">
                                <p className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-1"><FiAlignLeft/> Căn lề</p>
                                <div className="flex bg-white rounded-xl p-1 shadow-md border border-slate-100">
                                    <StyleBtn active={config.items[key].align === "left"} onClick={() => updateItem(key, "align", "left")} icon={<FiAlignLeft />} />
                                    <StyleBtn active={config.items[key].align === "center"} onClick={() => updateItem(key, "align", "center")} icon={<FiAlignCenter />} />
                                    <StyleBtn active={config.items[key].align === "right"} onClick={() => updateItem(key, "align", "right")} icon={<FiAlignRight />} />
                                </div>
                            </div>
                            {key !== 'logo' && key !== 'qrCode' && (
                            <div className="space-y-3">
                                <p className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-1"><FiBold/> Định dạng</p>
                                <div className="flex bg-white rounded-xl p-1 shadow-md border border-slate-100 gap-1">
                                    <StyleBtn active={config.items[key].bold} onClick={() => updateItem(key, "bold", !config.items[key].bold)} icon={<FiBold />} />
                                    <StyleBtn active={config.items[key].italic} onClick={() => updateItem(key, "italic", !config.items[key].italic)} icon={<FiItalic />} />
                                    <StyleBtn active={config.items[key].underline} onClick={() => updateItem(key, "underline", !config.items[key].underline)} icon={<FiUnderline />} />
                                </div>
                            </div>
                            )}
                        </div>
                        )}
                    </div>
                    ))}
                </div>
              </div>
            )}

            {/* TAB: THANH TOÁN */}
            {activeTab === "payment" && (
              <div className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <InputGroup label="Tên Ngân hàng" value={config.bankName} onChange={v => setConfig({...config, bankName: v})} />
                  <InputGroup label="Số tài khoản" value={config.stk} onChange={v => setConfig({...config, stk: v})} />
                </div>
                <InputGroup label="Tên chủ tài khoản" value={config.accountHolder} onChange={v => setConfig({...config, accountHolder: v})} />
                <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-[2rem] border border-amber-100 shadow-sm">
                    <p className="text-xs font-black text-amber-700 mb-2 uppercase tracking-widest flex items-center gap-2">
                      <FiInfo /> Lưu ý về QR Code
                    </p>
                    <p className="text-xs text-amber-600/80 font-bold leading-relaxed">Nếu không nhập "Link QR tĩnh", hệ thống sẽ tự sinh QR theo tài khoản ngân hàng trên bằng chuẩn VietQR.</p>
                </div>
                <InputGroup label="Link QR tĩnh (Nếu có)" value={config.qrStaticUrl} onChange={v => setConfig({...config, qrStaticUrl: v})} />
              </div>
            )}
          </div>
        </div>

        {/* BÊN PHẢI: PREVIEW K80 */}
        <div className="lg:w-[450px]">
           <div className="sticky top-8">
                <div className="bg-slate-900 p-6 rounded-t-[3rem] flex items-center justify-between text-white shadow-2xl">
                    <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em]"><FiEye className="text-blue-400 animate-pulse" /> BẢN XEM TRƯỚC K80</span>
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
                    </div>
                </div>
                <div className="bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] rounded-b-[3rem] overflow-hidden border-x border-b border-slate-200">
                    <div className="p-3 bg-slate-50 border-b border-dashed border-slate-200 text-[10px] text-center font-black text-slate-400 uppercase tracking-[0.3em]">Khổ giấy in nhiệt 80mm</div>
                    <div className="p-4 overflow-y-auto max-h-[70vh] no-scrollbar bg-white">
                        <InvoiceTemplate 
                            config={config} 
                            data={{
                                id: "8888",
                                customerName: "KHÁCH HÀNG MẪU",
                                customerPhone: "090.123.4567",
                                date: new Date().toLocaleString(),
                                products: [
                                    { name: "Tròng kính chống ánh sáng xanh", qty: 1, price: 450000, discount: 0 },
                                    { name: "Gọng kính kim loại Hàn Quốc", qty: 1, price: 350000, discount: 50000 }
                                ],
                                total: 750000,
                                orderDiscount: 50000,
                                note: "Giao hàng nhanh trong giờ hành chính"
                            }} 
                        />
                    </div>
                </div>
           </div>
        </div>

      </div>
    </div>
  );
}

// CÁC COMPONENT PHỤ
function TabBtn({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.2rem] font-black text-xs uppercase tracking-tight transition-all duration-300 ${active ? "bg-white text-blue-600 shadow-[0_10px_20px_-5px_rgba(59,130,246,0.2)] scale-[1.05] ring-1 ring-slate-200/50" : "text-slate-400 hover:text-slate-600 hover:bg-white/50"}`}
    >
      {React.cloneElement(icon, { size: 18 })} {label}
    </button>
  );
}

function StyleBtn({ active, onClick, icon }) {
  return (
    <button 
      onClick={onClick} 
      className={`p-3 rounded-xl transition-all duration-200 ${active ? "bg-slate-900 text-white shadow-lg scale-110 ring-4 ring-slate-100" : "text-slate-300 hover:bg-slate-100 hover:text-slate-600 active:scale-90"}`}
    >
      {icon}
    </button>
  );
}

function InputGroup({ label, value, onChange }) {
  return (
    <div className="space-y-2 group">
      <label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest group-focus-within:text-blue-500 transition-colors">{label}</label>
      <input 
        className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white focus:shadow-[0_10px_20px_-10px_rgba(59,130,246,0.1)] rounded-2xl outline-none font-bold text-slate-700 transition-all shadow-inner" 
        value={value} 
        onChange={e => onChange(e.target.value)} 
      />
    </div>
  );
}