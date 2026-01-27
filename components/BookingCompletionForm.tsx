import React, { useState, useEffect } from 'react';
import { TravelRequest, CostBreakdown, FlightBookingDetails, HotelBookingDetails } from '../types';
import { Upload, MapPin, Calendar, CheckSquare, Train, Plane, FileText, IndianRupee, ArrowRight, Clock, AlertCircle, Car, Plus, X, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast'; 

interface Props {
  request: TravelRequest;
  onConfirm: (details: CostBreakdown, total: number) => void;
  onCancel: () => void;
}

const BookingCompletionForm: React.FC<Props> = ({ request, onConfirm, onCancel }) => {
  
  // --- STATE ---
  const [segments, setSegments] = useState<FlightBookingDetails[]>([]);
  const [hotels, setHotels] = useState<HotelBookingDetails[]>([]);
  const [cab, setCab] = useState<{ [index: number]: { required: boolean, cost: number, agentFee: number, remarks: string } }>({});
  const [other, setOther] = useState<{ [index: number]: { cost: number, agentFee: number, description: string } }>({});
  const [showErrors, setShowErrors] = useState(false);

  // --- 1. SMART ROUTE PARSING ---
  useEffect(() => {
      const cleanCity = (str: string) => {
          if (!str) return '';
          let cleaned = str.split(',')[0].trim(); 
          cleaned = cleaned.replace(/^\d+\.\s*/, '').replace(/^(Origin:|From:|To:)/i, '').trim();
          return cleaned;
      };

      const noteLower = request.agentNotes?.toLowerCase() || '';
      
      // IMPROVED DETECTION LOGIC
      // Check agentNotes, but also check for explicit properties if they exist
      const isMultiCity = noteLower.includes('multi city') || (request.agentNotes?.includes('->') && !noteLower.includes('return'));
      
      // Robust Return Detection: 
      // 1. Explicit note 
      // 2. OR explicit 'tripType' property (if available on request object)
      // 3. OR heuristic: Start Date != End Date AND not multi-city AND notes have "Origin"
      // @ts-ignore
      const explicitTripType = request.tripType?.toLowerCase();
      let isReturn = explicitTripType === 'return' || noteLower.includes('return') || noteLower.includes('round trip');
      
      // Fallback: If not detected yet, check date difference logic for "A -> B" vs "A -> B -> A"
      if (!isReturn && !isMultiCity) {
         if (request.startDate !== request.endDate) {
             // It implies a stay, likely a return trip if it's single destination
             isReturn = true; 
         }
      }

      let initialSegments: FlightBookingDetails[] = [];
      let initialHotels: HotelBookingDetails[] = [];

      // --- EDIT MODE ---
      if (request.bookingDetails?.flights?.length) {
          initialSegments = request.bookingDetails.flights;
          // @ts-ignore
          initialHotels = request.bookingDetails.hotels || [];
      } 
      // --- NEW BOOKING ---
      else {
          if (isMultiCity) {
              // 1. Multi-City Logic
              const matches = [...(request.agentNotes?.matchAll(/(\d+\.)?\s*([a-zA-Z\s]+)(?:,[^->]+)?\s*->\s*([a-zA-Z\s]+)(?:,[^|]+)?/g) || [])];
              let cities: string[] = [];
              
              if (matches.length > 0) {
                  cities.push(cleanCity(matches[0][2])); 
                  matches.forEach(m => cities.push(cleanCity(m[3]))); 
              } else {
                  const origin = cleanCity(request.agentNotes?.match(/Origin:\s*(.*)/i)?.[1] || '');
                  const dests = request.destination.split(',').map(cleanCity);
                  cities = [origin, ...dests].filter(c => c);
              }

              for (let i = 0; i < cities.length - 1; i++) {
                  // Pre-fill date only for first segment
                  const date = i === 0 ? request.startDate : '';
                  initialSegments.push(createEmptySegment(cities[i], cities[i+1], date));
                  initialHotels.push(createEmptyHotel(cities[i+1], request.startDate, request.endDate));
              }
          } 
          else if (isReturn) {
              // 2. Return Trip Logic (A -> B -> A)
              const originMatch = request.agentNotes?.match(/(?:Origin|From):\s*(.*?)(\n|$)/i);
              // Fallback: if origin not found in notes, try to infer or use 'Origin' placeholder
              const origin = originMatch ? cleanCity(originMatch[1]) : 'Origin';
              const destination = cleanCity(request.destination);

              // Flight 1: Origin -> Dest (Start Date)
              initialSegments.push(createEmptySegment(origin, destination, request.startDate));
              // Flight 2: Dest -> Origin (End Date)
              initialSegments.push(createEmptySegment(destination, origin, request.endDate));

              // Hotels/Services:
              // 1. Destination: Hotel REQUIRED (Confirmed)
              initialHotels.push(createEmptyHotel(destination, request.startDate, request.endDate));
              
              // 2. Origin (Return): Hotel NOT REQUIRED (Book Later) - For Cab/Extras only
              const returnLeg = createEmptyHotel(origin, request.endDate, request.endDate);
              returnLeg.bookingStatus = 'Book Later'; 
              initialHotels.push(returnLeg);
          } 
          else {
              // 3. One Way Logic
              const originMatch = request.agentNotes?.match(/(?:Origin|From):\s*(.*?)(\n|$)/i);
              const origin = originMatch ? cleanCity(originMatch[1]) : 'Origin';
              const destination = cleanCity(request.destination);

              initialSegments.push(createEmptySegment(origin, destination, request.startDate));
              initialHotels.push(createEmptyHotel(destination, request.startDate, request.startDate));
          }
      }

      setSegments(initialSegments);
      setHotels(initialHotels);

      // Initialize Expenses
      const initialCab: any = {};
      const initialOther: any = {};
      initialHotels.forEach((_, index) => {
          initialCab[index] = { required: false, cost: 0, agentFee: 0, remarks: '' };
          initialOther[index] = { cost: 0, agentFee: 0, description: '' };
      });
      setCab(initialCab);
      setOther(initialOther);

  }, [request]);

  // --- HELPER FACTORIES ---
  const createEmptySegment = (from: string, to: string, date: string = '') => ({
      from, 
      to, 
      mode: 'Flight' as const, 
      airline: '', 
      flightNumber: '', 
      departureTime: date ? `${date}T10:00` : '', 
      arrivalTime: '', 
      cost: 0, 
      agentFee: 0, 
      ticketFile: ''
  });

  const createEmptyHotel = (city: string, checkIn: string, checkOut: string): HotelBookingDetails => ({
      city, 
      hotelName: '', 
      checkIn, 
      checkOut, 
      cost: 0, 
      agentFee: 0, 
      bookingStatus: 'Confirmed', 
      bookingFile: ''
  });

  // --- 2. CALCULATIONS ---
  const calculateTotal = () => {
      const flightTotal = segments.reduce((acc, s) => acc + Number(s.cost) + Number(s.agentFee), 0);
      const hotelTotal = hotels.reduce((acc, h) => (h.bookingStatus === 'Confirmed' ? acc + Number(h.cost) + Number(h.agentFee) : acc), 0);
      const cabTotal = Object.values(cab).reduce((acc: number, c: any) => c.required ? acc + Number(c.cost) + Number(c.agentFee) : acc, 0);
      const otherTotal = Object.values(other).reduce((acc: number, o: any) => acc + Number(o.cost) + Number(o.agentFee), 0);
      return flightTotal + hotelTotal + cabTotal + otherTotal;
  };
  const totalCost = calculateTotal();

  // --- HANDLERS ---
  const handleSegmentChange = (idx: number, field: keyof FlightBookingDetails, value: any) => {
    const newSegments = [...segments];
    // @ts-ignore
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

  const handleCabToggle = (index: number) => {
      setCab(prev => ({ ...prev, [index]: { ...prev[index], required: !prev[index]?.required } }));
  };

  const handleExpenseChange = (index: number, type: 'cab' | 'other', field: string, value: any) => {
      if (type === 'cab') {
          setCab(prev => ({ ...prev, [index]: { ...prev[index], [field]: value } }));
      } else {
          setOther(prev => ({ ...prev, [index]: { ...prev[index], [field]: value } }));
      }
  };

  // --- VALIDATION ---
  const validateAndSubmit = () => {
      let isValid = true;
      segments.forEach(seg => {
          if (!seg.from || !seg.to || !seg.airline || !seg.flightNumber || !seg.departureTime || !seg.arrivalTime || !seg.cost) {
              isValid = false;
          }
      });

      if (!isValid) {
          setShowErrors(true);
          toast.error("Please fill in all mandatory Flight details marked with *", {
              style: { background: '#FFF0F0', color: '#E11D48', fontWeight: 'bold' }
          });
          return;
      }

      onConfirm({ 
          flights: segments,
          hotels, 
          cab, 
          other, 
          flightCosts: segments, 
          totalAmount: totalCost 
      }, totalCost);
  };

  const getErrorClass = (val: any) => showErrors && !val ? "border-red-500 ring-1 ring-red-500 bg-red-50" : "border-slate-200 focus:border-pink-500 focus:ring-pink-500";

  return (
    <div className="space-y-8 pb-10">
      
      {/* HEADER */}
      <div className="bg-slate-900 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center shadow-xl text-white gap-4">
         <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Booking For</p>
            <div className="flex items-center gap-3">
                <span className="font-bold text-2xl tracking-tight">{request.employeeName}</span>
                <span className="text-xs bg-slate-700 px-3 py-1 rounded-full border border-slate-600 font-medium uppercase tracking-wide">{request.department}</span>
            </div>
         </div>
         <div className="bg-slate-800 px-6 py-3 rounded-xl border border-slate-700 min-w-[200px]">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1 text-right">Estimated Total</p>
            <p className="text-3xl font-bold text-green-400 text-right">₹{totalCost.toLocaleString()}</p>
         </div>
      </div>

      {/* 1. FLIGHT SEGMENTS */}
      <div className="space-y-6">
        <div className="flex justify-between items-end border-b border-gray-200 pb-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-3 text-base">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><MapPin size={20}/></div>
                Travel Itinerary
            </h3>
            {showErrors && <span className="text-xs text-red-500 font-bold flex items-center gap-1 animate-pulse"><AlertCircle size={12}/> Missing Flight Details</span>}
        </div>

        {segments.map((seg, i) => (
            <div key={i} className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow duration-300 relative group">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm border border-slate-200 shrink-0">
                            {i + 1}
                        </div>
                        {/* READ ONLY CITIES */}
                        <div className="flex items-center gap-3 w-full">
                            <div className="relative w-full">
                                <input value={seg.from} readOnly className="font-bold text-xl text-slate-900 border-b border-dashed border-slate-200 bg-gray-50/50 w-full cursor-not-allowed focus:outline-none"/>
                                <Lock size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300"/>
                            </div>
                            <ArrowRight className="text-slate-300 shrink-0" size={20} />
                            <div className="relative w-full">
                                <input value={seg.to} readOnly className="font-bold text-xl text-slate-900 border-b border-dashed border-slate-200 bg-gray-50/50 w-full cursor-not-allowed focus:outline-none"/>
                                <Lock size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300"/>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-slate-100 p-1.5 rounded-xl flex shadow-inner shrink-0">
                        <button onClick={() => handleSegmentChange(i, 'mode', 'Flight')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${seg.mode === 'Flight' ? 'bg-white shadow text-blue-600 ring-1 ring-black/5' : 'text-slate-500'}`}><Plane size={16}/> Flight</button>
                        <button onClick={() => handleSegmentChange(i, 'mode', 'Train')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${seg.mode === 'Train' ? 'bg-white shadow text-orange-600 ring-1 ring-black/5' : 'text-slate-500'}`}><Train size={16}/> Train</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide ml-1">{seg.mode === 'Flight' ? "Airline" : "Train Name"} <span className="text-red-500">*</span></label>
                        <input placeholder={seg.mode === 'Flight' ? "e.g. Indigo" : "e.g. Rajdhani"} value={seg.airline} onChange={(e) => handleSegmentChange(i, 'airline', e.target.value)} className={`w-full h-11 px-4 bg-slate-50 border rounded-xl text-sm font-medium outline-none transition-all ${getErrorClass(seg.airline)}`}/>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide ml-1">{seg.mode === 'Flight' ? "Flight No." : "Train No."} <span className="text-red-500">*</span></label>
                        <input placeholder={seg.mode === 'Flight' ? "e.g. 6E-402" : "e.g. 12951"} value={seg.flightNumber} onChange={(e) => handleSegmentChange(i, 'flightNumber', e.target.value)} className={`w-full h-11 px-4 bg-slate-50 border rounded-xl text-sm font-medium outline-none transition-all ${getErrorClass(seg.flightNumber)}`}/>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide ml-1">Departure <span className="text-red-500">*</span></label>
                        <input type="datetime-local" value={seg.departureTime} onChange={(e) => handleSegmentChange(i, 'departureTime', e.target.value)} className={`w-full h-11 px-4 bg-slate-50 border rounded-xl text-sm font-medium outline-none transition-all text-slate-700 ${getErrorClass(seg.departureTime)}`}/>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide ml-1">Arrival <span className="text-red-500">*</span></label>
                        <input type="datetime-local" value={seg.arrivalTime} onChange={(e) => handleSegmentChange(i, 'arrivalTime', e.target.value)} className={`w-full h-11 px-4 bg-slate-50 border rounded-xl text-sm font-medium outline-none transition-all text-slate-700 ${getErrorClass(seg.arrivalTime)}`}/>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50 p-5 rounded-xl border border-slate-200/60">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide ml-1">Ticket Cost <span className="text-red-500">*</span></label>
                        <div className="relative"><IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input type="number" value={seg.cost || ''} onChange={(e) => handleSegmentChange(i, 'cost', Number(e.target.value))} className={`w-full h-11 pl-9 pr-4 bg-white border rounded-xl text-sm font-bold text-slate-800 outline-none ${getErrorClass(seg.cost)}`} placeholder="0"/></div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide ml-1">Agent Fee</label>
                        <div className="relative"><IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input type="number" value={seg.agentFee || ''} onChange={(e) => handleSegmentChange(i, 'agentFee', Number(e.target.value))} className="w-full h-11 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-pink-500" placeholder="0"/></div>
                    </div>
                    <div className="flex items-end">
                        <label className={`w-full h-11 rounded-xl text-sm font-bold border-2 border-dashed transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${seg.ticketFile ? 'bg-green-50 text-green-700 border-green-300' : 'bg-white text-slate-500 border-slate-300 hover:border-pink-400 hover:text-pink-500'}`}>
                            <input type="file" className="hidden" onChange={(e) => handleSegmentChange(i, 'ticketFile', e.target.files?.[0]?.name || 'ticket.pdf')}/>
                            <Upload size={18}/> {seg.ticketFile ? 'Ticket Attached' : 'Upload Ticket'}
                        </label>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* 2. CITY-WISE SERVICES */}
      <div className="space-y-6 pt-6">
        <div className="flex justify-between items-end border-b border-gray-200 pb-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-3 text-base">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Calendar size={20}/></div>
                City-wise Services
            </h3>
        </div>

        {hotels.map((hotel, i) => {
            const city = hotel.city;
            const isCabRequired = cab[i]?.required;

            return (
                <div key={i} className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
                    
                    {/* Header: City Name (LOCKED) */}
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                          <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                            <MapPin size={20} className="text-orange-500"/> {city}
                            <Lock size={14} className="text-gray-300" />
                          </h4>
                          
                          <label className="flex items-center gap-3 cursor-pointer select-none bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 hover:border-orange-200 transition-colors">
                            <span className={`text-xs font-bold uppercase tracking-wider ${hotel.bookingStatus === 'Book Later' ? 'text-orange-600' : 'text-slate-400'}`}>
                                {hotel.bookingStatus === 'Book Later' ? 'No Hotel / Book Later' : 'Hotel Required'}
                            </span>
                            <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${hotel.bookingStatus === 'Book Later' ? 'bg-orange-500' : 'bg-slate-300'}`}>
                                <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ${hotel.bookingStatus === 'Book Later' ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                            <input type="checkbox" className="hidden" checked={hotel.bookingStatus === 'Book Later'} onChange={() => handleBookLaterToggle(i)} />
                          </label>
                    </div>

                    {/* HOTEL FORM */}
                    {hotel.bookingStatus === 'Confirmed' ? (
                        <div className="animate-fade-in space-y-6 mb-8">
                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><CheckSquare size={14}/> Hotel Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide ml-1">Hotel Name</label>
                                    <input placeholder="Enter hotel name" value={hotel.hotelName} onChange={(e) => handleHotelChange(i, 'hotelName', e.target.value)} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-500"/>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide ml-1">Check-in</label>
                                    <input type="date" value={hotel.checkIn} onChange={(e) => handleHotelChange(i, 'checkIn', e.target.value)} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-500"/>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide ml-1">Check-out</label>
                                    <input type="date" value={hotel.checkOut} onChange={(e) => handleHotelChange(i, 'checkOut', e.target.value)} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-500"/>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50 p-5 rounded-xl border border-slate-200/60">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide ml-1">Hotel Cost</label>
                                    <div className="relative"><IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input type="number" value={hotel.cost || ''} onChange={(e) => handleHotelChange(i, 'cost', Number(e.target.value))} className="w-full h-11 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-orange-500" placeholder="0"/></div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide ml-1">Agent Fee</label>
                                    <div className="relative"><IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input type="number" value={hotel.agentFee || ''} onChange={(e) => handleHotelChange(i, 'agentFee', Number(e.target.value))} className="w-full h-11 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-orange-500" placeholder="0"/></div>
                                </div>
                                <div className="flex items-end">
                                    <label className={`w-full h-11 rounded-xl text-sm font-bold border-2 border-dashed transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${hotel.bookingFile ? 'bg-green-50 text-green-700 border-green-300' : 'bg-white text-slate-500 border-slate-300 hover:border-orange-400 hover:text-orange-500'}`}>
                                        <input type="file" className="hidden" onChange={(e) => handleHotelChange(i, 'bookingFile', e.target.files?.[0]?.name || 'voucher.pdf')}/>
                                        <Upload size={18}/> {hotel.bookingFile ? 'Booking Attached' : 'Upload Booking'}
                                    </label>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-sm font-medium flex items-center gap-3 mb-8">
                            <Clock size={18} className="shrink-0" /> 
                            <span>Hotel booking skipped/deferred for this location.</span>
                        </div>
                    )}

                    {/* CAB & EXTRAS */}
                    <div className="pt-6 border-t border-dashed border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Car size={14}/> Local Travel & Extras</h5>
                            <button onClick={() => handleCabToggle(i)} className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all border ${isCabRequired ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                                {isCabRequired ? <CheckSquare size={12}/> : <Plus size={12}/>} {isCabRequired ? 'Cab Added' : 'Add Cab'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {isCabRequired ? (
                                <div className="space-y-3 animate-fade-in bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                    <div className="flex justify-between">
                                        <label className="text-xs font-bold text-blue-700 uppercase">Cab Details</label>
                                        <button onClick={() => handleCabToggle(i)} className="text-blue-400 hover:text-blue-600"><X size={12}/></button>
                                    </div>
                                    <input placeholder="Remarks (e.g. Airport Transfer)" value={cab[i]?.remarks || ''} onChange={(e) => handleExpenseChange(i, 'cab', 'remarks', e.target.value)} className="w-full h-10 px-3 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"/>
                                    <div className="flex gap-3">
                                        <div className="relative w-1/2">
                                            <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300"/>
                                            <input type="number" placeholder="Cost" value={cab[i]?.cost || ''} onChange={(e) => handleExpenseChange(i, 'cab', 'cost', Number(e.target.value))} className="w-full h-10 pl-8 pr-3 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"/>
                                        </div>
                                        <input type="number" placeholder="Fee" value={cab[i]?.agentFee || ''} onChange={(e) => handleExpenseChange(i, 'cab', 'agentFee', Number(e.target.value))} className="w-1/2 h-10 px-3 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"/>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center p-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-gray-400 text-sm italic">
                                    No cab required for this city.
                                </div>
                            )}

                            <div className="space-y-3 p-4">
                                <h5 className="text-xs font-bold text-slate-400 uppercase">Other Expenses</h5>
                                <input placeholder="Description (e.g. Food/Laundry)" value={other[i]?.description || ''} onChange={(e) => handleExpenseChange(i, 'other', 'description', e.target.value)} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-pink-500"/>
                                <div className="flex gap-3">
                                    <input type="number" placeholder="Cost" value={other[i]?.cost || ''} onChange={(e) => handleExpenseChange(i, 'other', 'cost', Number(e.target.value))} className="w-1/2 h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-pink-500"/>
                                    <input type="number" placeholder="Fee" value={other[i]?.agentFee || ''} onChange={(e) => handleExpenseChange(i, 'other', 'agentFee', Number(e.target.value))} className="w-1/2 h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-pink-500"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>

      <div className="flex gap-4 pt-8 border-t border-gray-200">
         <button onClick={onCancel} className="flex-1 py-4 border border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-colors">Cancel</button>
         <button onClick={validateAndSubmit} className="flex-[2] py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black shadow-xl hover:shadow-2xl hover:shadow-slate-900/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3">
            <CheckSquare size={20} /> Confirm & Finalize Booking
         </button>
      </div>
    </div>
  );
};

export default BookingCompletionForm;