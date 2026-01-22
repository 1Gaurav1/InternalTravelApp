import React, { useState } from 'react';
import { TravelRequest, RequestStatus, CostBreakdown } from '../types';
import { Plane, Calendar, MapPin, CheckCircle, Clock, Send, MessageCircle, User, MessageSquare } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import BookingCompletionForm from '../components/BookingCompletionForm';

interface TravelAgentDashboardProps {
  requests: TravelRequest[];
  onUpdateStatus: (id: string, status: RequestStatus, notes?: string, bookingDetails?: CostBreakdown, totalAmount?: number) => void;
}

const TravelAgentDashboard: React.FC<TravelAgentDashboardProps> = ({ requests, onUpdateStatus }) => {
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null);
  const [planDetails, setPlanDetails] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'book' | 'revert' | null>(null);

  // Filter requests
  const processingRequests = requests.filter(r => r.status === 'Processing (Agent)');
  const actionRequiredRequests = requests.filter(r => r.status === 'Action Required');
  
  const handleOpenAction = (req: TravelRequest, action: 'book' | 'revert') => {
    setSelectedRequest(req);
    setModalAction(action);
    setPlanDetails(''); 
    setModalOpen(true);
  };

  const confirmOptionsSend = () => {
    if (!selectedRequest) return;
    // Send standard text options
    onUpdateStatus(selectedRequest.id, 'Action Required', planDetails);
    setModalOpen(false);
  };

  // --- HANDLER FOR BOOKING FORM ---
  const handleBookingConfirm = (details: CostBreakdown, total: number) => {
    if (!selectedRequest) return;
    
    // Create a text summary for legacy support/email
    const summaryNote = `Booking Confirmed.\n` + 
                        `Total Cost: ₹${total}\n` +
                        `Flight Config: ${details.flightCosts.length} Flights\n` +
                        `Hotels: ${details.hotelCosts.length} Cities`;

    // Send everything to API
    onUpdateStatus(selectedRequest.id, 'Booked', summaryNote, details, total);
    setModalOpen(false);
  };

  // --- WHATSAPP LOGIC ---
  const handleAgentShare = (req: TravelRequest) => {
    let message = `Hello ${req.employeeName}, regarding your trip to ${req.destination}:\n\n`;

    if (req.status === 'Processing (Agent)') {
        message += `I am currently processing your request. I will send you flight/hotel options shortly.`;
    } else if (req.status === 'Action Required') {
        message += `I have uploaded travel options for your review. Please log in to the portal and confirm your choice.\n\n(Request ID: ${req.id})`;
    } else if (req.status === 'Booked') {
        message += `Your booking is CONFIRMED! ✅\n\nDates: ${req.startDate} to ${req.endDate}\n\nPlease check your email for the tickets.`;
    }
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // --- EXTRACT REPLY HELPER ---
  const getEmployeeReply = (notes?: string) => {
    if (!notes) return null;
    // We look for the tag we saved in RequestDetails.tsx
    const splitNotes = notes.split('[User Selection]:');
    if (splitNotes.length > 1) {
        return splitNotes[1].trim();
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Travel Desk Console</h1>
           <p className="text-gray-500 mt-1">Manage bookings and flight options for employees.</p>
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

      {/* Requests List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Plane className="text-primary-500" size={20} /> 
            Requests to Process
        </h2>
        
        {processingRequests.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center flex flex-col items-center gap-3">
                <CheckCircle size={32} className="text-green-500" />
                <p className="text-gray-500 font-medium">All caught up! No active tasks.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-4">
                {processingRequests.map(req => {
                    const reply = getEmployeeReply(req.agentNotes);
                    return (
                        <div key={req.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
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
                                            <span className="flex items-center gap-1.5"><Calendar size={16} className="text-gray-400"/> {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</span>
                                        </div>

                                        {/* --- REPLY SECTION --- */}
                                        {reply ? (
                                            <div className="mt-3 bg-blue-50 border border-blue-100 p-3 rounded-xl animate-fade-in-up">
                                                <p className="text-xs font-bold text-blue-700 uppercase mb-1 flex items-center gap-1">
                                                    <MessageSquare size={12}/> Employee Reply:
                                                </p>
                                                <p className="text-sm text-gray-800 font-medium leading-relaxed">"{reply}"</p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-2 bg-gray-50 px-3 py-1.5 rounded-lg w-fit">
                                                <Clock size={14}/> <strong>Pref Time:</strong> {req.startTime || 'Any'} - {req.endTime || 'Any'}
                                                {req.preferredFlight && <span className="ml-2 border-l border-gray-300 pl-2">Note: {req.preferredFlight}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex gap-3 self-end xl:self-center w-full xl:w-auto">
                                    <button 
                                        onClick={() => handleAgentShare(req)}
                                        className="px-3 py-2.5 bg-green-50 border border-green-200 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
                                        title="WhatsApp"
                                    >
                                        <MessageCircle size={20} />
                                    </button>

                                    <button 
                                        onClick={() => handleOpenAction(req, 'revert')}
                                        className="flex-1 xl:flex-none px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Send size={18} /> {reply ? 'Resend Options' : 'Send Options'}
                                    </button>
                                    <button 
                                        onClick={() => handleOpenAction(req, 'book')}
                                        className="flex-1 xl:flex-none px-5 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-colors flex items-center justify-center gap-2"
                                    >
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

      {/* Waiting List */}
      <div className="space-y-4 pt-8 border-t border-gray-200">
         <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="text-orange-500" size={20} /> 
            Awaiting Employee Selection
        </h2>
         {actionRequiredRequests.length === 0 ? (
            <div className="text-sm text-gray-400 italic pl-1">No requests currently waiting.</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {actionRequiredRequests.map(req => (
                    <div key={req.id} className="bg-gray-50 p-5 rounded-2xl border border-gray-200 opacity-80 hover:opacity-100 transition-opacity relative group">
                         <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-900">{req.employeeName}</h4>
                            <span className="text-[10px] uppercase bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold tracking-wider">Waiting</span>
                         </div>
                         <p className="text-sm text-gray-600 mb-3 flex items-center gap-1"><Plane size={14}/> Trip to {req.destination}</p>
                         <button 
                            onClick={() => handleAgentShare(req)}
                            className="absolute top-4 right-4 text-xs font-bold text-green-600 hover:bg-green-100 bg-white border border-green-200 px-2 py-1 rounded-lg flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                         >
                            <MessageCircle size={12}/> Nudge
                         </button>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Modal & Forms */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        {modalAction === 'book' ? 'Finalize Booking' : 'Send Travel Options'}
                    </h2>
                    
                    {modalAction === 'book' && selectedRequest ? (
                        <BookingCompletionForm 
                            request={selectedRequest}
                            onConfirm={handleBookingConfirm}
                            onCancel={() => setModalOpen(false)}
                        />
                    ) : (
                        <>
                            <p className="text-sm text-gray-600 mb-2 font-medium">Enter flight/hotel options:</p>
                            <textarea 
                                className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm font-mono resize-none"
                                value={planDetails}
                                onChange={(e) => setPlanDetails(e.target.value)}
                                placeholder="e.g. Option 1: Indigo 6E-554..."
                            ></textarea>
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setModalOpen(false)} className="flex-1 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50">Cancel</button>
                                <button onClick={confirmOptionsSend} className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black">Send Options</button>
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