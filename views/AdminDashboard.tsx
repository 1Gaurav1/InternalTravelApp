
import React from 'react';
import { UserRole, TravelRequest, RequestStatus } from '../types';
import { 
  Users, TrendingUp, Globe, Download, 
  MoreHorizontal, Search, Filter, CheckCircle, X
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend
} from 'recharts';

interface AdminDashboardProps {
  userRole: UserRole;
  requests: TravelRequest[];
  onUpdateStatus: (id: string, status: RequestStatus) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ userRole, requests, onUpdateStatus }) => {
  // Filter for requests waiting for Admin Approval
  const adminPendingRequests = requests.filter(r => r.status === 'Pending Admin');

  // Mock Data - Converted to INR
  const revenueData = [
    { name: 'Jan', amount: 340000 },
    { name: 'Feb', amount: 255000 },
    { name: 'Mar', amount: 170000 },
    { name: 'Apr', amount: 236000 },
    { name: 'May', amount: 160000 },
    { name: 'Jun', amount: 203000 },
    { name: 'Jul', amount: 296000 },
  ];

  const categoryData = [
    { name: 'Q1', Flights: 340000, Hotels: 204000 },
    { name: 'Q2', Flights: 255000, Hotels: 119000 },
    { name: 'Q3', Flights: 170000, Hotels: 833000 },
    { name: 'Q4', Flights: 236000, Hotels: 332000 },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {userRole === UserRole.SUPER_ADMIN ? 'Super Admin Control Center' : 'Admin Dashboard'}
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
                <div className="p-8 text-center text-gray-500 text-sm">No requests awaiting admin approval.</div>
            ) : adminPendingRequests.map((req) => (
               <div key={req.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4 min-w-[200px]">
                      <img src={`https://picsum.photos/seed/${req.id}/100/100`} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
                      <div>
                          <h4 className="font-bold text-gray-900 text-sm">{req.employeeName}</h4>
                          <p className="text-xs text-gray-600 font-medium">Approved by Manager</p>
                      </div>
                  </div>
                  <div className="flex-1 px-4">
                      <p className="font-bold text-gray-900 text-sm">{req.destination}</p>
                      <p className="text-xs text-gray-600">{req.startDate} - {req.endDate}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{req.purpose || 'No purpose specified'}</p>
                  </div>
                  <div className="flex gap-2">
                      <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-gray-200">
                         <X size={18} />
                      </button>
                      <button 
                         onClick={() => onUpdateStatus(req.id, 'Processing (Agent)')}
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
           <h3 className="text-3xl font-bold text-gray-900">2,543</h3>
           <p className="text-sm font-medium text-gray-600 mt-1">Total Users</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                 <span className="font-bold text-xl">₹</span>
              </div>
           </div>
           <h3 className="text-3xl font-bold text-gray-900">₹10.2 Cr</h3>
           <p className="text-sm font-medium text-gray-600 mt-1">YTD Travel Spend</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                 <Globe size={24} />
              </div>
           </div>
           <h3 className="text-3xl font-bold text-gray-900">45</h3>
           <p className="text-sm font-medium text-gray-600 mt-1">Active Destinations</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                 <TrendingUp size={24} />
              </div>
           </div>
           <h3 className="text-3xl font-bold text-gray-900">89%</h3>
           <p className="text-sm font-medium text-gray-600 mt-1">Policy Compliance</p>
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
                  <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
               <h3 className="font-bold text-lg text-gray-900">Category Analysis</h3>
               <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={20}/></button>
            </div>
            <div className="h-80">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                     <CartesianGrid vertical={false} stroke="#f3f4f6" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                     <Tooltip 
                        formatter={(value) => `₹${Number(value).toLocaleString()}`}
                        cursor={{fill: 'transparent'}} 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                     />
                     <Legend />
                     <Bar dataKey="Flights" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={40} />
                     <Bar dataKey="Hotels" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
