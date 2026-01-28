import React from 'react';
import { ViewState, UserRole, User } from '../types';
import { 
  LayoutDashboard, 
  PlusCircle, 
  List, 
  LogOut, 
  Plane,
  FileCheck,
  Users, 
  BarChart3,
  Briefcase,
  X,
  ShieldCheck,
  Settings // <--- 1. ADDED IMPORT
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
  userRole: string[]; 
  currentUser?: User | null;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onLogout, userRole, currentUser, isOpen, onClose }) => {
  
  const roles = Array.isArray(userRole) ? userRole : [userRole];

  // --- MENU DEFINITIONS (Same as before) ---
  const employeeMenu = [
    { view: ViewState.EMPLOYEE_DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { view: ViewState.CREATE_REQUEST, label: 'New Trip', icon: PlusCircle },
    { view: ViewState.MY_REQUESTS, label: 'My Trips', icon: Plane },
  ];

  const managerMenu = [
    { view: ViewState.MANAGER_DASHBOARD, label: 'Manager Console', icon: LayoutDashboard },
    // { view: ViewState.APPROVAL_LIST, label: 'Team Approvals', icon: FileCheck },
  ];

  const adminMenu = [
    { 
      view: roles.includes(UserRole.SUPER_ADMIN) ? ViewState.SUPER_ADMIN_DASHBOARD : ViewState.ADMIN_DASHBOARD, 
      label: roles.includes(UserRole.SUPER_ADMIN) ? 'Super Control' : 'Admin Console', 
      icon: roles.includes(UserRole.SUPER_ADMIN) ? ShieldCheck : LayoutDashboard 
    },
    ...(roles.includes(UserRole.SUPER_ADMIN) ? [
        { view: ViewState.USER_MANAGEMENT, label: 'User Management', icon: Users },
    ] : []),
  ];

  const agentMenu = [
    { view: ViewState.TRAVEL_AGENT_DASHBOARD, label: 'Agent Console', icon: Briefcase },
  ];

  // --- MENU SELECTION LOGIC ---
  let menuItems = employeeMenu;
  let roleLabel = 'Employee Portal';

  if (roles.includes(UserRole.SUPER_ADMIN)) {
    menuItems = adminMenu;
    roleLabel = 'Super Admin';
  } else if (roles.includes(UserRole.ADMIN)) {
    menuItems = adminMenu;
    roleLabel = 'Administrator';
  } else if (roles.includes(UserRole.TRAVEL_AGENT)) {
    menuItems = agentMenu;
    roleLabel = 'Travel Desk';
  } else if (roles.includes(UserRole.MANAGER)) {
    menuItems = managerMenu;
    roleLabel = 'Manager';
  }

  return (
    <>
      <div className={`
        fixed inset-y-0 left-0 z-30 w-72 bg-white h-full border-r border-gray-100 flex flex-col justify-between shadow-xl md:shadow-sm transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          <div className="p-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-primary-500/20">
                <img 
                  src="/travel.png" 
                  className="w-full h-full object-cover" 
                  alt="logo"
                  onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/40'; }} 
                />
              </div>

              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none">Renee Travel</h1>
                <p className="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-wider">
                  {roleLabel}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <nav className="px-4 space-y-2 mt-2">
            {menuItems.map((item) => {
              const isActive = currentView === item.view;
              return (
                <button
                  key={`${item.view}-${item.label}`}
                  onClick={() => onNavigate(item.view)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? 'bg-primary-50 text-primary-600 font-bold shadow-sm' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
                  }`}
                >
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={`transition-colors ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  <span>{item.label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500"></div>}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4">
          <button 
            onClick={() => onNavigate(ViewState.PROFILE_SETTINGS)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors mb-2 ${
               currentView === ViewState.PROFILE_SETTINGS 
               ? 'bg-primary-50 text-primary-600' 
               : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Settings size={20} />
            <span>Profile Settings</span>
          </button>


          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-medium transition-colors mb-2"
          >
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
          
          <div className="flex items-center gap-3 px-4 py-2 border-t border-gray-100 pt-4">
            <img 
                src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${currentUser?.name || 'User'}`} 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" 
            />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {currentUser?.name || 'Guest User'}
                </p>
                <p className="text-xs text-gray-500 truncate capitalize">
                    {roles.map(r => r.toLowerCase().replace('_', ' ')).join(', ')}
                </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;