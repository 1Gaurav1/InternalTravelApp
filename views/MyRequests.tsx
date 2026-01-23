import React, { useState, useMemo } from "react";
import { 
  Search, Filter, MessageSquare, Check, X, Trash2, Plus, 
  ArrowRight, Calendar, Clock, MapPin, Info, FileText, 
  User, Briefcase, Plane, Train 
} from "lucide-react";
import { TravelRequest, RequestStatus } from "../types";
import ConfirmationModal from "../components/ConfirmationModal";

interface MyRequestsProps {
  requests: TravelRequest[];
  onDelete?: (id: string) => void;
  onUpdateStatus?: (id: string, status: RequestStatus, agentNotes?: string) => void;
  onNavigate: (view: any) => void;
  onViewRequest: (id: string) => void;
  onCreateRequest?: () => void;
}

const MyRequests: React.FC<MyRequestsProps> = ({
  requests,
  onDelete,
  onUpdateStatus,
  onCreateRequest
}) => {
  const [viewingRequest, setViewingRequest] = useState<TravelRequest | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<{ id: string; dest: string } | null>(null);
  const [respondModalOpen, setRespondModalOpen] = useState(false);
  const [selectedRequestForResponse, setSelectedRequestForResponse] = useState<TravelRequest | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // --- FILTER LOGIC ---
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchSearch =
        req.id.toLowerCase().includes(search.toLowerCase()) ||
        req.destination.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "All" ||
        (statusFilter === "Pending" && req.status.includes("Pending")) ||
        (statusFilter === "Approved" && (req.status.includes("Agent") || req.status === "Booked"));

      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, requests]);

  // --- HELPERS ---
  const getRouteDisplay = (req: TravelRequest) => {
    const originMatch = req.agentNotes?.match(/Origin:\s*(.*?)(\n|$)/);
    const origin = originMatch ? originMatch[1].trim() : null;

    // Check if it's a simple comma-separated list (Multi-city inferred) or just a destination
    if (origin) {
        return (
            <div className="flex items-center gap-3 text-xl font-bold text-gray-900">
                <span>{origin}</span>
                <ArrowRight size={20} className="text-gray-400"/>
                <span>{req.destination.split(',')[0]}</span> 
                {/* If there are more cities, show indication */}
                {req.destination.includes(',') && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">+ Onward</span>}
            </div>
        );
    }
    return <span className="text-xl font-bold text-gray-900">{req.destination}</span>;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '--/--';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // --- ACTIONS ---
  const initiateDelete = (e: React.MouseEvent, req: TravelRequest) => {
    e.stopPropagation();
    setRequestToDelete({ id: req.id, dest: req.destination });
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (requestToDelete && onDelete) onDelete(requestToDelete.id);
    setDeleteModalOpen(false);
  };

  const initiateRespond = (e: React.MouseEvent, req: TravelRequest) => {
    e.stopPropagation();
    setSelectedRequestForResponse(req);
    setResponseMessage("");
    setRespondModalOpen(true);
  };

  const submitResponse = () => {
    if (selectedRequestForResponse && onUpdateStatus) {
      const fullMessage = `Employee Response: ${responseMessage}\nPrevious Notes: ${selectedRequestForResponse.agentNotes || ""}`;
      onUpdateStatus(selectedRequestForResponse.id, "Processing (Agent)", fullMessage);
    }
    setRespondModalOpen(false);
  };

  return (
    <div className="animate-fade-in space-y-6 w-full max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Travel Requests</h1>
          <p className="text-gray-500 mt-1">Track approval status and view itineraries.</p>
        </div>
        <button
          onClick={onCreateRequest}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-primary-500/30"
        >
          <Plus size={20} /> Create Request
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by ID or City..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border focus:bg-white focus:border-primary-300 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {['All', 'Approved', 'Pending'].map((status) => (
             <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm border transition-all ${statusFilter === status ? 'bg-primary-50 text-primary-600 border-primary-200 font-medium' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
             >
                {status}
             </button>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Itinerary</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Schedule</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRequests.map((req) => (
                <tr
                  key={req.id}
                  onClick={() => setViewingRequest(req)}
                  className={`cursor-pointer transition-colors group ${req.status === "Action Required" ? "bg-orange-50/40" : "hover:bg-gray-50"}`}
                >
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0 border border-blue-100 group-hover:scale-105 transition-transform">
                            <Plane size={18} />
                        </div>
                        <div>
                            <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                {req.destination}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5 font-mono">#{req.id}</div>
                        </div>
                     </div>
                  </td>

                  <td className="px-6 py-4">
                     <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Calendar size={12} className="text-gray-400"/>
                            {formatDate(req.startDate)} <ArrowRight size={10} className="text-gray-300"/> {formatDate(req.endDate)}
                        </div>
                     </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide border ${
                        req.status === "Booked" ? "bg-green-50 text-green-700 border-green-200" : 
                        req.status === "Action Required" ? "bg-orange-100 text-orange-700 border-orange-200 animate-pulse" :
                        req.status === "Rejected" ? "bg-red-50 text-red-700 border-red-200" :
                        "bg-yellow-50 text-yellow-700 border-yellow-200"
                    }`}>
                      {req.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    {req.status === "Action Required" && (
                      <button onClick={(e) => initiateRespond(e, req)} className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold mr-2 shadow-sm">
                        Review Options
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={(e) => initiateDelete(e, req)} className="p-2 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- CONFIRMATION MODAL --- */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Request?"
        message={`Delete request to ${requestToDelete?.dest}?`}
        confirmText="Delete"
        type="danger"
      />

      {/* --- RESPOND MODAL --- */}
      {respondModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Respond to Travel Desk</h3>
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-4 text-sm text-gray-800 whitespace-pre-line">
                <span className="font-bold block mb-1 text-orange-700">Travel Desk Message:</span>
                {selectedRequestForResponse?.agentNotes || "No notes."}
            </div>
            <textarea
              className="w-full h-28 p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Type your reply (e.g. 'Option 1 is approved')..."
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setRespondModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded-lg font-medium">Cancel</button>
              <button onClick={submitResponse} disabled={!responseMessage.trim()} className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg shadow font-medium">Send Reply</button>
            </div>
          </div>
        </div>
      )}

      {/* --- POLISHED DETAIL MODAL (THE "STATUS THING") --- */}
      {viewingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-md animate-fade-in p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* 1. Header (Dark Corporate Look) */}
                <div className="bg-[#1e293b] px-8 py-6 relative flex justify-between items-center shrink-0">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                viewingRequest.status === 'Booked' ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-200'
                            }`}>
                                {viewingRequest.status}
                            </span>
                            <span className="text-gray-400 text-xs font-mono">#{viewingRequest.id}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            Trip to {viewingRequest.destination.split(',')[0]}
                        </h2>
                    </div>
                    <button 
                        onClick={() => setViewingRequest(null)} 
                        className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors"
                    >
                        <X size={20}/>
                    </button>
                </div>

                {/* 2. Body - The "Corporate Polished" Layout */}
                <div className="p-8 overflow-y-auto bg-gray-50 flex-1">
                    
                    {/* SECTION A: ITINERARY SUMMARY (Top & Fully Visible) */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            
                            {/* Route Visualization */}
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Travel Route</label>
                                {getRouteDisplay(viewingRequest)}
                            </div>

                            {/* Divider (Mobile vs Desktop) */}
                            <div className="h-px w-full md:w-px md:h-12 bg-gray-100"></div>

                            {/* Time & Date Block */}
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Schedule & Timing</label>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-900">
                                        <div className="w-16 font-semibold text-gray-500 text-xs">DEPART</div>
                                        <span className="font-bold">{formatDate(viewingRequest.startDate)}</span>
                                        <span className="text-gray-400">at</span>
                                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">{viewingRequest.startTime || 'Flexible'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-900">
                                        <div className="w-16 font-semibold text-gray-500 text-xs">RETURN</div>
                                        <span className="font-bold">{formatDate(viewingRequest.endDate)}</span>
                                        <span className="text-gray-400">at</span>
                                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">{viewingRequest.endTime || 'Flexible'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION B: TRAVEL DESK REMARKS (Formerly Agent Notes) */}
                    {/* Renamed and styled to look like an official log/memo */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                        <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex items-center gap-2">
                            <FileText size={16} className="text-gray-500"/>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Itinerary Details </h3>
                        </div>
                        <div className="p-6">
                            {viewingRequest.agentNotes ? (
                                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                                    {/* We display the notes directly. The header above sets the professional context. */}
                                    {viewingRequest.agentNotes}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">No additional remarks or configuration details available yet.</p>
                            )}
                        </div>
                    </div>

                    {/* SECTION C: PURPOSE & METADATA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                                <Briefcase size={12}/> Business Purpose
                            </label>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                {viewingRequest.purpose || "No purpose specified."}
                            </p>
                        </div>
                        
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                                <User size={12}/> Employee Details
                            </label>
                            <div className="flex items-center gap-3">
                                <img 
                                    src={viewingRequest.employeeAvatar} 
                                    className="w-10 h-10 rounded-full border border-gray-100" 
                                    alt=""
                                />
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{viewingRequest.employeeName}</p>
                                    <p className="text-xs text-gray-500">{viewingRequest.department}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="bg-white px-8 py-4 border-t border-gray-100 flex justify-end shrink-0">
                    <button 
                        onClick={() => setViewingRequest(null)} 
                        className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default MyRequests;