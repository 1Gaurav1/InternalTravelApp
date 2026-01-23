import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { TravelRequest, UserRole } from '../types';
import { 
  ArrowLeft, Calendar, FileText, 
  CheckCircle, XCircle, Send, Building,
  MessageCircle, MapPin, AlertCircle, Eye, Download, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

interface RequestDetailsProps {
  requestId: string | null;
  onBack: () => void;
}

const RequestDetails: React.FC<RequestDetailsProps> = ({ requestId, onBack }) => {
  const [request, setRequest] = useState<TravelRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [userReply, setUserReply] = useState('');
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isManager = currentUser.role?.includes(UserRole.MANAGER);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!requestId) return;
      try {
        setLoading(true);
        const allRequests = await api.getRequests();
        const found = allRequests.find(r => r.id === requestId);
        setRequest(found || null);
      } catch (error) {
        console.error("Failed to fetch request", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [requestId]);

  const handleManagerAction = async (status: 'Approved' | 'Rejected') => {
    if (!request || !request.id) return;
    try {
      const newStatus = status === 'Approved' ? 'Pending Admin' : 'Rejected';
      // Note: Rejection Reason is handled by ConfirmationModal in ManagerDashboard
      // This is just a fallback direct action if used elsewhere
      await api.updateRequestStatus(request.id, newStatus);
      toast.success(`Request ${status}`);
      onBack();
    } catch (e) {
      toast.error("Action failed");
    }
  };

  const handleEmployeeSelection = async () => {
    if (!request || !request.id || !userReply) return;
    try {
      const originalNotes = request.agentNotes || '';
      // Remove old separator if exists to avoid duplication
      const cleanNotes = originalNotes.replace(/USER SELECTION[\s\S]*$/, '').trim();
      
      const updatedNotes = `${cleanNotes}\n\n` + 
                           `USER SELECTION ---------------\n` + 
                           `${userReply}`;

      await api.updateRequestStatus(request.id, 'Processing (Agent)', updatedNotes);
      
      toast.success("Selection sent to Travel Desk");
      onBack();
    } catch (e) {
      console.error(e);
      toast.error("Failed to send selection");
    }
  };

  const handleShare = () => {
    if (!request) return;
    const text = `*Travel Request Update*\n\n` +
                 `📍 Destination: ${request.destination}\n` +
                 `📅 Dates: ${new Date(request.startDate).toLocaleDateString()} - ${new Date(request.endDate).toLocaleDateString()}\n` +
                 `📊 Status: ${request.status}\n` + 
                 `\nCheck portal for full details.`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (loading) return <div className="p-10 text-center">Loading details...</div>;
  if (!request) return <div className="p-10 text-center">Request not found</div>;

  const isActionRequired = request.status === 'Action Required';
  const isBooked = request.status === 'Booked';
  const isRejected = request.status === 'Rejected';
  const details = request.bookingDetails;

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in pb-20">
      
      {/* HEADER ACTIONS */}
      <div className="flex items-center justify-between mb-6">
        <button 
            onClick={onBack} 
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium"
        >
            <ArrowLeft size={20} /> Back to Dashboard
        </button>

        <button
            onClick={handleShare}
            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white px-4 py-2 rounded-xl font-bold transition-all shadow-sm hover:shadow-md text-sm"
        >
            <MessageCircle size={18} /> Share
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* HERO HEADER */}
        <div className={`p-8 ${isBooked ? 'bg-green-600' : isRejected ? 'bg-red-600' : 'bg-gray-900'} text-white transition-colors duration-500`}>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-sm">
                  {request.status}
                </span>
              </div>
              <h1 className="text-3xl font-bold">Trip to {request.destination}</h1>
              <p className="text-white/70 mt-1 flex items-center gap-2">
                 <Calendar size={16}/> {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
              </p>
            </div>
            {request.employeeAvatar && (
               <img src={request.employeeAvatar} className="w-16 h-16 rounded-full border-4 border-white/20" alt="avatar"/>
            )}
          </div>
        </div>

        <div className="p-8">
          
          {/* 1. REJECTION ALERT */}
          {isRejected && request.rejectionReason && (
             <div className="mb-8 bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-4 animate-scale-in">
                <div className="p-2 bg-red-100 rounded-full text-red-600">
                    <XCircle size={24} />
                </div>
                <div>
                    <h3 className="text-red-900 font-bold text-lg">Request Rejected</h3>
                    <p className="text-red-700 mt-1 font-medium">Reason: "{request.rejectionReason}"</p>
                    <p className="text-red-500 text-xs mt-2">Please contact your manager for clarification.</p>
                </div>
             </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: MAIN CONTENT */}
            <div className="md:col-span-2 space-y-8">
                
                {/* 2. BASIC INFO GRID */}
                <div className="grid grid-cols-2 gap-6 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Department</label>
                        <div className="flex items-center gap-2 mt-1 text-gray-900 font-medium">
                            <Building size={18} className="text-gray-400"/> {request.department}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Trip Type</label>
                        <div className="flex items-center gap-2 mt-1 text-gray-900 font-medium">
                           <MapPin size={18} className="text-gray-400"/> {request.type}
                        </div>
                    </div>
                </div>

                {/* 3. FINAL BOOKING DETAILS (If Booked) */}
                {isBooked && details && (
                    <div className="space-y-6">
                        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                            <CheckCircle className="text-green-500"/> Booking Summary
                        </h3>

                        {/* Flights */}
                        {details.flights && details.flights.map((flight, i) => (
                            <div key={i} className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{flight.airline} <span className="text-gray-500 font-normal">({flight.flightNumber})</span></p>
                                        <p className="text-xs text-gray-500">{new Date(flight.departureTime).toLocaleString()}</p>
                                    </div>
                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">Flight</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-700 mb-4">
                                    <span className="font-medium">{flight.from}</span>
                                    <span className="text-gray-300">➜</span>
                                    <span className="font-medium">{flight.to}</span>
                                </div>
                                {flight.ticketFile && (
                                    <button 
                                        onClick={() => window.open(flight.ticketFile, '_blank')}
                                        className="w-full py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
                                    >
                                        <Download size={14}/> Download Ticket
                                    </button>
                                )}
                            </div>
                        ))}

                        {/* Hotels */}
                        {details.hotels && details.hotels.map((hotel, i) => (
                            <div key={i} className={`border p-5 rounded-2xl shadow-sm ${hotel.bookingStatus === 'Book Later' ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{hotel.bookingStatus === 'Confirmed' ? hotel.hotelName : 'Booking Pending'}</p>
                                        <p className="text-xs text-gray-500">{hotel.city}</p>
                                    </div>
                                    <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold">Hotel</span>
                                </div>
                                
                                {hotel.bookingStatus === 'Book Later' ? (
                                    <p className="text-sm text-orange-700 flex items-center gap-2 font-medium">
                                        <Clock size={16}/> To be booked later upon request.
                                    </p>
                                ) : (
                                    <>
                                        <p className="text-xs text-gray-500 mb-4">Check-in: {hotel.checkIn}</p>
                                        {hotel.bookingFile && (
                                            <button 
                                                onClick={() => window.open(hotel.bookingFile, '_blank')}
                                                className="w-full py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
                                            >
                                                <Download size={14}/> Download Voucher
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* 4. ACTION REQUIRED (Selection Mode) */}
                {isActionRequired && (
                    <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 animate-scale-in">
                        <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                            <FileText className="text-amber-600"/> Please Select an Option
                        </h3>
                        <div className="bg-white p-4 rounded-xl border border-amber-100 text-gray-700 text-sm whitespace-pre-line mb-6 font-mono leading-relaxed shadow-sm">
                            {request.agentNotes ? request.agentNotes.replace('USER SELECTION', '').trim() : "No details provided."}
                        </div>
                        
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-gray-700">Reply to Travel Desk:</label>
                            <textarea 
                                value={userReply}
                                onChange={(e) => setUserReply(e.target.value)}
                                placeholder="e.g. I select Option 2. Please proceed."
                                className="w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none h-24 text-sm"
                            ></textarea>
                            <button 
                                onClick={handleEmployeeSelection}
                                disabled={!userReply.trim()}
                                className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Send size={16} /> Confirm Selection
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT COLUMN: TIMELINE & ACTIONS */}
            <div className="space-y-6">
                 {/* Total Cost Display (Only if booked) */}
                 {isBooked && (
                     <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center">
                        <p className="text-xs font-bold text-green-600 uppercase mb-1">Total Trip Cost</p>
                        <p className="text-3xl font-black text-green-900">₹{request.amount.toLocaleString()}</p>
                     </div>
                 )}

                 <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-4 text-sm">Request Timeline</h4>
                    <div className="space-y-4 relative">
                        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200"></div>

                        {/* Steps */}
                        <div className="relative pl-6">
                            <div className="absolute left-0 top-1.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                            <p className="text-xs font-bold text-gray-900">Submitted</p>
                            <p className="text-[10px] text-gray-500">{new Date(request.submittedDate).toLocaleDateString()}</p>
                        </div>
                        
                        <div className="relative pl-6">
                            <div className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ${request.status === 'Pending Manager' ? 'bg-amber-400 animate-pulse' : request.status === 'Rejected' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                            <p className="text-xs font-bold text-gray-900">Manager Approval</p>
                        </div>

                        <div className="relative pl-6">
                            <div className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ${request.status === 'Pending Admin' ? 'bg-amber-400 animate-pulse' : ['Processing (Agent)', 'Action Required', 'Booked'].includes(request.status) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <p className="text-xs font-bold text-gray-900">Admin Approval</p>
                        </div>

                        <div className="relative pl-6">
                            <div className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ${request.status === 'Booked' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                            <p className="text-xs font-bold text-gray-900">Booking Finalized</p>
                        </div>
                    </div>
                 </div>

                {/* Manager Quick Actions (Fallback) */}
                {isManager && request.status === 'Pending Manager' && (
                    <div className="space-y-3">
                        <button 
                            onClick={() => handleManagerAction('Approved')}
                            className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={18}/> Approve Request
                        </button>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetails;