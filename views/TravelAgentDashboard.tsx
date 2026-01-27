import React, { useState } from 'react';
import { TravelRequest, RequestStatus, CostBreakdown } from '../types';
import { 
  Plane, Calendar, MapPin, CheckCircle, Clock, Send, 
  MessageCircle, MessageSquare, Eye, FileText, X, User, Briefcase, ArrowRight, Car, Building, History, Layers 
} from 'lucide-react';
import BookingCompletionForm from '../components/BookingCompletionForm';

interface TravelAgentDashboardProps {
  requests: TravelRequest[];
  onUpdateStatus: (id: string, status: RequestStatus, notes?: string, bookingDetails?: CostBreakdown, totalAmount?: number) => void;
}

const TravelAgentDashboard: React.FC<TravelAgentDashboardProps> = ({ requests, onUpdateStatus }) => {
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null);
  const [viewingRequest, setViewingRequest] = useState<TravelRequest | null>(null);
  const [planDetails, setPlanDetails] = useState('');
  
  // UI States
  const [activeTab, setActiveTab] = useState<'requirements' | 'conversation'>('requirements');
  
  // Modals State
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'book' | 'revert' | null>(null);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [currentReply, setCurrentReply] = useState('');

  // Filter requests
  const processingRequests = requests.filter(r => r.status === 'Processing (Agent)');
  const actionRequiredRequests = requests.filter(r => r.status === 'Action Required');
  
  // --- HANDLERS ---
  const handleOpenAction = (req: TravelRequest, action: 'book' | 'revert') => {
    setSelectedRequest(req);
    setModalAction(action);
    setPlanDetails(''); 
    setActionModalOpen(true);
  };

  const handleOpenReply = (req: TravelRequest) => {
    setCurrentReply(req.agentNotes || "No notes available.");
    setReplyModalOpen(true);
  };

  const confirmOptionsSend = () => {
    if (!selectedRequest) return;
    const timestamp = new Date().toLocaleString();
    const existingNotes = selectedRequest.agentNotes || '';
    const updatedNotes = `${existingNotes}\n\n--- [Agent Options Sent: ${timestamp}] ---\n${planDetails}`;
    onUpdateStatus(selectedRequest.id, 'Action Required', updatedNotes);
    setActionModalOpen(false);
  };

  const handleBookingConfirm = (details: CostBreakdown, total: number) => {
    if (!selectedRequest) return;
    const segmentCount = details.flights?.length || 0;
    const summaryNote = `Booking Confirmed.\nTotal Cost: ₹${total}\nSegments: ${segmentCount}`;
    onUpdateStatus(selectedRequest.id, 'Booked', summaryNote, details, total);
    setActionModalOpen(false);
  };

  const handleAgentShare = (req: TravelRequest) => {
    const message = `Hello ${req.employeeName}, regarding your trip to ${req.destination}. Please check the portal for updates.`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // --- HELPERS ---
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'Invalid Date') return '--/--';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString || dateString === 'Invalid Date') return '';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // --- STRICT CITY CLEANER ---
  const cleanCityName = (name: string) => {
      if (!name) return "";
      // 1. Remove State (anything after a comma)
      let cleaned = name.split(',')[0].trim();
      // 2. Remove "Origin:" prefix if accidentally captured
      cleaned = cleaned.replace(/^(Origin:|From:|To:)/i, '').trim();
      if (cleaned.toLowerCase() === 'origin' || cleaned.toLowerCase() === 'start point') return ''; 
      return cleaned;
  };

  // --- TEXT NOTE CLEANER (Removes states from the text block) ---
  const cleanNotesDisplay = (notes: string) => {
      if (!notes) return "No details provided.";
      // Regex to find "City, State" patterns and replace with just "City"
      // Looks for Word, Word -> Word, Word
      return notes.replace(/([a-zA-Z\s]+),\s[a-zA-Z\s&]+/g, "$1");
  };

  // --- TIMELINE PARSER ---
  const getFullTimeline = (req: TravelRequest) => {
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

    const multiCityMatches = [...(req.agentNotes?.matchAll(/\d+\.\s*(.*?)\s*->\s*(.*?)\s*\|\s*([\d-]+)/g) || [])];
    if (multiCityMatches.length > 0) {
        const nodes: any[] = [];
        nodes.push({
            city: cleanCityName(multiCityMatches[0][1]), 
            date: formatDate(multiCityMatches[0][3]), 
            time: req.startTime || 'TBA', 
            status: 'Start'
        });
        multiCityMatches.forEach((match, i) => {
            const isLast = i === multiCityMatches.length - 1;
            const nextLegDate = multiCityMatches[i+1]?.[3]; 
            nodes.push({
                city: cleanCityName(match[2]), 
                date: formatDate(nextLegDate || match[3]), 
                time: isLast ? (req.endTime || 'TBA') : 'TBA',
                status: isLast ? 'End' : 'Stop'
            });
        });
        return nodes;
    }

    const originMatch = req.agentNotes?.match(/(?:Origin|From):\s*(.*?)(\n|$)/i);
    let startCity = originMatch ? cleanCityName(originMatch[1]) : '';
    const dests = req.destination.split(',').map(cleanCityName);
    
    if (!startCity) startCity = "Start"; 

    const simpleNodes = [
        { city: startCity, date: formatDate(req.startDate), time: req.startTime || 'TBA', status: 'Start' },
        ...dests.map((d, i) => ({
            city: d,
            date: i === dests.length - 1 ? formatDate(req.endDate) : 'Stopover', 
            time: i === dests.length - 1 ? (req.endTime || 'TBA') : 'TBA',
            status: i === dests.length - 1 ? 'End' : 'Stop'
        }))
    ];

    if (simpleNodes[0].city === simpleNodes[1].city) return simpleNodes.slice(1);
    return simpleNodes;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* 1. DASHBOARD HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Travel Desk Console</h1>
           <p className="text-gray-500 mt-1">Manage bookings, flight options, and tickets.</p>
        </div>
        <div className="flex gap-3">
            <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
                <span className="flex h-2.5 w-2.5 rounded-full bg-pink-500 animate-pulse"></span>
                <span className="text-sm font-bold text-gray-700">{processingRequests.length} To Process</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
                <span className="flex h-2.5 w-2.5 rounded-full bg-orange-500"></span>
                <span className="text-sm font-bold text-gray-700">{actionRequiredRequests.length} Waiting</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: TASK LIST */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Plane className="text-pink-600" size={20} /> Priority Tasks
                </h2>
            </div>

            {processingRequests.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center flex flex-col items-center gap-3 shadow-sm">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                        <CheckCircle size={32} />
                    </div>
                    <p className="text-gray-500 font-medium">All caught up! No active tasks.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {processingRequests.map(req => (
                        <div key={req.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <img src={req.employeeAvatar || `https://ui-avatars.com/api/?name=${req.employeeName}&background=random`} className="w-12 h-12 rounded-full border border-gray-100" alt=""/>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{req.employeeName}</h3>
                                        <p className="text-xs text-gray-500">{req.department} • <span className="text-pink-600 font-medium">{req.id}</span></p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${req.type === 'International' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {req.type}
                                </span>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Destination</p>
                                    <p className="font-bold text-gray-900 text-sm">{req.destination}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Dates</p>
                                    <p className="font-bold text-gray-900 text-sm">{formatDate(req.startDate)} - {formatDate(req.endDate)}</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setViewingRequest(req)} className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors" title="View Full Details">
                                    <Eye size={20}/>
                                </button>
                                <button onClick={() => handleOpenAction(req, 'revert')} className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                    <Send size={18} /> Send Options
                                </button>
                                <button onClick={() => handleOpenAction(req, 'book')} className="flex-1 py-2.5 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700 shadow-lg shadow-pink-600/20 transition-colors flex items-center justify-center gap-2">
                                    <CheckCircle size={18} /> Book Now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* RIGHT: WAITING LIST */}
        <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Clock className="text-orange-500" size={20} /> Awaiting Employee
            </h2>
            {actionRequiredRequests.length === 0 ? (
                <div className="text-sm text-gray-400 italic">No pending selections.</div>
            ) : (
                <div className="space-y-4">
                    {actionRequiredRequests.map(req => (
                        <div key={req.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative group">
                             <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">{req.employeeName}</h4>
                                    <p className="text-xs text-gray-500">Trip to {req.destination}</p>
                                </div>
                                <button onClick={() => handleAgentShare(req)} className="text-green-600 bg-green-50 p-2 rounded-lg hover:bg-green-100 transition-colors">
                                    <MessageCircle size={16}/>
                                </button>
                             </div>
                             
                             {req.agentNotes && req.agentNotes.toUpperCase().includes('USER SELECTION') && (
                                 <div onClick={() => handleOpenReply(req)} className="mt-3 bg-blue-50 p-2 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors flex items-center gap-2 text-xs font-bold text-blue-700">
                                     <MessageSquare size={14}/> User Replied! Click to view.
                                 </div>
                             )}
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* --- MODAL 1: FULL DETAIL VIEW (TABBED UI) --- */}
      {viewingRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-fade-in p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[95vh]">
                
                {/* Header */}
                <div className="bg-[#1e293b] px-8 py-6 relative flex justify-between items-start shrink-0 rounded-t-3xl">
                    <div className="flex items-center gap-5">
                        <img src={viewingRequest.employeeAvatar || `https://ui-avatars.com/api/?name=${viewingRequest.employeeName}&background=random`} className="w-16 h-16 rounded-full border-4 border-white/10 shadow-sm" alt="" />
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-bold text-2xl text-white">{viewingRequest.employeeName}</h3>
                                <span className="bg-white/10 text-white px-2 py-0.5 rounded text-xs font-medium border border-white/20">{viewingRequest.department}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-300">
                                <span className="flex items-center gap-1"><MapPin size={12}/> {viewingRequest.destination}</span>
                                <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                                <span className="flex items-center gap-1"><Clock size={12}/> ID: {viewingRequest.id}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setViewingRequest(null)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors"><X size={20}/></button>
                </div>

                <div className="p-8 overflow-y-auto bg-gray-50 flex-1">
                    
                    {/* --- BUTTER UI TIMELINE (FIXED & CLEANED) --- */}
                    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center mb-8">
                        <div className="flex items-center gap-4 overflow-x-auto pb-4 w-full justify-between max-w-3xl">
                            {getFullTimeline(viewingRequest).map((node, i, arr) => (
                                <React.Fragment key={i}>
                                    <div className="flex flex-col items-center min-w-[120px] shrink-0 z-10 relative group">
                                        
                                        {/* City Circle */}
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-md border-4 border-white transition-transform group-hover:scale-110 ${i === 0 ? 'bg-green-100 text-green-600' : i === arr.length - 1 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-500'}`}>
                                            <MapPin size={20} className="fill-current"/>
                                        </div>
                                        
                                        {/* City Name (State Removed) */}
                                        <span className="text-base font-bold text-gray-900 text-center leading-tight mb-1">
                                            {node.city}
                                        </span>
                                        
                                        {/* Date & Time (BELOW CITY) */}
                                        <div className="flex flex-col items-center gap-1 mt-1">
                                            <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded border border-gray-200">
                                                {node.date}
                                            </span>
                                            {node.time && node.time !== 'TBA' && (
                                                <span className="text-[10px] font-mono text-gray-400 bg-white px-1.5 rounded border border-gray-100">
                                                    {node.time}
                                                </span>
                                            )}
                                        </div>

                                    </div>
                                    
                                    {/* Connector Line */}
                                    {i < arr.length - 1 && (
                                        <div className="h-0.5 flex-1 bg-gray-200 shrink-0 mb-14 mx-2 relative min-w-[60px] rounded-full">
                                            <div className="absolute right-0 -top-1.5 w-3 h-3 border-t-2 border-r-2 border-gray-300 rotate-45"></div>
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* --- TABS --- */}
                    <div className="flex gap-4 border-b border-gray-200 mb-6">
                        <button 
                            onClick={() => setActiveTab('requirements')}
                            className={`pb-3 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'requirements' ? 'border-pink-600 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            <span className="flex items-center gap-2"><Layers size={16}/> Trip Requirements</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('conversation')}
                            className={`pb-3 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'conversation' ? 'border-pink-600 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            <span className="flex items-center gap-2"><History size={16}/> Conversation History</span>
                        </button>
                    </div>

                    {/* --- TAB CONTENT --- */}
                    {activeTab === 'requirements' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                            {/* LEFT: Logistics */}
                            <div className="space-y-6">
                                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Calendar size={12}/> Booking Schedule</label>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-xs text-gray-500">Departure</p>
                                                <p className="font-bold text-gray-900 text-base">{formatDate(viewingRequest.startDate)}</p>
                                                <p className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded inline-block mt-1">{viewingRequest.startTime || "Any Time"}</p>
                                            </div>
                                            <ArrowRight className="text-gray-300" size={16}/>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">Return</p>
                                                <p className="font-bold text-gray-900 text-base">{formatDate(viewingRequest.endDate)}</p>
                                                <p className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded inline-block mt-1">{viewingRequest.endTime || "Any Time"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Briefcase size={12}/> Flight Preferences</label>
                                    <p className="text-sm leading-relaxed font-medium bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-yellow-800">
                                        {viewingRequest.preferredFlight || "No specific preferences."}
                                    </p>
                                </div>
                            </div>

                            {/* RIGHT: Requirements Text */}
                            <div className="space-y-6">
                                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm h-full">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <FileText size={12}/> Detailed Requirements
                                    </label>
                                    
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {(viewingRequest.agentNotes?.toLowerCase().includes('cab') || viewingRequest.agentNotes?.toLowerCase().includes('taxi')) && (
                                            <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100"><Car size={12}/> Cab Required</span>
                                        )}
                                        <span className="flex items-center gap-1 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-bold border border-orange-100"><Building size={12}/> Hotel Required</span>
                                    </div>

                                    {/* CLEANED NOTES (State names removed) */}
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap font-medium leading-relaxed">
                                            {cleanNotesDisplay(viewingRequest.agentNotes || "")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 animate-fade-in h-96 overflow-y-auto">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 block">Full Communication Log</label>
                            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap font-mono text-xs leading-relaxed bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                {viewingRequest.agentNotes || "No conversation history."}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-gray-100 flex justify-end gap-3 shrink-0 rounded-b-3xl">
                    <button onClick={() => setViewingRequest(null)} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors text-sm">Close</button>
                    <button onClick={() => { setViewingRequest(null); handleOpenAction(viewingRequest, 'book'); }} className="px-6 py-3 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700 shadow-lg shadow-pink-600/20 transition-colors flex items-center gap-2 text-sm">
                        <CheckCircle size={18}/> Complete Booking
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL 2: REPLY VIEWER --- */}
      {replyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><MessageSquare size={20} className="text-blue-600"/> Request History</h3>
                <div className="bg-blue-50 p-4 rounded-xl text-gray-800 text-sm whitespace-pre-wrap font-medium border border-blue-100 max-h-[60vh] overflow-y-auto">
                    {currentReply}
                </div>
                <button onClick={() => setReplyModalOpen(false)} className="mt-6 w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors">Close</button>
            </div>
        </div>
      )}

      {/* --- MODAL 3: ACTIONS (BOOKING FORM) --- */}
      {actionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[95vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900">
                        {modalAction === 'book' ? 'Finalize Booking' : 'Send Travel Options'}
                    </h2>
                    <button onClick={() => setActionModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                </div>
                
                <div className="p-6">
                    {modalAction === 'book' && selectedRequest ? (
                        <BookingCompletionForm 
                            request={selectedRequest}
                            onConfirm={handleBookingConfirm}
                            onCancel={() => setActionModalOpen(false)}
                        />
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <p className="text-xs font-bold text-blue-700 uppercase mb-1">Trip Details</p>
                                <p className="text-sm text-blue-900">To: <strong>{selectedRequest?.destination}</strong> | Pref: {selectedRequest?.preferredFlight || "None"}</p>
                            </div>
                            <textarea 
                                className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono transition-all resize-none"
                                value={planDetails}
                                onChange={(e) => setPlanDetails(e.target.value)}
                                placeholder="Enter options here (e.g., Option 1: Indigo...)"
                            ></textarea>
                            <button onClick={confirmOptionsSend} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black flex items-center justify-center gap-2">
                                <Send size={18}/> Send Options
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TravelAgentDashboard;