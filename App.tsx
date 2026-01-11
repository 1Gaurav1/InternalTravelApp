
import React, { useState, useEffect } from 'react';
import { ViewState, UserRole, Notification, TravelRequest, RequestStatus, User } from './types';
import { api } from './api';
import LoginView from './views/LoginView';
import EmployeeDashboard from './views/EmployeeDashboard';
import ManagerDashboard from './views/ManagerDashboard';
import AdminDashboard from './views/AdminDashboard';
import UserManagement from './views/UserManagement';
import CreateRequest from './views/CreateRequest';
import RequestDetails from './views/RequestDetails';
import MyRequests from './views/MyRequests';
import TravelAgentDashboard from './views/TravelAgentDashboard';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';

// Default Data for Fallback/Seeding
const DEFAULT_REQUESTS: TravelRequest[] = [
  { 
    id: 'TR-8821', 
    destination: 'London, UK', 
    startDate: '2026-10-12', 
    endDate: '2026-10-15', 
    startTime: '07:00 AM',
    endTime: '10:00 AM',
    status: 'Pending Manager', 
    amount: 272000, 
    employeeName: 'Sarah Jenkins', 
    department: 'Marketing',
    type: 'International',
    submittedDate: 'Oct 10, 2026'
  },
  { 
    id: 'TR-8822', 
    destination: 'Mumbai, Maharashtra', 
    startDate: '2026-10-14', 
    endDate: '2026-10-16', 
    startTime: '09:00 AM',
    endTime: '12:00 PM',
    status: 'Pending Admin', 
    amount: 72500, 
    employeeName: 'Mike Ross', 
    department: 'Sales',
    type: 'Domestic',
    submittedDate: 'Oct 11, 2026'
  },
  { 
    id: 'TR-8823', 
    destination: 'Singapore', 
    startDate: '2026-11-01', 
    endDate: '2026-11-05', 
    startTime: '06:00 AM',
    endTime: '11:00 PM',
    status: 'Processing (Agent)', 
    amount: 150000, 
    employeeName: 'Jessica Lee', 
    department: 'Finance',
    type: 'International',
    submittedDate: 'Oct 15, 2026'
  }
];

