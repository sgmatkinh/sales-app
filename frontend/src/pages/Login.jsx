import React, { useState } from "react";
import axios from "axios";
import { Lock, User, ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react";

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Gọi đến API mình vừa thêm ở file server.js
      const res = await axios.post("/api/login", { 
        username, 
        password 
      });

      if (res.data.success) {
        localStorage.setItem("isLoggedIn", "true");
        onLoginSuccess();
      }
    } catch (err) {
      setError("Thông tin xác thực không chính xác!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-sans text-slate-200 relative overflow-hidden">
      
      {/* Hiệu ứng đèn nền (Glow Effect) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md z-10">
        {/* Biểu tượng khiên bảo mật */}
        <div className="flex justify-center mb-8">
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-[2rem] shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
            <ShieldCheck size={48} className="text-blue-500 animate-pulse" />
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 p-10 rounded-[3rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Hệ Thống Sales</h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="h-[1px] w-8 bg-slate-700"></span>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em]">Security Access</p>
              <span className="h-[1px] w-8 bg-slate-700"></span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Tên đăng nhập */}
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input 
                type="text" 
                required
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-black/60 transition-all font-bold placeholder:text-slate-600"
                placeholder="Tên người dùng"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {/* Mật khẩu */}
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input 
                type={showPassword ? "text" : "password"}
                required
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-black/60 transition-all font-bold placeholder:text-slate-600"
                placeholder="Mật khẩu bảo mật"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 transition-colors"
              >
                {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
              </button>
            </div>

            {/* Hiển thị lỗi */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 py-3 rounded-xl">
                <p className="text-red-400 text-[10px] font-black text-center uppercase tracking-widest">
                  {error}
                </p>
              </div>
            )}

            {/* Nút Đăng Nhập */}
            <button 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white py-4 rounded-2xl font-black uppercase text-sm shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Đang mã hóa...</span>
                </>
              ) : (
                <>
                  <span>Xác thực truy cập</span>
                </>
              )}
            </button>
          </form>

          {/* Dòng chữ trang trí phía dưới */}
          <div className="mt-10 pt-6 border-t border-white/5 text-center">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/5 border border-green-500/10">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-tight">Hệ thống đang bảo vệ trực tuyến</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}