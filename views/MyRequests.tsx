import React, { useState, useMemo } from "react";
import { Search, Filter, MessageSquare, Check, X, Trash2, Plus } from "lucide-react";
import { TravelRequest, RequestStatus } from "../types";
import ConfirmationModal from "../components/ConfirmationModal";

interface MyRequestsProps {
  requests: TravelRequest[];
  onDelete?: (id: string) => void;
  onUpdateStatus?: (id: string, status: RequestStatus, agentNotes?: string) => void;
  onViewRequest: (id: string) => void;       // redirect to Request Details
  onCreateRequest?: () => void;              // redirect to Create Request
}

const MyRequests: React.FC<MyRequestsProps> = ({
  requests,
  onDelete,
  onUpdateStatus,
  onViewRequest,
  onCreateRequest
}) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [respondModalOpen, setRespondModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<{ id: string; dest: string; notes?: string } | null>(null);
  const [responseMessage, setResponseMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // -----------------------
  // 🔍 FILTER LOGIC
  // -----------------------
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchSearch =
        req.id.toLowerCase().includes(search.toLowerCase()) ||
        req.destination.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "All" ||
        (statusFilter === "Pending" && req.status.includes("Pending")) ||
        (statusFilter === "Approved" &&
          (req.status.includes("Agent") || req.status === "Booked"));

      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, requests]);

  // -----------------------
  // DELETE
  // -----------------------
  const initiateDelete = (id: string, dest: string) => {
    setSelectedRequest({ id, dest });
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedRequest && onDelete) onDelete(selectedRequest.id);
    setDeleteModalOpen(false);
  };

  // -----------------------
  // RESPOND TO AGENT
  // -----------------------
  const initiateRespond = (req: TravelRequest) => {
    setSelectedRequest({ id: req.id, dest: req.destination, notes: req.agentNotes });
    setResponseMessage("");
    setRespondModalOpen(true);
  };

  const submitResponse = () => {
    if (selectedRequest && onUpdateStatus) {
      const fullMessage = `Employee Response: ${responseMessage}\nPrevious Agent Notes: ${
        selectedRequest.notes || ""
      }`;

      onUpdateStatus(selectedRequest.id, "Processing (Agent)", fullMessage);
    }
    setRespondModalOpen(false);
  };

  return (
    <div className="animate-fade-in space-y-6 w-full max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Travel Requests</h1>
          <p className="text-gray-500 mt-1">View, filter and manage all of your travel requests.</p>
        </div>

        {/* 🔹 CREATE REQUEST BUTTON */}
        <button
          onClick={onCreateRequest}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-primary-500/30"
        >
          <Plus size={20} />
          Create Request
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between">

        {/* SEARCH */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by ID or Destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border focus:bg-white focus:border-primary-300 outline-none transition-all"
          />
        </div>

        {/* STATUS FILTER */}
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setStatusFilter("All")}
            className={`px-4 py-2 rounded-lg text-sm border
              ${
                statusFilter === "All"
                  ? "bg-primary-50 text-primary-600 border-primary-200"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
          >
            <Filter size={14} className="inline mr-1" />
            All
          </button>

          <button
            onClick={() => setStatusFilter("Approved")}
            className={`px-4 py-2 rounded-lg text-sm border
              ${
                statusFilter === "Approved"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
          >
            Approved
          </button>

          <button
            onClick={() => setStatusFilter("Pending")}
            className={`px-4 py-2 rounded-lg text-sm border
              ${
                statusFilter === "Pending"
                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
          >
            Pending
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Destination</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Travel Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredRequests.map((req) => (
                <tr
                  key={req.id}
                  onClick={() => onViewRequest(req.id)} // ROW CLICK → OPEN DETAILS
                  className={`cursor-pointer transition-colors ${
                    req.status === "Action Required" ? "bg-orange-50/60" : "hover:bg-gray-50"
                  }`}
                >
                  <td className="px-6 py-4 font-semibold text-gray-900">{req.id}</td>

                  <td className="px-6 py-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                    <span className="font-medium text-gray-900">{req.destination}</span>
                  </td>

                  <td className="px-6 py-4 text-gray-600">{req.startDate}</td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full border
                        ${
                          req.status === "Booked" || req.status.includes("Agent")
                            ? "bg-green-50 text-green-700 border-green-200"
                            : req.status === "Action Required"
                            ? "bg-orange-100 text-orange-700 border-orange-200 animate-pulse"
                            : req.status.includes("Pending")
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : req.status === "Rejected"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                    >
                      {req.status}
                    </span>
                  </td>

                  <td
                    className="px-6 py-4 text-right"
                    onClick={(e) => e.stopPropagation()} // Prevent row click
                  >
                    {/* ACTION REQUIRED BUTTON */}
                    {req.status === "Action Required" && (
                      <button
                        onClick={() => initiateRespond(req)}
                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold"
                      >
                        <MessageSquare size={14} className="inline mr-1" />
                        Review
                      </button>
                    )}

                    {/* DELETE BUTTON */}
                    {onDelete && (
                      <button
                        onClick={() => initiateDelete(req.id, req.destination)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-600 ml-2"
                        title="Delete"
                      >
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

      {/* DELETE MODAL */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Request?"
        message={`Are you sure you want to delete your travel request to ${selectedRequest?.dest}?`}
        confirmText="Delete Request"
      />

      {/* RESPOND MODAL */}
      {respondModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">Review Agent Options</h3>
              <button onClick={() => setRespondModalOpen(false)}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-4">
              <p className="text-xs font-bold text-orange-700 uppercase mb-1">Agent Notes</p>
              <p className="text-sm text-gray-800 whitespace-pre-line">
                {selectedRequest?.notes || "No notes yet."}
              </p>
            </div>

            <textarea
              className="w-full h-28 p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Write your response..."
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setRespondModalOpen(false)}
                className="px-4 py-2 bg-gray-100 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={submitResponse}
                disabled={!responseMessage.trim()}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg shadow disabled:opacity-50"
              >
                <Check size={16} className="inline mr-1" />
                Send
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyRequests;
