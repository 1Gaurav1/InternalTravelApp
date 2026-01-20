import React, { useMemo } from 'react';
import { ViewState, TravelRequest, RequestStatus } from '../types';
import { 
  CheckCircle, Clock, AlertCircle, 
  TrendingUp, Calendar, Download, ArrowRight, X, Search, MoreHorizontal, Filter
} from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ManagerDashboardProps {
  onNavigate: (view: ViewState) => void;
  onViewRequest: (id: string) => void;
  requests: TravelRequest[];
  onUpdateStatus: (id: string, status: RequestStatus) => void;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ onNavigate, onViewRequest, requests, onUpdateStatus }) => {
  
  // --- REAL DATA LOGIC ---

  // 1. Filter: Only show requests pending Manager Approval
  const pendingApprovals = requests.filter(r => r.status === 'Pending Manager');

  // 2. Action: Handle Rejection
  const handleReject = (id: string) => {
    if (window.confirm("Are you sure you want to reject this request?")) {
        onUpdateStatus(id, 'Rejected');
    }
  };

  // 3. Dynamic Chart Data (Real Spend by Type)
  // We calculate this from the ACTUAL requests array
  const chartData = useMemo(() => {
    const domesticTotal = requests
      .filter(r => r.type === 'Domestic' && r.status !== 'Rejected')
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    const internationalTotal = requests
      .filter(r => r.type === 'International' && r.status !== 'Rejected')
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    // If no data, show a placeholder so the chart isn't empty
    if (domesticTotal === 0 && internationalTotal === 0) {
        return [{ name: 'No Data', value: 1, color: '#f3f4f6' }];
    }

    return [
      { name: 'Domestic', value: domesticTotal, color: '#3b82f6' }, // Blue
      { name: 'International', value: internationalTotal, color: '#8b5cf6' }, // Purple
    ];
  }, [requests]);

  const totalSpend = chartData.reduce((sum, item) => item.name === 'No Data' ? 0 : sum + item.value, 0);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Manager Console</h1>
           <p className="text-gray-500 mt-1">Overview of team travel and budget approval.</p>
        </div>
        <div className="flex gap-3">
             <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                <Calendar size={16} /> Filter Date
             </button>
             <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 shadow-md shadow-primary-500/20 transition-all">
                <Download size={16} /> Export Report
             </button>
        </div>
      </div>

      {/* KPI Cards (Real Data) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Pending Count */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                 <Clock size={20} />
               </div>
               <span className="text-sm font-bold text-gray-500 uppercase">Pending Approval</span>
            </div>
            <div className="flex items-baseline gap-2">
                <h2 className="text-4xl font-bold text-gray-900">{pendingApprovals.length}</h2>
                <span className="text-sm text-gray-600 font-medium">requests</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-400"></div>
        </div>

        {/* Card 2: Total Spend */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <TrendingUp size={20} />
                </div>
                <span className="text-sm font-bold text-gray-500 uppercase">Total Commitment</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <h2 className="text-4xl font-bold text-gray-900">₹{(totalSpend/100000).toFixed(2)} L</h2>
                    <span className="text-sm text-emerald-600 font-bold">Approved & Pending</span>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500"></div>
        </div>

        {/* Card 3: Budget Status (Mock for now as we don't have budget limits yet) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <AlertCircle size={20} />
                </div>
                <span className="text-sm font-bold text-gray-500 uppercase">Dept. Budget</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <h2 className="text-4xl font-bold text-gray-900">Healthy</h2>
                    <span className="text-sm text-gray-600 font-medium">utilization</span>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: Approval List */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                   <h3 className="font-bold text-lg text-gray-900">Pending Approvals</h3>
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input type="text" placeholder="Search name..." className="pl-9 pr-4 py-2 bg-gray-50 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-primary-100 text-gray-900 placeholder-gray-400 w-40 transition-all" />
                   </div>
                </div>
                <div className="divide-y divide-gray-100">
                    {pendingApprovals.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                <CheckCircle size={32} className="text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-medium">All caught up! No pending requests.</p>
                        </div>
                    ) : pendingApprovals.map((item) => (
                        <div key={item.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50/50 transition-colors group gap-4 animate-fade-in">
                            <div className="flex items-center gap-4 min-w-[200px]">
                                <img 
                                    src={item.employeeAvatar || `https://ui-avatars.com/api/?name=${item.employeeName}&background=random`} 
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" 
                                    alt="" 
                                />
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">{item.employeeName}</h4>
                                    <p className="text-xs text-gray-500 font-medium">{item.department}</p>
                                </div>
                            </div>

                            <div className="flex-1 px-0 md:px-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-gray-900 text-sm">{item.destination}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${item.type === 'International' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {item.type}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 font-medium">
                                    {new Date(item.startDate).toLocaleDateString()} — {new Date(item.endDate).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 pt-2 md:pt-0 md:pl-4 border-t md:border-t-0 border-gray-100 mt-2 md:mt-0">
                                <button 
                                    onClick={() => handleReject(item.id || '')}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Reject Request"
                                >
                                    <X size={20} />
                                </button>
                                <button 
                                  onClick={() => item.id && onUpdateStatus(item.id, 'Pending Admin')}
                                  className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-lg shadow-lg shadow-gray-900/10 transition-all flex items-center gap-2"
                                  title="Approve & Send to Admin"
                                >
                                    <CheckCircle size={16} /> Approve
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* RIGHT: Real Pie Chart */}
        <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900">Spend by Type</h3>
                    <button className="text-gray-400 hover:text-gray-600"><Filter size={18} /></button>
                </div>
                
                <div className="h-64 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                            <Legend verticalAlign="bottom" height={36}/>
                        </RePieChart>
                    </ResponsiveContainer>
                    {totalSpend > 0 && (
                        <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total</p>
                            <p className="text-xl font-extrabold text-gray-900">₹{(totalSpend/1000).toFixed(0)}k</p>
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mt-2">
                    <p className="text-xs text-gray-500 leading-relaxed text-center">
                        This chart reflects the total value of all requests (Pending + Approved) currently in the system.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;