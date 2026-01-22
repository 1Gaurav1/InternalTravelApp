import React from "react";
import { TravelRequest } from "../types";
import { MessageCircle } from "lucide-react"; // <--- Import Icon

interface Props {
  requests: TravelRequest[];
  employeeName: string;
}

const TravelOptions: React.FC<Props> = ({ requests, employeeName }) => {
  const myRequests = requests.filter(
    r => r.employeeName === employeeName && r.agentOptions && r.agentOptions.length > 0
  );

  const handleShareOptions = (req: TravelRequest) => {
    // Format the options into a list
    const optionsList = req.agentOptions?.map(opt => `• ${opt}`).join('\n') || 'No options listed.';
    
    // Construct the WhatsApp message
    const message = `*Travel Options for ${req.destination}*\n` +
                    `Request ID: ${req.id}\n\n` +
                    `Here are the available options:\n${optionsList}\n\n` +
                    `Please login to the portal to confirm your choice.`;

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Travel Options</h1>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {myRequests.length} Active
          </span>
      </div>

      {myRequests.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
             <p className="text-gray-500">No travel options available yet.</p>
        </div>
      ) : (
        myRequests.map(req => (
          <div key={req.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-xl font-bold text-primary-600 flex items-center gap-2">
                    {req.destination}
                    </h2>
                    <p className="text-gray-400 text-xs font-mono mt-1">ID: {req.id}</p>
                </div>
                
                {/* SHARE BUTTON */}
                <button 
                    onClick={() => handleShareOptions(req)}
                    className="flex items-center gap-2 text-sm font-bold text-green-600 bg-green-50 hover:bg-green-100 px-3 py-2 rounded-lg transition-colors"
                    title="Share these options via WhatsApp"
                >
                    <MessageCircle size={18} /> <span className="hidden sm:inline">WhatsApp</span>
                </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Agent Recommendations</h3>
                <ul className="space-y-3">
                {req.agentOptions!.map((opt, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-700 text-sm bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <span className="bg-primary-100 text-primary-700 text-[10px] font-bold px-2 py-0.5 rounded-md mt-0.5">#{i+1}</span>
                        {opt}
                    </li>
                ))}
                </ul>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default TravelOptions;