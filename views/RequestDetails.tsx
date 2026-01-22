import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { TravelRequest, UserRole } from '../types';
import { 
  ArrowLeft, Calendar, FileText, 
  CheckCircle, XCircle, Send, Building,
  MessageCircle
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
      await api.updateRequestStatus(request.id, newStatus);
      toast.success(`Request ${status}`);
      onBack();
    } catch (e) {
      toast.error("Action failed");
    }
  };

  // --- FIXED: ROBUST NOTE SAVING ---
  const handleEmployeeSelection = async () => {
    if (!request || !request.id || !userReply) return;
    try {
      // 1. Get the original options (remove any previous User Selections or tags to avoid duplicates)
      let cleanOldNotes = request.agentNotes || '';
      
      // Remove the tag if it already existed to clean it up
      cleanOldNotes = cleanOldNotes.replace('[Agent Options]:', '').split('[User Selection]:')[0].trim();

      // 2. Create the formatted string exactly as the Dashboard expects it
      const updatedNotes = `[Agent Options]:\n${cleanOldNotes}\n\n[User Selection]: ${userReply}`;

      await api.updateRequestStatus(request.id, 'Processing (Agent)', updatedNotes);
      toast.success("Selection sent to Travel Desk");
      onBack();
    } catch (e) {
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

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in pb-20">
      
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
            <MessageCircle size={18} /> Share Details
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        
        <div className={`p-8 ${isBooked ? 'bg-green-600' : 'bg-gray-900'} text-white`}>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isBooked ? 'bg-green-500/30' : 'bg-gray-700'}`}>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="md:col-span-2 space-y-8">
                
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Department</label>
                        <div className="flex items-center gap-2 mt-1 text-gray-900 font-medium">
                            <Building size={18} className="text-gray-400"/> {request.department}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Estimated Budget</label>
                        <div className="flex items-center gap-2 mt-1 text-gray-900 font-medium">
                           ₹{request.amount.toLocaleString()}
                        </div>
                    </div>
                </div>

                {isActionRequired && (
                    <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 animate-scale-in">
                        <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                            <FileText className="text-amber-600"/> Travel Options Available
                        </h3>
                        <div className="bg-white p-4 rounded-xl border border-amber-100 text-gray-700 text-sm whitespace-pre-line mb-6 font-mono leading-relaxed shadow-sm">
                            {request.agentNotes ? request.agentNotes.replace('[Agent Options]:', '').trim() : "No details provided."}
                        </div>
                        
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-gray-700">Reply to Travel Desk:</label>
                            <textarea 
                                value={userReply}
                                onChange={(e) => setUserReply(e.target.value)}
                                placeholder="e.g. I select Option 2. Please proceed."
                                className="w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none h-24 text-sm"
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

                {isBooked && (
                    <div className="bg-green-50 rounded-2xl p-6 border border-green-100 animate-scale-in">
                        <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                            <CheckCircle className="text-green-600"/> Booking Confirmed
                        </h3>
                        <div className="bg-white p-6 rounded-xl border border-green-100 shadow-sm">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Booking / Ticket Details</p>
                            <div className="text-gray-800 font-mono text-sm whitespace-pre-line leading-relaxed">
                                {request.agentNotes || "Booking details attached to email."}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                 <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-4 text-sm">Request Timeline</h4>
                    <div className="space-y-4 relative">
                        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200"></div>

                        <div className="relative pl-6">
                            <div className="absolute left-0 top-1.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                            <p className="text-xs font-bold text-gray-900">Submitted</p>
                            <p className="text-[10px] text-gray-500">{new Date(request.submittedDate).toLocaleDateString()}</p>
                        </div>
                        
                        <div className="relative pl-6">
                            <div className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ${request.status === 'Pending Manager' ? 'bg-amber-400 animate-pulse' : 'bg-green-500'}`}></div>
                            <p className="text-xs font-bold text-gray-900">Manager Approval</p>
                            <p className="text-[10px] text-gray-500">{request.status === 'Pending Manager' ? 'Waiting...' : 'Completed'}</p>
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

                {isManager && request.status === 'Pending Manager' && (
                    <div className="space-y-3">
                        <button 
                            onClick={() => handleManagerAction('Approved')}
                            className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={18}/> Approve Request
                        </button>
                        <button 
                            onClick={() => handleManagerAction('Rejected')}
                            className="w-full py-3 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                        >
                            <XCircle size={18}/> Reject Request
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