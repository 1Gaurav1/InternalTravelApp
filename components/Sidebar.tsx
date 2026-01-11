
import React from 'react';
import { ViewState, UserRole, User } from '../types';
import { 
  LayoutDashboard, 
  PlusCircle, 
  List, 
  LogOut, 
  Plane,
  FileCheck,
  PieChart,
  ShieldCheck,
  Users,
  BarChart3,
  Globe,
  Briefcase,
  X
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
  userRole: UserRole;
  currentUser?: User | null;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onLogout, userRole, currentUser, isOpen, onClose }) => {
  
  const employeeMenu = [
    { view: ViewState.EMPLOYEE_DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { view: ViewState.CREATE_REQUEST, label: 'Create Request', icon: PlusCircle },
    { view: ViewState.MY_REQUESTS, label: 'My Requests', icon: List },
    { view: ViewState.SHARE_OPTIONS, label: 'Travel Options', icon: Plane },
  ];

  const managerMenu = [
    { view: ViewState.MANAGER_DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { view: ViewState.APPROVAL_LIST, label: 'Approval List', icon: FileCheck },
  ];

  const adminMenu = [
    { view: ViewState.ADMIN_DASHBOARD, label: 'Admin Console', icon: LayoutDashboard },
    { view: ViewState.ADMIN_REPORTS, label: 'Global Reports', icon: BarChart3 },
    { view: ViewState.USER_MANAGEMENT, label: 'User Management', icon: Users },
    ...(userRole === UserRole.SUPER_ADMIN ? [{ view: ViewState.ADMIN_REPORTS, label: 'System Health', icon: Globe }] : [])
  ];

  const agentMenu = [
    { view: ViewState.TRAVEL_AGENT_DASHBOARD, label: 'Agent Console', icon: Briefcase },
    { view: ViewState.ADMIN_REPORTS, label: 'Bookings', icon: List },
  ];

  let menuItems = employeeMenu;
  if (userRole === UserRole.MANAGER) menuItems = managerMenu;
  if (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) menuItems = adminMenu;
  if (userRole === UserRole.TRAVEL_AGENT) menuItems = agentMenu;

  return (
    <>
      <div className={`
        fixed inset-y-0 left-0 z-30 w-72 bg-white h-full border-r border-gray-100 flex flex-col justify-between shadow-xl md:shadow-sm transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          <div className="p-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/20">
                <Plane size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none">Renee Travel</h1>
                <p className="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-wider">
                  {userRole === UserRole.SUPER_ADMIN ? 'Super Admin' : 
                   userRole === UserRole.ADMIN ? 'Administrator' : 
                   userRole === UserRole.MANAGER ? 'Manager' : 
                   userRole === UserRole.TRAVEL_AGENT ? 'Travel Desk' : 'Employee Portal'}
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
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-medium transition-colors mb-2"
          >
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
          
          <div className="flex items-center gap-3 px-4 py-2">
            <img src={currentUser?.avatar || `https://picsum.photos/seed/${userRole}/100/100`} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {currentUser?.name || 'Guest User'}
                </p>
                <p className="text-xs text-gray-500 truncate capitalize">{userRole.toLowerCase().replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
