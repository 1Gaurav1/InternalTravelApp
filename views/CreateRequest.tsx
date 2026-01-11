
import React, { useState } from 'react';
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
    startTime: '',
    endTime: '',
    type: 'Domestic',
    purpose: '',
    department: currentUser?.department || 'Engineering',
    flexibleDates: false
  });

  const timeSlots = [
    '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', 
    '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
    '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'
  ];

  const handleSubmit = () => {
    if(!formData.destination || !formData.startDate) return;

    const newRequest: TravelRequest = {
      id: `TR-${Math.floor(Math.random() * 10000)}`,
      destination: formData.destination,
      startDate: formData.startDate,
      endDate: formData.endDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      status: 'Pending Manager',
      amount: 0,
      employeeName: currentUser?.name || 'Unknown User',
      employeeAvatar: currentUser?.avatar,
      department: formData.department,
      type: formData.type as 'Domestic' | 'International',
      submittedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      agentNotes: formData.flexibleDates ? 'User has indicated dates are flexible (+/- 2 days)' : ''
    };
    onCreate(newRequest);
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-12">
      <div className="mb-8">
        <div className="flex flex-wrap items-center text-sm text-gray-500 mb-2">
           <span className="hover:text-gray-900 cursor-pointer" onClick={() => onNavigate(ViewState.EMPLOYEE_DASHBOARD)}>Home</span>
           <span className="mx-2">/</span>
           <span className="hover:text-gray-900 cursor-pointer">Requests</span>
           <span className="mx-2">/</span>
           <span className="text-primary-600 font-medium">Create</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Create Travel Request</h1>
        <p className="text-gray-500 mt-2">Fill in the details for your upcoming business trip.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Destination</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  <input 
                    type="text" 
                    list="indian-cities"
                    value={formData.destination}
                    onChange={(e) => setFormData({...formData, destination: e.target.value})}
                    className="w-full bg-gray-50 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-gray-900 font-medium placeholder-gray-400"
                    placeholder="e.g. Bengaluru HQ"
                  />
                  <datalist id="indian-cities">
                    <option value="Bengaluru, Karnataka" />
                    <option value="Ahmedabad, Gujarat" />
                    <option value="Mumbai, Maharashtra" />
                    <option value="New Delhi, Delhi" />
                    <option value="Hyderabad, Telangana" />
                    <option value="Chennai, Tamil Nadu" />
                    <option value="Pune, Maharashtra" />
                    <option value="Jaipur, Rajasthan" />
                    <option value="Kolkata, West Bengal" />
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Travel Type</label>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                  <button 
                    onClick={() => setFormData({...formData, type: 'Domestic'})}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all text-sm md:text-base ${formData.type === 'Domestic' ? 'bg-primary-500 text-white shadow-md' : 'text-gray-900 hover:bg-gray-200/50'}`}
                  >
                    Domestic
                  </button>
                  <button 
                    onClick={() => setFormData({...formData, type: 'International'})}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all text-sm md:text-base ${formData.type === 'International' ? 'bg-primary-500 text-white shadow-md' : 'text-gray-900 hover:bg-gray-200/50'}`}
                  >
                    International
                  </button>
                </div>
              </div>

              {/* Date Menu Section */}
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Date & Duration</h3>
                  <div className="flex items-center gap-2">
                     <input 
                        type="checkbox" 
                        id="flexible" 
                        checked={formData.flexibleDates}
                        onChange={(e) => setFormData({...formData, flexibleDates: e.target.checked})}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 border-gray-300" 
                     />
                     <label htmlFor="flexible" className="text-sm text-gray-600 font-medium cursor-pointer">Flexible Dates (+/- 2 days)</label>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Start Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input 
                        type="date" 
                        value={formData.startDate}
                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                        className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 font-medium shadow-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">End Date</label>
                    <div className="relative">
                      <CalendarCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input 
                        type="date" 
                        value={formData.endDate}
                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                        className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 font-medium shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Frame Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Preferred Start Time</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <select 
                        value={formData.startTime}
                        onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                        className="w-full bg-gray-50 border-gray-200 rounded-xl pl-12 pr-10 py-3.5 appearance-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 font-medium"
                    >
                        <option value="">Select Time</option>
                        {timeSlots.map(time => <option key={`start-${time}`} value={time}>{time}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Preferred End Time</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <select 
                        value={formData.endTime}
                        onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                        className="w-full bg-gray-50 border-gray-200 rounded-xl pl-12 pr-10 py-3.5 appearance-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 font-medium"
                    >
                        <option value="">Select Time</option>
                        {timeSlots.map(time => <option key={`end-${time}`} value={time}>{time}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Purpose of Travel</label>
                <textarea 
                  rows={4}
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  className="w-full bg-gray-50 border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-primary-500 outline-none resize-none text-gray-900 font-medium placeholder-gray-400"
                  placeholder="Please describe the business justification for this trip..."
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Options */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-6">
              <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
              Trip Details
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Department</label>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <select 
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full bg-gray-50 border-gray-200 rounded-xl pl-12 pr-10 py-3.5 appearance-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 font-medium"
                  >
                    <option>Engineering</option>
                    <option>Marketing</option>
                    <option>Sales</option>
                    <option>HR</option>
                    <option>Executive</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 space-y-3">
              <button 
                onClick={handleSubmit}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2"
              >
                Submit Request <ArrowRight size={18} />
              </button>
              <button 
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Save Draft <Save size={16} />
              </button>
            </div>
          </div>
          
           <div className="bg-pink-50 rounded-2xl p-6 border border-pink-100">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-full shadow-sm text-pink-500">
                        <DollarSign size={16} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">Travel Tip</h4>
                        <p className="text-xs text-gray-700 mt-1 leading-relaxed font-medium">
                            Booking 14 days in advance typically saves 20% on flights to major hubs.
                        </p>
                    </div>
                </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRequest;
