import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Save, Camera, Briefcase, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ProfileSettingsProps {
  user: any;
  onSave: (updatedUser: any) => void;
  onCancel: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onSave, onCancel }) => {
  
  // --- STATE ---
  const [formData, setFormData] = useState({
      name: '',
      email: '',
      phone: '',
      department: '',
      location: '',
      avatar: ''
  });

  // Load initial data
  useEffect(() => {
      if (user) {
          setFormData({
              name: user.name || 'Alex Morgan',
              email: user.email || 'alex.morgan@company.com',
              phone: user.phone || '+91 98765 43210',
              department: user.department || 'Product',
              location: user.location || 'Bangalore, India',
              avatar: user.avatar || `https://ui-avatars.com/api/?name=${user.name || 'Alex'}&background=random`
          });
      }
  }, [user]);

  // --- HANDLERS ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Simulate API call / Local Storage update
      const updatedUser = { ...user, ...formData };
      localStorage.setItem('user', JSON.stringify(updatedUser)); // Persist data
      onSave(updatedUser);
      toast.success("Profile updated successfully!");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setFormData(prev => ({ ...prev, avatar: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
          <div>
              <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
              <p className="text-gray-500 mt-1">Manage your personal information and preferences.</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
              <X size={24} />
          </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          
          {/* BANNER & AVATAR */}
          <div className="h-32 bg-gradient-to-r from-slate-800 to-slate-900 relative">
              <div className="absolute -bottom-12 left-8">
                  <div className="relative group">
                      <img 
                          src={formData.avatar} 
                          alt="Profile" 
                          className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-md bg-white"
                      />
                      <label className="absolute bottom-0 right-0 p-1.5 bg-pink-600 text-white rounded-full cursor-pointer hover:bg-pink-700 shadow-lg transition-transform hover:scale-110 border-2 border-white">
                          <Camera size={14} />
                          <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange}/>
                      </label>
                  </div>
              </div>
          </div>

          <div className="pt-16 px-8 pb-8 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                      <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input 
                              name="name" 
                              value={formData.name} 
                              onChange={handleChange} 
                              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all" 
                          />
                      </div>
                  </div>

                  {/* Department */}
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Department</label>
                      <div className="relative">
                          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input 
                              name="department" 
                              value={formData.department} 
                              onChange={handleChange} 
                              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all" 
                          />
                      </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                      <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input 
                              name="email" 
                              type="email"
                              value={formData.email} 
                              onChange={handleChange} 
                              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all" 
                          />
                      </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
                      <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input 
                              name="phone" 
                              value={formData.phone} 
                              onChange={handleChange} 
                              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all" 
                          />
                      </div>
                  </div>

                  {/* Location */}
                  <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Base Location</label>
                      <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input 
                              name="location" 
                              value={formData.location} 
                              onChange={handleChange} 
                              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all" 
                          />
                      </div>
                  </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-6 border-t border-gray-100 flex gap-4 justify-end">
                  <button type="button" onClick={onCancel} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                      Cancel
                  </button>
                  <button type="submit" className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black shadow-lg hover:shadow-xl transition-all flex items-center gap-2 transform active:scale-95">
                      <Save size={18} /> Save Changes
                  </button>
              </div>

          </div>
      </form>
    </div>
  );
};

export default ProfileSettings;