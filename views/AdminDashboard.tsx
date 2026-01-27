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

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // --- SMART ITINERARY PARSER ---
  const getTimelineCities = (req: TravelRequest) => {
    // 1. If Booked, use exact flight data
    if (req.bookingDetails?.flights?.length) {
       const cities = [req.bookingDetails.flights[0].from];
       req.bookingDetails.flights.forEach((f: any) => cities.push(f.to));
       return [...new Set(cities)]; 
    }
    // 2. Try parsing "Multi City" format from Agent Notes
    const multiCityMatches = [...(req.agentNotes?.matchAll(/\d+\.\s*(.*?)\s*->\s*(.*?)\s*\|/g) || [])];
    if (multiCityMatches.length > 0) {
        const cities = [multiCityMatches[0][1].split(',')[0].trim()];
        multiCityMatches.forEach(m => cities.push(m[2].split(',')[0].trim()));
        return cities;
    }
    // 3. Fallback: Parse "Origin: X" and Destination string
    const origin = req.agentNotes?.match(/Origin:\s*(.*?)(\n|$)/)?.[1]?.split(',')[0].trim();
    const dests = req.destination.split(',').map(s => s.split(',')[0].trim());
    if (origin && origin !== "Origin") return [origin, ...dests];
    return ["Origin", ...dests];
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
                          <div key={req.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors group gap-4 animate-fade-in">
                              <div className="flex items-center gap-4 min-w-[200px]">
                                  <img 
                                    src={req.employeeAvatar || `https://ui-avatars.com/api/?name=${req.employeeName}`} 
                                    className="w-12 h-12 rounded-full border-2 border-white shadow-sm" 
                                    alt=""
                                  />
                                  <div>
                                      <h4 className="font-bold text-gray-900 text-sm">{req.employeeName}</h4>
                                      <p className="text-xs text-gray-500 font-medium">{req.department}</p>
                                  </div>
                              </div>

                              <div className="flex-1 px-0 md:px-4">
                                  <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold text-gray-900 text-sm">{req.destination}</span>
                                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${req.type === 'International' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                          {req.type}
                                      </span>
                                  </div>
                                  <p className="text-xs text-gray-600 font-medium">
                                      {formatDate(req.startDate)} — {formatDate(req.endDate)}
                                  </p>
                              </div>

                              <div className="flex items-center gap-3">
                                  <div className="text-right mr-2 hidden md:block">
                                      <p className="font-bold text-gray-900 text-sm">₹{req.amount.toLocaleString()}</p>
                                      <span className={`text-[10px] font-bold uppercase ${
                                          req.status === 'Pending Admin' ? 'text-yellow-600' : 
                                          req.status === 'Booked' ? 'text-green-600' : 'text-gray-400'
                                      }`}>{req.status}</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 border-t md:border-t-0 border-gray-100 pt-2 md:pt-0">
                                      <button onClick={() => setViewingRequest(req)} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                                          <Eye size={18}/>
                                      </button>
                                      {req.status === 'Pending Admin' && (
                                          <>
                                              <button onClick={() => handleRejectClick(req.id)} className="p-2 text-red-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors" title="Reject">
                                                  <X size={18}/>
                                              </button>
                                              <button onClick={() => approveRequest(req.id)} className="p-2 text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors" title="Approve">
                                                  <CheckCircle size={18}/>
                                              </button>
                                          </>
                                      )}
                                  </div>
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
        message="Are you sure? This will return the request to the employee/manager."
        type="danger"
        confirmText="Reject"
        showInput={true}
        inputRequired={true}
      />

      {/* --- DETAIL MODAL (PROFESSIONAL BUTTER UI) --- */}
      {viewingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-fade-in p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[95vh]">
                
                {/* Header */}
                <div className="bg-[#1e293b] px-8 py-6 relative flex justify-between items-start shrink-0 rounded-t-3xl">
                    <div className="flex items-center gap-5">
                        <img 
                            src={viewingRequest.employeeAvatar || `https://ui-avatars.com/api/?name=${viewingRequest.employeeName}`} 
                            className="w-16 h-16 rounded-full border-4 border-white/10 shadow-sm" 
                            alt="" 
                        />
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-bold text-2xl text-white">{viewingRequest.employeeName}</h3>
                                <span className="bg-white/10 text-white px-2 py-0.5 rounded text-xs font-medium border border-white/20">
                                    {viewingRequest.department}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-300">
                                <span className="flex items-center gap-1"><MapPin size={12}/> {viewingRequest.branch || 'Headquarters'}</span>
                                <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                                <span className="flex items-center gap-1"><Clock size={12}/> Submitted: {formatDate(viewingRequest.submittedDate?.toString() || '')}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setViewingRequest(null)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors">
                        <X size={20}/>
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto bg-gray-50 flex-1">
                    
                    {/* ITINERARY TIMELINE (BUTTER UI) */}
                    <div className="mb-8">
                        {/* If Booked: Show Specifics */}
                        {viewingRequest.bookingDetails?.flights && viewingRequest.bookingDetails.flights.length > 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                {viewingRequest.bookingDetails.flights.map((seg: any, idx: number) => (
                                    <div key={idx} className="flex p-5 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors gap-4">
                                        <div className="w-24 shrink-0 flex flex-col justify-center text-right border-r border-gray-100 pr-4">
                                            <span className="text-sm font-bold text-gray-900">{formatTime(seg.departureTime) || 'TBA'}</span>
                                            <span className="text-[10px] text-gray-400 uppercase font-bold">{seg.departureTime ? formatDate(seg.departureTime) : 'Date'}</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                                    {seg.from} <ArrowRight size={14} className="text-gray-300"/> {seg.to}
                                                </h4>
                                                <span className="font-bold text-gray-900">₹{seg.cost?.toLocaleString()}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 font-medium flex items-center gap-3">
                                                <span>{seg.airline} • {seg.flightNumber}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* If Pending: Show Visual Nodes */
                            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center">
                                <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full justify-between max-w-2xl">
                                    {getTimelineCities(viewingRequest).map((city, i, arr) => (
                                        <React.Fragment key={i}>
                                            <div className="flex flex-col items-center min-w-[100px] shrink-0 z-10">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 shadow-md border-4 border-white ${
                                                    i === 0 ? 'bg-green-100 text-green-600' : 
                                                    i === arr.length - 1 ? 'bg-red-100 text-red-600' : 
                                                    'bg-blue-50 text-blue-500'
                                                }`}>
                                                    <MapPin size={16} className="fill-current"/>
                                                </div>
                                                <span className="text-sm font-bold text-gray-800 text-center leading-tight">{city}</span>
                                                <span className="text-[10px] text-gray-400 uppercase font-bold mt-1">
                                                    {i === 0 ? 'Start' : i === arr.length - 1 ? 'End' : 'Stop'}
                                                </span>
                                            </div>
                                            {i < arr.length - 1 && (
                                                <div className="h-0.5 flex-1 bg-gray-200 shrink-0 mb-8 mx-2 relative min-w-[40px]">
                                                    <div className="absolute right-0 -top-1 w-2 h-2 border-t-2 border-r-2 border-gray-300 rotate-45"></div>
                                                </div>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* LEFT: TRIP DATA */}
                        <div className="space-y-6">
                            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Calendar size={12}/> Schedule
                                </label>
                                <div className="flex justify-between items-center mb-2">
                                    <div>
                                        <p className="text-xs text-gray-500">Departure</p>
                                        <p className="font-bold text-gray-900">{formatDate(viewingRequest.startDate)}</p>
                                    </div>
                                    <div className="w-8 h-px bg-gray-200"></div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Return</p>
                                        <p className="font-bold text-gray-900">{formatDate(viewingRequest.endDate)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Briefcase size={12}/> Business Purpose
                                </label>
                                <p className="text-sm text-gray-700 leading-relaxed italic">
                                    "{viewingRequest.purpose || "No specific purpose stated."}"
                                </p>
                            </div>
                        </div>

                        {/* RIGHT: REQUIREMENTS & COST */}
                        <div className="space-y-6">
                            {/* Requirements / Notes */}
                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200/60">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <FileText size={12}/> Requirements & Notes
                                </label>
                                {viewingRequest.agentNotes ? (
                                    <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap font-sans text-xs">
                                        {viewingRequest.agentNotes}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">No special requirements.</p>
                                )}
                            </div>

                            {/* COST SUMMARY (CRITICAL FOR ADMINS) */}
                            <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-xl">
                                <div className="flex items-center gap-2 mb-4 opacity-80">
                                    <TrendingUp size={16}/>
                                    <span className="text-xs font-bold uppercase tracking-widest">Total Approved Cost</span>
                                </div>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-3xl font-black">₹{viewingRequest.amount?.toLocaleString() || '0'}</p>
                                        <p className="text-xs text-gray-400 mt-1">Ready for Disbursement</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${viewingRequest.amount > 50000 ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'}`}>
                                            {viewingRequest.amount > 50000 ? 'High Value' : 'Standard'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="bg-white px-8 py-5 border-t border-gray-100 flex justify-end gap-3 shrink-0 rounded-b-3xl">
                    <button onClick={() => setViewingRequest(null)} className="px-6 py-3 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-sm">Close</button>
                    {viewingRequest.status === 'Pending Admin' && (
                        <>
                            <button 
                                onClick={() => handleRejectClick(viewingRequest.id)}
                                className="px-6 py-3 border border-red-100 text-red-600 hover:bg-red-50 font-bold rounded-xl transition-colors text-sm"
                            >
                                Reject
                            </button>
                            <button 
                                onClick={() => approveRequest(viewingRequest.id)}
                                className="px-6 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-lg transition-all text-sm flex items-center gap-2"
                            >
                                <CheckCircle size={18}/> Approve & Process
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