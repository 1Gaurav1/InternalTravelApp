
import React, { useState } from 'react';
import { Eye, Trash2, Search, Filter, MessageSquare, Check, X } from 'lucide-react';
import { TravelRequest, RequestStatus } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';

interface MyRequestsProps {
    requests: TravelRequest[];
    onDelete?: (id: string) => void;
    onUpdateStatus?: (id: string, status: RequestStatus, agentNotes?: string) => void;
}

const MyRequests: React.FC<MyRequestsProps> = ({ requests, onDelete, onUpdateStatus }) => {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [respondModalOpen, setRespondModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<{ id: string, dest: string, notes?: string } | null>(null);
    const [responseMessage, setResponseMessage] = useState('');

    const initiateDelete = (id: string, dest: string) => {
        if (!onDelete) return;
        setSelectedRequest({ id, dest });
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (selectedRequest && onDelete) {
            onDelete(selectedRequest.id);
        }
    };

    const initiateRespond = (req: TravelRequest) => {
        setSelectedRequest({ id: req.id, dest: req.destination, notes: req.agentNotes });
        setResponseMessage('');
        setRespondModalOpen(true);
    };

    const submitResponse = () => {
        if(selectedRequest && onUpdateStatus) {
            // Send back to agent (Status becomes Processing again for Agent to book)
            const fullNote = `Employee Selection/Note: ${responseMessage} | Previous Agent Options: ${selectedRequest.notes}`;
            onUpdateStatus(selectedRequest.id, 'Processing (Agent)', fullNote);
            setRespondModalOpen(false);
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-end">
                <div>
                     <h1 className="text-3xl font-bold text-gray-900">My Requests History</h1>
                     <p className="text-gray-500 mt-2">View and manage your past and upcoming travel requests.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl font-medium shadow-lg shadow-primary-500/30 hover:bg-primary-600 transition-all">
                    + New Request
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-wrap gap-4 items-center justify-between shadow-sm">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Search by ID, destination..." className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border border-transparent focus:bg-white focus:border-primary-200 outline-none transition-all" />
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1 md:pb-0">
                    <button className="px-4 py-2 bg-primary-50 text-primary-600 font-medium rounded-lg text-sm flex items-center gap-2">
                        <Filter size={16} /> All Requests
                    </button>
                     <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 font-medium rounded-lg text-sm hover:bg-gray-50 transition-colors">
                        Approved
                    </button>
                     <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 font-medium rounded-lg text-sm hover:bg-gray-50 transition-colors">
                        Pending
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Request ID</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Destination</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Travel Date</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {requests.map((req) => (
                                <tr key={req.id} className={`hover:bg-gray-50/50 transition-colors group ${req.status === 'Action Required' ? 'bg-orange-50/30' : ''}`}>
                                    <td className="px-6 py-4 font-bold text-gray-900 text-sm">{req.id}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-pink-50 text-pink-500 rounded-full">
                                                <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                                            </div>
                                            <span className="font-medium text-gray-900">{req.destination}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-sm">{req.startDate}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                          ${req.status.includes('Agent') || req.status === 'Booked' ? 'bg-green-50 text-green-700 border-green-100' : 
                                            req.status === 'Action Required' ? 'bg-orange-100 text-orange-700 border-orange-200 animate-pulse' :
                                            req.status.includes('Pending') ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 
                                            req.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                                            'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 text-gray-400">
                                            {req.status === 'Action Required' ? (
                                                <button 
                                                    onClick={() => initiateRespond(req)}
                                                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-xs font-bold flex items-center gap-1 shadow-md shadow-orange-500/20" 
                                                    title="Review Options"
                                                >
                                                    <MessageSquare size={14} /> Review Options
                                                </button>
                                            ) : (
                                                <button className="p-1.5 hover:bg-gray-100 rounded-lg hover:text-gray-600 transition-colors" title="View Details">
                                                    <Eye size={18} />
                                                </button>
                                            )}
                                            
                                            {onDelete && (
                                                <button 
                                                    onClick={() => initiateDelete(req.id, req.destination)}
                                                    className="p-1.5 hover:bg-red-50 rounded-lg hover:text-red-600 transition-colors" 
                                                    title="Delete Request"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmationModal 
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Request?"
                message={`Are you sure you want to permanently delete your travel request to ${selectedRequest?.dest}? This action cannot be undone.`}
                confirmText="Delete Request"
            />

            {/* Respond Modal */}
            {respondModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm animate-fade-in p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 transform transition-all scale-100">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Review Travel Options</h3>
                            <button onClick={() => setRespondModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-4">
                            <p className="text-xs font-bold text-orange-700 uppercase mb-2">Message from Travel Agent</p>
                            <div className="text-sm text-gray-800 whitespace-pre-wrap font-medium">
                                {selectedRequest?.notes || "No notes provided."}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Select an Option / Reply</label>
                            <textarea 
                                className="w-full h-24 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                placeholder="e.g. I'll take Option 2. Please book the aisle seat."
                                value={responseMessage}
                                onChange={(e) => setResponseMessage(e.target.value)}
                            ></textarea>
                            <p className="text-xs text-gray-500 mt-2">Your response will be sent back to the travel agent for final booking.</p>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button 
                                onClick={() => setRespondModalOpen(false)}
                                className="px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={submitResponse}
                                disabled={!responseMessage.trim()}
                                className="px-4 py-2.5 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-lg shadow-primary-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Check size={16} /> Confirm Selection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyRequests;
