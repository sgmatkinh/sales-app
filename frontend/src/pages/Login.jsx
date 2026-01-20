import React, { useState } from "react";
import axios from "axios";
import { Lock, User, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post("/api/login", { 
        username, 
        password 
      });

      if (res.data.success) {
        setIsSuccess(true);
        localStorage.setItem("isLoggedIn", "true");
        
        setTimeout(() => {
          onLoginSuccess();
        }, 1000);
      }
    } catch (err) {
      setError("Thông tin xác thực không chính xác!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-sans text-slate-200 relative overflow-hidden">
      
      {/* Hiệu ứng đèn nền ambient */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md z-10">
        
        {/* LOGO AREA - ĐÃ TĂNG KÍCH THƯỚC LÊN 36 (144px) */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Vùng sáng tỏa ra */}
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
            
            {/* Khung bọc ngoài cùng ôm khít */}
            <div className="relative p-1.5 bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl backdrop-blur-xl ring-1 ring-white/10 overflow-visible">
              
              {/* Khung chứa ảnh */}
              <div className="relative overflow-hidden rounded-[2.2rem] bg-black/20">
                <img 
                  src="/logo-shop-net.png" 
                  alt="Logo Shop" 
                  className="w-36 h-36 object-contain p-3 relative z-10" 
                />
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer-fast"></div>
              </div>

              {/* Icon bảo mật */}
              <div className="absolute -bottom-1 -right-1 bg-blue-600 p-2.5 rounded-xl border-4 border-[#020617] shadow-[0_0_15px_rgba(37,99,235,0.6)] flex items-center justify-center overflow-hidden animate-super-float z-20">
                <ShieldCheck size={22} className="text-white relative z-10" />
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 p-10 rounded-[3rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">Hệ Thống Quản Lý</h2>
            
            <div className="relative inline-block">
               <p className="text-2xl font-black uppercase tracking-[0.2em] italic bg-gradient-to-r from-slate-500 via-white to-slate-500 bg-[length:200%_auto] bg-clip-text text-transparent animate-text-shimmer drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                  Mắt Kính Sài Gòn
               </p>
               
               {/* HIỆU ỨNG RƯỢT ĐUỔI CHẠY TỪ PHẢI QUA TRÁI */}
               <div className="relative h-[2px] w-full mt-2 overflow-hidden bg-white/5 rounded-full">
                  <div className="absolute inset-0 w-[200%] bg-infinite-chase-reverse animate-line-chase-reverse"></div>
               </div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
              <input 
                type="text" 
                required
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-black/60 transition-all font-bold placeholder:text-slate-600"
                placeholder="Tên người dùng"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
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

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 py-3 rounded-xl">
                <p className="text-red-400 text-[10px] font-black text-center uppercase tracking-widest">{error}</p>
              </div>
            )}

            <button 
              disabled={loading || isSuccess}
              className={`w-full ${isSuccess ? 'bg-green-600 shadow-[0_0_20px_rgba(22,163,74,0.5)]' : 'bg-blue-600 hover:bg-blue-500'} disabled:bg-slate-800 text-white py-4 rounded-2xl font-black uppercase text-sm shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3`}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : isSuccess ? <span>Truy Cập Thành Công!</span> : <span>Vào Hệ Thống</span>}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-white/5 text-center">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_1px] ${
                  isSuccess 
                  ? 'bg-green-500 shadow-green-500 animate-none' 
                  : 'animate-warning-light'
                }`}></div>
                <span className={`text-[10px] font-black uppercase tracking-widest italic ${isSuccess ? 'text-green-400' : 'text-slate-400'}`}>
                  {isSuccess ? "Truy cập được chấp nhận" : "Hệ Thống Được Bảo Mật"}
                </span>
             </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes warning-light {
          0%, 100% { background-color: #ef4444; box-shadow: 0 0 12px #ef4444; } 
          50% { background-color: #eab308; box-shadow: 0 0 12px #eab308; }   
        }

        @keyframes text-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes line-chase-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }

        .bg-infinite-chase-reverse {
          background: linear-gradient(
            to left,
            transparent 0%,
            rgba(59, 130, 246, 0) 10%,
            rgba(59, 130, 246, 0.8) 25%,
            rgba(59, 130, 246, 0) 40%,
            transparent 50%,
            rgba(59, 130, 246, 0) 60%,
            rgba(59, 130, 246, 0.8) 75%,
            rgba(59, 130, 246, 0) 90%,
            transparent 100%
          );
          background-size: 50% 100%;
        }

        .animate-line-chase-reverse {
          animation: line-chase-reverse 2s infinite linear;
        }

        @keyframes super-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-12px) rotate(8deg); }
          50% { transform: translateY(4px) rotate(-8deg); }
          75% { transform: translateY(-8px) rotate(4deg); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(150%) skewX(-20deg); }
        }

        .animate-warning-light { animation: warning-light 0.8s infinite linear; }
        .animate-text-shimmer { animation: text-shimmer 3s infinite linear; }
        .animate-super-float { animation: super-float 4s infinite ease-in-out; }
        .animate-shimmer { animation: shimmer 2s infinite linear; }
        .animate-shimmer-fast { animation: shimmer 3s infinite linear; animation-delay: 1s; }
      `}</style>
    </div>
  );
}