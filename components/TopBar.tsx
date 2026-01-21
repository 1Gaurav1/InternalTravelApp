import React, { useState, useRef, useEffect } from 'react';
import { Bell, Menu, LogOut } from 'lucide-react';
import { Notification, User } from '../types';

interface TopBarProps {
  currentUser: User | null;
  onToggleSidebar: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onLogout: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ 
  currentUser, 
  onToggleSidebar, 
  notifications, 
  onMarkAsRead, 
  onLogout 
}) => {
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

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm">
      
      {/* LEFT: Mobile Menu & Welcome Message */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>
      
      {/* RIGHT: Notifications & Logout */}
      <div className="flex items-center gap-4">
        
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2.5 rounded-xl transition-all ${showNotifications ? 'bg-primary-50 text-primary-600' : 'bg-white hover:bg-gray-50 text-gray-500 border border-gray-200'}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-scale-in origin-top-right">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-900">Notifications</h3>
                <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">{unreadCount} New</span>
              </div>
              <div className="max-h-[350px] overflow-y-auto">
                {notifications.length === 0 ? (
                   <div className="p-8 text-center text-gray-400 text-sm">No new notifications</div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      onClick={() => onMarkAsRead(notif.id)}
                      className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 ${notif.read ? 'opacity-60' : 'bg-blue-50/30'}`}
                    >
                        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${notif.read ? 'bg-gray-300' : 'bg-primary-500'}`}></div>
                        <div>
                          <p className={`text-sm ${notif.read ? 'text-gray-600' : 'text-gray-900 font-bold'}`}>{notif.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1.5">{notif.time}</p>
                        </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;