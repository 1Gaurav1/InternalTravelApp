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

  // Filter requests dynamically
  const processingRequests = requests.filter(r => r.status === 'Processing (Agent)');
  const actionRequiredRequests = requests.filter(r => r.status === 'Action Required');
  
  const handleOpenAction = (req: TravelRequest, action: 'book' | 'revert') => {
    setSelectedRequest(req);
    setModalAction(action);
    setPlanDetails(''); // Clean slate - no prebuilt text
    setModalOpen(true);
  };

  const confirmAction = () => {
    if (!selectedRequest || !modalAction) return;

    if (modalAction === 'book') {
        onUpdateStatus(selectedRequest.id || '', 'Booked', planDetails);
    } else {
        onUpdateStatus(selectedRequest.id || '', 'Action Required', planDetails);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Travel Desk Console</h1>
           <p className="text-gray-500 mt-1">Manage bookings and flight options for employees.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex gap-4 text-sm font-medium">
            <span className="flex items-center gap-2 text-primary-600">
                <div className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-pulse"></div> 
                {processingRequests.length} New Requests
            </span>
            <span className="flex items-center gap-2 text-orange-600">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div> 
                {actionRequiredRequests.length} Awaiting Employee
            </span>
        </div>
      </div>

      {/* New Requests Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Plane className="text-primary-500" size={20} /> 
            New Requests to Process
        </h2>
        
        {processingRequests.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                    <CheckCircle size={32} />
                </div>
                <p className="text-gray-500 font-medium">All caught up! No new requests pending.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-4">
                {processingRequests.map(req => (
                    <div key={req.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <img 
                                    src={req.employeeAvatar || `https://ui-avatars.com/api/?name=${req.employeeName}&background=random`} 
                                    className="w-12 h-12 rounded-full object-cover border border-gray-200" 
                                    alt="" 
                                />
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-900">{req.employeeName}</h3>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold uppercase">{req.department}</span>
                                        {req.type === 'International' && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold uppercase">International</span>}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                        <span className="flex items-center gap-1.5"><MapPin size={16} className="text-gray-400"/> {req.destination}</span>
                                        <span className="flex items-center gap-1.5"><Calendar size={16} className="text-gray-400"/> {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-2 bg-gray-50 px-3 py-1.5 rounded-lg w-fit">
                                         <Clock size={14}/> <strong>Pref Time:</strong> {req.startTime || 'Any'} - {req.endTime || 'Any'}
                                    </div>
                                    {req.preferredFlight && (
                                        <div className="mt-2 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                                            <strong>Note:</strong> {req.preferredFlight}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex gap-3 self-end xl:self-center w-full xl:w-auto">
                                <button 
                                    onClick={() => handleOpenAction(req, 'revert')}
                                    className="flex-1 xl:flex-none px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Send size={18} /> Send Options
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
                ))}
            </div>
        )}
      </div>

      {/* Waiting for Employee Section */}
      <div className="space-y-4 pt-8 border-t border-gray-200">
         <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="text-orange-500" size={20} /> 
            Awaiting Employee Selection
        </h2>
         {actionRequiredRequests.length === 0 ? (
            <div className="text-sm text-gray-400 italic pl-1">No requests currently waiting for employee action.</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {actionRequiredRequests.map(req => (
                    <div key={req.id} className="bg-gray-50 p-5 rounded-2xl border border-gray-200 opacity-80 hover:opacity-100 transition-opacity">
                         <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-900">{req.employeeName}</h4>
                            <span className="text-[10px] uppercase bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold tracking-wider">Waiting</span>
                         </div>
                         <p className="text-sm text-gray-600 mb-3 flex items-center gap-1"><Plane size={14}/> Trip to {req.destination}</p>
                         <div className="text-xs text-gray-500 p-3 bg-white rounded-xl border border-gray-100 italic">
                            "{req.agentNotes ? req.agentNotes.substring(0, 80) + (req.agentNotes.length > 80 ? '...' : '') : 'Options sent'}"
                         </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Action Modal */}
      <ConfirmationModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        onConfirm={confirmAction}
        type="primary"
        title={modalAction === 'revert' ? 'Send Travel Options' : 'Confirm Booking'}
        confirmText={modalAction === 'revert' ? 'Send to Employee' : 'Confirm Booking'}
      >
         <div className="mt-4">
             <p className="text-sm text-gray-600 mb-2 font-medium">
                {modalAction === 'revert' 
                   ? 'Enter flight/hotel options for the employee to review:' 
                   : 'Enter final booking details (PNR, Confirmation #):'}
             </p>
             <textarea 
                className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm font-mono transition-all resize-none"
                value={planDetails}
                onChange={(e) => setPlanDetails(e.target.value)}
                placeholder={modalAction === 'revert' ? "e.g. Option 1: Indigo 6E-554..." : "e.g. PNR: XJ9921..."}
             ></textarea>
         </div>
      </ConfirmationModal>
    </div>
  );
};

export default TravelAgentDashboard;