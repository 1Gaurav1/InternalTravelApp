import React, { useState, useMemo } from "react";
import { 
  Search, Filter, Trash2, Plus, 
  ArrowRight, Calendar, Info, FileText, 
  User, Briefcase, Plane, Download, Paperclip, X, MapPin, ChevronLeft, ArrowLeft 
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
  const formatDate = (dateString: string) => {
    if (!dateString) return '--/--';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateString?: string) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const getTimelineCities = (req: TravelRequest) => {
    if (req.bookingDetails?.flights?.length) {
       const cities = [req.bookingDetails.flights[0].from];
       req.bookingDetails.flights.forEach(f => cities.push(f.to));
       return [...new Set(cities)]; 
    }
    const multiCityMatches = [...(req.agentNotes?.matchAll(/\d+\.\s*(.*?)\s*->\s*(.*?)\s*\|/g) || [])];
    if (multiCityMatches.length > 0) {
        const cities = [multiCityMatches[0][1].split(',')[0].trim()]; 
        multiCityMatches.forEach(m => cities.push(m[2].split(',')[0].trim())); 
        return cities;
    }
    const origin = req.agentNotes?.match(/Origin:\s*(.*?)(\n|$)/)?.[1]?.split(',')[0].trim();
    const dests = req.destination.split(',').map(s => s.split(',')[0].trim());
    if (origin && origin !== "Origin") return [origin, ...dests];
    return ["Origin", ...dests];
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

  const handleDownload = (fileName: string) => {
      alert(`Downloading document: ${fileName}`);
  };

  return (
    <div className="animate-fade-in space-y-6 w-full max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Travel Requests</h1>
          <p className="text-gray-500 mt-1">Track approval status and download tickets.</p>
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
                                {req.destination.split(',')[0]} 
                                {req.destination.includes(',') && <span className="text-[10px] bg-gray-100 px-1.5 rounded text-gray-500">+More</span>}
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
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
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

      {/* --- FULL PAGE DETAIL VIEW (Replaces Modal Overlay) --- */}
      {viewingRequest && (
        <div className="fixed inset-x-0 bottom-0 top-12 z-[9999] bg-gray-50 flex flex-col w-full h-full overflow-hidden animate-fade-in-up">
            
            {/* 1. Header - Full Width */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0 shadow-sm">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setViewingRequest(null)} 
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-gray-900 border border-gray-200"
                    >
                        <ArrowLeft size={20}/>
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-gray-900">
                                Trip to {viewingRequest.destination.split(',')[0]}
                            </h2>
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                viewingRequest.status === 'Booked' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                                {viewingRequest.status}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">Request ID: {viewingRequest.id}</p>
                    </div>
                </div>
                
                <button 
                    onClick={() => setViewingRequest(null)} 
                    className="text-sm font-bold text-gray-500 hover:text-gray-900 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    Close View
                </button>
            </div>

            {/* 2. Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-5xl mx-auto space-y-8 pb-20">
                    
                    {/* --- ITINERARY TIMELINE --- */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <MapPin size={20} className="text-primary-600"/> Itinerary Timeline
                        </h3>

                        {viewingRequest.bookingDetails?.flights && viewingRequest.bookingDetails.flights.length > 0 ? (
                            /* BOOKED STATE */
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                {viewingRequest.bookingDetails.flights.map((seg, idx) => (
                                    <div key={idx} className="flex flex-col md:flex-row md:items-center p-6 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors gap-4 md:gap-0">
                                        <div className="w-32 shrink-0 md:border-r border-gray-100 pr-6 mr-6 flex flex-row md:flex-col items-center md:items-end md:justify-center text-right gap-2 md:gap-0">
                                            <span className="text-lg font-bold text-gray-900">{formatTime(seg.departureTime) || '--:--'}</span>
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                                                {seg.departureTime ? formatDate(seg.departureTime) : 'Date Pending'}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                                <span className="text-lg font-bold text-gray-900">{seg.from}</span>
                                                <ArrowRight size={18} className="text-gray-300"/>
                                                <span className="text-lg font-bold text-gray-900">{seg.to}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide">
                                                    {seg.mode || 'Flight'}
                                                </span>
                                                <span className="font-medium">{seg.airline}</span>
                                                <span>•</span>
                                                <span className="font-mono">{seg.flightNumber}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* PENDING STATE */
                            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-2 overflow-x-auto pb-4 pt-2 w-full justify-between max-w-3xl mx-auto">
                                    {getTimelineCities(viewingRequest).map((city, i, arr) => (
                                        <React.Fragment key={i}>
                                            <div className="flex flex-col items-center min-w-[100px] shrink-0 z-10">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-lg mb-3 ${
                                                    i === 0 ? 'bg-green-100 text-green-600' : 
                                                    i === arr.length - 1 ? 'bg-red-100 text-red-600' : 
                                                    'bg-blue-50 text-blue-500'
                                                }`}>
                                                    <MapPin size={20} className="fill-current"/>
                                                </div>
                                                <span className="text-sm font-bold text-gray-800 text-center leading-tight">{city}</span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-wider">
                                                    {i === 0 ? 'Start' : i === arr.length - 1 ? 'End' : 'Stop'}
                                                </span>
                                            </div>
                                            {i < arr.length - 1 && (
                                                <div className="h-1 flex-1 bg-gray-100 shrink-0 mb-8 mx-2 relative min-w-[60px] rounded-full">
                                                    <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-gray-200 p-1 rounded-full">
                                                        <ArrowRight size={12} className="text-gray-400"/>
                                                    </div>
                                                </div>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- DOCUMENTS & NOTES GRID --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* LEFT COL: DOCUMENTS */}
                        <div className="lg:col-span-2 space-y-8">
                            
                            {/* Documents Card */}
                            {(viewingRequest.bookingDetails?.flights?.some(f => f.ticketFile) || viewingRequest.bookingDetails?.hotels?.some(h => h.bookingFile)) && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Paperclip size={20} className="text-primary-600"/> Travel Documents
                                    </h3>
                                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {viewingRequest.bookingDetails?.flights?.map((f, i) => f.ticketFile && (
                                            <button key={`flight-${i}`} onClick={() => handleDownload(f.ticketFile || "")} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all group text-left">
                                                <div className="bg-blue-100 text-blue-600 p-3 rounded-lg group-hover:scale-110 transition-transform"><Plane size={20}/></div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-gray-900">Flight Ticket</p>
                                                    <p className="text-xs text-gray-500 truncate">{f.from} to {f.to}</p>
                                                </div>
                                                <Download size={18} className="text-gray-300 group-hover:text-blue-600"/>
                                            </button>
                                        ))}
                                        {viewingRequest.bookingDetails?.hotels?.map((h, i) => h.bookingFile && (
                                            <button key={`hotel-${i}`} onClick={() => handleDownload(h.bookingFile || "")} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50/50 transition-all group text-left">
                                                <div className="bg-orange-100 text-orange-600 p-3 rounded-lg group-hover:scale-110 transition-transform"><FileText size={20}/></div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-gray-900">Hotel Voucher</p>
                                                    <p className="text-xs text-gray-500 truncate">{h.hotelName || h.city}</p>
                                                </div>
                                                <Download size={18} className="text-gray-300 group-hover:text-orange-600"/>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Remarks / Configuration */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Info size={20} className="text-primary-600"/> Trip Configuration
                                </h3>
                                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                    {viewingRequest.agentNotes ? (
                                        <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
                                            {viewingRequest.agentNotes}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400 italic">
                                            No specific configuration notes available.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COL: METADATA */}
                        <div className="space-y-6">
                            
                            {/* Employee Card */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <User size={14}/> Traveler
                                </h4>
                                <div className="flex items-center gap-4">
                                    <img 
                                        src={viewingRequest.employeeAvatar} 
                                        className="w-12 h-12 rounded-full border-2 border-gray-100" 
                                        alt=""
                                    />
                                    <div>
                                        <p className="text-base font-bold text-gray-900">{viewingRequest.employeeName}</p>
                                        <p className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full inline-block mt-1">
                                            {viewingRequest.department}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Purpose Card */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Briefcase size={14}/> Purpose
                                </h4>
                                <p className="text-sm text-gray-700 leading-relaxed italic">
                                    "{viewingRequest.purpose || "No specific purpose mentioned for this trip."}"
                                </p>
                            </div>

                            {/* Schedule Summary */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Calendar size={14}/> Summary
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Depart</span>
                                        <span className="font-bold text-gray-900">{formatDate(viewingRequest.startDate)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Return</span>
                                        <span className="font-bold text-gray-900">{formatDate(viewingRequest.endDate)}</span>
                                    </div>
                                    <div className="h-px bg-gray-100 my-2"></div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Type</span>
                                        <span className="font-bold text-primary-600">{viewingRequest.type}</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default MyRequests;