import React, { useState, useEffect } from 'react';
import toast from "react-hot-toast";
import { ViewState, TravelRequest, User } from '../types';
import { 
  MapPin, 
  ChevronDown, 
  Save, 
  ArrowRight, 
  Briefcase, 
  Repeat, 
  GitMerge, 
  Plus, 
  Trash2,
  Car,
  Calendar,
  Navigation,
  Info,
  Clock,
  CheckCircle2,
  Loader2,
  RotateCcw,
  BedDouble
} from 'lucide-react';

interface CreateRequestProps {
  onNavigate: (view: ViewState) => void;
  onCreate: (req: TravelRequest) => Promise<void>;
  currentUser?: User | null;
}

// Updated Interface to include Hotel
interface TripSegment {
  from: string;
  to: string;
  date: string;
  preferredStartTime: string;
  preferredEndTime: string;
  hotelRequired: boolean;
}

const CreateRequest: React.FC<CreateRequestProps> = ({ onNavigate, onCreate, currentUser }) => {
  // --- UI States ---
  const [tripType, setTripType] = useState<'oneway' | 'return' | 'multicity'>('return');
  const [cabRequired, setCabRequired] = useState(false);
  const [fromLocation, setFromLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Standard Form Data ---
  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    startStartTime: '',
    startEndTime: '',
    endStartTime: '',
    endEndTime: '',
    type: 'Domestic',
    purpose: '',
    preferredFlight: '',
    department: currentUser?.department || 'Engineering',
    flexibleDates: false
  });

  // --- Multi-City Data ---
  const [segments, setSegments] = useState<TripSegment[]>([
    { from: '', to: '', date: '', preferredStartTime: '', preferredEndTime: '', hotelRequired: false },
    { from: '', to: '', date: '', preferredStartTime: '', preferredEndTime: '', hotelRequired: false }
  ]);

  const now = new Date().toISOString().split('T')[0];

  const timeSlots = [
    '12:00 AM','01:00 AM','02:00 AM','03:00 AM','04:00 AM','05:00 AM','06:00 AM',
    '07:00 AM','08:00 AM','09:00 AM','10:00 AM','11:00 AM','12:00 PM','01:00 PM',
    '02:00 PM','03:00 PM','04:00 PM','05:00 PM','06:00 PM','07:00 PM','08:00 PM',
    '09:00 PM','10:00 PM','11:00 PM'
  ];

  // --- DRAFT LOGIC ---
  useEffect(() => {
    const savedDraft = localStorage.getItem('travel_request_draft');
    if (savedDraft) {
        try {
            const parsed = JSON.parse(savedDraft);
            setFormData(parsed.formData);
            // Ensure hotelRequired exists for old drafts
            const patchedSegments = parsed.segments.map((s: any) => ({
                ...s,
                hotelRequired: s.hotelRequired || false
            }));
            setSegments(patchedSegments);
            setTripType(parsed.tripType);
            setFromLocation(parsed.fromLocation);
            setCabRequired(parsed.cabRequired);
            toast.success("Draft restored from last session");
        } catch (e) {
            console.error("Failed to load draft", e);
        }
    }
  }, []);

  const saveDraft = () => {
    const draftData = {
        formData,
        segments,
        tripType,
        fromLocation,
        cabRequired
    };
    localStorage.setItem('travel_request_draft', JSON.stringify(draftData));
    toast.success("Draft saved successfully!");
  };

  const clearDraft = () => {
    if(window.confirm("Are you sure you want to clear the form?")) {
        localStorage.removeItem('travel_request_draft');
        window.location.reload(); 
    }
  }

  // --- Helpers ---
  const convertTo24 = (t: string) => {
    if (!t) return '';
    const [time, mod] = t.split(' ');
    let [h, m] = time.split(':');
    if (mod === 'PM' && h !== '12') h = String(Number(h) + 12);
    if (mod === 'AM' && h === '12') h = '00';
    return `${h}:${m}`;
  };

  const compare = (d1: string, t1: string, d2: string, t2: string) => {
    if (!t1 || !t2) return true; 
    return new Date(`${d1}T${convertTo24(t1)}`) <= new Date(`${d2}T${convertTo24(t2)}`);
  };

  const formatDate = (d: string) => {
    if (!d) return 'Select Date';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getFilteredTimeSlots = (compareTime: string, isSameDay: boolean) => {
    if (!isSameDay || !compareTime) return timeSlots;
    const compare24 = convertTo24(compareTime);
    return timeSlots.filter(slot => convertTo24(slot) > compare24);
  };

  // --- Multi City Logic ---

  // 1. Add Segment with Autofill
  const addSegment = () => {
    const previousDestination = segments[segments.length - 1].to;
    setSegments([
        ...segments, 
        { 
            from: previousDestination, // Autofill Logic
            to: '', 
            date: '', 
            preferredStartTime: '', 
            preferredEndTime: '', 
            hotelRequired: false 
        }
    ]);
  };

  const removeSegment = (index: number) => {
    if (segments.length <= 2) return;
    const newSegments = [...segments];
    newSegments.splice(index, 1);
    setSegments(newSegments);
  };

  // 2. Update Segment with Live Autofill
  const updateSegment = (index: number, field: keyof TripSegment, value: any) => {
    const newSegments = [...segments];
    // @ts-ignore
    newSegments[index][field] = value;

    // Live Autofill: If I change the 'To' of Segment 1, update 'From' of Segment 2
    if (field === 'to' && index < newSegments.length - 1) {
        const nextSegment = newSegments[index + 1];
        if (nextSegment.from === '' || nextSegment.from === segments[index].to) {
            nextSegment.from = value;
        }
    }

    setSegments(newSegments);
  };

  // --- Submit Logic ---
  const submit = async () => {
    if (isSubmitting) return;

    let finalDestination = formData.destination;
    let finalStartDate = formData.startDate;
    let finalEndDate = formData.endDate;
    let finalStartTime = `${formData.startStartTime || ""} - ${formData.startEndTime || ""}`;
    let finalEndTime = `${formData.endStartTime || ""} - ${formData.endEndTime || ""}`;
    let notesBuilder = formData.flexibleDates ? "User has indicated dates are flexible (+/- 2 days). " : "";

    // 1. One Way
    if (tripType === 'oneway') {
      if (!fromLocation) { toast.error("Please enter a departure location (From)"); return; }
      if (!formData.destination) { toast.error("Please enter a destination (To)"); return; }
      if (!formData.startDate) { toast.error("Please select a date"); return; }
      
      if (!compare(formData.startDate, formData.startStartTime, formData.startDate, formData.startEndTime)) {
        toast.error("Invalid time range"); return;
      }

      notesBuilder += `\nOrigin: ${fromLocation}`;
      finalEndDate = formData.startDate;
      finalEndTime = ""; 
    }

    // 2. Return
    else if (tripType === 'return') {
      if (!fromLocation) { toast.error("Please enter a departure location (From)"); return; }
      if (!formData.destination) { toast.error("Please enter a destination (To)"); return; }
      if (!formData.startDate) { toast.error("Please select a start date"); return; }
      if (!formData.endDate) { toast.error("Please select an end date"); return; }

      if (!compare(formData.startDate, formData.startStartTime, formData.startDate, formData.startEndTime)) {
        toast.error("Invalid start time range"); return;
      }
      if (!compare(formData.endDate, formData.endStartTime, formData.endDate, formData.endEndTime)) {
        toast.error("Invalid return time range"); return;
      }
      if (formData.startDate === formData.endDate) {
         if (formData.startStartTime && formData.endStartTime) {
             if (convertTo24(formData.endStartTime) <= convertTo24(formData.startStartTime)) {
                 toast.error("For same-day travel, Return time cannot be before Start time.");
                 return;
             }
         }
      }
      if (!compare(formData.startDate, formData.startEndTime, formData.endDate, formData.endStartTime)) {
        toast.error("End date cannot be earlier than start date"); return;
      }

      notesBuilder += `\nOrigin: ${fromLocation}`;
    }

    // 3. Multi City
    else if (tripType === 'multicity') {
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (!seg.from || !seg.to || !seg.date) {
          toast.error(`Please complete all fields for Trip Segment ${i + 1}`); return;
        }
        if (!compare(seg.date, seg.preferredStartTime, seg.date, seg.preferredEndTime)) {
          toast.error(`Invalid time range in Segment ${i + 1}`); return;
        }
        if (i > 0) {
          const prev = segments[i-1];
          if (new Date(seg.date) < new Date(prev.date)) {
            toast.error(`Segment ${i + 1} date cannot be before Segment ${i}`); return;
          }
        }
      }

      finalDestination = `Multi City Trip`; 
      finalStartDate = segments[0].date;
      finalEndDate = segments[segments.length - 1].date;
      finalStartTime = segments[0].preferredStartTime;
      finalEndTime = segments[segments.length - 1].preferredEndTime;

      let multiCityDetails = "\nMulti City Itinerary:\n";
      segments.forEach((seg, idx) => {
        const hotelNote = seg.hotelRequired ? " [Hotel Required]" : "";
        multiCityDetails += `${idx + 1}. ${seg.from} -> ${seg.to} | ${seg.date} | ${seg.preferredStartTime || 'Any'} - ${seg.preferredEndTime || 'Any'}${hotelNote}\n`;
      });
      notesBuilder += multiCityDetails;
    }

    if (cabRequired) {
      notesBuilder += "\n[!] Cab Required for entire trip.";
    }

    if (formData.purpose) {
        notesBuilder += `\nPurpose: ${formData.purpose}`;
    }

    const newRequest: TravelRequest = {
      // Backend will generate ID
      destination: finalDestination,
      startDate: finalStartDate,
      endDate: finalEndDate,
      startTime: finalStartTime,
      endTime: finalEndTime,
      status: "Pending Manager",
      amount: 0,
      employeeName: currentUser?.name || "Unknown User",
      employeeAvatar: currentUser?.avatar,
      department: formData.department,
      type: formData.type as "Domestic" | "International",
      submittedDate: new Date().toISOString(), 
      agentNotes: notesBuilder,
      preferredFlight: formData.preferredFlight,
    };

    try {
        setIsSubmitting(true);
        await onCreate(newRequest);
        localStorage.removeItem('travel_request_draft');
    } catch (error) {
        toast.error("Failed to submit request");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-20">
      <datalist id="indian-cities">
        <option value="Agra, Uttar Pradesh" />
        <option value="Ahmedabad, Gujarat" />
        <option value="Aizawl, Mizoram" />
        <option value="Ajmer, Rajasthan" />
        <option value="Aligarh, Uttar Pradesh" />
        <option value="Allahabad (Prayagraj), Uttar Pradesh" />
        <option value="Ambala, Haryana" />
        <option value="Amritsar, Punjab" />
        <option value="Aurangabad, Maharashtra" />
        <option value="Bareilly, Uttar Pradesh" />
        <option value="Belagavi, Karnataka" />
        <option value="Bengaluru, Karnataka" />
        <option value="Bhavnagar, Gujarat" />
        <option value="Bhilai, Chhattisgarh" />
        <option value="Bhopal, Madhya Pradesh" />
        <option value="Bhubaneswar, Odisha" />
        <option value="Bikaner, Rajasthan" />
        <option value="Chandigarh" />
        <option value="Chennai, Tamil Nadu" />
        <option value="Coimbatore, Tamil Nadu" />
        <option value="Cuttack, Odisha" />
        <option value="Dehradun, Uttarakhand" />
        <option value="Delhi, Delhi" />
        <option value="Dhanbad, Jharkhand" />
        <option value="Durgapur, West Bengal" />
        <option value="Faridabad, Haryana" />
        <option value="Gandhinagar, Gujarat" />
        <option value="Gangtok, Sikkim" />
        <option value="Ghaziabad, Uttar Pradesh" />
        <option value="Goa (Panaji)" />
        <option value="Gorakhpur, Uttar Pradesh" />
        <option value="Gurugram, Haryana" />
        <option value="Guwahati, Assam" />
        <option value="Gwalior, Madhya Pradesh" />
        <option value="Hubballi-Dharwad, Karnataka" />
        <option value="Hyderabad, Telangana" />
        <option value="Imphal, Manipur" />
        <option value="Indore, Madhya Pradesh" />
        <option value="Itanagar, Arunachal Pradesh" />
        <option value="Jabalpur, Madhya Pradesh" />
        <option value="Jaipur, Rajasthan" />
        <option value="Jalandhar, Punjab" />
        <option value="Jammu, Jammu & Kashmir" />
        <option value="Jamnagar, Gujarat" />
        <option value="Jamshedpur, Jharkhand" />
        <option value="Jodhpur, Rajasthan" />
        <option value="Kanpur, Uttar Pradesh" />
        <option value="Kochi, Kerala" />
        <option value="Kohima, Nagaland" />
        <option value="Kolhapur, Maharashtra" />
        <option value="Kolkata, West Bengal" />
        <option value="Kota, Rajasthan" />
        <option value="Kozhikode, Kerala" />
        <option value="Lucknow, Uttar Pradesh" />
        <option value="Ludhiana, Punjab" />
        <option value="Madurai, Tamil Nadu" />
        <option value="Mangaluru, Karnataka" />
        <option value="Meerut, Uttar Pradesh" />
        <option value="Mumbai, Maharashtra" />
        <option value="Mysuru, Karnataka" />
        <option value="Nagpur, Maharashtra" />
        <option value="Nashik, Maharashtra" />
        <option value="Navi Mumbai, Maharashtra" />
        <option value="Noida, Uttar Pradesh" />
        <option value="Patna, Bihar" />
        <option value="Pondicherry" />
        <option value="Port Blair, Andaman" />
        <option value="Pune, Maharashtra" />
        <option value="Raipur, Chhattisgarh" />
        <option value="Rajkot, Gujarat" />
        <option value="Ranchi, Jharkhand" />
        <option value="Rourkela, Odisha" />
        <option value="Salem, Tamil Nadu" />
        <option value="Shillong, Meghalaya" />
        <option value="Shimla, Himachal Pradesh" />
        <option value="Siliguri, West Bengal" />
        <option value="Solapur, Maharashtra" />
        <option value="Srinagar, Jammu & Kashmir" />
        <option value="Surat, Gujarat" />
        <option value="Thiruvananthapuram, Kerala" />
        <option value="Tiruchirappalli, Tamil Nadu" />
        <option value="Tirupati, Andhra Pradesh" />
        <option value="Udaipur, Rajasthan" />
        <option value="Ujjain, Madhya Pradesh" />
        <option value="Vadodara, Gujarat" />
        <option value="Varanasi, Uttar Pradesh" />
        <option value="Vijayawada, Andhra Pradesh" />
        <option value="Visakhapatnam, Andhra Pradesh" />
        <option value="Warangal, Telangana" />
      </datalist>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <span className="hover:text-gray-900 cursor-pointer transition-colors" onClick={() => onNavigate(ViewState.EMPLOYEE_DASHBOARD)}>Home</span>
          <span className="mx-2 text-gray-300">/</span>
          <span className="hover:text-gray-900 cursor-pointer transition-colors">Requests</span>
          <span className="mx-2 text-gray-300">/</span>
          <span className="text-primary-600 font-medium">New Trip</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Create Request</h1>
            <p className="text-gray-500 mt-2 text-lg">Plan your next business trip</p>
          </div>
          
          {/* Trip Type Toggle */}
          <div className="bg-gray-100 p-1.5 rounded-full flex items-center shadow-inner">
            <button
              onClick={() => setTripType('oneway')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all duration-300 ${tripType === 'oneway' ? 'bg-white text-primary-600 shadow-md ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Briefcase size={16} /> One Way
            </button>
            <button
              onClick={() => setTripType('return')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all duration-300 ${tripType === 'return' ? 'bg-white text-primary-600 shadow-md ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Repeat size={16} /> Return
            </button>
            <button
              onClick={() => setTripType('multicity')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all duration-300 ${tripType === 'multicity' ? 'bg-white text-primary-600 shadow-md ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <GitMerge size={16} /> Multi City
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* --- LEFT: FORM --- */}
        <div className="xl:col-span-8 space-y-8">
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-100 border border-white space-y-8">
            
            {/* MULTI CITY */}
            {tripType === 'multicity' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-primary-50 p-2 rounded-lg text-primary-600">
                    <GitMerge size={20} />
                  </span>
                  <h3 className="text-lg font-bold text-gray-900">Itinerary Segments</h3>
                </div>
                
                {segments.map((seg, idx) => (
                  <div key={idx} className="bg-gray-50/50 border border-gray-100 rounded-2xl p-6 relative group hover:border-primary-200 hover:bg-white hover:shadow-lg transition-all duration-300">
                    <div className="absolute -left-3 top-6 bg-gray-900 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white">
                      {idx + 1}
                    </div>
                    {idx > 1 && (
                      <button 
                        onClick={() => removeSegment(idx)}
                        className="absolute -right-2 -top-2 bg-white text-gray-400 hover:text-red-500 p-2 rounded-full shadow-md border border-gray-100 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">From</label>
                        <div className="relative group/input">
                           <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-primary-500 transition-colors" size={18} />
                           <input
                            type="text"
                            list="indian-cities"
                            placeholder="Origin City"
                            value={seg.from}
                            onChange={(e) => updateSegment(idx, 'from', e.target.value)}
                            className="w-full bg-white border-0 ring-1 ring-gray-200 rounded-xl pl-11 pr-4 py-3.5 focus:ring-2 focus:ring-primary-500 text-gray-900 font-medium placeholder-gray-400 transition-all shadow-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">To</label>
                          <div className="relative group/input">
                           <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-primary-500 transition-colors" size={18} />
                           <input
                            type="text"
                            list="indian-cities"
                            placeholder="Destination City"
                            value={seg.to}
                            onChange={(e) => updateSegment(idx, 'to', e.target.value)}
                            className="w-full bg-white border-0 ring-1 ring-gray-200 rounded-xl pl-11 pr-4 py-3.5 focus:ring-2 focus:ring-primary-500 text-gray-900 font-medium placeholder-gray-400 transition-all shadow-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">Date</label>
                        <input
                          type="date"
                          min={idx === 0 ? now : segments[idx-1].date}
                          value={seg.date}
                          onChange={(e) => updateSegment(idx, 'date', e.target.value)}
                          className="w-full bg-white border-0 ring-1 ring-gray-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary-500 text-gray-900 font-medium shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">Start Time</label>
                        <div className="relative">
                          <select
                            value={seg.preferredStartTime}
                            onChange={(e) => updateSegment(idx, 'preferredStartTime', e.target.value)}
                            className="w-full bg-white border-0 ring-1 ring-gray-200 rounded-xl pl-4 pr-10 py-3.5 text-sm appearance-none focus:ring-2 focus:ring-primary-500 text-gray-900 shadow-sm font-medium"
                          >
                            <option value="">Any Time</option>
                            {timeSlots.map(t => <option key={t}>{t}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">End Time</label>
                        <div className="relative">
                          <select
                            value={seg.preferredEndTime}
                            onChange={(e) => updateSegment(idx, 'preferredEndTime', e.target.value)}
                            className="w-full bg-white border-0 ring-1 ring-gray-200 rounded-xl pl-4 pr-10 py-3.5 text-sm appearance-none focus:ring-2 focus:ring-primary-500 text-gray-900 shadow-sm font-medium"
                          >
                            <option value="">Any Time</option>
                            {timeSlots.map(t => <option key={t}>{t}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        </div>
                      </div>
                    </div>

                    {/* HOTEL CHECKBOX FOR SEGMENT */}
                    <div className="pt-4 border-t border-gray-200/60">
                         <label 
                            className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all cursor-pointer ${seg.hotelRequired ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                          >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${seg.hotelRequired ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'}`}>
                              {seg.hotelRequired && <div className="w-2 h-2 bg-white rounded-sm" />}
                            </div>
                            <input 
                              type="checkbox" 
                              className="hidden"
                              checked={seg.hotelRequired}
                              onChange={(e) => updateSegment(idx, 'hotelRequired', e.target.checked)}
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                                  <BedDouble size={18} className={seg.hotelRequired ? 'text-indigo-600' : 'text-gray-400'} /> 
                                  Stay Required
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">Need accommodation in {seg.to || 'this city'}?</p>
                            </div>
                          </label>
                    </div>

                  </div>
                ))}
                
                <button
                  onClick={addSegment}
                  className="w-full group border-2 border-dashed border-gray-200 rounded-2xl py-4 flex items-center justify-center text-sm font-bold text-gray-500 hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-600 transition-all gap-2"
                >
                  <Plus size={16} className="text-gray-400 group-hover:text-primary-500"/> Add Another Segment
                </button>
              </div>
            )}

            {/* ONE WAY / RETURN */}
            {(tripType === 'oneway' || tripType === 'return') && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {/* From Field */}
                  <div className="relative group z-10">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block tracking-wide">From</label>
                    <div className="relative transition-transform duration-200 origin-bottom-left group-focus-within:scale-[1.01]">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                      <input
                        type="text"
                        list="indian-cities"
                        value={fromLocation}
                        onChange={(e) => setFromLocation(e.target.value)}
                        className="w-full bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-primary-500 focus:bg-white text-gray-900 font-semibold text-lg placeholder-gray-400 transition-all shadow-sm"
                        placeholder="Origin City"
                      />
                    </div>
                  </div>

                  {/* To Field */}
                  <div className="relative group z-10">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block tracking-wide">To</label>
                    <div className="relative transition-transform duration-200 origin-bottom-left group-focus-within:scale-[1.01]">
                      <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                      <input
                        type="text"
                        list="indian-cities"
                        value={formData.destination}
                        onChange={(e) => setFormData({...formData, destination: e.target.value})}
                        className="w-full bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-primary-500 focus:bg-white text-gray-900 font-semibold text-lg placeholder-gray-400 transition-all shadow-sm"
                        placeholder="Destination City"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100 w-full"></div>

                {/* Onward Journey */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-blue-50 p-2 rounded-lg text-blue-600">
                      <Calendar size={20} />
                    </span>
                    <h3 className="text-lg font-bold text-gray-900">
                      {tripType === 'oneway' ? 'Travel Schedule' : 'Onward Journey'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4">
                      <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">Date</label>
                      <input
                        type="date"
                        min={now}
                        value={formData.startDate}
                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                        className="w-full bg-gray-50 border-0 ring-1 ring-gray-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary-500 focus:bg-white text-gray-900 font-medium transition-all"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">Pref. Start Time</label>
                      <div className="relative">
                        <select
                          value={formData.startStartTime}
                          onChange={(e) => setFormData({...formData, startStartTime: e.target.value})}
                          className="w-full bg-gray-50 border-0 ring-1 ring-gray-200 rounded-xl pl-4 pr-10 py-3.5 appearance-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-gray-900 font-medium transition-all"
                        >
                          <option value="">Any Time</option>
                          {timeSlots.map(t => <option key={t}>{t}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      </div>
                    </div>
                    <div className="md:col-span-4">
                      <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">Pref. End Time</label>
                      <div className="relative">
                        <select
                          value={formData.startEndTime}
                          onChange={(e) => setFormData({...formData, startEndTime: e.target.value})}
                          className="w-full bg-gray-50 border-0 ring-1 ring-gray-200 rounded-xl pl-4 pr-10 py-3.5 appearance-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-gray-900 font-medium transition-all"
                        >
                          <option value="">Any Time</option>
                          {timeSlots.map(t => <option key={t}>{t}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Return Journey */}
                {tripType === 'return' && (
                  <div className="animate-fade-in-up">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="bg-teal-50 p-2 rounded-lg text-teal-600">
                        <Repeat size={20} />
                      </span>
                      <h3 className="text-lg font-bold text-gray-900">Return Journey</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-4">
                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">Date</label>
                        <input
                          type="date"
                          min={formData.startDate || now}
                          value={formData.endDate}
                          onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                          className="w-full bg-gray-50 border-0 ring-1 ring-gray-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary-500 focus:bg-white text-gray-900 font-medium transition-all"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">Pref. Start Time</label>
                        <div className="relative">
                          {/* SMART FILTERING APPLIED HERE */}
                          <select
                            value={formData.endStartTime}
                            onChange={(e) => setFormData({...formData, endStartTime: e.target.value})}
                            className="w-full bg-gray-50 border-0 ring-1 ring-gray-200 rounded-xl pl-4 pr-10 py-3.5 appearance-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-gray-900 font-medium transition-all"
                          >
                            <option value="">Any Time</option>
                            {getFilteredTimeSlots(
                                formData.startStartTime, 
                                formData.startDate === formData.endDate
                            ).map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        </div>
                      </div>
                      <div className="md:col-span-4">
                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">Pref. End Time</label>
                        <div className="relative">
                          <select
                            value={formData.endEndTime}
                            onChange={(e) => setFormData({...formData, endEndTime: e.target.value})}
                            className="w-full bg-gray-50 border-0 ring-1 ring-gray-200 rounded-xl pl-4 pr-10 py-3.5 appearance-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-gray-900 font-medium transition-all"
                          >
                            <option value="">Any Time</option>
                            {timeSlots.map(t => <option key={t}>{t}</option>)}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Common Extras */}
            <div className="pt-4 border-t border-gray-100">
               <label 
                className={`flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer mb-6 ${cabRequired ? 'bg-primary-50 border-primary-200 shadow-sm' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
              >
                <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${cabRequired ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-300'}`}>
                  {cabRequired && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={cabRequired}
                  onChange={(e) => setCabRequired(e.target.checked)}
                />
                <div className="flex-1">
                    <div className="flex items-center gap-2 font-bold text-gray-900">
                      <Car size={18} className={cabRequired ? 'text-primary-600' : 'text-gray-400'} /> 
                      Cab Required
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">Include if you require a full day cab service</p>
                </div>
              </label>

              <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">Purpose of Travel</label>
              <textarea
                rows={3}
                value={formData.purpose}
                onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                className="w-full bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl p-4 focus:ring-2 focus:ring-primary-500 focus:bg-white text-gray-900 resize-none transition-all"
                placeholder="Describe the business purpose..."
              ></textarea>
            </div>
            
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">
                Special Instructions
              </label>
              <textarea
                rows={2}
                value={formData.preferredFlight}
                onChange={(e) =>
                  setFormData({ ...formData, preferredFlight: e.target.value })
                }
                className="w-full bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl p-4 focus:ring-2 focus:ring-primary-500 focus:bg-white text-gray-900 resize-none transition-all"
                placeholder="E.g. Flight preferred, or Train..."
              ></textarea>
            </div>

          </div>
        </div>

        {/* --- RIGHT: SUMMARY & ACTIONS --- */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Detailed Summary Card */}
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-100 border border-white sticky top-6">
             <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 pb-4 border-b border-gray-50">
               <Info size={18} className="text-primary-600"/> Request Summary
             </h3>
             <div className="space-y-6">
                
                {/* 1. Trip Type */}
                <div className="flex items-start gap-3">
                   <div className="mt-0.5 bg-gray-100 p-1.5 rounded-lg"><Briefcase size={16} className="text-gray-500"/></div>
                   <div>
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Trip Type</p>
                      <p className="text-gray-900 font-bold capitalize">{tripType === 'multicity' ? 'Multi-City' : tripType + ' Trip'}</p>
                   </div>
                </div>

                {/* 2. Route (Dynamic) */}
                {tripType !== 'multicity' ? (
                   (fromLocation || formData.destination) && (
                     <div className="flex items-start gap-3 animate-fade-in">
                       <div className="mt-0.5 bg-gray-100 p-1.5 rounded-lg"><MapPin size={16} className="text-gray-500"/></div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Route</p>
                          <p className="text-gray-900 font-semibold text-sm leading-relaxed">
                             {fromLocation || 'Origin'} <span className="text-gray-400 mx-1">to</span> {formData.destination || 'Destination'}
                          </p>
                        </div>
                     </div>
                   )
                ) : (
                    <div className="flex items-start gap-3 animate-fade-in">
                       <div className="mt-0.5 bg-gray-100 p-1.5 rounded-lg"><GitMerge size={16} className="text-gray-500"/></div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Itinerary</p>
                          <p className="text-gray-900 font-semibold text-sm">
                             {segments.length} Cities planned
                          </p>
                        </div>
                     </div>
                )}

                {/* 3. Dates & Time (Dynamic) */}
                {tripType !== 'multicity' && formData.startDate && (
                   <div className="flex items-start gap-3 animate-fade-in">
                     <div className="mt-0.5 bg-gray-100 p-1.5 rounded-lg"><Calendar size={16} className="text-gray-500"/></div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Schedule</p>
                        <p className="text-gray-900 font-semibold text-sm">
                           {formatDate(formData.startDate)}
                           {tripType === 'return' && formData.endDate && ` — ${formatDate(formData.endDate)}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Clock size={10} /> {formData.startStartTime || 'Any'} {tripType === 'return' ? ' (Onward)' : ''}
                        </p>
                        {tripType === 'return' && formData.endStartTime && (
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <Clock size={10} /> {formData.endStartTime} (Return)
                          </p>
                        )}
                      </div>
                   </div>
                )}
                {/* Multi City Dates */}
                {tripType === 'multicity' && segments[0].date && (
                   <div className="flex items-start gap-3 animate-fade-in">
                     <div className="mt-0.5 bg-gray-100 p-1.5 rounded-lg"><Calendar size={16} className="text-gray-500"/></div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Date Range</p>
                        <p className="text-gray-900 font-semibold text-sm">
                           {formatDate(segments[0].date)} — {formatDate(segments[segments.length-1].date)}
                        </p>
                      </div>
                   </div>
                )}

                {/* 4. Add-ons */}
                {cabRequired && (
                   <div className="flex items-start gap-3 animate-fade-in pt-4 border-t border-gray-50">
                     <div className="mt-0.5 bg-green-50 p-1.5 rounded-lg"><CheckCircle2 size={16} className="text-green-600"/></div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Add-ons</p>
                        <p className="text-gray-900 font-semibold text-sm">Cab Requested</p>
                      </div>
                   </div>
                )}

             </div>

             {/* Action Buttons */}
             <div className="mt-8 space-y-4">
                <button 
                  onClick={submit}
                  disabled={isSubmitting}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : <>Submit Request <ArrowRight size={20} /></>}
                </button>
                <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={saveDraft}
                      className="w-full bg-white hover:bg-gray-50 text-gray-600 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 border border-gray-100 shadow-sm transition-all duration-200"
                    >
                      Save Draft <Save size={16} />
                    </button>
                    <button 
                      onClick={clearDraft}
                      className="w-full bg-white hover:bg-red-50 text-red-400 hover:text-red-500 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 border border-gray-100 shadow-sm transition-all duration-200"
                    >
                      Clear <RotateCcw size={16} />
                    </button>
                </div>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CreateRequest;