import React, { useState, useEffect } from 'react';
import { TravelRequest, CostBreakdown } from '../types';
import { Upload, Plus, Trash2, Calculator, MapPin } from 'lucide-react';

interface Props {
  request: TravelRequest;
  onConfirm: (details: CostBreakdown, total: number) => void;
  onCancel: () => void;
}

const BookingCompletionForm: React.FC<Props> = ({ request, onConfirm, onCancel }) => {
  // --- PARSE ORIGIN FROM NOTES ---
  // We try to find "Origin: X" in the notes, otherwise default to "Origin"
  const originMatch = request.agentNotes?.match(/Origin:\s*(.*?)(\n|$)/);
  const initialOrigin = originMatch ? originMatch[1].trim() : 'Start Location';

  // --- STATE ---
  const [flights, setFlights] = useState([
    { from: initialOrigin, to: request.destination, airlineCost: 0, agentFee: 0, ticketFile: '' }
  ]);
  
  const [hotels, setHotels] = useState([
    { city: request.destination, hotelCost: 0, agentFee: 0 }
  ]);

  const [cabCost, setCabCost] = useState(0);
  const [otherCost, setOtherCost] = useState(0);

  // --- CALCULATE TOTAL ---
  const totalCost = 
    flights.reduce((acc, f) => acc + Number(f.airlineCost) + Number(f.agentFee), 0) +
    hotels.reduce((acc, h) => acc + Number(h.hotelCost) + Number(h.agentFee), 0) +
    Number(cabCost) + 
    Number(otherCost);

  // --- HANDLERS ---
  const handleFlightChange = (idx: number, field: string, value: any) => {
    const newFlights: any = [...flights];
    newFlights[idx][field] = value;
    setFlights(newFlights);
  };

  const handleHotelChange = (idx: number, field: string, value: any) => {
    const newHotels: any = [...hotels];
    newHotels[idx][field] = value;
    setHotels(newHotels);
  };

  const handleFileUpload = (idx: number) => {
    // Mock upload
    handleFlightChange(idx, 'ticketFile', 'ticket_confirmed.pdf');
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
         <div>
            <p className="text-xs text-blue-600 font-bold uppercase">Booking For</p>
            <p className="font-bold text-blue-900">{request.employeeName}</p>
         </div>
         <div className="text-right">
            <p className="text-xs text-blue-600 font-bold uppercase">Total Estimated Cost</p>
            <p className="text-2xl font-bold text-blue-900">₹{totalCost.toLocaleString()}</p>
         </div>
      </div>

      {/* 1. FLIGHT DETAILS */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wide">
            <MapPin size={16}/> Flight Segments
        </h3>
        {flights.map((flight, i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <input 
                        placeholder="From" 
                        value={flight.from}
                        onChange={(e) => handleFlightChange(i, 'from', e.target.value)}
                        className="p-2 border rounded-lg text-sm font-medium"
                    />
                    <input 
                        placeholder="To" 
                        value={flight.to}
                        onChange={(e) => handleFlightChange(i, 'to', e.target.value)}
                        className="p-2 border rounded-lg text-sm font-medium"
                    />
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400">Flight Cost</label>
                        <input 
                            type="number"
                            placeholder="0" 
                            value={flight.airlineCost || ''}
                            onChange={(e) => handleFlightChange(i, 'airlineCost', Number(e.target.value))}
                            className="w-full p-2 border rounded-lg text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400">Agent Fee</label>
                        <input 
                            type="number"
                            placeholder="0" 
                            value={flight.agentFee || ''}
                            onChange={(e) => handleFlightChange(i, 'agentFee', Number(e.target.value))}
                            className="w-full p-2 border rounded-lg text-sm"
                        />
                    </div>
                    <div className="flex items-end">
                        <button 
                            onClick={() => handleFileUpload(i)}
                            className={`w-full p-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-2 ${flight.ticketFile ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-gray-500 border-dashed border-gray-300'}`}
                        >
                            <Upload size={14}/> {flight.ticketFile ? 'Uploaded' : 'Upload Ticket'}
                        </button>
                    </div>
                </div>
            </div>
        ))}
        <button 
            onClick={() => setFlights([...flights, { from: '', to: '', airlineCost: 0, agentFee: 0, ticketFile: '' }])}
            className="text-xs font-bold text-primary-600 flex items-center gap-1 hover:underline"
        >
            <Plus size={14}/> Add Return/Connecting Flight
        </button>
      </div>

      <hr className="border-gray-100"/>

      {/* 2. HOTEL DETAILS */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wide">
            <MapPin size={16}/> Hotel Costs
        </h3>
        {hotels.map((hotel, i) => (
            <div key={i} className="grid grid-cols-3 gap-3 p-3 border border-gray-200 rounded-xl bg-gray-50/50">
                <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400">City</label>
                    <input 
                        value={hotel.city}
                        onChange={(e) => handleHotelChange(i, 'city', e.target.value)}
                        className="w-full p-2 border rounded-lg text-sm font-medium"
                    />
                </div>
                <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400">Hotel Cost</label>
                    <input 
                        type="number"
                        placeholder="0"
                        value={hotel.hotelCost || ''}
                        onChange={(e) => handleHotelChange(i, 'hotelCost', Number(e.target.value))}
                        className="w-full p-2 border rounded-lg text-sm"
                    />
                </div>
                <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400">Agent Fee</label>
                    <input 
                        type="number"
                        placeholder="0"
                        value={hotel.agentFee || ''}
                        onChange={(e) => handleHotelChange(i, 'agentFee', Number(e.target.value))}
                        className="w-full p-2 border rounded-lg text-sm"
                    />
                </div>
            </div>
        ))}
        <button 
            onClick={() => setHotels([...hotels, { city: '', hotelCost: 0, agentFee: 0 }])}
            className="text-xs font-bold text-primary-600 flex items-center gap-1 hover:underline"
        >
            <Plus size={14}/> Add Another City
        </button>
      </div>

      <hr className="border-gray-100"/>

      {/* 3. CAB & OTHER */}
      <div className="grid grid-cols-2 gap-4">
         <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Total Cab Cost</label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <input 
                    type="number"
                    value={cabCost || ''}
                    onChange={(e) => setCabCost(Number(e.target.value))}
                    className="w-full pl-6 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="0"
                />
            </div>
         </div>
         <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Other/Misc Cost</label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <input 
                    type="number"
                    value={otherCost || ''}
                    onChange={(e) => setOtherCost(Number(e.target.value))}
                    className="w-full pl-6 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="0"
                />
            </div>
         </div>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-3 pt-4">
         <button 
            onClick={onCancel}
            className="flex-1 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50"
         >
            Cancel
         </button>
         <button 
            onClick={() => onConfirm({ 
                flightCosts: flights, 
                hotelCosts: hotels, 
                cabCost, 
                otherCost, 
                totalAmount: totalCost 
            }, totalCost)}
            className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg"
         >
            Confirm Booking
         </button>
      </div>
    </div>
  );
};

export default BookingCompletionForm;