import React, { useState, useEffect } from 'react';
import { TravelRequest, CostBreakdown, FlightBookingDetails, HotelBookingDetails } from '../types';
import { Upload, Plus, Trash2, Calculator, MapPin, Calendar, CheckSquare, Clock, Train, Plane } from 'lucide-react';

interface Props {
  request: TravelRequest;
  onConfirm: (details: CostBreakdown, total: number) => void;
  onCancel: () => void;
}

const BookingCompletionForm: React.FC<Props> = ({ request, onConfirm, onCancel }) => {
  
  // --- 1. SMART ROUTE PARSING ---
  // We extract the sequence of cities to enforce "A -> B -> C"
  const getCitySequence = () => {
      // 1. Try to get origin from notes
      const originMatch = request.agentNotes?.match(/Origin:\s*(.*?)(\n|$)/);
      const origin = originMatch ? originMatch[1].trim() : 'Origin';

      // 2. Get destinations (Multi-city is comma separated)
      const destinations = request.destination.split(',').map(s => s.trim());

      // 3. Combine: [Origin, Dest1, Dest2, ...]
      return [origin, ...destinations];
  };

  const citySequence = getCitySequence();

  // --- 2. STATE INITIALIZATION ---
  // We pre-fill segments based on the city sequence
  const initialSegments = [];
  for (let i = 0; i < citySequence.length - 1; i++) {
      initialSegments.push({
          from: citySequence[i],
          to: citySequence[i+1],
          mode: 'Flight' as 'Flight' | 'Train', // Default to Flight
          airline: '', 
          flightNumber: '', 
          departureTime: '', 
          arrivalTime: '', 
          cost: 0, 
          agentFee: 0, 
          ticketFile: '' 
      });
  }

  const [segments, setSegments] = useState<any[]>(initialSegments);
  
  // Hotels: One for each destination city (excluding Origin)
  const initialHotels = citySequence.slice(1).map(city => ({
      city: city,
      hotelName: '', 
      checkIn: request.startDate, 
      checkOut: request.endDate, 
      cost: 0, 
      agentFee: 0,
      bookingStatus: 'Confirmed', 
      bookingFile: ''
  }));

  const [hotels, setHotels] = useState<HotelBookingDetails[]>(initialHotels);

  const [cab, setCab] = useState({ required: false, cost: 0, agentFee: 0, remarks: '' });
  const [other, setOther] = useState({ cost: 0, agentFee: 0, description: '' });

  // --- 3. DYNAMIC TOTAL ---
  const totalCost = 
    segments.reduce((acc, s) => acc + Number(s.cost) + Number(s.agentFee), 0) +
    hotels.reduce((acc, h) => (h.bookingStatus === 'Confirmed' ? acc + Number(h.cost) + Number(h.agentFee) : acc), 0) +
    (Number(cab.cost) + Number(cab.agentFee)) + 
    (Number(other.cost) + Number(other.agentFee));

  // --- HANDLERS ---

  const handleSegmentChange = (idx: number, field: string, value: any) => {
    const newSegments = [...segments];
    newSegments[idx][field] = value;
    setSegments(newSegments);
  };

  const handleHotelChange = (idx: number, field: keyof HotelBookingDetails, value: any) => {
    const newHotels = [...hotels];
    // @ts-ignore
    newHotels[idx][field] = value;
    setHotels(newHotels);
  };

  const handleBookLaterToggle = (idx: number) => {
    const newHotels = [...hotels];
    const currentStatus = newHotels[idx].bookingStatus;
    newHotels[idx].bookingStatus = currentStatus === 'Confirmed' ? 'Book Later' : 'Confirmed';
    
    if (newHotels[idx].bookingStatus === 'Book Later') {
        newHotels[idx].cost = 0;
        newHotels[idx].agentFee = 0;
    }
    setHotels(newHotels);
  };

  // --- RENDER ---
  return (
    <div className="space-y-8">
      
      {/* HEADER SUMMARY */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-2xl flex justify-between items-center shadow-lg text-white">
         <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Booking For</p>
            <div className="flex items-center gap-3">
                <span className="font-extrabold text-2xl">{request.employeeName}</span>
                <span className="text-xs bg-gray-700 px-2 py-1 rounded border border-gray-600 uppercase tracking-wide">{request.department}</span>
            </div>
         </div>
         <div className="text-right">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Estimated Cost</p>
            <p className="text-3xl font-black text-green-400">₹{totalCost.toLocaleString()}</p>
         </div>
      </div>

      {/* 1. TRAVEL SEGMENTS (Strict Sequence) */}
      <div className="space-y-6">
        <div className="flex justify-between items-end border-b border-gray-100 pb-2">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                <MapPin size={18} className="text-primary-600"/> Travel Itinerary
            </h3>
            <span className="text-xs text-gray-400 italic">Sequence is fixed based on request</span>
        </div>

        {segments.map((seg, i) => (
            <div key={i} className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm space-y-5 relative">
                
                {/* Header: Route & Mode Switch */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-sm border border-gray-200">
                            {i + 1}
                        </div>
                        <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                            {seg.from} <span className="text-gray-300">➝</span> {seg.to}
                        </h4>
                    </div>
                    
                    {/* MODE TOGGLE */}
                    <div className="bg-gray-100 p-1 rounded-lg flex">
                        <button 
                            onClick={() => handleSegmentChange(i, 'mode', 'Flight')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${seg.mode === 'Flight' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Plane size={14}/> Flight
                        </button>
                        <button 
                            onClick={() => handleSegmentChange(i, 'mode', 'Train')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${seg.mode === 'Train' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Train size={14}/> Train
                        </button>
                    </div>
                </div>

                {/* DETAILS INPUTS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <input 
                        placeholder={seg.mode === 'Flight' ? "Airline (e.g. Indigo)" : "Train Name (e.g. Rajdhani)"}
                        value={seg.airline} // Reusing field name for Train Name
                        onChange={(e) => handleSegmentChange(i, 'airline', e.target.value)}
                        className="p-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                    <input 
                        placeholder={seg.mode === 'Flight' ? "Flight No. (6E-402)" : "Train No. (12951)"} 
                        value={seg.flightNumber}
                        onChange={(e) => handleSegmentChange(i, 'flightNumber', e.target.value)}
                        className="p-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                    <input 
                        type="datetime-local"
                        value={seg.departureTime}
                        onChange={(e) => handleSegmentChange(i, 'departureTime', e.target.value)}
                        className="p-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none text-gray-600"
                    />
                    <input 
                        type="datetime-local"
                        value={seg.arrivalTime}
                        onChange={(e) => handleSegmentChange(i, 'arrivalTime', e.target.value)}
                        className="p-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none text-gray-600"
                    />
                </div>

                {/* COSTS & UPLOAD */}
                <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Ticket Cost</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                            <input 
                                type="number"
                                value={seg.cost || ''}
                                onChange={(e) => handleSegmentChange(i, 'cost', Number(e.target.value))}
                                className="w-full pl-6 p-2 bg-white border border-gray-200 rounded-lg text-sm font-bold outline-none focus:border-primary-500"
                                placeholder="0"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Agent Fee</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                            <input 
                                type="number"
                                value={seg.agentFee || ''}
                                onChange={(e) => handleSegmentChange(i, 'agentFee', Number(e.target.value))}
                                className="w-full pl-6 p-2 bg-white border border-gray-200 rounded-lg text-sm font-bold outline-none focus:border-primary-500"
                                placeholder="0"
                            />
                        </div>
                    </div>
                    <div className="flex items-end">
                        <label className={`w-full py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            seg.ticketFile ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-100'
                        }`}>
                            <input type="file" className="hidden" onChange={(e) => handleSegmentChange(i, 'ticketFile', e.target.files?.[0]?.name || 'ticket.pdf')}/>
                            <Upload size={14}/> {seg.ticketFile ? 'File Attached' : 'Upload Ticket'}
                        </label>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* 2. HOTEL BOOKING SECTION */}
      <div className="space-y-6">
        <div className="flex justify-between items-end border-b border-gray-100 pb-2">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                <Calendar size={18} className="text-orange-500"/> Accommodation
            </h3>
        </div>

        {hotels.map((hotel, i) => (
            <div key={i} className={`p-6 border rounded-2xl transition-all ${hotel.bookingStatus === 'Book Later' ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200 shadow-sm'}`}>
                
                <div className="flex justify-between items-center mb-5">
                     <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        Stay in {hotel.city}
                     </h4>

                     {/* BOOK LATER TOGGLE */}
                     <label className="flex items-center gap-2 cursor-pointer select-none">
                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${hotel.bookingStatus === 'Book Later' ? 'bg-orange-500' : 'bg-gray-200'}`}>
                            <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${hotel.bookingStatus === 'Book Later' ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                        <input 
                            type="checkbox" 
                            className="hidden"
                            checked={hotel.bookingStatus === 'Book Later'}
                            onChange={() => handleBookLaterToggle(i)}
                        />
                        <span className="text-xs font-bold text-gray-500 uppercase">Defer Booking</span>
                     </label>
                </div>

                {hotel.bookingStatus === 'Confirmed' ? (
                    <div className="animate-fade-in space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <input 
                                placeholder="Hotel Name" 
                                value={hotel.hotelName}
                                onChange={(e) => handleHotelChange(i, 'hotelName', e.target.value)}
                                className="col-span-1 p-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                            <div className="relative">
                                <label className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-gray-400">Check-in</label>
                                <input 
                                    type="date"
                                    value={hotel.checkIn}
                                    onChange={(e) => handleHotelChange(i, 'checkIn', e.target.value)}
                                    className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm font-medium outline-none"
                                />
                            </div>
                            <div className="relative">
                                <label className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-gray-400">Check-out</label>
                                <input 
                                    type="date"
                                    value={hotel.checkOut}
                                    onChange={(e) => handleHotelChange(i, 'checkOut', e.target.value)}
                                    className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm font-medium outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Cost</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                                    <input 
                                        type="number"
                                        value={hotel.cost || ''}
                                        onChange={(e) => handleHotelChange(i, 'cost', Number(e.target.value))}
                                        className="w-full pl-6 p-2 bg-white border border-gray-200 rounded-lg text-sm font-bold outline-none focus:border-primary-500"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Agent Fee</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                                    <input 
                                        type="number"
                                        value={hotel.agentFee || ''}
                                        onChange={(e) => handleHotelChange(i, 'agentFee', Number(e.target.value))}
                                        className="w-full pl-6 p-2 bg-white border border-gray-200 rounded-lg text-sm font-bold outline-none focus:border-primary-500"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="flex items-end">
                                <label className={`w-full py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                    hotel.bookingFile ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-100'
                                }`}>
                                    <input type="file" className="hidden" onChange={(e) => handleHotelChange(i, 'bookingFile', e.target.files?.[0]?.name || 'voucher.pdf')}/>
                                    <Upload size={14}/> {hotel.bookingFile ? 'Voucher Attached' : 'Upload Voucher'}
                                </label>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-3 bg-orange-100 rounded-lg border border-orange-200 text-orange-800 text-sm font-medium flex items-center gap-2">
                        <Clock size={16} /> Hotel booking deferred. It will remain in your active queue.
                    </div>
                )}
            </div>
        ))}
      </div>

      <hr className="border-gray-200 border-dashed"/>

      {/* 3. CAB & OTHER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* CAB */}
         <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
            <h4 className="font-bold text-gray-700 text-sm mb-3">Cab / Local Transport</h4>
            <div className="grid grid-cols-2 gap-3 mb-3">
                 <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Cost</label>
                    <input 
                        type="number" 
                        value={cab.cost || ''} 
                        onChange={(e) => setCab({...cab, cost: Number(e.target.value), required: true})}
                        className="w-full p-2 border rounded-lg text-sm" placeholder="₹0"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Fee</label>
                    <input 
                        type="number" 
                        value={cab.agentFee || ''} 
                        onChange={(e) => setCab({...cab, agentFee: Number(e.target.value)})}
                        className="w-full p-2 border rounded-lg text-sm" placeholder="₹0"
                    />
                 </div>
            </div>
            <input 
                placeholder="Remarks (e.g. Airport Pickup)"
                value={cab.remarks}
                onChange={(e) => setCab({...cab, remarks: e.target.value})}
                className="w-full p-2 border rounded-lg text-sm"
            />
         </div>

         {/* OTHER */}
         <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
            <h4 className="font-bold text-gray-700 text-sm mb-3">Other Expenses</h4>
            <div className="grid grid-cols-2 gap-3 mb-3">
                 <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Cost</label>
                    <input 
                        type="number" 
                        value={other.cost || ''} 
                        onChange={(e) => setOther({...other, cost: Number(e.target.value)})}
                        className="w-full p-2 border rounded-lg text-sm" placeholder="₹0"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Fee</label>
                    <input 
                        type="number" 
                        value={other.agentFee || ''} 
                        onChange={(e) => setOther({...other, agentFee: Number(e.target.value)})}
                        className="w-full p-2 border rounded-lg text-sm" placeholder="₹0"
                    />
                 </div>
            </div>
            <input 
                placeholder="Description (e.g. Visa Fee)"
                value={other.description}
                onChange={(e) => setOther({...other, description: e.target.value})}
                className="w-full p-2 border rounded-lg text-sm"
            />
         </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex gap-4 pt-4 border-t border-gray-100">
         <button 
            onClick={onCancel}
            className="flex-1 py-4 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
         >
            Cancel
         </button>
         <button 
            onClick={() => onConfirm({ 
                flights: segments, // We reuse the 'flights' type but now it can contain trains
                hotels, 
                cab, 
                other, 
                flightCosts: segments,
                totalAmount: totalCost 
            }, totalCost)}
            className="flex-1 py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
         >
            <CheckSquare size={20} /> Confirm & Book
         </button>
      </div>
    </div>
  );
};

export default BookingCompletionForm;