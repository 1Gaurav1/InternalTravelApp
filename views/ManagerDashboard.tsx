import React, { useMemo, useState } from 'react';
import { ViewState, TravelRequest, RequestStatus } from '../types';
import { 
  CheckCircle, Clock, AlertCircle, 
  TrendingUp, Calendar, Download, X, Search, Filter, Eye, MapPin, Building, FileText,
  Plane, ArrowRight, Briefcase, Layers, History, Home, Undo2, Repeat, Shuffle, CheckSquare
} from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import ConfirmationModal from '../components/ConfirmationModal';
import { toast } from 'react-hot-toast';

interface ManagerDashboardProps {
  onNavigate: (view: ViewState) => void;
  onViewRequest: (id: string) => void;
  requests: TravelRequest[];
  onUpdateStatus: (id: string, status: RequestStatus, notes?: string, booking?: any, amount?: number, rejectionReason?: string) => void;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ onNavigate, onViewRequest, requests, onUpdateStatus }) => {
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [viewingRequest, setViewingRequest] = useState<TravelRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // --- FILTERING ---
  // 1. Pending Approvals (Actionable)
  const pendingApprovals = requests.filter(r => r.status === 'Pending Manager');
  
  // 2. History (Everything else: Approved, Rejected, Booked, Completed)
  const historyRequests = requests.filter(r => r.status !== 'Pending Manager' && r.status !== 'Draft');

  // Apply Search
  const filteredHistory = historyRequests.filter(req => 
      req.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // TRIGGER REJECTION
  const handleRejectClick = (id: string) => {
      setViewingRequest(null);
      setRejectingId(id);
  };

  // CONFIRM REJECTION WITH REASON
  const confirmReject = (reason?: string) => {
    if (rejectingId) {
        onUpdateStatus(rejectingId, 'Rejected', undefined, undefined, undefined, reason);
        setRejectingId(null);
        toast.error("Request rejected successfully");
    }
  };

  // CHART DATA (Financial Overview)
  const chartData = useMemo(() => {
    const domesticTotal = requests
      .filter(r => r.type === 'Domestic' && r.status !== 'Rejected')
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    const internationalTotal = requests
      .filter(r => r.type === 'International' && r.status !== 'Rejected')
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    if (domesticTotal === 0 && internationalTotal === 0) {
        return [{ name: 'No Data', value: 1, color: '#f3f4f6' }];
    }

    return [
      { name: 'Domestic', value: domesticTotal, color: '#3b82f6' }, 
      { name: 'International', value: internationalTotal, color: '#8b5cf6' }, 
    ];
  }, [requests]);

  const totalSpend = chartData.reduce((sum, item) => item.name === 'No Data' ? 0 : sum + item.value, 0);

  // --- FORMATTING HELPERS (MATCHING MYREQUEST) ---
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'Invalid Date') return '--/--';
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
    const isReturn = req.agentNotes?.toLowerCase().includes('return') || req.agentNotes?.toLowerCase().includes('round trip') || req.startDate !== req.endDate;

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
      link.setAttribute("download", `manager_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Report downloaded successfully");
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10 relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Manager Console</h1>
           <p className="text-gray-500 mt-1">Overview of team travel and budget approval.</p>
        </div>
        <div className="flex gap-3">
             <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                <Calendar size={16} /> Filter Date
             </button>
             <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 shadow-md shadow-primary-500/20 transition-all">
                <Download size={16} /> Export Report
             </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Clock size={20} /></div>
               <span className="text-sm font-bold text-gray-500 uppercase">Pending Approval</span>
            </div>
            <div className="flex items-baseline gap-2">
                <h2 className="text-4xl font-bold text-gray-900">{pendingApprovals.length}</h2>
                <span className="text-sm text-gray-600 font-medium">requests</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-400"></div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={20} /></div>
                <span className="text-sm font-bold text-gray-500 uppercase">Total Commitment</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <h2 className="text-4xl font-bold text-gray-900">₹{(totalSpend/100000).toFixed(2)} L</h2>
                    <span className="text-sm text-emerald-600 font-bold">Approved & Pending</span>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500"></div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><AlertCircle size={20} /></div>
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
        
        {/* LEFT: APPROVAL LIST (With TABS) */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* TABS */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 px-6 pt-4 flex gap-6">
                    <button 
                        onClick={() => setActiveTab('pending')}
                        className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'pending' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Pending Actions ({pendingApprovals.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        History Log ({filteredHistory.length})
                    </button>
                </div>

                <div className="p-4 bg-gray-50/50 border-b border-gray-100">
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Search employee, destination, or ID..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2.5 bg-white rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 text-gray-900 placeholder-gray-400 w-full transition-all" 
                      />
                   </div>
                </div>

                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                    
                    {/* --- TAB: PENDING --- */}
                    {activeTab === 'pending' && (
                        <>
                            {pendingApprovals.length === 0 ? (
                                <div className="p-12 text-center flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                        <CheckCircle size={32} className="text-gray-300" />
                                    </div>
                                    <p className="text-gray-500 font-medium">All caught up! No pending requests.</p>
                                </div>
                            ) : pendingApprovals.map((item) => (
                                <div key={item.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-amber-50/30 transition-colors group gap-4 animate-fade-in relative border-l-4 border-amber-400">
                                    <div className="flex items-center gap-4 min-w-[200px]">
                                        <img src={item.employeeAvatar || `https://ui-avatars.com/api/?name=${item.employeeName}&background=random`} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm">{item.employeeName}</h4>
                                            <p className="text-xs text-gray-500 font-medium">{item.department}</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 px-0 md:px-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-900 text-sm">{cleanCityName(item.destination)}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 font-medium">
                                            {formatDate(item.startDate)} — {formatDate(item.endDate)}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2 md:pt-0 md:pl-4 border-t md:border-t-0 border-gray-100 mt-2 md:mt-0">
                                        <button onClick={() => setViewingRequest(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Full Details">
                                            <Eye size={20} />
                                        </button>
                                        <button onClick={() => handleRejectClick(item.id || '')} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Reject Request">
                                            <X size={20} />
                                        </button>
                                        {/* PINK APPROVE BUTTON */}
                                        <button onClick={() => item.id && onUpdateStatus(item.id, 'Pending Admin')} className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-bold rounded-lg shadow-lg shadow-pink-600/20 transition-all flex items-center gap-2" title="Approve & Send to Admin">
                                            <CheckCircle size={16} /> Approve
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* --- TAB: HISTORY --- */}
                    {activeTab === 'history' && (
                        <>
                            {filteredHistory.length === 0 ? (
                                <div className="p-12 text-center flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                        <History size={32} className="text-gray-300" />
                                    </div>
                                    <p className="text-gray-500 font-medium">No history found matching your search.</p>
                                </div>
                            ) : filteredHistory.map((item) => (
                                <div key={item.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50/50 transition-colors group gap-4 animate-fade-in opacity-80 hover:opacity-100">
                                    <div className="flex items-center gap-4 min-w-[200px]">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                                            item.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                                            item.status === 'Booked' ? 'bg-green-100 text-green-600' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                            {item.status === 'Rejected' ? <X size={16}/> : <CheckCircle size={16}/>}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm">{item.employeeName}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                                                    item.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                                    item.status === 'Booked' ? 'bg-green-50 text-green-600 border-green-100' :
                                                    'bg-blue-50 text-blue-600 border-blue-100'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 px-0 md:px-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-700 text-sm">{cleanCityName(item.destination)}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 font-medium">
                                            {formatDate(item.startDate)} - {formatDate(item.endDate)}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setViewingRequest(item)} className="p-2 bg-white border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 rounded-lg transition-all shadow-sm">
                                            <Eye size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

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
                            <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
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
            </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. REJECTION MODAL */}
      <div className="relative z-[60]"> 
        <ConfirmationModal
            isOpen={!!rejectingId}
            onClose={() => setRejectingId(null)}
            onConfirm={(reason) => confirmReject(reason)}
            title="Reject Request"
            message="Are you sure you want to reject this request? This action cannot be undone."
            type="danger"
            confirmText="Reject Request"
            showInput={true}
            inputPlaceholder="Reason for rejection (Visible to employee)..."
            inputRequired={true}
        />
      </div>

      {/* 2. MANAGER DETAIL MODAL */}
      {viewingRequest && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[95vh]">
                
                {/* Header with Trip Type Badge */}
                <div className="bg-[#1e293b] px-8 py-6 relative flex justify-between items-start shrink-0 rounded-t-3xl">
                    <div className="flex items-center gap-5">
                        <img src={viewingRequest.employeeAvatar || `https://ui-avatars.com/api/?name=${viewingRequest.employeeName}&background=random`} className="w-16 h-16 rounded-full border-4 border-white/10 shadow-sm" alt="" />
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-bold text-2xl text-white">{viewingRequest.employeeName}</h3>
                                <span className="bg-white/10 text-white px-2 py-0.5 rounded text-xs font-medium border border-white/20">{viewingRequest.department}</span>
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
                            (viewingRequest.agentNotes?.toLowerCase().includes('multi city')) 
                            ? 'bg-purple-500/20 text-purple-100 border-purple-500/30' 
                            : (viewingRequest.startDate !== viewingRequest.endDate || viewingRequest.agentNotes?.toLowerCase().includes('return'))
                            ? 'bg-indigo-500/20 text-indigo-100 border-indigo-500/30'
                            : 'bg-blue-500/20 text-blue-100 border-blue-500/30'
                        }`}>
                             {(() => {
                                 const notes = viewingRequest.agentNotes?.toLowerCase() || '';
                                 if (notes.includes('multi city') || (viewingRequest.agentNotes?.includes('->') && !notes.includes('origin'))) {
                                     return <><Shuffle size={14}/> Multi-City</>;
                                 } 
                                 if (notes.includes('return') || notes.includes('round trip') || viewingRequest.startDate !== viewingRequest.endDate) {
                                     return <><Repeat size={14}/> Round Trip</>;
                                 }
                                 return <><ArrowRight size={14}/> One-Way</>;
                             })()}
                        </span>
                        <button onClick={() => setViewingRequest(null)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors"><X size={20}/></button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto bg-gray-50 flex-1">
                    
                    {/* ITINERARY TIMELINE */}
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

                <div className="bg-white px-8 py-5 border-t border-gray-100 flex justify-end gap-3 shrink-0 rounded-b-3xl">
                    <button onClick={() => setViewingRequest(null)} className="px-6 py-3 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-sm">Close</button>
                    {viewingRequest.status === 'Pending Manager' && (
                        <>
                            <button onClick={() => handleRejectClick(viewingRequest.id)} className="px-6 py-3 border border-red-100 text-red-600 hover:bg-red-50 font-bold rounded-xl transition-colors text-sm">Reject</button>
                            <button onClick={() => { setViewingRequest(null); onUpdateStatus(viewingRequest.id, 'Pending Admin'); }} className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-lg shadow-pink-600/20 transition-all text-sm flex items-center gap-2"><CheckCircle size={18}/> Approve Request</button>
                        </>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;