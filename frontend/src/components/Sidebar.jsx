import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiBox,
  FiUsers,
  FiFileText,
  FiSettings,
  FiX, // Thêm icon đóng
} from "react-icons/fi";

// Thêm props setOpen để có thể đóng sidebar từ bên trong
export default function Sidebar({ open, setOpen }) {
  const [config, setConfig] = useState({
    themeColor: "#2563eb",
    logoUrl: "",
  });

  useEffect(() => {
    const savedConfig = localStorage.getItem("shopConfig");
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  return (
    <>
      {/* 1. LỚP NỀN MỜ (OVERLAY) - Chỉ hiện trên mobile khi sidebar mở */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-[40] md:hidden"
          onClick={() => setOpen(false)}
        ></div>
      )}

      {/* 2. SIDEBAR CHÍNH */}
      <div
        className={`fixed top-0 left-0 h-full w-72 p-6 text-white transition-transform duration-300 z-[50]
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 flex flex-col shadow-2xl`}
        style={{ backgroundColor: config.themeColor || "#2563eb" }}
      >
        {/* NÚT ĐÓNG NHANH TRÊN MOBILE */}
        <button 
          onClick={() => setOpen(false)}
          className="md:hidden absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full"
        >
          <FiX size={24} />
        </button>

        {/* PHẦN ĐẦU: LOGO */}
        <div className="flex flex-col items-center gap-4 mb-8 border-b border-white/20 pb-8">
          <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl overflow-hidden p-3 ring-4 ring-white/20">
            <img 
              src="/logo-shop-net.png" 
              alt="Mắt Kính Sài Gòn Logo" 
              className="w-full h-full object-contain"
              onError={(e) => e.target.src = "https://via.placeholder.com/150?text=LOGO"} 
            />
          </div>

          <div className="text-center mt-2">
            <h1 className="text-xl font-black italic uppercase tracking-tighter text-white">
              Mắt Kính Sài Gòn
            </h1>
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-100 opacity-80 mt-1">
              Premium Eyewear
            </div>
          </div>
        </div>

        {/* NAVIGATION MENU */}
        <nav className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {/* Truyền thêm hàm setOpen vào Menu để bấm là đóng sidebar */}
          <Menu to="/" icon={FiHome} label="Dashboard" closeMenu={() => setOpen(false)} />
          <Menu to="/products" icon={FiBox} label="Sản phẩm" closeMenu={() => setOpen(false)} />
          <Menu to="/customers" icon={FiUsers} label="Khách hàng" closeMenu={() => setOpen(false)} />
          <Menu to="/invoice" icon={FiFileText} label="Bán Hàng" closeMenu={() => setOpen(false)} />
          <Menu to="/invoices" icon={FiFileText} label="Quản lý hóa đơn" closeMenu={() => setOpen(false)} />
          <Menu to="/settings" icon={FiSettings} label="Cài đặt" closeMenu={() => setOpen(false)} />
        </nav>

        <div className="pt-6 border-t border-white/10 text-center">
          <p className="text-[10px] font-medium opacity-70 uppercase tracking-widest">
            © 2026 Mắt Kính Sài Gòn
          </p>
        </div>
      </div>
    </>
  );
}

// Sửa lại Component Menu để nhận hàm closeMenu
function Menu({ to, icon: Icon, label, closeMenu }) {
  return (
    <NavLink
      to={to}
      onClick={closeMenu} // Bấm vào link là đóng Sidebar ngay (trên mobile)
      className={({ isActive }) =>
        `flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 font-black text-base
        ${isActive 
          ? "bg-white text-blue-700 shadow-xl scale-[1.02]" 
          : "hover:bg-white/10 text-white hover:translate-x-2"
        }`
      }
    >
      <Icon size={22} strokeWidth={2.5} />
      {label}
    </NavLink>
  );
}