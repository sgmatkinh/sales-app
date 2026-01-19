import { useEffect, useState } from "react";
// 1. Import useNavigate
import { useNavigate } from "react-router-dom"; 
import { FiDollarSign, FiTrendingUp, FiCalendar, FiFileText, FiArrowRight } from "react-icons/fi";
import { getSummary, getRevenueByDay, getRecentInvoices } from "../dashboardService";
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList
} from "recharts";

export default function Dashboard() {
  const [summary, setSummary] = useState({});
  const [chartData, setChartData] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [timeRange, setTimeRange] = useState(7); // Mặc định là 7 ngày
  
  const navigate = useNavigate();

  // Load summary và invoices chỉ 1 lần khi mount
  useEffect(() => {
    getSummary().then((res) => setSummary(res.data));
    getRecentInvoices().then((res) => setInvoices(res.data));
  }, []);

  // Load biểu đồ mỗi khi timeRange thay đổi
  useEffect(() => {
    getRevenueByDay(timeRange).then((res) => setChartData(res.data));
  }, [timeRange]);

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen font-sans">
      {/* Tiêu đề Dashboard */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase italic tracking-tight">Tổng quan kinh doanh</h1>
          <p className="text-slate-500 font-medium">Chào mừng trở lại, đây là tình hình cửa hàng của mày hôm nay.</p>
        </div>
        <div className="text-right">
          <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-bold text-sm">
            Cập nhật: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Thẻ thống kê (Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Stat title="Doanh thu hôm nay" value={summary.today} icon={FiDollarSign} gradient="from-blue-600 to-blue-400" shadow="shadow-blue-200" />
        <Stat title="Doanh thu tháng này" value={summary.month} icon={FiTrendingUp} gradient="from-emerald-600 to-emerald-400" shadow="shadow-emerald-200" />
        <Stat title="Số đơn năm nay" value={summary.year} icon={FiCalendar} gradient="from-violet-600 to-violet-400" shadow="shadow-violet-200" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Biểu đồ Doanh thu Kết hợp */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2">
              <FiTrendingUp className="text-blue-500" /> Xu hướng doanh thu
            </h2>
            
            {/* Bộ chọn thời gian mở rộng */}
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="bg-slate-100 border-none text-blue-700 text-sm font-black p-2 px-4 rounded-xl outline-none cursor-pointer hover:bg-blue-600 hover:text-white transition-all shadow-sm"
            >
              <option value={7}>7 ngày gần nhất</option>
              <option value={30}>30 ngày gần nhất</option>
              <option value={60}>60 ngày gần nhất</option>
              <option value={90}>90 ngày gần nhất</option>
              <option value={120}>120 ngày gần nhất</option>
              <option value={365}>1 năm qua</option>
              <option value={730}>2 năm qua</option>
              <option value={1095}>3 năm qua</option>
            </select>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 25, right: 20, bottom: 20, left: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} tickFormatter={(val) => `${(val/1000000).toFixed(1)}M`} />
                <Tooltip 
                  cursor={{stroke: '#e2e8f0', strokeWidth: 2}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  formatter={(value) => [Number(value).toLocaleString() + " ₫", "Doanh thu"]}
                />
                
                <Bar dataKey="total" barSize={timeRange > 90 ? 10 : 35} fill="#e2e8f0" radius={[4, 4, 0, 0]}>
                  {/* Chỉ hiện nhãn số tiền nếu chọn dưới 30 ngày để tránh bị rối mắt khi biểu đồ quá dày */}
                  {timeRange <= 30 && (
                    <LabelList 
                      dataKey="total" 
                      position="top" 
                      content={(props) => {
                        const { x, y, width, value } = props;
                        if (!value || value === 0) return null;
                        const formatted = value >= 1000000 
                          ? `${(value / 1000000).toFixed(1)}M` 
                          : `${(value / 1000).toFixed(0)}K`;
                        return (
                          <text x={x + width / 2} y={y - 10} fill="#64748b" fontSize={10} fontWeight="900" textAnchor="middle">
                            {formatted}
                          </text>
                        );
                      }} 
                    />
                  )}
                </Bar>
                
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3b82f6" 
                  strokeWidth={timeRange > 180 ? 2 : 4} 
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                  dot={timeRange <= 30 ? { r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' } : false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hóa đơn gần nhất */}
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col">
          <h2 className="text-xl font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
            <FiFileText className="text-violet-500" /> Đơn hàng mới
          </h2>
          <div className="space-y-4 flex-1 overflow-auto max-h-[350px] pr-2 custom-scrollbar">
            {invoices.map((i) => (
              <div key={i.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-slate-400 group-hover:text-blue-500 transition-colors shadow-sm">
                    #{i.id.toString().slice(-3)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 uppercase text-xs">{i.customer_name || "Khách lẻ"}</p>
                    <p className="text-[10px] text-slate-400">{new Date(i.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-blue-700">{i.final_total?.toLocaleString()}đ</p>
                  <span className="text-[9px] bg-green-100 text-green-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Thành công</span>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => navigate("/invoices")} 
            className="w-full mt-6 py-3 bg-slate-800 text-white rounded-xl font-bold text-sm uppercase flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"
          >
            Xem tất cả <FiArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ title, value, icon: Icon, gradient, shadow }) {
  return (
    <div className={`relative bg-white p-6 rounded-[2rem] shadow-2xl ${shadow} border border-slate-50 transition-transform hover:-translate-y-2 duration-300 group overflow-hidden`}>
      <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${gradient} opacity-5 rounded-full group-hover:scale-150 transition-transform duration-500`}></div>
      <div className="flex items-center gap-5 relative z-10">
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg shadow-current`}>
          <Icon className="text-white text-2xl" />
        </div>
        <div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight italic">
            {(value || 0).toLocaleString()}<span className="text-lg ml-1 not-italic">₫</span>
          </h2>
        </div>
      </div>
    </div>
  );
}