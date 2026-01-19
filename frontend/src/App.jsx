import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FiMenu } from "react-icons/fi";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Invoice from "./pages/Invoice";
import Invoices from "./pages/Invoices";
import Settings from "./pages/Settings";

export default function App() {
  const [open, setOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar: Truyền cả open và setOpen xuống */}
        <Sidebar open={open} setOpen={setOpen} />

        {/* Main content */}
        {/* Sửa md:ml-64 thành md:ml-72 để khớp với độ rộng w-72 của Sidebar */}
        <div className="flex-1 flex flex-col md:ml-72 transition-all duration-300">
          
          {/* Header (Chỉ hiện trên mobile) */}
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

          {/* Nội dung trang: Thêm overflow-x-hidden để không bị xê dịch ngang trên mobile */}
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