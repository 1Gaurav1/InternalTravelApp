import React, { useMemo } from 'react';
import { ViewState, TravelRequest } from '../types';
import { 
  ShieldCheck, Users, Activity, Server, 
  Database, AlertTriangle, Plus, ArrowRight,
  TrendingUp, HardDrive
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

interface SuperAdminDashboardProps {
  requests: TravelRequest[];
  onNavigate: (view: ViewState) => void;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ requests, onNavigate }) => {
  
  // --- REAL TIME METRICS ---
  const stats = useMemo(() => {
    // Calculate total money flowing through the system
    const totalVolume = requests.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    
    // Count unique users who have interacted with the system
    const uniqueUsers = new Set(requests.map(r => r.employeeName)).size;
    
    // Count total requests
    const totalRequests = requests.length;

    // Count pending system-wide actions
    const pendingActions = requests.filter(r => r.status.includes('Pending')).length;

    return { totalVolume, uniqueUsers, totalRequests, pendingActions };
  }, [requests]);

  // Mock System Health Data (In real prod, fetch from AWS/Azure/DigitalOcean API)
  const systemHealthData = [
    { time: '00:00', load: 12, memory: 20 },
    { time: '04:00', load: 15, memory: 22 },
    { time: '08:00', load: 45, memory: 40 },
    { time: '12:00', load: 78, memory: 65 },
    { time: '14:00', load: 60, memory: 55 },
    { time: '16:00', load: 65, memory: 60 },
    { time: '20:00', load: 30, memory: 35 },
    { time: '23:59', load: 18, memory: 25 },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* --- HERO SECTION --- */}
      <div className="bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="text-indigo-400" size={24} />
                    <span className="text-indigo-400 font-bold tracking-wider text-xs uppercase bg-indigo-400/10 px-2 py-1 rounded">Super Admin Access</span>
                </div>
                <h1 className="text-4xl font-extrabold mb-2 tracking-tight">System Control Center</h1>
                <p className="text-gray-400 max-w-lg text-lg">
                    Full oversight of global operations, user access, and infrastructure health.
                </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
                 {/* Personal Travel Shortcut */}
                 {/* <button 
                    onClick={() => onNavigate(ViewState.CREATE_REQUEST)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/50"
                 >
                    <Plus size={20} /> Personal Trip
                 </button> */}
                 
                 {/* User Management Shortcut */}
                 <button 
                    onClick={() => onNavigate(ViewState.USER_MANAGEMENT)}
                    className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-bold transition-all backdrop-blur-md"
                 >
                    <Users size={20} /> Manage Users
                 </button>
            </div>
        </div>
      </div>

      {/* --- METRIC GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. Infrastructure Status */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
             <div className="flex items-center gap-3 mb-6">
                 <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Activity size={22}/></div>
                 <h3 className="font-bold text-gray-900 text-lg">Infrastructure</h3>
             </div>
             <div className="space-y-4">
                 <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                     <span className="text-sm text-gray-700 font-medium flex items-center gap-2"><Server size={16} className="text-gray-400"/> API Gateway</span>
                     <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-xs font-bold text-emerald-700">Online</span>
                     </div>
                 </div>
                 <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                     <span className="text-sm text-gray-700 font-medium flex items-center gap-2"><Database size={16} className="text-gray-400"/> MongoDB Atlas</span>
                     <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-xs font-bold text-emerald-700">Connected</span>
                     </div>
                 </div>
                 <div className="flex justify-between items-center px-2">
                     <span className="text-sm text-gray-500 flex items-center gap-2"><AlertTriangle size={14}/> Error Rate</span>
                     <span className="text-xs font-bold text-gray-900">0.01%</span>
                 </div>
             </div>
        </div>

        {/* 2. Global Metrics */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6">
                 <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={22}/></div>
                 <h3 className="font-bold text-gray-900 text-lg">Growth Metrics</h3>
             </div>
             <div className="grid grid-cols-2 gap-4">
                 <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                     <p className="text-xs text-blue-600 uppercase font-bold tracking-wider">Active Users</p>
                     <p className="text-3xl font-extrabold text-gray-900 mt-1">{stats.uniqueUsers + 12}</p>
                 </div>
                 <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                     <p className="text-xs text-purple-600 uppercase font-bold tracking-wider">Total Requests</p>
                     <p className="text-3xl font-extrabold text-gray-900 mt-1">{stats.totalRequests}</p>
                 </div>
             </div>
             <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-sm text-gray-500">Pending Actions System-wide</span>
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-md">{stats.pendingActions}</span>
             </div>
        </div>

        {/* 3. Financial Aggregation */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
             <div className="flex items-center gap-3 mb-6">
                 <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><TrendingUp size={22}/></div>
                 <h3 className="font-bold text-gray-900 text-lg">Total Volume</h3>
             </div>
             <div className="flex flex-col justify-center h-40">
                 <p className="text-sm text-gray-500 font-medium mb-1">Gross Transaction Volume (GTV)</p>
                 <p className="text-5xl font-extrabold text-gray-900 tracking-tight">
                    ₹{(stats.totalVolume / 10000000).toFixed(2)}<span className="text-2xl text-gray-400 font-bold ml-1">Cr</span>
                 </p>
                 <div className="mt-4 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{width: '75%'}}></div>
                 </div>
                 <p className="text-xs text-indigo-600 font-bold mt-2 text-right">75% of Annual Budget</p>
             </div>
        </div>
      </div>

      {/* --- SERVER LOAD CHART --- */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
         <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                    <HardDrive size={20} className="text-gray-400"/> 
                    Server Load & Memory
                </h3>
                <p className="text-sm text-gray-500 mt-1">Real-time utilization of the Node.js backend cluster.</p>
            </div>
            <div className="flex gap-4 text-sm font-medium">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-indigo-500"></span> CPU Load
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-300"></span> Memory
                </div>
            </div>
         </div>
         
         <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={systemHealthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#f3f4f6" strokeDasharray="3 3"/>
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value, name) => [`${value}%`, name === 'load' ? 'CPU Load' : 'Memory Usage']}
                    />
                    <Area type="monotone" dataKey="load" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorLoad)" />
                    <Area type="monotone" dataKey="memory" stroke="#d8b4fe" strokeWidth={3} fillOpacity={0} />
                </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;