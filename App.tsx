import React, { useState, useEffect } from 'react';
import { ViewState, UserRole, Notification, TravelRequest, RequestStatus, User } from './types';
import { api } from './api';
import LoginView from './views/LoginView';
import EmployeeDashboard from './views/EmployeeDashboard';
import ManagerDashboard from './views/ManagerDashboard';
import AdminDashboard from './views/AdminDashboard';
import SuperAdminDashboard from './views/SuperAdminDashboard'; // <--- IMPORTED
import UserManagement from './views/UserManagement';
import CreateRequest from './views/CreateRequest';
import RequestDetails from './views/RequestDetails';
import MyRequests from './views/MyRequests';
import TravelAgentDashboard from './views/TravelAgentDashboard';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import { Toaster } from "react-hot-toast";
import TravelOptions from "./views/TravelOptions";

const App: React.FC = () => {
  // Stats state
  const [stats, setStats] = useState<any>(null);
  
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Data State
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);

  // Initialize empty notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Helper to determine dashboard based on role priority
  const getInitialView = (roles: string[]): ViewState => {
    if (roles.includes(UserRole.SUPER_ADMIN)) {
        return ViewState.SUPER_ADMIN_DASHBOARD; // <--- Correctly point to new dashboard
    }
    if (roles.includes(UserRole.ADMIN)) {
        return ViewState.ADMIN_DASHBOARD;
    }
    if (roles.includes(UserRole.TRAVEL_AGENT)) {
        return ViewState.TRAVEL_AGENT_DASHBOARD;
    }
    if (roles.includes(UserRole.MANAGER)) {
        return ViewState.MANAGER_DASHBOARD;
    }
    return ViewState.EMPLOYEE_DASHBOARD;
  };

  // Fetch real stats and data from backend
  useEffect(() => {
    const fetchGlobalData = async () => {
      if (currentView === ViewState.LOGIN) return;

      setLoading(true);
      try {
        const [fetchedStats, fetchedRequests] = await Promise.all([
          api.getStats().catch(() => null),
          api.getRequests()
        ]);
        
        if (fetchedStats) setStats(fetchedStats);
        setRequests(fetchedRequests);
        setBackendError(false);
      } catch (err) {
        console.error("Backend connection failed:", err);
        setBackendError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalData();
  }, [currentView]);

  // Restore Session
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        if (!Array.isArray(userObj.role)) {
            userObj.role = [userObj.role];
        }
        
        setCurrentUser(userObj);
        setCurrentView(getInitialView(userObj.role));
      } catch (e) {
        console.error("Failed to parse saved user", e);
        localStorage.removeItem("user");
      }
    }
  }, []);

  // -- ACTIONS --

  const handleCreateRequest = async (newRequest: TravelRequest) => {
    const requestWithUser = {
      ...newRequest,
      employeeName: currentUser?.name || 'Unknown User'
    };

    // Optimistic Update
    setRequests([requestWithUser, ...requests]);
    
    // Redirect based on role
    const roles = currentUser?.role || [];
    if (roles.includes(UserRole.SUPER_ADMIN)) setCurrentView(ViewState.SUPER_ADMIN_DASHBOARD);
    else if (roles.includes(UserRole.ADMIN)) setCurrentView(ViewState.ADMIN_DASHBOARD);
    else if (roles.includes(UserRole.MANAGER)) setCurrentView(ViewState.MANAGER_DASHBOARD);
    else setCurrentView(ViewState.EMPLOYEE_DASHBOARD);
    
    addNotification({
      title: 'Request Submitted',
      message: `Your request to ${newRequest.destination} has been submitted.`,
      time: 'Just now',
      type: 'success'
    });

    try {
      const saved = await api.createRequest(requestWithUser);
      setRequests(prev => prev.map(r => r.id === requestWithUser.id ? saved : r));
      const newStats = await api.getStats();
      setStats(newStats);
    } catch (e) {
      console.error("Failed to save request", e);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: RequestStatus, agentNotes?: string) => {
    setRequests(requests.map(req => {
      if (req.id === id) {
        return { ...req, status: newStatus, agentNotes: agentNotes || req.agentNotes };
      }
      return req;
    }));
    
    // Status update logic (notifications)...
    let message = '';
    if (newStatus === 'Pending Admin') message = 'Request approved by Manager. Sent to Admin.';
    if (newStatus === 'Processing (Agent)') message = 'Request approved. Sent to Travel Desk.';
    if (newStatus === 'Action Required') message = 'Travel Agent has sent options.';
    if (newStatus === 'Booked') message = 'Travel booking confirmed!';
    if (newStatus === 'Rejected') message = 'Travel request was rejected.';
    
    if (message) {
      addNotification({
        title: 'Status Updated',
        message: message,
        time: 'Just now',
        type: 'info'
      });
    }

    try {
      await api.updateRequestStatus(id, newStatus, agentNotes);
      const newStats = await api.getStats();
      setStats(newStats);
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    setRequests(requests.filter(req => req.id !== id));
    addNotification({
      title: 'Request Deleted',
      message: `Travel request has been permanently deleted.`,
      time: 'Just now',
      type: 'info'
    });

    try {
      await api.deleteRequest(id);
      const newStats = await api.getStats();
      setStats(newStats);
    } catch (e) {
         console.error("Failed to delete", e);
    }
  };

  const handleLogin = (user: User) => {
    const userWithRoleArray = {
        ...user,
        role: Array.isArray(user.role) ? user.role : [user.role]
    };
    setCurrentUser(userWithRoleArray);
    localStorage.setItem("user", JSON.stringify(userWithRoleArray));
    setCurrentView(getInitialView(userWithRoleArray.role));
  };

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setCurrentUser(null);
    setCurrentView(ViewState.LOGIN);
    setNotifications([]);
  };

  const handleViewRequest = (id: string) => {
    setSelectedRequestId(id);
    setCurrentView(ViewState.REQUEST_DETAILS);
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'read'>) => {
    const newNote: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false
    };
    setNotifications(prev => [newNote, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // --- RENDER ---

  if (currentView === ViewState.LOGIN) {
    return (
      <>
        {backendError && (
          <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-xs text-center py-1 z-[100]">
              Backend disconnected. Check server logs.
          </div>
        )}
        <LoginView onLogin={handleLogin} />
      </>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <Sidebar 
        currentView={currentView} 
        onNavigate={handleNavigate} 
        onLogout={handleLogout}
        userRole={currentUser?.role || []} 
        currentUser={currentUser}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        <TopBar 
          userRole={currentUser?.role || []} 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onNavigate={handleNavigate}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full relative">
          {backendError && (
            <div className="absolute top-0 left-0 w-full bg-red-100 text-red-700 text-xs px-4 py-2 text-center border-b border-red-200">
                Backend Disconnected: Changes will not be saved to database.
            </div>
          )}
          
          {loading && !requests.length ? (
             <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
             </div>
          ) : (
            <>
              {currentView === ViewState.EMPLOYEE_DASHBOARD && (
                <EmployeeDashboard 
                  onNavigate={handleNavigate}
                  requests={requests}
                  stats={stats}
                />
              )}

              {currentView === ViewState.SHARE_OPTIONS && (
                <TravelOptions
                  requests={requests}
                  currentUser={currentUser}
                  onUpdateStatus={handleUpdateStatus}
                  />           
              )}
              
              {currentView === ViewState.CREATE_REQUEST && (
                <CreateRequest 
                  onNavigate={handleNavigate} 
                  onCreate={handleCreateRequest}
                  currentUser={currentUser}
                />
              )}
              
              {currentView === ViewState.MY_REQUESTS && (
                  <MyRequests 
                    requests={requests} 
                    onDelete={handleDeleteRequest}
                    onUpdateStatus={handleUpdateStatus}
                    onViewRequest={handleViewRequest}
                    onCreateRequest={() => setCurrentView(ViewState.CREATE_REQUEST)}
                  />
                )}
              
              {(currentView === ViewState.MANAGER_DASHBOARD || currentView === ViewState.APPROVAL_LIST) && (
                <ManagerDashboard 
                  onNavigate={handleNavigate} 
                  onViewRequest={handleViewRequest} 
                  requests={requests}
                  onUpdateStatus={handleUpdateStatus}
                />
              )}
              
              {(currentView === ViewState.ADMIN_DASHBOARD || currentView === ViewState.ADMIN_REPORTS) && (
                <AdminDashboard 
                  userRole={currentUser?.role || []}
                  requests={requests}
                  onUpdateStatus={handleUpdateStatus}
                  onNavigate={handleNavigate}
                />
              )}

              {/* ADDED: Super Admin Logic */}
              {currentView === ViewState.SUPER_ADMIN_DASHBOARD && (
                <SuperAdminDashboard 
                  requests={requests}
                  onNavigate={handleNavigate}
                />
              )}

              {currentView === ViewState.TRAVEL_AGENT_DASHBOARD && (
                <TravelAgentDashboard 
                  requests={requests}
                  onUpdateStatus={handleUpdateStatus}
                />
              )}

              {currentView === ViewState.USER_MANAGEMENT && currentUser?.role.includes(UserRole.SUPER_ADMIN) && (
                <UserManagement /> 
              )}
                  
              {currentView === ViewState.REQUEST_DETAILS && (
                <RequestDetails 
                  requestId={selectedRequestId} 
                  onBack={() => {
                      const roles = currentUser?.role || [];
                      if(roles.includes(UserRole.SUPER_ADMIN)) return handleNavigate(ViewState.SUPER_ADMIN_DASHBOARD);
                      if(roles.includes(UserRole.ADMIN)) return handleNavigate(ViewState.ADMIN_DASHBOARD);
                      if(roles.includes(UserRole.TRAVEL_AGENT)) return handleNavigate(ViewState.TRAVEL_AGENT_DASHBOARD);
                      if(roles.includes(UserRole.MANAGER)) return handleNavigate(ViewState.MANAGER_DASHBOARD);
                      return handleNavigate(ViewState.EMPLOYEE_DASHBOARD);
                  }} 
                />
              )}
            </>
          )}
        </main>
        <Toaster position="top-right" />
      </div>
    </div>
  );
};

export default App;