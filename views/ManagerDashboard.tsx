
import React from 'react';
import { ViewState, Notification, TravelRequest, RequestStatus } from '../types';
import { 
  CheckCircle, Clock, AlertCircle, PieChart, 
  TrendingUp, Calendar, Download, ArrowRight, X, Search, MoreHorizontal
} from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ManagerDashboardProps {
  onNavigate: (view: ViewState) => void;
  onViewRequest: (id: string) => void;
  requests: TravelRequest[];
  onUpdateStatus: (id: string, status: RequestStatus) => void;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ onNavigate, onViewRequest, requests, onUpdateStatus }) => {
  // Only show requests pending Manager Approval
  const pendingApprovals = requests.filter(r => r.status === 'Pending Manager');

  // Chart Data
  const chartData = [
    { name: 'Flights', value: 250000, color: '#ec4899' },
    { name: 'Hotels', value: 270000, color: '#fbcfe8' },
    { name: 'Other', value: 100000, color: '#1f2937' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Manager Console</h1>
           <p className="text-gray-500 mt-1">Overview of team travel and budget approval.</p>
        </div>
        <div className="flex gap-3">
             <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Calendar size={16} /> Oct 2026
             </button>
             <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 shadow-md shadow-primary-500/20">
                <Download size={16} /> Export Report
             </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock size={80} className="text-primary-500" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                 <Clock size={20} />
               </div>
               <span className="text-sm font-bold text-gray-500 uppercase">Pending Requests</span>
            </div>
            <div className="flex items-baseline gap-2">
                <h2 className="text-4xl font-bold text-gray-900">{pendingApprovals.length}</h2>
                <span className="text-sm text-gray-600 font-medium">requests</span>
            </div>
            <div className="w-16 h-1 bg-yellow-400 rounded-full mt-4"></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <PieChart size={80} className="text-green-500" />
             </div>
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <TrendingUp size={20} />
                </div>
                <span className="text-sm font-bold text-gray-500 uppercase">Monthly Spend</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <h2 className="text-4xl font-bold text-gray-900">₹3.5 L</h2>
                    <span className="text-sm text-green-600 font-bold">↗ +12%</span>
                </div>
                <div className="w-24 h-1 bg-green-500 rounded-full mt-4"></div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <AlertCircle size={80} className="text-red-500" />
             </div>
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                    <AlertCircle size={20} />
                </div>
                <span className="text-sm font-bold text-gray-500 uppercase">Urgent Approvals</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <h2 className="text-4xl font-bold text-gray-900">3</h2>
                    <span className="text-sm text-gray-600 font-medium">require action</span>
                </div>
                <div className="w-12 h-1 bg-red-500 rounded-full mt-4"></div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Approval List */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-gray-100 w-fit">
                <button className="px-4 py-2 bg-primary-500 text-white text-sm font-bold rounded-lg shadow-sm">All Requests</button>
                <button className="px-4 py-2 text-gray-700 text-sm font-bold hover:bg-gray-50 rounded-lg">International</button>
                <button className="px-4 py-2 text-gray-700 text-sm font-bold hover:bg-gray-50 rounded-lg">Domestic</button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                   <h3 className="font-bold text-lg text-gray-900">Travel Approvals</h3>
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                      <input type="text" placeholder="Search employees..." className="pl-9 pr-4 py-2 bg-gray-50 rounded-lg text-sm border-none outline-none focus:ring-1 focus:ring-primary-200 text-gray-900 placeholder-gray-400" />
                   </div>
                </div>
                <div className="divide-y divide-gray-100">
                    {pendingApprovals.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No pending requests.</div>
                    ) : pendingApprovals.map((item) => (
                        <div key={item.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                            <div className="flex items-center gap-4 min-w-[200px]">
                                <img src={`https://picsum.photos/seed/${item.id}/100/100`} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">{item.employeeName}</h4>
                                    <p className="text-xs text-gray-600 font-medium">{item.department}</p>
                                </div>
                            </div>

                            <div className="flex-1 px-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-gray-900 text-sm">{item.destination}</span>
                                </div>
                                <p className="text-xs text-gray-600 font-medium">{item.startDate} to {item.endDate}</p>
                                <p className="text-[10px] text-gray-500">{item.startTime || '09:00 AM'} - {item.endTime || '05:00 PM'}</p>
                            </div>

                            <div className="px-4 text-right min-w-[100px]">
                                <p className="font-bold text-gray-900">₹{item.amount > 0 ? item.amount.toLocaleString() : 'TBD'}</p>
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide mt-1 bg-pink-100 text-pink-600`}>
                                    Pending
                                </span>
                            </div>

                            <div className="flex items-center gap-2 pl-4">
                                <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                    <X size={20} />
                                </button>
                                <button 
                                  onClick={() => onUpdateStatus(item.id, 'Pending Admin')}
                                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg shadow-sm shadow-green-500/20 transition-all flex items-center gap-2"
                                  title="Approve & Send to Admin"
                                >
                                    <CheckCircle size={16} /> Approve
                                </button>
                                <button 
                                  onClick={() => onViewRequest(item.id)}
                                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg shadow-sm shadow-primary-500/20 transition-all flex items-center gap-2">
                                    Review <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Budget & Stats */}
        <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900">Budget Overview</h3>
                    <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={20} /></button>
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
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                        </RePieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                        <p className="text-xs text-gray-500 uppercase font-bold">Total Spent</p>
                        <p className="text-2xl font-bold text-gray-900">₹6.2 L</p>
                    </div>
                </div>

                <div className="space-y-3 mt-4">
                    {chartData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div>
                                <span className="text-sm text-gray-700 font-medium">{item.name}</span>
                            </div>
                            <span className="text-sm font-bold text-gray-900">₹{(item.value / 100000).toFixed(1)} L</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
