import React, { useState } from 'react';
import { TravelRequest, RequestStatus, CostBreakdown } from '../types';
import { 
  Plane, Calendar, MapPin, CheckCircle, Clock, Send, 
  MessageCircle, MessageSquare, Eye, FileText, X 
} from 'lucide-react';
import BookingCompletionForm from '../components/BookingCompletionForm';

interface TravelAgentDashboardProps {
  requests: TravelRequest[];
  onUpdateStatus: (id: string, status: RequestStatus, notes?: string, bookingDetails?: CostBreakdown, totalAmount?: number) => void;
}

const TravelAgentDashboard: React.FC<TravelAgentDashboardProps> = ({ requests, onUpdateStatus }) => {
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null);
  const [planDetails, setPlanDetails] = useState('');
  
  // Modals State
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'book' | 'revert' | null>(null);
  
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [currentReply, setCurrentReply] = useState('');
  const [currentReplyTitle, setCurrentReplyTitle] = useState('');

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
    const reply = getEmployeeReply(req.agentNotes);
    
    if (reply) {
        setCurrentReply(reply);
        setCurrentReplyTitle('Employee Reply');
    } else {
        setCurrentReply(req.agentNotes || "No notes available.");
        setCurrentReplyTitle('Request Notes');
    }
    setReplyModalOpen(true);
  };

  const confirmOptionsSend = () => {
    if (!selectedRequest) return;
    onUpdateStatus(selectedRequest.id, 'Action Required', planDetails);
    setActionModalOpen(false);
  };

  const handleBookingConfirm = (details: CostBreakdown, total: number) => {
    if (!selectedRequest) return;
    // Use optional chaining (?.) to prevent crash if flights array is missing
    // @ts-ignore
    const segmentCount = details.flights?.length || 0;
    const summaryNote = `Booking Confirmed.\nTotal Cost: ₹${total}\nSegments: ${segmentCount}`;
    onUpdateStatus(selectedRequest.id, 'Booked', summaryNote, details, total);
    setActionModalOpen(false);
  };

  const handleAgentShare = (req: TravelRequest) => {
    let message = `Hello ${req.employeeName}, regarding your trip to ${req.destination}:\n\n`;
    if (req.status === 'Processing (Agent)') {
        message += `I am processing your request. Options coming shortly.`;
    } else if (req.status === 'Action Required') {
        message += `Please check the portal for travel options.`;
    }
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const getEmployeeReply = (notes?: string) => {
    if (!notes) return null;
    if (notes.toUpperCase().includes('USER SELECTION')) {
        const parts = notes.split(/USER SELECTION/i);
        return parts[1].replace(/^[\s:\-]+/g, '').trim();
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* 1. DASHBOARD HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Travel Desk Console</h1>
           <p className="text-gray-500 mt-1">Manage bookings, flight options, and tickets.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex gap-4 text-sm font-medium">
            <span className="flex items-center gap-2 text-primary-600">
                <div className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-pulse"></div> 
                {processingRequests.length} Active Tasks
            </span>
            <span className="flex items-center gap-2 text-orange-600">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div> 
                {actionRequiredRequests.length} Pending Employee
            </span>
        </div>
      </div>

      {/* 2. REQUESTS TO PROCESS (Active) */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Plane className="text-primary-500" size={20} /> 
            Requests to Process
        </h2>
        
        {processingRequests.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                    <CheckCircle size={32} />
                </div>
                <p className="text-gray-500 font-medium">All caught up! No active tasks.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-4">
                {processingRequests.map(req => {
                    const hasReply = req.agentNotes && req.agentNotes.toUpperCase().includes('USER SELECTION');
                    
                    return (
                        <div key={req.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                                
                                {/* LEFT: Employee & Trip Info */}
                                <div className="flex items-start gap-4 flex-1">
                                    <img 
                                        src={req.employeeAvatar || `https://ui-avatars.com/api/?name=${req.employeeName}&background=random`} 
                                        className="w-12 h-12 rounded-full object-cover border border-gray-200" 
                                        alt="" 
                                    />
                                    <div className="w-full">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-gray-900">{req.employeeName}</h3>
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold uppercase">{req.department}</span>
                                            {req.type === 'International' && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold uppercase">International</span>}
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                                            <span className="flex items-center gap-1.5"><MapPin size={16} className="text-gray-400"/> {req.destination}</span>
                                            <span className="flex items-center gap-1.5"><Calendar size={16} className="text-gray-400"/> {new Date(req.startDate).toLocaleDateString()}</span>
                                        </div>

                                        <div className="mt-3">
                                            <button 
                                                onClick={() => handleOpenReply(req)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-sm border ${
                                                    hasReply 
                                                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 animate-pulse' 
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                {hasReply ? <MessageSquare size={16} /> : <FileText size={16} />}
                                                {hasReply ? "View Employee Reply" : "View Request Notes"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* RIGHT: Actions */}
                                <div className="flex gap-3 self-end xl:self-center w-full xl:w-auto">
                                    <button onClick={() => handleAgentShare(req)} className="px-3 py-2.5 bg-green-50 border border-green-200 text-green-600 rounded-xl hover:bg-green-100 transition-colors">
                                        <MessageCircle size={20} />
                                    </button>
                                    <button onClick={() => handleOpenAction(req, 'revert')} className="flex-1 xl:flex-none px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center justify-center gap-2">
                                        <Send size={18} /> Send Options
                                    </button>
                                    <button onClick={() => handleOpenAction(req, 'book')} className="flex-1 xl:flex-none px-5 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-colors flex items-center justify-center gap-2">
                                        <CheckCircle size={18} /> Complete Booking
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* 3. AWAITING EMPLOYEE (Pending) */}
      <div className="space-y-4 pt-8 border-t border-gray-200">
         <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="text-orange-500" size={20} /> Awaiting Employee Selection
        </h2>
         {actionRequiredRequests.length === 0 ? (
            <div className="text-sm text-gray-400 italic pl-1">No requests currently waiting.</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {actionRequiredRequests.map(req => (
                    <div key={req.id} className="bg-gray-50 p-5 rounded-2xl border border-gray-200 opacity-90 hover:opacity-100 transition-opacity relative group">
                         <div className="flex justify-between items-start mb-3">
                            <h4 className="font-bold text-gray-900 text-sm">{req.employeeName}</h4>
                            <span className="text-[10px] uppercase bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold tracking-wider">Waiting</span>
                         </div>
                         <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                            <Plane size={14}/> Trip to <strong>{req.destination}</strong>
                         </p>
                         <button onClick={() => handleAgentShare(req)} className="absolute top-4 right-4 text-xs font-bold text-green-600 hover:bg-green-100 bg-white border border-green-200 px-2 py-1 rounded-lg flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                            <MessageCircle size={12}/> Nudge
                         </button>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* --- MODAL 1: REPLY VIEWER --- */}
      {replyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        {currentReplyTitle === 'Employee Reply' ? <MessageSquare className="text-blue-600" size={20}/> : <FileText className="text-gray-500" size={20}/>}
                        {currentReplyTitle}
                    </h3>
                    <button onClick={() => setReplyModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
                </div>
                <div className="p-8 max-h-[60vh] overflow-y-auto">
                    <div className="bg-blue-50 p-6 rounded-2xl text-gray-900 text-lg leading-relaxed font-medium border border-blue-200 shadow-inner whitespace-pre-wrap">
                        {currentReply}
                    </div>
                </div>
                <div className="p-4 border-t border-gray-100 flex justify-end">
                    <button onClick={() => setReplyModalOpen(false)} className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL 2: ACTIONS --- */}
      {actionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[95vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">
                            {modalAction === 'book' ? 'Finalize Booking' : 'Send Travel Options'}
                        </h2>
                        <button onClick={() => setActionModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                    </div>
                    
                    {/* BOOKING COMPLETION FORM */}
                    {modalAction === 'book' && selectedRequest ? (
                        <BookingCompletionForm 
                            request={selectedRequest}
                            onConfirm={handleBookingConfirm}
                            onCancel={() => setActionModalOpen(false)}
                        />
                    ) : (
                        <>
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                                <p className="text-xs font-bold text-blue-700 uppercase mb-1">Employee Preferences</p>
                                <p className="text-sm text-blue-900">{selectedRequest?.preferredFlight || "No specific preferences."}</p>
                            </div>

                            <p className="text-sm text-gray-600 mb-2 font-medium">Enter travel options for the employee to review:</p>
                            <textarea 
                                className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm font-mono transition-all resize-none"
                                value={planDetails}
                                onChange={(e) => setPlanDetails(e.target.value)}
                                placeholder="e.g. Option 1: Indigo 6E-554 - 09:00 AM - ₹5,000..."
                            ></textarea>
                            
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setActionModalOpen(false)} className="flex-1 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50">Cancel</button>
                                <button onClick={confirmOptionsSend} className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black flex items-center justify-center gap-2">
                                    <Send size={18}/> Send Options
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TravelAgentDashboard;