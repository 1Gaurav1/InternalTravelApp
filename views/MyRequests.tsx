import React, { useState, useMemo } from "react";
import { 
  Search, Trash2, Plus, 
  ArrowRight, Calendar, Info, FileText, 
  User, Briefcase, Plane, Download, Paperclip, MapPin, 
  ArrowLeftRight, Repeat, MoveRight, X, Home, Undo2 
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

  // --- STRICT CITY CLEANER (MATCHING MANAGER DASHBOARD) ---
  const cleanCityName = (name: string) => {
      if (!name) return "";
      let cleaned = name.split(',')[0].trim();
      cleaned = cleaned.replace(/^(Origin:|From:|To:)/i, '').trim();
      if (cleaned.toLowerCase() === 'origin' || cleaned.toLowerCase() === 'start point') return ''; 
      return cleaned;
  };

  const formatCitiesDisplay = (cityData: any) => {
    try {
      // For Display in List: Show "A -> B -> C"
      const rawString = Array.isArray(cityData) ? cityData.join(',') : String(cityData);
      
      // Clean and split
      let cities = rawString.split(/->|,/).map(cleanCityName).filter(Boolean);
      
      // If just one city (e.g. "Gangtok"), return it
      if (cities.length === 1) return cities[0];
      
      // If multiple, join with arrows
      return cities.join(' → ');
    } catch (e) { return String(cityData); }
  };

  // --- TIMELINE LOGIC (FIXED) ---
  const getTimelineCities = (req: TravelRequest) => {
    // 1. If Booked, use actual flight path
    if (req.bookingDetails?.flights?.length) {
       const cities = [req.bookingDetails.flights[0].from];
       req.bookingDetails.flights.forEach(f => cities.push(f.to));
       return [...new Set(cities.map(cleanCityName))]; 
    }

    // 2. Determine Start City
    let startCity = "Start";
    const originMatch = req.agentNotes?.match(/(?:Origin|From):\s*(.*?)(\n|$)/i);
    if (originMatch) {
        startCity = cleanCityName(originMatch[1]);
    } else {
        // Infer from "CityA -> CityB" string in destination
        const splitArrow = req.destination.split('->');
        if (splitArrow.length > 1) startCity = cleanCityName(splitArrow[0]);
    }

    // 3. Determine Destinations Path
    let destinations: string[] = [];
    
    if (req.tripType === 'Multi City') {
        // FIX: For Multi-City, we MUST split by comma or arrow to get EVERY city
        // e.g. "Kanpur, Bhilai, Indore" -> ["Kanpur", "Bhilai", "Indore"]
        destinations = req.destination.split(/->|,/).map(cleanCityName).filter(Boolean);
    } else {
        // One Way / Round Trip -> Treat as SINGLE destination (ignore commas inside)
        destinations = [cleanCityName(req.destination)];
    }
    
    // Remove duplicate start city if it appears at the beginning of destinations
    // (e.g. User typed "StartCity, CityB" in destination field)
    if (destinations.length > 0 && destinations[0].toLowerCase() === startCity.toLowerCase()) {
        if (req.tripType !== 'Round Trip') {
             destinations.shift();
        }
    }

    // 4. Build Final Path
    if (req.tripType === 'Round Trip') {
        return [startCity, ...destinations, startCity];
    } 
    
    // One Way or Multi City
    return [startCity, ...destinations];
  };

  // --- TIMELINE PARSER (EXACTLY MATCHING MANAGER DASHBOARD) ---
  const getFullTimeline = (req: TravelRequest) => {
    // 1. If Booked, use exact flight data
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

    // 2. Parse Multi-City
    const multiCityMatches = [...(req.agentNotes?.matchAll(/(\d+\.)?\s*([a-zA-Z\s]+)(?:,[^->]+)?\s*->\s*([a-zA-Z\s]+)(?:,[^|]+)?/g) || [])];
    if (multiCityMatches.length > 0) {
        const nodes: any[] = [];
        nodes.push({
            city: cleanCityName(multiCityMatches[0][2]), 
            date: formatDate(req.startDate), 
            time: req.startTime || 'TBA', 
            status: 'Start'
        });
        multiCityMatches.forEach((match, i) => {
            nodes.push({
                city: cleanCityName(match[3]), 
                date: '... ', 
                time: 'TBA',
                status: i === multiCityMatches.length - 1 ? 'End' : 'Stop'
            });
        });
        return nodes;
    }

    // 3. Fallback: One-Way or Return
    const originMatch = req.agentNotes?.match(/(?:Origin|From):\s*(.*?)(\n|$)/i);
    let startCity = originMatch ? cleanCityName(originMatch[1]) : '';
    const dest = cleanCityName(req.destination);
    const isReturn = req.agentNotes?.toLowerCase().includes('return') || req.agentNotes?.toLowerCase().includes('round trip') || req.startDate !== req.endDate;

    const simpleNodes = [];
    simpleNodes.push({ city: startCity || "Start", date: formatDate(req.startDate), time: req.startTime || 'TBA', status: 'Start' });
    simpleNodes.push({ city: dest, date: formatDate(req.endDate), time: isReturn ? 'Stay' : 'End', status: isReturn ? 'Stop' : 'End' });

    if (isReturn) {
        simpleNodes.push({ city: startCity || "Start", date: formatDate(req.endDate), time: req.endTime || 'TBA', status: 'Return' });
    }

    return simpleNodes;
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
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 border group-hover:scale-105 transition-transform
                            ${req.tripType === 'Round Trip' ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                              req.tripType === 'Multi City' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                              'bg-blue-50 text-blue-600 border-blue-100'}`}>
                             {req.tripType === 'Round Trip' ? <Repeat size={18} /> : 
                              req.tripType === 'Multi City' ? <ArrowLeftRight size={18} /> : 
                              <MoveRight size={18} />}
                         </div>
                         <div>
                             <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                 {formatCitiesDisplay(req.destination)}
                             </div>
                             <div className="flex items-center gap-2 mt-0.5">
                                 <span className="text-xs font-mono text-gray-400">#{req.id}</span>
                             </div>
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

      {/* --- FULL PAGE DETAIL VIEW (MATCHING MANAGER DASHBOARD EXACTLY) --- */}
      {viewingRequest && (
        <div className="fixed inset-x-0 bottom-0 top-12 z-[9999] bg-gray-50 flex flex-col w-full h-full overflow-hidden animate-fade-in-up">
            
            {/* 1. DARK HEADER (MATCHING MANAGER CONSOLE EXACTLY) */}
            <div className="bg-[#1e293b] px-8 py-6 relative flex justify-between items-start shrink-0">
                <div className="flex items-center gap-5">
                    <img 
                        src={viewingRequest.employeeAvatar || `https://ui-avatars.com/api/?name=${viewingRequest.employeeName}&background=random`} 
                        className="w-16 h-16 rounded-full border-4 border-white/10 shadow-sm" 
                        alt=""
                    />
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-2xl text-white">{viewingRequest.employeeName}</h3>
                            <span className="bg-white/10 text-white px-2 py-0.5 rounded text-xs font-medium border border-white/20">{viewingRequest.department}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-300">
                            <span className="flex items-center gap-1"><MapPin size={12}/> {cleanCityName(viewingRequest.destination)}</span>
                            <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                            <span className="flex items-center gap-1">ID: {viewingRequest.id}</span>
                        </div>
                    </div>
                </div>

                {/* TRIP TYPE BADGE */}
                <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 rounded-full text-xs font-bold border flex items-center gap-2 shadow-sm uppercase tracking-wide ${
                        (viewingRequest.agentNotes?.toLowerCase().includes('multi city')) 
                        ? 'bg-purple-500/20 text-purple-100 border-purple-500/30' 
                        : (viewingRequest.startDate !== viewingRequest.endDate || viewingRequest.agentNotes?.toLowerCase().includes('return'))
                        ? 'bg-indigo-500/20 text-indigo-100 border-indigo-500/30'
                        : 'bg-blue-500/20 text-blue-100 border-blue-500/30'
                    }`}>
                         {(() => {
                             const notes = viewingRequest.agentNotes?.toLowerCase() || '';
                             if (notes.includes('multi city') || (viewingRequest.agentNotes?.includes('->') && !notes.includes('origin'))) {
                                 return <><ArrowLeftRight size={14}/> Multi-City</>;
                             } 
                             if (notes.includes('return') || notes.includes('round trip') || viewingRequest.startDate !== viewingRequest.endDate) {
                                 return <><Repeat size={14}/> Round Trip</>;
                             }
                             return <><MoveRight size={14}/> One-Way</>;
                         })()}
                    </span>
                    <button onClick={() => setViewingRequest(null)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors"><X size={20}/></button>
                </div>
            </div>

            {/* 2. Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                <div className="max-w-5xl mx-auto space-y-8 pb-20">
                    
                    {/* --- ITINERARY TIMELINE (EXACT MATCH WITH MANAGER DASHBOARD) --- */}
                    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center">
                        <div className="flex items-center gap-4 overflow-x-auto pb-4 w-full justify-between max-w-3xl">
                            {getFullTimeline(viewingRequest).map((node, i, arr) => {
                                const isReturnToStart = i === arr.length - 1 && node.city === arr[0].city;
                                return (
                                    <React.Fragment key={i}>
                                        <div className="flex flex-col items-center min-w-[120px] shrink-0 z-10 relative group">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-md border-4 border-white transition-transform group-hover:scale-110 ${i === 0 ? 'bg-green-100 text-green-600' : isReturnToStart ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-50 text-blue-500'}`}>
                                                {isReturnToStart ? <Home size={20} className="fill-current"/> : <MapPin size={20} className="fill-current"/>}
                                            </div>
                                            <span className="text-base font-bold text-gray-900 text-center leading-tight mb-1">{node.city}</span>
                                            <div className="flex flex-col items-center gap-1 mt-1">
                                                <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded border border-gray-200">{node.date}</span>
                                                {node.time && node.time !== 'TBA' && (<span className="text-[10px] font-mono text-gray-400 bg-white px-1.5 rounded border border-gray-100">{node.time}</span>)}
                                            </div>
                                        </div>
                                        {i < arr.length - 1 && (
                                            <div className="h-0.5 flex-1 bg-gray-200 shrink-0 mb-14 mx-2 relative min-w-[60px] rounded-full flex items-center justify-center">
                                                {(i === arr.length - 2 && arr[i+1].city === arr[0].city) ? (
                                                    <div className="absolute -top-4 flex flex-col items-center">
                                                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1"><Undo2 size={10}/> Return</span>
                                                    </div>
                                                ) : null}
                                                <div className="absolute right-0 -top-1.5 w-3 h-3 border-t-2 border-r-2 border-gray-300 rotate-45"></div>
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Calendar size={12}/> Booking Schedule</label>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-xs text-gray-500">Departure</p>
                                            <p className="font-bold text-gray-900 text-base">{formatDate(viewingRequest.startDate)}</p>
                                        </div>
                                        <ArrowRight className="text-gray-300" size={16}/>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">Return</p>
                                            <p className="font-bold text-gray-900 text-base">{formatDate(viewingRequest.endDate)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Briefcase size={12}/> Business Purpose</label>
                                <p className="text-sm text-gray-700 leading-relaxed italic">"{viewingRequest.purpose || "No specific purpose stated."}"</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200/60">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><FileText size={12}/> Trip Configuration</label>
                                <p className="text-xs text-gray-600 font-medium whitespace-pre-wrap">{viewingRequest.agentNotes || "No notes."}</p>
                            </div>
                            {viewingRequest.amount !== undefined && viewingRequest.amount !== null && viewingRequest.amount > 0 && (
                                <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-xl">
                                    <div className="flex items-center gap-2 mb-4 opacity-80">
                                        <Briefcase size={16}/>
                                        <span className="text-xs font-bold uppercase tracking-widest">Estimated Cost</span>
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-3xl font-black">₹{viewingRequest.amount.toLocaleString()}</p>
                                            <p className="text-xs text-gray-400 mt-1">Budget Impact</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${viewingRequest.amount > 50000 ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'}`}>
                                            {viewingRequest.amount > 50000 ? 'High Value' : 'Standard'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- DOCUMENTS --- */}
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
                                            <p className="text-xs text-gray-500 truncate">{cleanCityName(f.from)} to {cleanCityName(f.to)}</p>
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
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default MyRequests;