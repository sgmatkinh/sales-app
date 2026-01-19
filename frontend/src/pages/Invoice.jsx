import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Trash2, Search, User, Phone, CreditCard, Printer, Save, ShoppingCart, StickyNote, Calendar } from "lucide-react";

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

  // --- PHẦN CHỈNH SỬA: KHỞI TẠO STATE TỪ LOCALSTORAGE ---
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

  // --- PHẦN CHỈNH SỬA: TỰ ĐỘNG LƯU KHI CÓ THAY ĐỔI ---
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
        if (barcodeBuffer.current.length > 2) {
          handleBarcodeScan(barcodeBuffer.current);
        }
        barcodeBuffer.current = ""; 
      } else {
        if (e.key.length === 1) {
          barcodeBuffer.current += e.key;
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);

  const handleBarcodeScan = async (sku) => {
    try {
      const res = await axios.get(`/api/products/find-by-sku/${sku}`);
      if (res.data) {
        addToCart(res.data);
      }
    } catch (err) {
      console.log("Không tìm thấy sản phẩm mã:", sku);
    }
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
    const disc = item.discType === "percent" 
      ? (totalRaw * (item.discount || 0)) / 100 
      : (item.discount || 0);
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

  // --- PHẦN CHỈNH SỬA: XÓA SẠCH BỘ NHỚ TẠM SAU KHI XONG ---
  const resetForm = () => {
    setCart([]); 
    setCustomer({ name: "", phone: "" }); 
    setNote("");
    setOrderDiscount(0);
    setSaleDate(new Date().toISOString().slice(0, 16));
    
    // Xóa các key draft trong localStorage
    localStorage.removeItem("draft_cart");
    localStorage.removeItem("draft_customer");
    localStorage.removeItem("draft_note");
    localStorage.removeItem("draft_orderDiscount");
    localStorage.removeItem("draft_discountType");
    localStorage.removeItem("draft_saleDate");
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
    }).catch(err => console.error("Lỗi gửi mail ngầm:", err));
  };

  const handleAction = async (isPrint) => {
    if (cart.length === 0) return alert("Giỏ hàng đang trống mày ơi!");
    
    const invoiceData = {
      customer_name: customer.name || "Khách lẻ",
      customer_phone: customer.phone || "N/A",
      note: note,
      total: subTotal,
      discount: actualDiscountValue,
      final_total: finalTotal,
      created_at: saleDate,
      items: cart.map(item => {
        const itemDiscValue = item.discType === "percent" 
          ? (item.price * item.qty * (item.discount || 0) / 100) 
          : (item.discount || 0);
        return {
          product_id: item.id,
          product_name: item.name,
          quantity: item.qty,
          price: item.price,
          item_discount: itemDiscValue, 
          total: (item.price * item.qty) - itemDiscValue
        };
      })
    };

    try {
      const res = await axios.post("/api/invoices", invoiceData);
      sendEmailNotification(invoiceData, res.data?.id);

      if (isPrint) {
        const saved = localStorage.getItem("shopConfig");
        if (saved) {
          const configParsed = JSON.parse(saved);
          setConfig(configParsed);
          setTimeout(() => {
            handlePrint();
          }, 100);
        } else {
          handlePrint();
        }
      } else {
        alert("Lưu đơn thành công!");
        resetForm();
      }
    } catch (err) { 
        console.error(err);
        alert("Lỗi lưu đơn rồi mày!"); 
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 bg-slate-50 h-screen overflow-hidden font-sans text-slate-900">
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div style={{ display: "none" }}>
        <div ref={componentRef}>
            {config && (
                <InvoiceTemplate 
                    config={config} 
                    data={{
                        customerName: customer.name || "Khách lẻ",
                        customerPhone: customer.phone || "N/A",
                        note: note,
                        date: new Date(saleDate).toLocaleString('vi-VN'),
                        products: cart.map(i => {
                            const discVal = i.discType === "percent" 
                                ? (i.price * i.qty * (i.discount || 0) / 100) 
                                : (i.discount || 0);
                            return {
                                name: i.name,
                                qty: i.qty,
                                price: Number(i.price),
                                discount: discVal 
                            };
                        }),
                        orderDiscount: actualDiscountValue,
                        total: finalTotal
                    }} 
                />
            )}
        </div>
      </div>

      {/* BÊN TRÁI: GIỎ HÀNG */}
      <div className="flex-1 flex flex-col gap-6 min-h-0">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex-shrink-0" ref={searchRef}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200"><ShoppingCart size={24}/></div>
            <h2 className="text-xl font-black text-slate-800 uppercase italic">Bán hàng lẻ</h2>
            <span className="ml-auto text-[10px] bg-green-100 text-green-600 px-3 py-1 rounded-full font-bold animate-pulse">SCANNER READY</span>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 border-none text-lg font-bold" 
              placeholder="Gõ tên kính hoặc quét Barcode..." 
              value={search} 
              onChange={e => {setSearch(e.target.value); setShowSuggest(true)}}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && search.length > 0) {
                  handleBarcodeScan(search);
                }
              }}
            />
            {showSuggest && search && (
              <div className="absolute bg-white border border-slate-100 w-full mt-2 rounded-2xl shadow-2xl z-50 max-h-60 overflow-auto no-scrollbar divide-y divide-slate-50">
                {products.filter(p => 
                  p.name.toLowerCase().includes(search.toLowerCase()) || 
                  (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
                ).map(p => (
                  <div key={p.id} className="p-4 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors" onClick={() => addToCart(p)}>
                    <div>
                        <div className="font-bold text-slate-700">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                            {p.sku ? `SKU: ${p.sku} | ` : ""}Tồn: {p.stock}
                        </div>
                    </div>
                    <div className="text-blue-600 font-black">{Number(p.price).toLocaleString()}đ</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex-1 overflow-hidden flex flex-col">
          <div className="overflow-y-auto flex-1 no-scrollbar">
            <table className="w-full">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b text-center">
                  <th className="p-5 text-left">Sản phẩm</th>
                  <th className="p-5">Số lượng</th>
                  <th className="p-5">Giảm giá món</th>
                  <th className="p-5 text-right">Thành tiền</th>
                  <th className="p-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cart.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition-all group">
                    <td className="p-5 text-left">
                      <div className="font-black text-slate-800 uppercase text-sm italic">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold">
                          {item.sku ? `${item.sku} - ` : ""}{item.price.toLocaleString()}đ
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      <div className="flex items-center justify-center gap-2 bg-slate-100 p-1 rounded-xl w-fit mx-auto">
                          <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm font-black">-</button>
                          <span className="font-black text-slate-700 px-2">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm font-black">+</button>
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                          <button onClick={() => updateItemDiscount(item.id, "discType", "percent")} className={`px-2 py-1 rounded-md text-[10px] font-black ${item.discType === 'percent' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>%</button>
                          <button onClick={() => updateItemDiscount(item.id, "discType", "money")} className={`px-2 py-1 rounded-md text-[10px] font-black ${item.discType === 'money' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>VNĐ</button>
                        </div>
                        <input type="number" className="w-20 bg-slate-50 border-none rounded-lg text-right p-2 font-black text-xs outline-none text-blue-600" value={item.discount || ""} placeholder="0" onChange={(e) => updateItemDiscount(item.id, "discount", Number(e.target.value))} />
                      </div>
                    </td>
                    <td className="p-5 text-right font-black text-slate-800">{getItemFinalPrice(item).toLocaleString()}đ</td>
                    <td className="p-5 text-center">
                      <button onClick={() => setCart(cart.filter((_, idx) => idx !== index))} className="text-slate-200 hover:text-red-500"><Trash2 size={18}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* BÊN PHẢI: THÔNG TIN KHÁCH HÀNG & THANH TOÁN */}
      <div className="w-full lg:w-[380px] flex flex-col gap-6 overflow-y-auto no-scrollbar pr-1">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex-shrink-0" ref={custSearchRef}>
          <h2 className="font-black uppercase italic text-xs mb-4 text-blue-600 flex items-center gap-2">
            <User size={16}/> Khách hàng & Thời gian
          </h2>
          <div className="space-y-3">
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="datetime-local"
                className="w-full pl-11 pr-4 py-3 bg-blue-50 text-blue-700 rounded-2xl outline-none font-bold text-sm border border-blue-100 focus:ring-2 focus:ring-blue-200"
                value={saleDate}
                onChange={e => setSaleDate(e.target.value)}
              />
            </div>

            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-2xl outline-none font-bold uppercase text-sm" placeholder="Tên khách..." value={customer.name} onChange={e => {setCustomer({...customer, name: e.target.value}); setShowNameSuggest(true)}} />
              {showNameSuggest && customer.name && (
                <div className="absolute z-20 bg-white border w-full mt-1 rounded-2xl shadow-2xl max-h-48 overflow-auto no-scrollbar divide-y divide-slate-50">
                  {allCustomers.filter(c => c.name.toLowerCase().includes(customer.name.toLowerCase())).map(c => (
                    <div key={c.phone} className="p-4 hover:bg-slate-50 cursor-pointer" onClick={() => {setCustomer({name: c.name, phone: c.phone}); setShowNameSuggest(false)}}>
                      <div className="font-black text-xs uppercase">{c.name}</div><div className="text-xs text-slate-400">{c.phone}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-2xl outline-none font-bold text-sm" placeholder="SĐT..." value={customer.phone} onChange={e => {setCustomer({...customer, phone: e.target.value}); setShowCustSuggest(true)}} />
              {showCustSuggest && customer.phone && (
                <div className="absolute z-20 bg-white border w-full mt-1 rounded-2xl shadow-2xl max-h-48 overflow-auto no-scrollbar divide-y divide-slate-50">
                  {allCustomers.filter(c => c.phone.includes(customer.phone)).map(c => (
                    <div key={c.phone} className="p-4 hover:bg-slate-50 cursor-pointer" onClick={() => {setCustomer({name: c.name, phone: c.phone}); setShowCustSuggest(false)}}>
                      <div className="font-black text-xs uppercase">{c.name}</div><div className="text-xs text-slate-400">{c.phone}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <StickyNote className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <textarea className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-2xl outline-none font-bold text-sm min-h-[80px]" placeholder="Ghi chú đơn hàng..." value={note} onChange={e => setNote(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-[2.5rem] shadow-xl text-white flex flex-col gap-4 flex-shrink-0">
          <div className="flex items-center gap-3 text-blue-400 font-black uppercase italic text-sm tracking-widest">
            <CreditCard size={20}/> Thanh toán
          </div>
          
          <div className="space-y-4 border-b border-white/10 pb-6">
            <div className="flex justify-between text-slate-400 font-bold uppercase text-xs">
                <span>Tạm tính</span>
                <span>{subTotal.toLocaleString()}đ</span>
            </div>
            
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-red-400 font-black uppercase text-xs">Giảm Bill</span>
                    <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                        <button onClick={() => setDiscountType("money")} className={`px-3 py-1.5 rounded-md text-xs font-black transition-colors ${discountType === 'money' ? 'bg-red-500 text-white' : 'text-slate-500'}`}>VNĐ</button>
                        <button onClick={() => setDiscountType("percent")} className={`px-3 py-1.5 rounded-md text-xs font-black transition-colors ${discountType === 'percent' ? 'bg-red-500 text-white' : 'text-slate-500'}`}>%</button>
                    </div>
                </div>
                <input type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl text-right p-4 outline-none font-black text-red-400 text-2xl focus:ring-1 focus:ring-red-500" placeholder="0" value={orderDiscount || ""} onChange={e => setOrderDiscount(Number(e.target.value))} />
            </div>
          </div>

          <div>
            <p className="text-slate-400 text-xs font-black uppercase mb-1">Cần thanh toán</p>
            <div className="text-5xl font-black italic tracking-tighter text-blue-400">
              {finalTotal.toLocaleString()}<span className="text-2xl ml-1 font-sans">đ</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mt-2">
            <button className="bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 transition-all active:scale-95" onClick={() => handleAction(false)}>
              <Save size={18}/> Lưu đơn
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black uppercase text-sm shadow-lg shadow-blue-900/50 flex items-center justify-center gap-2 transition-all active:scale-95" onClick={() => handleAction(true)}>
              <Printer size={20}/> In hóa đơn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}