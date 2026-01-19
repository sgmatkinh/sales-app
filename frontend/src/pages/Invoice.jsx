import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Trash2, Search, User, Phone, CreditCard, Printer, Save, ShoppingCart, StickyNote, Calendar, Camera, X } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode"; // 1. Thêm dòng này

// 1. IMPORT TEMPLATE VÀ THƯ VIỆN IN
import InvoiceTemplate from "../components/InvoiceTemplate";
import { useReactToPrint } from "react-to-print";

export default function Invoice() {
  const [products, setProducts] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [showCustSuggest, setShowCustSuggest] = useState(false);
  const [showNameSuggest, setShowNameSuggest] = useState(false);
  const [showScanner, setShowScanner] = useState(false); // 2. State ẩn hiện camera

  // --- PHẦN GIỮ NGUYÊN LOGIC STATE ---
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("draft_cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [customer, setCustomer] = useState(() => {
    const saved = localStorage.getItem("draft_customer");
    return saved ? JSON.parse(saved) : { name: "", phone: "" };
  });
  const [note, setNote] = useState(() => {
    return localStorage.getItem("draft_note") || "";
  });
  const [orderDiscount, setOrderDiscount] = useState(() => {
    return Number(localStorage.getItem("draft_orderDiscount")) || 0;
  });
  const [discountType, setDiscountType] = useState(() => {
    return localStorage.getItem("draft_discountType") || "money";
  });
  const [saleDate, setSaleDate] = useState(() => {
    return localStorage.getItem("draft_saleDate") || new Date().toISOString().slice(0, 16);
  });

  const [config, setConfig] = useState(null);
  const componentRef = useRef(null);
  const searchRef = useRef(null);
  const custSearchRef = useRef(null);
  const barcodeBuffer = useRef("");

  // --- LOGIC QUÉT BARCODE BẰNG CAMERA ---
  useEffect(() => {
    let scanner = null;
    if (showScanner) {
      scanner = new Html5QrcodeScanner("reader", {
        fps: 10,
        qrbox: { width: 250, height: 150 },
      }, false);

      scanner.render((decodedText) => {
        handleBarcodeScan(decodedText);
        setShowScanner(false);
        scanner.clear();
      }, (error) => { /* Quét trượt kệ nó */ });
    }
    return () => { if (scanner) scanner.clear().catch(e => console.error(e)); };
  }, [showScanner]);

  // --- PHẦN GIỮ NGUYÊN LOGIC EFFECT ---
  useEffect(() => {
    localStorage.setItem("draft_cart", JSON.stringify(cart));
    localStorage.setItem("draft_customer", JSON.stringify(customer));
    localStorage.setItem("draft_note", note);
    localStorage.setItem("draft_orderDiscount", orderDiscount);
    localStorage.setItem("draft_discountType", discountType);
    localStorage.setItem("draft_saleDate", saleDate);
  }, [cart, customer, note, orderDiscount, discountType, saleDate]);

  useEffect(() => {
    axios.get("/api/products").then(res => setProducts(res.data));
    axios.get("/api/customers").then(res => setAllCustomers(res.data));
    const saved = localStorage.getItem("shopConfig");
    if (saved) setConfig(JSON.parse(saved));

    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggest(false);
      if (custSearchRef.current && !custSearchRef.current.contains(e.target)) {
        setShowCustSuggest(false);
        setShowNameSuggest(false);
      }
    };

    const handleGlobalKeyDown = (e) => {
      if (e.target.tagName === "INPUT" && e.target !== searchRef.current?.querySelector('input')) return;
      if (e.target.tagName === "TEXTAREA") return;
      if (e.key === "Enter") {
        if (barcodeBuffer.current.length > 2) handleBarcodeScan(barcodeBuffer.current);
        barcodeBuffer.current = ""; 
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);

  // --- GIỮ NGUYÊN TẤT CẢ CÁC HÀM LOGIC ---
  const handleBarcodeScan = async (sku) => {
    try {
      const res = await axios.get(`/api/products/find-by-sku/${sku}`);
      if (res.data) addToCart(res.data);
    } catch (err) { console.log("Không tìm thấy mã:", sku); }
  };

  const addToCart = (p) => {
    const exist = cart.find(i => i.id === p.id);
    if (exist) {
      setCart(prev => prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCart(prev => [...prev, { ...p, qty: 1, discount: 0, discType: "percent" }]);
    }
    setSearch("");
    setShowSuggest(false);
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(item => item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item));
  };

  const updateItemDiscount = (id, field, value) => {
    setCart(cart.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const getItemFinalPrice = (item) => {
    const totalRaw = item.price * item.qty;
    const disc = item.discType === "percent" ? (totalRaw * (item.discount || 0)) / 100 : (item.discount || 0);
    return Math.max(0, totalRaw - disc);
  };

  const subTotal = cart.reduce((s, i) => s + getItemFinalPrice(i), 0);
  const actualDiscountValue = discountType === "money" ? orderDiscount : (subTotal * orderDiscount) / 100;
  const finalTotal = Math.max(0, subTotal - actualDiscountValue);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Hoa_Don_${customer.phone || 'Le'}`,
    onAfterPrint: () => {
        alert("Đã in và lưu đơn thành công!");
        resetForm();
    }
  });

  const resetForm = () => {
    setCart([]); setCustomer({ name: "", phone: "" }); setNote(""); setOrderDiscount(0);
    setSaleDate(new Date().toISOString().slice(0, 16));
    localStorage.removeItem("draft_cart"); localStorage.removeItem("draft_customer");
    localStorage.removeItem("draft_note"); localStorage.removeItem("draft_orderDiscount");
    localStorage.removeItem("draft_discountType"); localStorage.removeItem("draft_saleDate");
  };

  const sendEmailNotification = (invoiceData, serverInvoiceId) => {
    axios.post("/api/send-invoice-email", {
      invoiceId: serverInvoiceId || "MỚI",
      total: invoiceData.total,
      discount: invoiceData.discount,
      final_total: invoiceData.final_total,
      customerName: invoiceData.customer_name,
      items: invoiceData.items,
      saleDate: invoiceData.created_at
    }).catch(err => console.error("Lỗi gửi mail:", err));
  };

  const handleAction = async (isPrint) => {
    if (cart.length === 0) return alert("Giỏ hàng đang trống mày ơi!");
    const invoiceData = {
      customer_name: customer.name || "Khách lẻ",
      customer_phone: customer.phone || "N/A",
      note: note, total: subTotal, discount: actualDiscountValue, final_total: finalTotal, created_at: saleDate,
      items: cart.map(item => {
        const itemDiscValue = item.discType === "percent" ? (item.price * item.qty * (item.discount || 0) / 100) : (item.discount || 0);
        return { product_id: item.id, product_name: item.name, quantity: item.qty, price: item.price, item_discount: itemDiscValue, total: (item.price * item.qty) - itemDiscValue };
      })
    };
    try {
      const res = await axios.post("/api/invoices", invoiceData);
      sendEmailNotification(invoiceData, res.data?.id);
      if (isPrint) {
        const saved = localStorage.getItem("shopConfig");
        if (saved) { setConfig(JSON.parse(saved)); setTimeout(() => handlePrint(), 100); } else handlePrint();
      } else { alert("Lưu đơn thành công!"); resetForm(); }
    } catch (err) { alert("Lỗi lưu đơn rồi mày!"); }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 p-3 lg:p-6 bg-slate-50 min-h-screen lg:h-screen lg:overflow-hidden font-sans text-slate-900">
      
      {/* MODAL QUÉT BARCODE CHO MOBILE */}
      {showScanner && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
          <button onClick={() => setShowScanner(false)} className="absolute top-5 right-5 text-white p-3 bg-red-600 rounded-full shadow-lg">
            <X size={24}/>
          </button>
          <div id="reader" className="w-full max-w-sm rounded-2xl overflow-hidden bg-white shadow-2xl border-4 border-blue-500"></div>
          <p className="text-white font-black mt-6 uppercase tracking-widest animate-pulse">Đưa mã vạch vào khung</p>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* PHẦN IN ẤN GIỮ NGUYÊN */}
      <div style={{ display: "none" }}>
        <div ref={componentRef}>
            {config && (
                <InvoiceTemplate config={config} data={{
                    customerName: customer.name || "Khách lẻ",
                    customerPhone: customer.phone || "N/A",
                    note: note, date: new Date(saleDate).toLocaleString('vi-VN'),
                    products: cart.map(i => {
                        const discVal = i.discType === "percent" ? (i.price * i.qty * (i.discount || 0) / 100) : (i.discount || 0);
                        return { name: i.name, qty: i.qty, price: Number(i.price), discount: discVal };
                    }),
                    orderDiscount: actualDiscountValue, total: finalTotal
                }} />
            )}
        </div>
      </div>

      {/* BÊN TRÁI: GIỎ HÀNG */}
      <div className="flex-1 flex flex-col gap-4 lg:gap-6 min-h-0">
        <div className="bg-white p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] shadow-sm border border-slate-100 flex-shrink-0" ref={searchRef}>
          <div className="flex items-center gap-3 mb-4 lg:mb-6">
            <div className="p-2 lg:p-3 bg-blue-600 rounded-xl lg:rounded-2xl text-white shadow-lg shadow-blue-200"><ShoppingCart size={20}/></div>
            <h2 className="text-lg lg:text-xl font-black text-slate-800 uppercase italic">Bán hàng lẻ</h2>
            
            {/* NÚT CAMERA CHO MOBILE */}
            <button 
              onClick={() => setShowScanner(true)}
              className="ml-auto lg:hidden flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-xl font-black text-[10px] shadow-lg active:scale-95"
            >
              <Camera size={16}/> QUÉT MÃ
            </button>
            <span className="hidden lg:block ml-auto text-[8px] lg:text-[10px] bg-green-100 text-green-600 px-2 lg:px-3 py-1 rounded-full font-bold animate-pulse">SCANNER READY</span>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              className="w-full pl-11 pr-4 py-3 lg:py-4 bg-slate-50 rounded-xl lg:rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 border-none text-base lg:text-lg font-bold" 
              placeholder="Tên kính hoặc Barcode..." 
              value={search} 
              onChange={e => {setSearch(e.target.value); setShowSuggest(true)}}
              onKeyDown={(e) => e.key === 'Enter' && search.length > 0 && handleBarcodeScan(search)}
            />
            {showSuggest && search && (
              <div className="absolute bg-white border border-slate-100 w-full mt-2 rounded-xl shadow-2xl z-50 max-h-60 overflow-auto no-scrollbar divide-y divide-slate-50">
                {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))).map(p => (
                  <div key={p.id} className="p-3 lg:p-4 hover:bg-blue-50 cursor-pointer flex justify-between items-center" onClick={() => addToCart(p)}>
                    <div>
                      <div className="font-bold text-sm lg:text-base text-slate-700">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{p.sku ? `SKU: ${p.sku} | ` : ""}Tồn: {p.stock}</div>
                    </div>
                    <div className="text-blue-600 font-black text-sm lg:text-base">{Number(p.price).toLocaleString()}đ</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BẢNG GIỎ HÀNG */}
        <div className="bg-white rounded-[1.5rem] lg:rounded-[2.5rem] shadow-sm border border-slate-100 flex-1 overflow-hidden flex flex-col">
          <div className="overflow-x-auto lg:overflow-y-auto flex-1 no-scrollbar">
            <table className="w-full min-w-[600px] lg:min-w-full">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b text-center">
                  <th className="p-3 lg:p-5 text-left">Sản phẩm</th>
                  <th className="p-3 lg:p-5">Số lượng</th>
                  <th className="p-3 lg:p-5">Giảm giá</th>
                  <th className="p-3 lg:p-5 text-right">Tổng</th>
                  <th className="p-3 lg:p-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cart.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition-all group">
                    <td className="p-3 lg:p-5 text-left">
                      <div className="font-black text-slate-800 uppercase text-xs lg:text-sm italic truncate max-w-[150px] lg:max-w-none">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold">{item.price.toLocaleString()}đ</div>
                    </td>
                    <td className="p-3 lg:p-5 text-center">
                      <div className="flex items-center justify-center gap-1 bg-slate-100 p-1 rounded-lg w-fit mx-auto">
                          <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center bg-white rounded-md lg:rounded-lg shadow-sm font-black">-</button>
                          <span className="font-black text-slate-700 px-2 text-sm">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center bg-white rounded-md lg:rounded-lg shadow-sm font-black">+</button>
                      </div>
                    </td>
                    <td className="p-3 lg:p-5 text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <div className="flex bg-slate-100 p-0.5 lg:p-1 rounded-lg border border-slate-200">
                          <button onClick={() => updateItemDiscount(item.id, "discType", "percent")} className={`px-1.5 py-0.5 rounded-md text-[8px] lg:text-[10px] font-black ${item.discType === 'percent' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>%</button>
                          <button onClick={() => updateItemDiscount(item.id, "discType", "money")} className={`px-1.5 py-0.5 rounded-md text-[8px] lg:text-[10px] font-black ${item.discType === 'money' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Đ</button>
                        </div>
                        <input type="number" className="w-14 lg:w-20 bg-slate-50 border-none rounded-lg text-right p-1.5 font-black text-[10px] lg:text-xs outline-none text-blue-600" value={item.discount || ""} placeholder="0" onChange={(e) => updateItemDiscount(item.id, "discount", Number(e.target.value))} />
                      </div>
                    </td>
                    <td className="p-3 lg:p-5 text-right font-black text-slate-800 text-sm">{getItemFinalPrice(item).toLocaleString()}đ</td>
                    <td className="p-3 lg:p-5 text-center">
                      <button onClick={() => setCart(cart.filter((_, idx) => idx !== index))} className="text-slate-200 hover:text-red-500"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* BÊN PHẢI: THANH TOÁN */}
      <div className="w-full lg:w-[380px] flex flex-col gap-4 lg:gap-6 lg:overflow-y-auto no-scrollbar">
        <div className="bg-white p-5 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] shadow-sm border border-slate-100 flex-shrink-0" ref={custSearchRef}>
          <h2 className="font-black uppercase italic text-xs mb-4 text-blue-600 flex items-center gap-2"><User size={16}/> Khách hàng & Thời gian</h2>
          <div className="space-y-3">
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="datetime-local" className="w-full pl-11 pr-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl outline-none font-bold text-xs border border-blue-100" value={saleDate} onChange={e => setSaleDate(e.target.value)} />
            </div>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input className="w-full pl-11 pr-4 py-2.5 bg-slate-50 rounded-xl outline-none font-bold uppercase text-xs" placeholder="Tên khách..." value={customer.name} onChange={e => {setCustomer({...customer, name: e.target.value}); setShowNameSuggest(true)}} />
              {showNameSuggest && customer.name && (
                <div className="absolute z-20 bg-white border w-full mt-1 rounded-xl shadow-2xl max-h-48 overflow-auto no-scrollbar divide-y">
                  {allCustomers.filter(c => c.name.toLowerCase().includes(customer.name.toLowerCase())).map(c => (
                    <div key={c.phone} className="p-3 hover:bg-slate-50 cursor-pointer text-xs" onClick={() => {setCustomer({name: c.name, phone: c.phone}); setShowNameSuggest(false)}}>
                      <div className="font-black uppercase">{c.name}</div><div className="text-slate-400">{c.phone}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input className="w-full pl-11 pr-4 py-2.5 bg-slate-50 rounded-xl outline-none font-bold text-xs" placeholder="SĐT..." value={customer.phone} onChange={e => {setCustomer({...customer, phone: e.target.value}); setShowCustSuggest(true)}} />
              {showCustSuggest && customer.phone && (
                <div className="absolute z-20 bg-white border w-full mt-1 rounded-xl shadow-2xl max-h-48 overflow-auto no-scrollbar divide-y">
                  {allCustomers.filter(c => c.phone.includes(customer.phone)).map(c => (
                    <div key={c.phone} className="p-3 hover:bg-slate-50 cursor-pointer text-xs" onClick={() => {setCustomer({name: c.name, phone: c.phone}); setShowCustSuggest(false)}}>
                      <div className="font-black uppercase">{c.name}</div><div className="text-slate-400">{c.phone}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <StickyNote className="absolute left-4 top-3 text-slate-400" size={16} />
              <textarea className="w-full pl-11 pr-4 py-2.5 bg-slate-50 rounded-xl outline-none font-bold text-xs min-h-[60px]" placeholder="Ghi chú..." value={note} onChange={e => setNote(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-5 lg:p-6 rounded-[1.5rem] lg:rounded-[2.5rem] shadow-xl text-white flex flex-col gap-4 mb-4 lg:mb-0">
          <div className="flex items-center gap-3 text-blue-400 font-black uppercase italic text-[10px] tracking-widest"><CreditCard size={18}/> Thanh toán</div>
          <div className="space-y-3 border-b border-white/10 pb-4">
            <div className="flex justify-between text-slate-400 font-bold uppercase text-[10px]"><span>Tạm tính</span><span>{subTotal.toLocaleString()}đ</span></div>
            <div className="space-y-2">
                <div className="flex justify-between items-center"><span className="text-red-400 font-black uppercase text-[10px]">Giảm Bill</span>
                    <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                        <button onClick={() => setDiscountType("money")} className={`px-2 py-1 rounded-md text-[8px] font-black ${discountType === 'money' ? 'bg-red-500 text-white' : 'text-slate-500'}`}>VNĐ</button>
                        <button onClick={() => setDiscountType("percent")} className={`px-2 py-1 rounded-md text-[8px] font-black ${discountType === 'percent' ? 'bg-red-500 text-white' : 'text-slate-500'}`}>%</button>
                    </div>
                </div>
                <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl text-right p-3 outline-none font-black text-red-400 text-xl focus:ring-1 focus:ring-red-500" placeholder="0" value={orderDiscount || ""} onChange={e => setOrderDiscount(Number(e.target.value))} />
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase mb-1">Cần thanh toán</p>
            <div className="text-4xl lg:text-5xl font-black italic tracking-tighter text-blue-400">{finalTotal.toLocaleString()}<span className="text-xl ml-1 font-sans">đ</span></div>
          </div>
          <div className="grid grid-cols-1 gap-3 mt-2">
            <button className="bg-white/10 hover:bg-white/20 text-white py-3 lg:py-4 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95" onClick={() => handleAction(false)}><Save size={16}/> Lưu đơn</button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white py-4 lg:py-5 rounded-xl font-black uppercase text-xs shadow-lg shadow-blue-900/50 flex items-center justify-center gap-2 transition-all active:scale-95" onClick={() => handleAction(true)}><Printer size={18}/> In hóa đơn</button>
          </div>
        </div>
      </div>
    </div>
  );
}