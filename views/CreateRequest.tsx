import React, { useState } from 'react';
import toast from "react-hot-toast";
import { ViewState, TravelRequest, User } from '../types';
import { Calendar, MapPin, Building, ChevronDown, Save, ArrowRight, DollarSign, Clock, CalendarCheck } from 'lucide-react';

interface CreateRequestProps {
  onNavigate: (view: ViewState) => void;
  onCreate: (req: TravelRequest) => void;
  currentUser?: User | null;
}

const CreateRequest: React.FC<CreateRequestProps> = ({ onNavigate, onCreate, currentUser }) => {
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

  const now = new Date().toISOString().split('T')[0];

  const timeSlots = [
    '12:00 AM','01:00 AM','02:00 AM','03:00 AM','04:00 AM','05:00 AM','06:00 AM',
    '07:00 AM','08:00 AM','09:00 AM','10:00 AM','11:00 AM','12:00 PM','01:00 PM',
    '02:00 PM','03:00 PM','04:00 PM','05:00 PM','06:00 PM','07:00 PM','08:00 PM',
    '09:00 PM','10:00 PM','11:00 PM'
  ];

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

  const submit = () => {
  if (!formData.destination) {
    toast.error("Please enter a destination");
    return;
  }
  if (!formData.startDate) {
    toast.error("Please select a start date");
    return;
  }
  if (!formData.endDate) {
    toast.error("Please select an end date");
    return;
  }

  if (!compare(formData.startDate, formData.startStartTime, formData.startDate, formData.startEndTime)) {
    toast.error("Invalid start time range");
    return;
  }
  if (!compare(formData.endDate, formData.endStartTime, formData.endDate, formData.endEndTime)) {
    toast.error("Invalid end time range");
    return;
  }
  if (!compare(formData.startDate, formData.startEndTime, formData.endDate, formData.endStartTime)) {
    toast.error("End time cannot be earlier than start time");
    return;
  }

  const newRequest: TravelRequest = {
    id: "",
    destination: formData.destination,
    startDate: formData.startDate,
    endDate: formData.endDate,
    startTime: `${formData.startStartTime || ""} - ${formData.startEndTime || ""}`,
    endTime: `${formData.endStartTime || ""} - ${formData.endEndTime || ""}`,
    status: "Pending Manager",
    amount: 0,
    employeeName: currentUser?.name || "Unknown User",
    employeeAvatar: currentUser?.avatar,
    department: formData.department,
    type: formData.type as "Domestic" | "International",
    submittedDate: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    agentNotes: formData.flexibleDates ? "User has indicated dates are flexible (+/- 2 days)" : "",
    preferredFlight: formData.preferredFlight,
  };

  onCreate(newRequest);
  toast.success("Travel request submitted");
};

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-12">
      <div className="mb-8">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <span className="hover:text-gray-900 cursor-pointer" onClick={() => onNavigate(ViewState.EMPLOYEE_DASHBOARD)}>Home</span>
          <span className="mx-2">/</span>
          <span className="hover:text-gray-900 cursor-pointer">Requests</span>
          <span className="mx-2">/</span>
          <span className="text-primary-600 font-medium">Create</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Create Travel Request</h1>
        <p className="text-gray-500 mt-2">Fill in your travel details.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-8">

            {/* Destination */}
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase mb-2 block">Destination</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="text"
                  list = "indian-cities"
                  value={formData.destination}
                  onChange={(e) => setFormData({...formData, destination: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary-500 text-gray-900"
                  placeholder="e.g. Bengaluru HQ"
                />
                <datalist id="indian-cities">
    <option value="Agartala, Tripura" />
    <option value="Agra, Uttar Pradesh" />
    <option value="Ahmedabad, Gujarat" />
    <option value="Aizawl, Mizoram" />
    <option value="Ajmer (Kishangarh), Rajasthan" />
    <option value="Akola, Maharashtra" />
    <option value="Allahabad (Prayagraj), Uttar Pradesh" />
    <option value="Amritsar, Punjab" />
    <option value="Aurangabad, Maharashtra" />
    <option value="Bagdogra, West Bengal" />
    <option value="Balurghat, West Bengal" />
    <option value="Bengaluru, Karnataka" />
    <option value="Bareilly, Uttar Pradesh" />
    <option value="Belagavi, Karnataka" />
    <option value="Bellary, Karnataka" />
    <option value="Bhavnagar, Gujarat" />
    <option value="Bhopal, Madhya Pradesh" />
    <option value="Bhubaneswar, Odisha" />
    <option value="Bhuj, Gujarat" />
    <option value="Bidar, Karnataka" />
    <option value="Bikaner, Rajasthan" />
    <option value="Bilaspur, Chhattisgarh" />
    <option value="Chandigarh, Chandigarh" />
    <option value="Chennai, Tamil Nadu" />
    <option value="Coimbatore, Tamil Nadu" />
    <option value="Cooch Behar, West Bengal" />
    <option value="Daman, Dadra & Nagar Haveli and Daman & Diu" />
    <option value="Dehradun, Uttarakhand" />
    <option value="Delhi, Delhi" />
    <option value="Deoghar, Jharkhand" />
    <option value="Dharamshala (Gaggal), Himachal Pradesh" />
    <option value="Dibrugarh, Assam" />
    <option value="Dimapur, Nagaland" />
    <option value="Diu, Dadra & Nagar Haveli and Daman & Diu" />
    <option value="Durgapur, West Bengal" />
    <option value="Gaya, Bihar" />
    <option value="Goa (Dabolim), Goa" />
    <option value="Goa (Mopa), Goa" />
    <option value="Gondia, Maharashtra" />
    <option value="Gorakhpur, Uttar Pradesh" />
    <option value="Guwahati, Assam" />
    <option value="Hubballi, Karnataka" />
    <option value="Hyderabad, Telangana" />
    <option value="Imphal, Manipur" />
    <option value="Indore, Madhya Pradesh" />
    <option value="Jabalpur, Madhya Pradesh" />
    <option value="Jaipur, Rajasthan" />
    <option value="Jaisalmer, Rajasthan" />
    <option value="Jammu, Jammu & Kashmir" />
    <option value="Jamnagar, Gujarat" />
    <option value="Jodhpur, Rajasthan" />
    <option value="Jorhat, Assam" />
    <option value="Kadapa, Andhra Pradesh" />
    <option value="Kangra, Himachal Pradesh" />
    <option value="Kannur, Kerala" />
    <option value="Kanpur, Uttar Pradesh" />
    <option value="Kochi, Kerala" />
    <option value="Kolhapur, Maharashtra" />
    <option value="Kolkata, West Bengal" />
    <option value="Kozhikode, Kerala" />
    <option value="Kullu, Himachal Pradesh" />
    <option value="Leh, Ladakh" />
    <option value="Lilabari, Assam" />
    <option value="Lucknow, Uttar Pradesh" />
    <option value="Ludhiana, Punjab" />
    <option value="Madurai, Tamil Nadu" />
    <option value="Mangaluru, Karnataka" />
    <option value="Mumbai, Maharashtra" />
    <option value="Mysuru, Karnataka" />
    <option value="Nagpur, Maharashtra" />
    <option value="Nanded, Maharashtra" />
    <option value="Nashik, Maharashtra" />
    <option value="Patna, Bihar" />
    <option value="Port Blair, Andaman & Nicobar Islands" />
    <option value="Pune, Maharashtra" />
    <option value="Raipur, Chhattisgarh" />
    <option value="Rajahmundry, Andhra Pradesh" />
    <option value="Rajkot, Gujarat" />
    <option value="Ranchi, Jharkhand" />
    <option value="Shirdi, Maharashtra" />
    <option value="Shillong, Meghalaya" />
    <option value="Silchar, Assam" />
    <option value="Srinagar, Jammu & Kashmir" />
    <option value="Surat, Gujarat" />
    <option value="Thiruvananthapuram, Kerala" />
    <option value="Tiruchirappalli, Tamil Nadu" />
    <option value="Tirupati, Andhra Pradesh" />
    <option value="Trichy, Tamil Nadu" />
    <option value="Udaipur, Rajasthan" />
    <option value="Vadodara, Gujarat" />
    <option value="Varanasi, Uttar Pradesh" />
    <option value="Vijayawada, Andhra Pradesh" />
    <option value="Visakhapatnam, Andhra Pradesh" />
</datalist>

              </div>
            </div>

            {/* Start Date Section */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase">Start Date</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Start Date */}
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase mb-2 block">Date</label>
                  <input
                    type="date"
                    min={now}
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary-500 text-gray-900"
                  />
                </div>

                {/* Departure Start Time */}
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase mb-2 block">Departure Start Time</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <select
                      value={formData.startStartTime}
                      onChange={(e) => setFormData({...formData, startStartTime: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-10 py-3.5 appearance-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                    >
                      <option value="">Select Time</option>
                      {timeSlots.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  </div>
                </div>

              </div>

              {/* Departure End Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div></div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase mb-2 block">Departure End Time</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <select
                      value={formData.startEndTime}
                      onChange={(e) => setFormData({...formData, startEndTime: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-10 py-3.5 appearance-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                    >
                      <option value="">Select Time</option>
                      {timeSlots.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  </div>
                </div>
              </div>
            </div>

            {/* End Date Section */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase">End Date</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* End Date */}
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase mb-2 block">Date</label>
                  <input
                    type="date"
                    min={formData.startDate || now}
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary-500 text-gray-900"
                  />
                </div>

                {/* Return Start Time */}
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase mb-2 block">Return Start Time</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <select
                      value={formData.endStartTime}
                      onChange={(e) => setFormData({...formData, endStartTime: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-10 py-3.5 appearance-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                    >
                      <option value="">Select Time</option>
                      {timeSlots.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  </div>
                </div>

              </div>

              {/* Return End Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div></div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase mb-2 block">Return End Time</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <select
                      value={formData.endEndTime}
                      onChange={(e) => setFormData({...formData, endEndTime: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-10 py-3.5 appearance-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                    >
                      <option value="">Select Time</option>
                      {timeSlots.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  </div>
                </div>
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase mb-2 block">Purpose of Travel</label>
              <textarea
                rows={4}
                value={formData.purpose}
                onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-primary-500 text-gray-900 resize-none"
                placeholder="Describe the business purpose..."
              ></textarea>
            </div>
            {/* Preferred Flight (Optional) */}
<div>
  <label className="text-xs font-bold text-gray-700 uppercase mb-2 block">
    Preferred Flight/Other Mode of Travel (Optional)
  </label>
  <textarea
    rows={3}
    value={formData.preferredFlight}
    onChange={(e) =>
      setFormData({ ...formData, preferredFlight: e.target.value })
    }
    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-primary-500 text-gray-900 resize-none"
    placeholder="Enter preferred airline, flight number or timing (if any)..."
  ></textarea>
</div>


          </div>
        </div>

        {/* Submit */}
        <div className="space-y-6">
          <button
            onClick={submit}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2"
          >
            Submit Request <ArrowRight size={18} />
          </button>
          <button
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2"
          >
            Save Draft <Save size={16} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreateRequest;
