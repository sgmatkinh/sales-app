import { useState, useEffect } from "react"; 
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FiMenu } from "react-icons/fi";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Invoice from "./pages/Invoice";
import Invoices from "./pages/Invoices";
import Settings from "./pages/Settings";
import Login from "./pages/Login"; 

export default function App() {
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // --- LOGIC KIỂM TRA ĐĂNG NHẬP ---
  useEffect(() => {
    const auth = localStorage.getItem("isLoggedIn");
    if (auth === "true") {
      setIsLoggedIn(true);
    }
  }, []);

  // --- HÀM ĐĂNG XUẤT (TRUYỀN XUỐNG SIDEBAR) ---
  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
      localStorage.removeItem("isLoggedIn");
      setIsLoggedIn(false);
    }
  };

  // Nếu chưa đăng nhập, hiện trang Login
  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar: Truyền thêm hàm onLogout xuống */}
        <Sidebar open={open} setOpen={setOpen} onLogout={handleLogout} />

        {/* Main content */}
        <div className="flex-1 flex flex-col md:ml-72 transition-all duration-300">
          
          {/* Header (Mobile) */}
          <div className="sticky top-0 z-30 bg-white shadow-sm p-4 flex items-center md:hidden">
            <button 
              className="p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => setOpen(true)}
            >
              <FiMenu size={24} />
            </button>
            <span className="ml-3 font-black text-blue-700 uppercase tracking-tight">
              Mắt Kính Sài Gòn
            </span>
          </div>

          {/* Nội dung trang */}
          <div className="p-4 md:p-8 overflow-x-hidden">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/invoice" element={<Invoice />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}