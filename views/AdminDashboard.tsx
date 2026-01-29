import React, { useState, useMemo } from 'react';
import { ViewState, TravelRequest, RequestStatus } from '../types';
import { 
  CheckCircle, Clock, AlertCircle, TrendingUp, Calendar, 
  Download, X, Search, Filter, Eye, MapPin, Building, 
  FileText, Plane, Bed, Briefcase, User, ArrowRight, MessageSquare, 
  Layers, History, Home, Undo2, Repeat, Shuffle, CheckSquare
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Cell 
} from 'recharts';
import ConfirmationModal from '../components/ConfirmationModal';
import { toast } from 'react-hot-toast';

interface AdminDashboardProps {
  onNavigate: (view: ViewState) => void;
  requests: TravelRequest[];
  onUpdateStatus: (id: string, status: RequestStatus, notes?: string, booking?: any, amount?: number, rejectionReason?: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, requests, onUpdateStatus }) => {
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [viewingRequest, setViewingRequest] = useState<TravelRequest | null>(null);
  const [search, setSearch] = useState('');

  // --- FILTER LOGIC ---
  // 1. Pending Approvals (Actionable)
  const pendingRequests = requests.filter(r => r.status === 'Pending Admin');

  // 2. History (Everything else)
  const historyRequests = requests.filter(r => r.status !== 'Pending Admin' && r.status !== 'Draft');

  // Apply Search to whichever list is active or just for counting
  const getFilteredList = (list: TravelRequest[]) => {
      if (!search) return list;
      const lowerSearch = search.toLowerCase();
      return list.filter(r => 
          r.employeeName.toLowerCase().includes(lowerSearch) ||
          r.destination.toLowerCase().includes(lowerSearch) ||
          r.id.toLowerCase().includes(lowerSearch)
      );
  };

  const displayList = activeTab === 'pending' ? getFilteredList(pendingRequests) : getFilteredList(historyRequests);
  const pendingCount = pendingRequests.length;

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
        toast.error("Request rejected successfully");
    }
  };

  const approveRequest = (id: string) => {
      setViewingRequest(null);
      // Admin Approval moves it to the Agent (or Booked if workflow differs, usually Agent processes it)
      onUpdateStatus(id, 'Processing (Agent)');
      toast.success("Request approved and forwarded to Travel Desk");
  };

  // --- HELPERS (MATCHING MYREQUEST EXACTLY) ---
  const formatDate = (dateString: string) => {
    if (!dateString) return '--/--';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // --- STRICT CITY CLEANER (MATCHING MYREQUEST) ---
  const cleanCityName = (name: string) => {
      if (!name) return "";
      let cleaned = name.split(',')[0].trim();
      cleaned = cleaned.replace(/^(Origin:|From:|To:)/i, '').trim();
      if (cleaned.toLowerCase() === 'origin' || cleaned.toLowerCase() === 'start point') return ''; 
      return cleaned;
  };

  // --- TEXT NOTE CLEANER ---
  const cleanNotesDisplay = (notes: string) => {
      if (!notes) return "No details provided.";
      return notes.replace(/([a-zA-Z\s]+),\s[a-zA-Z\s&]+/g, "$1");
  };

  // --- TRIP TYPE DETECTOR ---
  const getTripType = (req: TravelRequest) => {
      const notes = req.agentNotes?.toLowerCase() || '';
      if (notes.includes('multi city') || (req.agentNotes?.includes('->') && !notes.includes('origin'))) {
          return 'Multi-City';
      } 
      if (notes.includes('return') || notes.includes('round trip') || req.startDate !== req.endDate) {
          return 'Round Trip';
      }
      return 'One-Way';
  };

  // --- TIMELINE PARSER (EXACTLY MATCHING MYREQUEST) ---
  const getFullTimeline = (req: TravelRequest) => {
    // 1. If Booked, use exact flight data
    if (req.bookingDetails?.flights?.length) {
       const nodes: any[] = [];
       const flights = req.bookingDetails.flights;
       nodes.push({
           city: cleanCityName(flights[0].from),
           date: formatDate(flights[0].departureTime),
           time: formatTime(flights[0].departureTime),
           status: 'Start'
       });
       flights.forEach((f: any, idx: number) => {
           nodes.push({
               city: cleanCityName(f.to),
               date: formatDate(f.arrivalTime || f.departureTime), 
               time: formatTime(f.arrivalTime),
               status: idx === flights.length - 1 ? 'End' : 'Stop'
           });
       });
       return nodes;
    }

    // 2. Parse Multi-City
    const multiCityMatches = [...(req.agentNotes?.matchAll(/(\d+\.)?\s*([a-zA-Z\s]+)(?:,[^->]+)?\s*->\s*([a-zA-Z\s]+)(?:,[^|]+)?/g) || [])];
    if (multiCityMatches.length > 0) {
        const nodes: any[] = [];
        nodes.push({
            city: cleanCityName(multiCityMatches[0][2]), 
            date: formatDate(req.startDate), 
            time: req.startTime || 'TBA', 
            status: 'Start'
        });
        multiCityMatches.forEach((match, i) => {
            nodes.push({
                city: cleanCityName(match[3]), 
                date: '... ', 
                time: 'TBA',
                status: i === multiCityMatches.length - 1 ? 'End' : 'Stop'
            });
        });
        return nodes;
    }

    // 3. Fallback: One-Way or Return
    const originMatch = req.agentNotes?.match(/(?:Origin|From):\s*(.*?)(\n|$)/i);
    let startCity = originMatch ? cleanCityName(originMatch[1]) : '';
    const dest = cleanCityName(req.destination);
    const isReturn = getTripType(req) === 'Round Trip';

    const simpleNodes = [];
    simpleNodes.push({ city: startCity || "Start", date: formatDate(req.startDate), time: req.startTime || 'TBA', status: 'Start' });
    simpleNodes.push({ city: dest, date: formatDate(req.endDate), time: isReturn ? 'Stay' : 'End', status: isReturn ? 'Stop' : 'End' });

    if (isReturn) {
        simpleNodes.push({ city: startCity || "Start", date: formatDate(req.endDate), time: req.endTime || 'TBA', status: 'Return' });
    }

    return simpleNodes;
  };

  // --- EXPORT FUNCTION ---
  const exportToCSV = () => {
      const headers = ['Request ID', 'Employee', 'Department', 'Type', 'Destination', 'Start Date', 'End Date', 'Status', 'Total Cost'];
      const rows = requests.map(req => [
          req.id,
          req.employeeName,
          req.department,
          req.type,
          `"${req.destination}"`,
          req.startDate,
          req.endDate,
          req.status,
          req.amount || 0
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `admin_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Report downloaded successfully");
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
             <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-black shadow-lg shadow-gray-900/20 transition-all">
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
              <div className="border-b border-gray-100 px-6 pt-4 flex gap-6">
                    <button 
                        onClick={() => setActiveTab('pending')}
                        className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'pending' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Pending Actions ({pendingCount})
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        History Log ({historyRequests.length})
                    </button>
              </div>

              <div className="p-4 bg-gray-50/50 border-b border-gray-100">
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Search employee, destination, or ID..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-white rounded-lg text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-purple-100 w-full transition-all" 
                      />
                  </div>
              </div>

              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {displayList.length === 0 ? (
                      <div className="p-10 text-center text-gray-500">No requests found.</div>
                  ) : (
                      displayList.map(req => {
                          const type = getTripType(req);
                          return (
                              <div key={req.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors group gap-4 animate-fade-in relative">
                                  {activeTab === 'pending' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-400 rounded-l"></div>}
                                  
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
                                          <span className="font-bold text-gray-900 text-sm">{cleanCityName(req.destination)}</span>
                                          {/* TRIP TYPE BADGE IN LIST */}
                                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1 ${
                                              type === 'Multi-City' ? 'bg-purple-100 text-purple-700' :
                                              type === 'Round Trip' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                                          }`}>
                                              {type === 'Multi-City' ? <Shuffle size={10}/> : type === 'Round Trip' ? <Repeat size={10}/> : <ArrowRight size={10}/>}
                                              {type}
                                          </span>
                                      </div>
                                      <p className="text-xs text-gray-600 font-medium">
                                          {formatDate(req.startDate)} — {formatDate(req.endDate)}
                                      </p>
                                  </div>

                                  <div className="flex items-center gap-3">
                                      <div className="text-right mr-2 hidden md:block">
                                          <p className="font-bold text-gray-900 text-sm">₹{req.amount?.toLocaleString() || '0'}</p>
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
                                                  {/* PINK APPROVE BUTTON */}
                                                  <button onClick={() => approveRequest(req.id)} className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-lg shadow-pink-600/20 transition-all text-sm flex items-center gap-2" title="Approve">
                                                      <CheckCircle size={16}/> Approve
                                                  </button>
                                              </>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          );
                      })
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

      {/* --- DETAIL MODAL (MATCHING MYREQUEST EXACTLY) --- */}
      {viewingRequest && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[95vh] overflow-hidden relative">
                
                {/* Header */}
                <div className="bg-[#1e293b] px-8 py-6 relative flex justify-between items-start shrink-0">
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
                                <span className="flex items-center gap-1"><MapPin size={12}/> {cleanCityName(viewingRequest.destination)}</span>
                                <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                                <span className="flex items-center gap-1">ID: {viewingRequest.id}</span>
                            </div>
                        </div>
                    </div>

                    {/* TRIP TYPE BADGE */}
                    <div className="flex items-center gap-3">
                        <span className={`px-4 py-2 rounded-full text-xs font-bold border flex items-center gap-2 shadow-sm uppercase tracking-wide ${
                            (getTripType(viewingRequest) === 'Multi-City') 
                            ? 'bg-purple-500/20 text-purple-100 border-purple-500/30' 
                            : (getTripType(viewingRequest) === 'Round Trip')
                            ? 'bg-indigo-500/20 text-indigo-100 border-indigo-500/30'
                            : 'bg-blue-500/20 text-blue-100 border-blue-500/30'
                        }`}>
                             {(() => {
                                 const type = getTripType(viewingRequest);
                                 if (type === 'Multi-City') return <><Shuffle size={14}/> Multi-City</>;
                                 if (type === 'Round Trip') return <><Repeat size={14}/> Round Trip</>;
                                 return <><ArrowRight size={14}/> One-Way</>;
                             })()}
                        </span>
                        <button onClick={() => setViewingRequest(null)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors"><X size={20}/></button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto bg-gray-50 flex-1">
                    
                    {/* ITINERARY TIMELINE (EXACT MATCH) */}
                    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center mb-8">
                        <div className="flex items-center gap-4 overflow-x-auto pb-4 w-full justify-between max-w-3xl">
                            {getFullTimeline(viewingRequest).map((node, i, arr) => {
                                const isReturnToStart = i === arr.length - 1 && node.city === arr[0].city;
                                return (
                                    <React.Fragment key={i}>
                                        <div className="flex flex-col items-center min-w-[120px] shrink-0 z-10 relative group">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-md border-4 border-white transition-transform group-hover:scale-110 ${i === 0 ? 'bg-green-100 text-green-600' : isReturnToStart ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-50 text-blue-500'}`}>
                                                {isReturnToStart ? <Home size={20} className="fill-current"/> : <MapPin size={20} className="fill-current"/>}
                                            </div>
                                            <span className="text-base font-bold text-gray-900 text-center leading-tight mb-1">{node.city}</span>
                                            <div className="flex flex-col items-center gap-1 mt-1">
                                                <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded border border-gray-200">{node.date}</span>
                                                {node.time && node.time !== 'TBA' && (<span className="text-[10px] font-mono text-gray-400 bg-white px-1.5 rounded border border-gray-100">{node.time}</span>)}
                                            </div>
                                        </div>
                                        {i < arr.length - 1 && (
                                            <div className="h-0.5 flex-1 bg-gray-200 shrink-0 mb-14 mx-2 relative min-w-[60px] rounded-full flex items-center justify-center">
                                                {(i === arr.length - 2 && arr[i+1].city === arr[0].city) ? (
                                                    <div className="absolute -top-4 flex flex-col items-center">
                                                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1"><Undo2 size={10}/> Return</span>
                                                    </div>
                                                ) : null}
                                                <div className="absolute right-0 -top-1.5 w-3 h-3 border-t-2 border-r-2 border-gray-300 rotate-45"></div>
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Calendar size={12}/> Booking Schedule</label>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-xs text-gray-500">Departure</p>
                                            <p className="font-bold text-gray-900 text-base">{formatDate(viewingRequest.startDate)}</p>
                                        </div>
                                        <ArrowRight className="text-gray-300" size={16}/>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">Return</p>
                                            <p className="font-bold text-gray-900 text-base">{formatDate(viewingRequest.endDate)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Briefcase size={12}/> Business Purpose</label>
                                <p className="text-sm text-gray-700 leading-relaxed italic">"{viewingRequest.purpose || "No specific purpose stated."}"</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200/60">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><FileText size={12}/> Requirements</label>
                                <p className="text-xs text-gray-600 font-medium whitespace-pre-wrap">{cleanNotesDisplay(viewingRequest.agentNotes || "No notes.")}</p>
                            </div>
                            {viewingRequest.amount !== undefined && viewingRequest.amount !== null && viewingRequest.amount > 0 && (
                                <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-xl">
                                    <div className="flex items-center gap-2 mb-4 opacity-80">
                                        <TrendingUp size={16}/>
                                        <span className="text-xs font-bold uppercase tracking-widest">Estimated Cost</span>
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-3xl font-black">₹{viewingRequest.amount.toLocaleString()}</p>
                                            <p className="text-xs text-gray-400 mt-1">Budget Impact</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${viewingRequest.amount > 50000 ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'}`}>
                                            {viewingRequest.amount > 50000 ? 'High Value' : 'Standard'}
                                        </span>
                                    </div>
                                </div>
                            )}
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
                                className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-lg shadow-pink-600/20 transition-all text-sm flex items-center gap-2"
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