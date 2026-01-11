
import React, { useState } from 'react';
import { TravelRequest, RequestStatus } from '../types';
import { Plane, Calendar, MapPin, CheckCircle, Clock, Send, FileText } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';

interface TravelAgentDashboardProps {
  requests: TravelRequest[];
  onUpdateStatus: (id: string, status: RequestStatus, notes?: string) => void;
}

const TravelAgentDashboard: React.FC<TravelAgentDashboardProps> = ({ requests, onUpdateStatus }) => {
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null);
  const [planDetails, setPlanDetails] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'book' | 'revert' | null>(null);

  const processingRequests = requests.filter(r => r.status === 'Processing (Agent)');
  const actionRequiredRequests = requests.filter(r => r.status === 'Action Required');
  
  const handleOpenAction = (req: TravelRequest, action: 'book' | 'revert') => {
    setSelectedRequest(req);
    setModalAction(action);
    setPlanDetails(action === 'revert' ? 'Here are 3 flight options for your review:\n1. Indigo 6E-554 (09:00 AM) - ₹4,500\n2. Air India AI-882 (11:30 AM) - ₹5,200\n3. Vistara UK-992 (02:00 PM) - ₹6,100' : 'Booking Confirmed: PNR XJ9921, Hotel: Hyatt Regency');
    setModalOpen(true);
  };

  const confirmAction = () => {
    if (!selectedRequest || !modalAction) return;

    if (modalAction === 'book') {
        onUpdateStatus(selectedRequest.id, 'Booked', planDetails);
    } else {
        onUpdateStatus(selectedRequest.id, 'Action Required', planDetails);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Travel Desk Console</h1>
           <p className="text-gray-500 mt-1">Manage bookings and flight options for employees.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex gap-4 text-sm font-medium">
            <span className="flex items-center gap-2 text-primary-600"><div className="w-2 h-2 rounded-full bg-primary-500"></div> {processingRequests.length} New Requests</span>
            <span className="flex items-center gap-2 text-orange-600"><div className="w-2 h-2 rounded-full bg-orange-500"></div> {actionRequiredRequests.length} Awaiting Employee</span>
        </div>
      </div>

      {/* New Requests Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Plane className="text-primary-500" size={20} /> 
            New Requests to Process
        </h2>
        
        {processingRequests.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-gray-500">
                No new requests pending processing. Good job!
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-4">
                {processingRequests.map(req => (
                    <div key={req.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <img src={req.employeeAvatar || `https://picsum.photos/seed/${req.id}/100`} className="w-12 h-12 rounded-full object-cover border border-gray-200" alt="" />
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-900">{req.employeeName}</h3>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{req.department}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span className="flex items-center gap-1"><MapPin size={14}/> {req.destination}</span>
                                        <span className="flex items-center gap-1"><Calendar size={14}/> {req.startDate} - {req.endDate}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                         <span className="flex items-center gap-1"><Clock size={12}/> Pref: {req.startTime} - {req.endTime}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-3 self-end md:self-center">
                                <button 
                                    onClick={() => handleOpenAction(req, 'revert')}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                                >
                                    <Send size={16} /> Send Options
                                </button>
                                <button 
                                    onClick={() => handleOpenAction(req, 'book')}
                                    className="px-4 py-2 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600 shadow-lg shadow-primary-500/20 transition-colors flex items-center gap-2"
                                >
                                    <CheckCircle size={16} /> Complete Booking
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Waiting for Employee Section */}
      <div className="space-y-4 pt-6 border-t border-gray-200">
         <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="text-orange-500" size={20} /> 
            Awaiting Employee Selection
        </h2>
         {actionRequiredRequests.length === 0 ? (
            <div className="text-sm text-gray-500 italic">No requests currently waiting for employee action.</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {actionRequiredRequests.map(req => (
                    <div key={req.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 opacity-75">
                         <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-900">{req.employeeName}</h4>
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">Waiting</span>
                         </div>
                         <p className="text-sm text-gray-600 mb-1">Trip to {req.destination}</p>
                         <div className="text-xs text-gray-500 mt-2 p-2 bg-white rounded border border-gray-100">
                            <strong>Agent Note:</strong> {req.agentNotes ? req.agentNotes.substring(0, 50) + '...' : 'Options sent'}
                         </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      <ConfirmationModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        onConfirm={confirmAction}
        title={modalAction === 'revert' ? 'Send Travel Options' : 'Confirm Booking'}
        message=""
      >
         <div className="mt-4">
             <p className="text-sm text-gray-600 mb-2">
                {modalAction === 'revert' 
                    ? 'Enter the flight/hotel options you want the employee to choose from:' 
                    : 'Enter the final booking details (PNR, Confirmation #):'}
             </p>
             <textarea 
                className="w-full h-32 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                value={planDetails}
                onChange={(e) => setPlanDetails(e.target.value)}
             ></textarea>
         </div>
      </ConfirmationModal>
    </div>
  );
};

export default TravelAgentDashboard;
