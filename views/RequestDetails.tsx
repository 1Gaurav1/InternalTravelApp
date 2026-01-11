
import React from 'react';
import { ArrowLeft, Clock, AlertTriangle, X, Check, Plane, Bed, MapPin } from 'lucide-react';

interface RequestDetailsProps {
  requestId: string | null;
  onBack: () => void;
}

const RequestDetails: React.FC<RequestDetailsProps> = ({ requestId, onBack }) => {
  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Request #{requestId || 'TR-8821'}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-2">
                Submitted by <span className="font-medium text-gray-900">Sarah Jenkins</span> • Marketing Dept • Oct 24, 2026
            </p>
        </div>
        <div className="flex gap-3">
            <div className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium flex items-center gap-2 border border-yellow-100">
                <Clock size={16} /> Pending Approval
            </div>
            <div className="px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-sm font-medium flex items-center gap-2 border border-orange-100">
                <AlertTriangle size={16} /> Policy Flagged
            </div>
        </div>
        <div className="flex gap-3 ml-4">
            <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                <X size={18} /> Reject
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 shadow-lg shadow-primary-500/20 transition-all">
                <Check size={18} /> Approve Request
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            {/* Map/Destination Card */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="h-32 bg-gray-200 relative">
                     {/* Placeholder for map */}
                     <img src="https://picsum.photos/800/200?blur=2" className="w-full h-full object-cover opacity-50" />
                     <div className="absolute bottom-4 right-4 bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full">International</div>
                </div>
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">London, United Kingdom</h2>
                    <p className="text-gray-500 text-sm mb-6">Client Meeting & Conference</p>
                    
                    <div className="grid grid-cols-3 gap-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="text-center border-r border-gray-200 last:border-0">
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Dates</p>
                            <p className="font-bold text-gray-900">Nov 12 - 16, 2026</p>
                        </div>
                        <div className="text-center border-r border-gray-200 last:border-0">
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Duration</p>
                            <p className="font-bold text-gray-900">5 Days, 4 Nights</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Estimate</p>
                            <p className="font-bold text-primary-600 text-lg">₹2,95,000</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Flight Details */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Plane className="text-primary-500" size={20} /> Flight Details
                    </h3>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">In Policy</span>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-900 text-white flex items-center justify-center font-serif font-bold text-xs rounded">BA</div>
                        <div>
                            <p className="font-bold text-gray-900">British Airways</p>
                            <p className="text-xs text-gray-500 font-medium">BA117 • Economy</p>
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold text-gray-900">08:30</p>
                        <p className="text-xs text-gray-500 font-medium">JFK</p>
                    </div>
                    <div className="flex flex-col items-center px-4">
                        <p className="text-xs text-gray-400 mb-1">7h 10m</p>
                        <div className="w-24 h-px bg-gray-300 relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                        </div>
                        <p className="text-xs text-green-600 mt-1 font-medium">Direct</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold text-gray-900">20:40</p>
                        <p className="text-xs text-gray-500 font-medium">LHR</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-gray-900 text-lg">₹1,02,000</p>
                        <p className="text-xs text-gray-500 font-medium">Round Trip</p>
                    </div>
                </div>
            </div>

            {/* Accommodation */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Bed className="text-primary-500" size={20} /> Accommodation
                    </h3>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">Exceeds Cap</span>
                </div>
                <div className="flex gap-4">
                    <img src="https://picsum.photos/200/150" className="w-48 h-32 object-cover rounded-xl" />
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg">The Langham Hotel</h4>
                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1 font-medium">
                                    <MapPin size={14} /> 1c Portland Place, Regent Street, London
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">₹38,500<span className="text-sm font-normal text-gray-500">/night</span></p>
                                <p className="text-xs font-bold text-gray-900">x 4 Nights</p>
                            </div>
                        </div>
                        <div className="flex gap-1 mt-3">
                             {[1,2,3,4,5].map(i => <span key={i} className="text-yellow-400 text-xs">★</span>)}
                             <span className="text-xs text-gray-500 ml-2 font-medium">5.0 (320 reviews)</span>
                        </div>
                        <div className="mt-4 bg-orange-50 border border-orange-100 p-3 rounded-lg text-sm text-orange-800 font-medium">
                            <strong>Policy Flag:</strong> This hotel rate is ₹3,500 above the city cap of ₹35,000 for London.
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-6">Employee Context</h3>
                <div className="flex items-center gap-4 mb-6">
                    <img src="https://picsum.photos/100/100" className="w-14 h-14 rounded-full object-cover" />
                    <div>
                        <p className="font-bold text-gray-900 text-lg">Sarah Jenkins</p>
                        <p className="text-sm text-gray-500">Marketing Director</p>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Department Budget (Q4)</span>
                        <span className="text-primary-600 font-bold">65% Used</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-primary-500 h-full rounded-full" style={{width: '65%'}}></div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-gray-50 p-4 rounded-xl text-center">
                        <p className="text-xs text-gray-500 uppercase mb-1 font-bold">Trips YTD</p>
                        <p className="text-2xl font-bold text-gray-900">8</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl text-center">
                        <p className="text-xs text-gray-500 uppercase mb-1 font-bold">Avg. Spend</p>
                        <p className="text-2xl font-bold text-gray-900">₹1.8 L</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-6">Cost Breakdown</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                            <span className="text-gray-700 font-medium">Flight</span>
                        </div>
                        <span className="font-bold text-gray-900">₹1,02,000</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary-300"></span>
                            <span className="text-gray-700 font-medium">Hotel (4 nights)</span>
                        </div>
                        <span className="font-bold text-gray-900">₹1,54,000</span>
                    </div>
                     <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span className="text-gray-700 font-medium">Est. Per Diem</span>
                        </div>
                        <span className="font-bold text-gray-900">₹39,000</span>
                    </div>
                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                        <span className="font-bold text-gray-900">Total</span>
                        <span className="font-bold text-2xl text-primary-500">₹2,95,000</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-6">Policy Checks</h3>
                <div className="space-y-5">
                    <div className="flex gap-3">
                        <div className="mt-0.5 p-1 bg-green-100 text-green-600 rounded-full h-fit">
                            <Check size={12} strokeWidth={3} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm">Booking Lead Time</p>
                            <p className="text-xs text-gray-500">Booked {'>'}14 days in advance</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                         <div className="mt-0.5 p-1 bg-green-100 text-green-600 rounded-full h-fit">
                            <Check size={12} strokeWidth={3} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm">Flight Class</p>
                            <p className="text-xs text-gray-500">Economy class selected</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                         <div className="mt-0.5 p-1 bg-orange-100 text-orange-600 rounded-full h-fit">
                            <span className="font-bold text-xs">!</span>
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm">Hotel Rate Cap</p>
                            <p className="text-xs text-gray-500">Exceeds ₹35,000 cap by ₹3,500</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetails;
