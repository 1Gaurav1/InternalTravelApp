import React, { useMemo, useState } from 'react';
import { ViewState, TravelRequest, RequestStatus } from '../types';
import { 
  CheckCircle, Clock, AlertCircle, 
  TrendingUp, Calendar, Download, X, Search, Filter, Eye, MapPin, Building, FileText,
  Plane, Bed, ArrowRight, MessageSquare
} from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import ConfirmationModal from '../components/ConfirmationModal';

interface ManagerDashboardProps {
  onNavigate: (view: ViewState) => void;
  onViewRequest: (id: string) => void;
  requests: TravelRequest[];
  // Ensure the parent handles 'rejectionReason'
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
      // Close the details view if open, so the modal is clear
      setViewingRequest(null);
      setRejectingId(id);
  };

  // CONFIRM REJECTION WITH REASON
  const confirmReject = (reason?: string) => {
    if (rejectingId) {
        // Pass the reason (comment) back to the parent component
        // This ensures it gets saved into 'agentNotes' or a 'rejectionReason' field
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
    if (!dateString) return '--/--/----';
    return new Date(dateString).toLocaleDateString('en-GB'); 
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getRouteDisplay = (req: TravelRequest) => {
    // 1. Try to find "Origin: City" in notes
    const originMatch = req.agentNotes?.match(/Origin:\s*(.*?)(\n|$)/);
    const origin = originMatch ? originMatch[1].trim() : null;

    if (req.destination.includes(',')) {
        return req.destination.split(',').map(s => s.trim()).join(' ➝ ');
    }
    if (origin) {
        return `${origin} ➝ ${req.destination}`;
    }
    return req.destination;
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
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${item.type === 'International' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {item.type}
                                    </span>
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

      {/* 1. REJECTION MODAL (High Z-Index to stay on top) */}
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

      {/* 2. PROFESSIONAL VIEW DETAILS MODAL */}
      {viewingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Modal Header */}
                <div className="bg-white px-8 py-6 border-b border-gray-100 flex justify-between items-start shrink-0">
                    <div className="flex items-center gap-5">
                         <img 
                            src={viewingRequest.employeeAvatar || `https://ui-avatars.com/api/?name=${viewingRequest.employeeName}&background=random`} 
                            className="w-16 h-16 rounded-full border-4 border-gray-50 shadow-sm" 
                            alt="" 
                        />
                        <div>
                             <h3 className="font-bold text-2xl text-gray-900">{viewingRequest.employeeName}</h3>
                             <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium text-xs"><Building size={12}/> {viewingRequest.department}</span>
                                <span className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded text-blue-600 font-medium text-xs"><MapPin size={12}/> {viewingRequest.branch || 'Headquarters'}</span>
                             </div>
                        </div>
                    </div>
                    <button onClick={() => setViewingRequest(null)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-200 transition-all"><X size={20}/></button>
                </div>

                {/* Modal Content */}
                <div className="p-8 overflow-y-auto bg-gray-50/30">
                    
                    {/* IF BOOKED: SHOW DETAILED ITINERARY */}
                    {viewingRequest.bookingDetails ? (
                        <div className="space-y-8">
                            
                            {/* Flights Section */}
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                                <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                    <h4 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                                        <Plane size={16} className="text-blue-500"/> Flight Itinerary
                                    </h4>
                                    <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                        {viewingRequest.bookingDetails.flights.length} Leg{viewingRequest.bookingDetails.flights.length > 1 ? 's' : ''}
                                    </span>
                                </div>
                                
                                <div className="divide-y divide-gray-100">
                                    {viewingRequest.bookingDetails.flights.map((f, i) => (
                                        <div key={i} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                                            
                                            {/* Flight # and Airline */}
                                            <div className="flex items-center gap-4 min-w-[180px]">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                                                    #{i + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">{f.airline}</p>
                                                    <p className="text-xs text-gray-500 font-mono">{f.flightNumber}</p>
                                                </div>
                                            </div>

                                            {/* Route */}
                                            <div className="flex-1 flex items-center gap-3">
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900 text-sm">{f.from}</p>
                                                    <p className="text-xs text-gray-500">{formatTime(f.departureTime)}</p>
                                                </div>
                                                <div className="flex-1 flex flex-col items-center">
                                                    <p className="text-[10px] text-gray-400 mb-1">{formatDate(f.departureTime)}</p>
                                                    <div className="w-full h-px bg-gray-300 relative">
                                                        <Plane size={12} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400 bg-white p-0.5 transform rotate-90"/>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">{f.to}</p>
                                                    <p className="text-xs text-gray-500">{formatTime(f.arrivalTime)}</p>
                                                </div>
                                            </div>

                                            {/* Cost (Manager View) */}
                                            <div className="text-right min-w-[100px] pl-4 border-l border-gray-100">
                                                <p className="text-xs font-bold text-gray-400 uppercase">Cost</p>
                                                <p className="font-bold text-gray-900">₹{f.cost.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Hotels Section */}
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                                <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100">
                                    <h4 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                                        <Bed size={16} className="text-orange-500"/> Accommodation
                                    </h4>
                                </div>
                                <div className="p-5 grid gap-4">
                                    {viewingRequest.bookingDetails.hotels.map((h, i) => (
                                        <div key={i} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl bg-gray-50/30">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                                    <Building size={18}/>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">
                                                        {h.bookingStatus === 'Confirmed' ? h.hotelName : 'Booking Deferred (Book Later)'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                                        <span>{h.city}</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                        <span>Check-in: {formatDate(h.checkIn)}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                 {h.bookingStatus === 'Confirmed' ? (
                                                     <p className="font-bold text-gray-900">₹{h.cost.toLocaleString()}</p>
                                                 ) : (
                                                     <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-bold">Pending</span>
                                                 )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Total Summary */}
                            <div className="flex justify-end">
                                <div className="bg-gray-900 text-white p-5 rounded-2xl min-w-[250px] shadow-xl">
                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Total Trip Cost</p>
                                    <div className="flex items-end justify-between">
                                        <span className="text-3xl font-black">₹{viewingRequest.amount.toLocaleString()}</span>
                                        <span className="text-xs bg-white/20 px-2 py-1 rounded text-white/80">Inc. Fees</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        /* IF PENDING: SHOW STANDARD REQUEST DETAILS */
                        <div className="space-y-6">
                             {/* --- PRIMARY DETAILS GRID --- */}
                             <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1 mb-1"><MapPin size={12}/> Destination</label>
                                    <p className="font-bold text-gray-900 text-lg">{getRouteDisplay(viewingRequest)}</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1 mb-1"><Calendar size={12}/> Dates</label>
                                    <p className="font-bold text-gray-900 text-lg">
                                        {formatDate(viewingRequest.startDate)} — {formatDate(viewingRequest.endDate)}
                                    </p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1 mb-1"><Clock size={12}/> Requested Times</label>
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <span className="text-[10px] text-gray-400 block">Start</span>
                                            <p className="font-bold text-gray-900 text-sm">{viewingRequest.startTime || '--:--'}</p>
                                        </div>
                                        <div className="w-px h-6 bg-gray-100"></div>
                                        <div>
                                            <span className="text-[10px] text-gray-400 block">End</span>
                                            <p className="font-bold text-gray-900 text-sm">{viewingRequest.endTime || '--:--'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1 mb-1"><TrendingUp size={12}/> Est. Budget</label>
                                    <p className="font-bold text-gray-900 text-lg">₹{viewingRequest.amount.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                                    <FileText size={16} className="text-gray-400"/> Purpose of Visit
                                </h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {viewingRequest.purpose || "No specific purpose details provided by the employee."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="bg-white px-8 py-5 border-t border-gray-100 shrink-0 flex justify-end gap-3">
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