const DEFAULT_USERS: User[] = [
  { id: '1', name: 'Alex Morgan', email: 'employee@renee.com', password: '123', role: UserRole.EMPLOYEE, department: 'Product', status: 'Active', lastActive: '2 mins ago', avatar: 'https://picsum.photos/seed/alex/200' },
  { id: '2', name: 'James Wilson', email: 'manager@renee.com', password: '123', role: UserRole.MANAGER, department: 'Sales', status: 'Active', lastActive: '1 hour ago', avatar: 'https://picsum.photos/seed/james/200' },
  { id: '3', name: 'Sarah Jenkins', email: 'admin@renee.com', password: '123', role: UserRole.ADMIN, department: 'IT', status: 'Active', lastActive: '5 hours ago', avatar: 'https://picsum.photos/seed/sarah/200' },
  { id: '4', name: 'Super Admin', email: 'super@renee.com', password: '123', role: UserRole.SUPER_ADMIN, department: 'Executive', status: 'Active', lastActive: 'Just now', avatar: 'https://picsum.photos/seed/super/200' },
  { id: '5', name: 'Travel Desk', email: 'agent@renee.com', password: '123', role: UserRole.TRAVEL_AGENT, department: 'Operations', status: 'Active', lastActive: '10 mins ago', avatar: 'https://picsum.photos/seed/agent/200' },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Data State
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', title: 'System Update', message: 'Platform maintenance scheduled for Sunday.', time: '2h ago', read: false, type: 'info' }
  ]);

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [fetchedUsers, fetchedRequests] = await Promise.all([
          api.getUsers(),
          api.getRequests()
        ]);
        
        // If backend returns empty lists (first run), maybe fallback to defaults or seeding happens on backend
        if (fetchedUsers.length === 0) {
           setUsers(DEFAULT_USERS); // Just for display if DB is empty
        } else {
           setUsers(fetchedUsers);
        }
        
        setRequests(fetchedRequests);
        setBackendError(false);
      } catch (err) {
        console.error("Backend connection failed:", err);
        setBackendError(true);
        // Fallback to local defaults so app is usable
        setUsers(DEFAULT_USERS);
        setRequests(DEFAULT_REQUESTS);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // -- ACTIONS --

  const handleCreateRequest = async (newRequest: TravelRequest) => {
    const requestWithUser = {
      ...newRequest,
      employeeName: currentUser?.name || 'Unknown User'
    };

    // Optimistic Update
    setRequests([requestWithUser, ...requests]);
    setCurrentView(ViewState.EMPLOYEE_DASHBOARD);
    
    addNotification({
      title: 'Request Submitted',
      message: `Your request to ${newRequest.destination} has been submitted.`,
      time: 'Just now',
      type: 'success'
    });

    if (!backendError) {
      try {
        const saved = await api.createRequest(requestWithUser);
        // Replace optimistic ID with real DB ID if needed
        setRequests(prev => prev.map(r => r.id === requestWithUser.id ? saved : r));
      } catch (e) {
        console.error("Failed to save request", e);
        alert("Could not save to database. Check console.");
      }
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: RequestStatus, agentNotes?: string) => {
    // Optimistic Update
    setRequests(requests.map(req => {
      if (req.id === id) {
        return { ...req, status: newStatus, agentNotes: agentNotes || req.agentNotes };
      }
      return req;
    }));
    
    let message = '';
    if (newStatus === 'Pending Admin') message = 'Request approved by Manager. Sent to Admin.';
    if (newStatus === 'Processing (Agent)') {
        // If coming from Action Required, it means Employee responded
        if(requests.find(r => r.id === id)?.status === 'Action Required') {
            message = 'Response sent to Travel Agent.';
        } else {
            message = 'Request approved by Admin. Sent to Travel Agent.';
        }
    }
    if (newStatus === 'Action Required') message = 'Travel Agent has sent options for review.';
    if (newStatus === 'Booked') message = 'Travel booking confirmed!';
    
    if (message) {
      addNotification({
        title: 'Status Updated',
        message: message,
        time: 'Just now',
        type: 'info'
      });
    }

    if (!backendError) {
      try {
        await api.updateRequestStatus(id, newStatus, agentNotes);
      } catch (e) {
        console.error("Failed to update status", e);
      }
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

    if (!backendError) {
      try {
        await api.deleteRequest(id);
      } catch (e) {
         console.error("Failed to delete", e);
      }
    }
  };

  // User Management Actions
  const handleUpdateUser = async (updatedUser: User) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    addNotification({
      title: 'User Updated',
      message: `Profile for ${updatedUser.name} has been updated.`,
      time: 'Just now',
      type: 'success'
    });

    if (!backendError) {
      try {
        await api.updateUser(updatedUser.id, updatedUser);
      } catch (e) {
        console.error("Failed to update user", e);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
    addNotification({
      title: 'User Deleted',
      message: 'User account has been permanently removed.',
      time: 'Just now',
      type: 'warning'
    });

    if (!backendError) {
      try {
        await api.deleteUser(userId);
      } catch (e) {
         console.error("Failed to delete user", e);
      }
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      setCurrentView(ViewState.ADMIN_DASHBOARD);
    } else if (user.role === UserRole.MANAGER) {
      setCurrentView(ViewState.MANAGER_DASHBOARD);
    } else if (user.role === UserRole.TRAVEL_AGENT) {
      setCurrentView(ViewState.TRAVEL_AGENT_DASHBOARD);
    } else {
      setCurrentView(ViewState.EMPLOYEE_DASHBOARD);
    }
  };

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
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

  if (currentView === ViewState.LOGIN) {
    return (
      <>
        {backendError && (
          <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-xs text-center py-1 z-[100]">
             Backend disconnected. Running in demo mode. (Start server on port 5000)
          </div>
        )}
        <LoginView onLogin={handleLogin} users={users} />
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
        userRole={currentUser?.role || UserRole.EMPLOYEE}
        currentUser={currentUser}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        <TopBar 
          userRole={currentUser?.role || UserRole.EMPLOYEE} 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onNavigate={handleNavigate}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full relative">
          {backendError && (
            <div className="absolute top-0 left-0 w-full bg-red-100 text-red-700 text-xs px-4 py-2 text-center border-b border-red-200">
               ⚠️ Backend Disconnected: Changes will not be saved to database. Check your Node.js server.
            </div>
          )}
          
          {loading ? (
             <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
             </div>
          ) : (
            <>
              {currentView === ViewState.EMPLOYEE_DASHBOARD && (
                <EmployeeDashboard 
                  onNavigate={handleNavigate} 
                  requests={requests}
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
                  userRole={currentUser?.role || UserRole.ADMIN}
                  requests={requests}
                  onUpdateStatus={handleUpdateStatus}
                />
              )}

              {currentView === ViewState.TRAVEL_AGENT_DASHBOARD && (
                <TravelAgentDashboard 
                  requests={requests}
                  onUpdateStatus={handleUpdateStatus}
                />
              )}

              {currentView === ViewState.USER_MANAGEMENT && (
                <UserManagement 
                  users={users}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
                />
              )}

              {currentView === ViewState.REQUEST_DETAILS && (
                <RequestDetails 
                  requestId={selectedRequestId} 
                  onBack={() => handleNavigate(
                    currentUser?.role === UserRole.MANAGER ? ViewState.MANAGER_DASHBOARD : 
                    currentUser?.role === UserRole.TRAVEL_AGENT ? ViewState.TRAVEL_AGENT_DASHBOARD :
                    ViewState.ADMIN_DASHBOARD
                  )} 
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
