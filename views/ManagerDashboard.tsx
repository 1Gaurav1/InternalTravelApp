import React, { useMemo, useState } from 'react';
import { ViewState, TravelRequest, RequestStatus } from '../types';
import { 
  CheckCircle, Clock, AlertCircle, 
  TrendingUp, Calendar, Download, X, Search, Filter, Eye, MapPin, Building, FileText,
  Plane, Bed, ArrowRight, MessageSquare, User, Briefcase
} from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import ConfirmationModal from '../components/ConfirmationModal';

interface ManagerDashboardProps {
  onNavigate: (view: ViewState) => void;
  onViewRequest: (id: string) => void;
  requests: TravelRequest[];
  onUpdateStatus: (id: string, status: RequestStatus, notes?: string, booking?: any, amount?: number, rejectionReason?: string) => void;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ onNavigate, onViewRequest, requests, onUpdateStatus }) => {
  
  // --- STATE ---
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [viewingRequest, setViewingRequest] = useState<TravelRequest | null>(null);

  // --- FILTER & CHART DATA ---
  const pendingApprovals = requests.filter(r => r.status === 'Pending Manager');

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
    }
  };

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

  // --- FORMATTING HELPERS ---
  const formatDate = (dateString: string) => {
    if (!dateString) return '--/--';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // --- SMART ITINERARY PARSER (Same logic as MyRequests for consistency) ---
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
             <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 shadow-md shadow-primary-500/20 transition-all">
                <Download size={16} /> Export Report
             </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending */}
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

        {/* Spend */}
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

        {/* Budget */}
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
                                    {/* <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${item.type === 'International' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {item.type}
                                    </span> */}
                                </div>
                                <p className="text-xs text-gray-600 font-medium">
                                    {formatDate(item.startDate)} — {formatDate(item.endDate)}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 pt-2 md:pt-0 md:pl-4 border-t md:border-t-0 border-gray-100 mt-2 md:mt-0">
                                <button 
                                    onClick={() => setViewingRequest(item)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="View Full Details"
                                >
                                    <Eye size={20} />
                                </button>
                                <button 
                                    onClick={() => handleRejectClick(item.id || '')}
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

      {/* 2. MANAGER DETAIL MODAL (Updated to "Butter UI") */}
      {viewingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-fade-in p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[95vh]">
                
                {/* Header */}
                <div className="bg-[#1e293b] px-8 py-6 relative flex justify-between items-start shrink-0 rounded-t-3xl">
                    <div className="flex items-center gap-5">
                        <img 
                            src={viewingRequest.employeeAvatar || `https://ui-avatars.com/api/?name=${viewingRequest.employeeName}&background=random`} 
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
                    
                    {/* ITINERARY TIMELINE (The "Butter UI") */}
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

                            {/* COST SUMMARY (CRITICAL FOR MANAGERS) */}
                            <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-xl">
                                <div className="flex items-center gap-2 mb-4 opacity-80">
                                    <TrendingUp size={16}/>
                                    <span className="text-xs font-bold uppercase tracking-widest">Estimated Cost</span>
                                </div>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-3xl font-black">₹{viewingRequest.amount?.toLocaleString() || '0'}</p>
                                        <p className="text-xs text-gray-400 mt-1">Budget Impact</p>
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
                    {viewingRequest.status === 'Pending Manager' && (
                        <>
                            <button 
                                onClick={() => handleRejectClick(viewingRequest.id)}
                                className="px-6 py-3 border border-red-100 text-red-600 hover:bg-red-50 font-bold rounded-xl transition-colors text-sm"
                            >
                                Reject
                            </button>
                            <button 
                                onClick={() => { setViewingRequest(null); onUpdateStatus(viewingRequest.id, 'Pending Admin'); }}
                                className="px-6 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-lg transition-all text-sm flex items-center gap-2"
                            >
                                <CheckCircle size={18}/> Approve Request
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

export default ManagerDashboard;