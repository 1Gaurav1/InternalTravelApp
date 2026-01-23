import React, { useState, useMemo } from 'react';
import { ViewState, TravelRequest, RequestStatus } from '../types';
import { 
  CheckCircle, Clock, AlertCircle, TrendingUp, Calendar, 
  Download, X, Search, Filter, Eye, MapPin, Building, 
  FileText, Plane, Bed, Briefcase, User, ArrowRight, MessageSquare 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Cell 
} from 'recharts';
import ConfirmationModal from '../components/ConfirmationModal';

interface AdminDashboardProps {
  onNavigate: (view: ViewState) => void;
  requests: TravelRequest[];
  onUpdateStatus: (id: string, status: RequestStatus, notes?: string, booking?: any, amount?: number, rejectionReason?: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, requests, onUpdateStatus }) => {
  
  // --- STATE ---
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [viewingRequest, setViewingRequest] = useState<TravelRequest | null>(null);
  const [filter, setFilter] = useState<'All' | 'Pending'>('Pending');
  const [search, setSearch] = useState('');

  // --- FILTER LOGIC ---
  const displayRequests = useMemo(() => {
      let filtered = requests;
      
      // 1. Filter by Tab
      if (filter === 'Pending') {
          filtered = filtered.filter(r => r.status === 'Pending Admin');
      }

      // 2. Filter by Search
      if (search) {
          const lowerSearch = search.toLowerCase();
          filtered = filtered.filter(r => 
              r.employeeName.toLowerCase().includes(lowerSearch) ||
              r.destination.toLowerCase().includes(lowerSearch) ||
              r.id.toLowerCase().includes(lowerSearch)
          );
      }

      return filtered;
  }, [requests, filter, search]);

  const pendingCount = requests.filter(r => r.status === 'Pending Admin').length;

  // --- ANALYTICS DATA ---
  const deptData = useMemo(() => {
    const data: Record<string, number> = {};
    requests.forEach(r => {
        if (r.status !== 'Rejected') {
            data[r.department] = (data[r.department] || 0) + (r.amount || 0);
        }
    });
    return Object.keys(data).map(dept => ({ name: dept, value: data[dept] }));
  }, [requests]);

  const totalSpend = requests.reduce((sum, r) => r.status !== 'Rejected' ? sum + (r.amount || 0) : sum, 0);

  // --- HANDLERS ---
  const handleRejectClick = (id: string) => {
      setViewingRequest(null);
      setRejectingId(id);
  };

  const confirmReject = (reason?: string) => {
    if (rejectingId) {
        onUpdateStatus(rejectingId, 'Rejected', undefined, undefined, undefined, reason);
        setRejectingId(null);
    }
  };

  const approveRequest = (id: string) => {
      setViewingRequest(null);
      // Admin Approval moves it to the Agent
      onUpdateStatus(id, 'Processing (Agent)');
  };

  // --- HELPERS ---
  const formatDate = (dateString: string) => {
    if (!dateString) return '--/--';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getRouteDisplay = (req: TravelRequest) => {
    const originMatch = req.agentNotes?.match(/Origin:\s*(.*?)(\n|$)/);
    const origin = originMatch ? originMatch[1].trim() : null;
    if (req.destination.includes(',')) return req.destination.split(',').map(s => s.trim()).join(' ➝ ');
    if (origin) return `${origin} ➝ ${req.destination}`;
    return req.destination;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
           <p className="text-gray-500 mt-1">Financial control and final approval.</p>
        </div>
        <div className="flex gap-3">
             <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                <Calendar size={16} /> Date Range
             </button>
             <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-black shadow-lg shadow-gray-900/20 transition-all">
                <Download size={16} /> Audit Report
             </button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Briefcase size={20}/></div>
                      <span className="text-xs font-bold text-gray-400 uppercase">Pending Review</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                      <h2 className="text-3xl font-bold text-gray-900">{pendingCount}</h2>
                      <span className="text-sm text-gray-500">requests</span>
                  </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-500"></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={20}/></div>
                      <span className="text-xs font-bold text-gray-400 uppercase">Total Commitment</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                      <h2 className="text-3xl font-bold text-gray-900">₹{(totalSpend / 100000).toFixed(2)}L</h2>
                      <span className="text-sm text-green-600 font-bold">+12%</span>
                  </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500"></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Building size={20}/></div>
                      <span className="text-xs font-bold text-gray-400 uppercase">Top Dept</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                      <h2 className="text-3xl font-bold text-gray-900">Prod.</h2>
                      <span className="text-sm text-gray-500">Product Team</span>
                  </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500"></div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Request List */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                  <h3 className="font-bold text-lg text-gray-900">Travel Requests</h3>
                  <div className="flex items-center gap-3">
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                          <input 
                            type="text" 
                            placeholder="Search..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-1.5 bg-gray-50 rounded-lg text-xs border-none outline-none focus:ring-2 focus:ring-primary-100 text-gray-900 w-32 transition-all" 
                          />
                       </div>
                      <div className="flex bg-gray-100 p-1 rounded-lg">
                          <button onClick={() => setFilter('Pending')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filter === 'Pending' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>Pending</button>
                          <button onClick={() => setFilter('All')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filter === 'All' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>All</button>
                      </div>
                  </div>
              </div>
              <div className="divide-y divide-gray-100">
                  {displayRequests.length === 0 ? (
                      <div className="p-10 text-center text-gray-500">No requests found.</div>
                  ) : (
                      displayRequests.map(req => (
                          <div key={req.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                              <div className="flex items-center gap-4">
                                  <img src={req.employeeAvatar || `https://ui-avatars.com/api/?name=${req.employeeName}`} className="w-10 h-10 rounded-full border border-gray-200" alt=""/>
                                  <div>
                                      <h4 className="font-bold text-gray-900 text-sm">{req.employeeName}</h4>
                                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                          <span className="flex items-center gap-1"><MapPin size={10}/> {req.destination.split(',')[0]}</span>
                                          <span>•</span>
                                          <span>{formatDate(req.startDate)}</span>
                                      </div>
                                  </div>
                              </div>
                              <div className="flex items-center gap-3">
                                  <div className="text-right mr-2">
                                      <p className="font-bold text-gray-900 text-sm">₹{req.amount.toLocaleString()}</p>
                                      <span className={`text-[10px] font-bold uppercase ${
                                          req.status === 'Pending Admin' ? 'text-yellow-600' : 
                                          req.status === 'Booked' ? 'text-green-600' : 'text-gray-400'
                                      }`}>{req.status}</span>
                                  </div>
                                  
                                  {req.status === 'Pending Admin' && (
                                      <div className="flex items-center gap-2"> {/* Removed opacity classes */}
                                          <button onClick={() => setViewingRequest(req)} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"><Eye size={16}/></button>
                                          <button onClick={() => handleRejectClick(req.id)} className="p-2 text-red-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors"><X size={16}/></button>
                                          <button onClick={() => approveRequest(req.id)} className="p-2 text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"><CheckCircle size={16}/></button>
                                      </div>
                                  )}
                                  {req.status !== 'Pending Admin' && (
                                       <button onClick={() => setViewingRequest(req)} className="p-2 text-gray-300 hover:text-gray-500"><Eye size={16}/></button>
                                  )}
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>

          {/* RIGHT: Charts */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-6">Spend by Department</h3>
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deptData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} dy={10}/>
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} tickFormatter={(val) => `₹${val/1000}k`}/>
                          <ReTooltip 
                              cursor={{fill: '#F3F4F6'}}
                              contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {deptData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'][index % 4]} />
                              ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* --- CONFIRMATION MODAL --- */}
      <ConfirmationModal
        isOpen={!!rejectingId}
        onClose={() => setRejectingId(null)}
        onConfirm={(reason) => confirmReject(reason)}
        title="Reject Request"
        message="Are you sure? This will return the request to the employee."
        type="danger"
        confirmText="Reject"
        showInput={true}
        inputRequired={true}
      />

      {/* --- DETAIL MODAL (Matching Rich UI) --- */}
      {viewingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-[#111827] px-8 py-8 relative">
                    <button onClick={() => setViewingRequest(null)} className="absolute top-6 left-6 text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors">
                        <ArrowRight className="rotate-180" size={16}/> Back
                    </button>
                    <div className="mt-6 flex justify-between items-start">
                        <div>
                            <span className={`px-3 py-1 text-xs font-bold rounded-lg uppercase ${viewingRequest.status === 'Pending Admin' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-gray-700 text-gray-300'}`}>
                                {viewingRequest.status}
                            </span>
                            <h2 className="text-3xl font-bold text-white mt-3 mb-2">{getRouteDisplay(viewingRequest)}</h2>
                            <p className="text-gray-400 flex items-center gap-2">
                                <User size={16}/> {viewingRequest.employeeName}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400 font-bold uppercase">Estimated Cost</p>
                            <p className="text-3xl font-black text-white">₹{viewingRequest.amount.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 overflow-y-auto bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2"><Calendar size={14}/> Schedule</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Start</span>
                                    <span className="font-bold text-gray-900">{formatDate(viewingRequest.startDate)} • {viewingRequest.startTime}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">End</span>
                                    <span className="font-bold text-gray-900">{formatDate(viewingRequest.endDate)} • {viewingRequest.endTime}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2"><Briefcase size={14}/> Preferences</h4>
                            <p className="text-sm text-gray-700 leading-relaxed">{viewingRequest.preferredFlight || "None specified"}</p>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-full">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2"><FileText size={14}/> Business Purpose</h4>
                            <p className="text-sm text-gray-700 leading-relaxed">{viewingRequest.purpose}</p>
                        </div>
                        {viewingRequest.agentNotes && (
                            <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 shadow-sm">
                                <h4 className="text-xs font-bold text-blue-700 uppercase mb-2 flex items-center gap-2"><MessageSquare size={14}/> Previous Notes</h4>
                                <p className="text-xs text-blue-900 whitespace-pre-wrap">{viewingRequest.agentNotes}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-white border-t border-gray-100 flex justify-end gap-3 shrink-0">
                    <button onClick={() => setViewingRequest(null)} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors text-sm">Close</button>
                    {viewingRequest.status === 'Pending Admin' && (
                        <>
                            <button onClick={() => handleRejectClick(viewingRequest.id)} className="px-6 py-3 text-red-600 font-bold hover:bg-red-50 rounded-xl border border-red-100 transition-colors">Reject</button>
                            <button onClick={() => approveRequest(viewingRequest.id)} className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black flex items-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5">
                                <CheckCircle size={18}/> Approve & Send to Agent
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;