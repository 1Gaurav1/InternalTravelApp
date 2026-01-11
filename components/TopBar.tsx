
import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, X, ChevronDown, Check } from 'lucide-react';
import { UserRole, Notification, ViewState } from '../types';

interface TopBarProps {
  userRole: UserRole;
  onToggleSidebar: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onNavigate?: (view: ViewState) => void;
}

const TopBar: React.FC<TopBarProps> = ({ userRole, onToggleSidebar, notifications, onMarkAsRead, onNavigate }) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Mock search suggestions
  const allSuggestions = [
    { label: 'Create New Request', view: ViewState.CREATE_REQUEST },
    { label: 'My Past Trips', view: ViewState.MY_REQUESTS },
    { label: 'London Office', type: 'destination' },
    { label: 'Travel Policy 2026', type: 'policy' },
    { label: 'Approvals Pending', view: ViewState.APPROVAL_LIST },
  ];

  const suggestions = searchValue 
    ? allSuggestions.filter(s => s.label.toLowerCase().includes(searchValue.toLowerCase()))
    : [];

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-200/50 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
        >
          <Menu size={24} />
        </button>

        <div className="relative max-w-xl w-full hidden md:block">
          <div className={`relative group transition-all duration-300 ${isSearchFocused ? 'scale-105' : ''}`}>
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isSearchFocused ? 'text-primary-500' : 'text-gray-400'}`} size={20} />
            <input 
              type="text" 
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder="Search destinations, requests, or policies..."
              className="w-full bg-gray-100/50 border-none rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-100 focus:bg-white transition-all outline-none text-gray-700 placeholder-gray-400 shadow-sm"
            />
          </div>
          
          {/* Search Dropdown */}
          {isSearchFocused && searchValue && suggestions.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-2 animate-fade-in">
              {suggestions.map((item, idx) => (
                <button 
                  key={idx}
                  onClick={() => {
                    if (item.view && onNavigate) onNavigate(item.view);
                    setSearchValue('');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center justify-between group"
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-gray-400 group-hover:text-primary-500 capitalize">{item.view ? 'Page' : item.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3 md:gap-5">
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${showNotifications ? 'bg-primary-50 text-primary-600' : 'bg-white hover:bg-gray-50 border border-gray-100 text-gray-500'}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-900">Notifications</h3>
                <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full">{unreadCount} New</span>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                   <div className="p-8 text-center text-gray-500 text-sm">No new notifications</div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      onClick={() => onMarkAsRead(notif.id)}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 ${notif.read ? 'opacity-60' : 'bg-blue-50/30'}`}
                    >
                       <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${notif.read ? 'bg-gray-300' : 'bg-primary-500'}`}></div>
                       <div>
                          <p className={`text-sm ${notif.read ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>{notif.title}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-gray-400 mt-2">{notif.time}</p>
                       </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 border-t border-gray-100 text-center">
                <button className="text-xs font-medium text-gray-500 hover:text-gray-900 py-2 w-full">Mark all as read</button>
              </div>
            </div>
          )}
        </div>
        
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full cursor-pointer hover:shadow-sm transition-shadow">
           <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary-500 to-purple-500 text-[10px] text-white flex items-center justify-center font-bold">
              {userRole[0]}
           </div>
           <span className="text-xs font-medium text-gray-700 pr-1 capitalize">{userRole.toLowerCase().replace('_', ' ')}</span>
           <ChevronDown size={14} className="text-gray-400" />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
