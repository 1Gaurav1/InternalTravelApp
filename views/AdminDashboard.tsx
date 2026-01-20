import React, { useMemo } from 'react';
import { UserRole, TravelRequest, RequestStatus } from '../types';
import { 
  Users, TrendingUp, Globe, Download, 
  MoreHorizontal, Filter, CheckCircle, X
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend
} from 'recharts';

interface AdminDashboardProps {
  userRole: string[]; // Updated to string array
  requests: TravelRequest[];
  onUpdateStatus: (id: string, status: RequestStatus) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ userRole, requests, onUpdateStatus }) => {
  // 1. Filter: Requests waiting for Admin
  const adminPendingRequests = requests.filter(r => r.status === 'Pending Admin');

  // 2. Action: Handle Rejection
  const handleReject = (id: string) => {
    if (window.confirm("Are you sure you want to reject this request?")) {
        onUpdateStatus(id, 'Rejected');
    }
  };

  // --- REAL TIME STATS CALCULATION ---
  const stats = useMemo(() => {
    const totalSpend = requests
        .filter(r => r.status !== 'Rejected')
        .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const uniqueDestinations = new Set(requests.map(r => r.destination)).size;
    const uniqueTravelers = new Set(requests.map(r => r.employeeName)).size;

    return { totalSpend, uniqueDestinations, uniqueTravelers };
  }, [requests]);


  // --- DYNAMIC CHART DATA PREPARATION ---
  const { areaData, barData } = useMemo(() => {
    const months: { [key: string]: any } = {};

    // Helper to get Month Name (e.g., "Oct")
    const getMonth = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('default', { month: 'short' });
    };

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const m = d.toLocaleString('default', { month: 'short' });
        months[m] = { name: m, amount: 0, Domestic: 0, International: 0 };
    }

    // Populate data
    requests.forEach(req => {
        if (req.status === 'Rejected') return; // Skip rejected
        const m = getMonth(req.startDate);
        if (months[m]) {
            months[m].amount += (req.amount || 0);
            if (req.type === 'Domestic') months[m].Domestic += (req.amount || 0);
            else months[m].International += (req.amount || 0);
        }
    });

    return {
        areaData: Object.values(months), // For Area Chart (Total Trend)
        barData: Object.values(months)   // For Bar Chart (Split)
    };
  }, [requests]);


  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {userRole.includes(UserRole.SUPER_ADMIN) ? 'Super Admin Control Center' : 'Admin Dashboard'}
          </h1>
          <p className="text-gray-500 mt-1">Real-time overview of system performance and travel metrics.</p>
        </div>
        <div className="flex gap-3">
             <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
                <Filter size={18} /> Filters
             </button>
             <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black shadow-lg shadow-gray-900/20 transition-all">
                <Download size={18} /> Generate Report
             </button>
        </div>
      </div>

      {/* Admin Approval Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-purple-50">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                Pending Admin Approval 
                <span className="bg-purple-200 text-purple-800 text-xs px-2 py-0.5 rounded-full">{adminPendingRequests.length}</span>
            </h3>
         </div>
         <div className="divide-y divide-gray-100">
            {adminPendingRequests.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                        <CheckCircle size={32} className="text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-sm">No requests awaiting admin approval.</p>
                </div>
            ) : adminPendingRequests.map((req) => (
               <div key={req.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50/50 transition-colors gap-4">
                  <div className="flex items-center gap-4 min-w-[200px]">
                      <img 
                        src={req.employeeAvatar || `https://ui-avatars.com/api/?name=${req.employeeName}&background=random`} 
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" 
                        alt="" 
                      />
                      <div>
                          <h4 className="font-bold text-gray-900 text-sm">{req.employeeName}</h4>
                          <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                             <CheckCircle size={10} /> Approved by Manager
                          </p>
                      </div>
                  </div>
                  <div className="flex-1 px-0 md:px-4">
                      <div className="flex items-center gap-2">
                         <p className="font-bold text-gray-900 text-sm">{req.destination}</p>
                         <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{req.type}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</p>
                      {req.amount > 0 && <p className="text-xs font-bold text-gray-900 mt-1">₹{req.amount.toLocaleString()}</p>}
                  </div>
                  <div className="flex gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                      <button 
                        onClick={() => handleReject(req.id || '')}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-gray-200"
                        title="Reject"
                      >
                         <X size={18} />
                      </button>
                      <button 
                         onClick={() => req.id && onUpdateStatus(req.id, 'Processing (Agent)')}
                         className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg shadow-sm transition-all flex items-center gap-2"
                      >
                         <CheckCircle size={16} /> Final Approve
                      </button>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                 <Users size={24} />
              </div>
           </div>
           <h3 className="text-3xl font-bold text-gray-900">{stats.uniqueTravelers}</h3>
           <p className="text-sm font-medium text-gray-600 mt-1">Active Travelers</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                 <span className="font-bold text-xl">₹</span>
              </div>
           </div>
           <h3 className="text-3xl font-bold text-gray-900">₹{(stats.totalSpend / 10000000).toFixed(2)} Cr</h3>
           <p className="text-sm font-medium text-gray-600 mt-1">YTD Travel Spend</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                 <Globe size={24} />
              </div>
           </div>
           <h3 className="text-3xl font-bold text-gray-900">{stats.uniqueDestinations}</h3>
           <p className="text-sm font-medium text-gray-600 mt-1">Active Destinations</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                 <TrendingUp size={24} />
              </div>
           </div>
           <h3 className="text-3xl font-bold text-gray-900">100%</h3>
           <p className="text-sm font-medium text-gray-600 mt-1">System Uptime</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-lg text-gray-900">Spend Overview</h3>
               <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={20}/></button>
            </div>
            <div className="h-80">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                     <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#ec4899" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                     <CartesianGrid vertical={false} stroke="#f3f4f6" />
                     <Tooltip 
                        formatter={(value) => `₹${Number(value).toLocaleString()}`}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                     />
                     <Area type="monotone" dataKey="amount" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-lg text-gray-900">Type Analysis</h3>
               <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={20}/></button>
            </div>
            <div className="h-80">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                     <CartesianGrid vertical={false} stroke="#f3f4f6" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                     <Tooltip 
                        formatter={(value) => `₹${Number(value).toLocaleString()}`}
                        cursor={{fill: 'transparent'}} 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                     />
                     <Legend />
                     <Bar dataKey="Domestic" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                     <Bar dataKey="International" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AdminDashboard;