
import React, { useState } from 'react';
import { UserRole, User } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';
import { 
  Search, Filter, Shield, Edit2, Check, X, User as UserIcon, 
  Trash2, Unlock, Lock 
} from 'lucide-react';

interface UserManagementProps {
    users: User[];
    onUpdateUser: (user: User) => void;
    onDeleteUser: (id: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onUpdateUser, onDeleteUser }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<{ type: 'suspend' | 'activate' | 'delete', userId: string, userName: string } | null>(null);

  const handleEditClick = (user: User) => {
    setEditingId(user.id);
    setSelectedRole(user.role);
  };

  const handleSaveRole = (user: User) => {
    if (selectedRole) {
      onUpdateUser({ ...user, role: selectedRole });
      setEditingId(null);
      setSelectedRole(null);
    }
  };

  const initiateStatusChange = (user: User) => {
    const actionType = user.status === 'Active' ? 'suspend' : 'activate';
    setModalAction({ type: actionType, userId: user.id, userName: user.name });
    setModalOpen(true);
  };

  const initiateDelete = (user: User) => {
    setModalAction({ type: 'delete', userId: user.id, userName: user.name });
    setModalOpen(true);
  };

  const confirmAction = () => {
    if (!modalAction) return;
    const user = users.find(u => u.id === modalAction.userId);
    if (!user && modalAction.type !== 'delete') return;

    if (modalAction.type === 'suspend') {
      onUpdateUser({ ...user!, status: 'Suspended' });
    } else if (modalAction.type === 'activate') {
        onUpdateUser({ ...user!, status: 'Active' });
    } else if (modalAction.type === 'delete') {
      onDeleteUser(modalAction.userId);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN: return 'bg-purple-100 text-purple-700 border-purple-200';
      case UserRole.ADMIN: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case UserRole.MANAGER: return 'bg-pink-100 text-pink-700 border-pink-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">User Management</h1>
          <p className="text-gray-500 mt-1">Manage access control, permissions, and user roles across the organization.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black shadow-lg shadow-gray-900/20 transition-all">
          <UserIcon size={18} /> Add New User
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 justify-between items-center bg-gray-50/50">
           <div className="relative max-w-md w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by name, email, or role..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300 transition-all" 
              />
           </div>
           <div className="flex gap-2">
              <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                 <Filter size={16} /> Status
              </button>
              <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                 <Shield size={16} /> Role
              </button>
           </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User Profile</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Current Role</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Permissions Level</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className={`group transition-colors ${user.status === 'Suspended' ? 'bg-gray-50/80' : 'hover:bg-gray-50/50'}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={user.avatar} className={`w-10 h-10 rounded-full object-cover border-2 ${user.status === 'Suspended' ? 'grayscale border-gray-200' : 'border-white shadow-sm'}`} alt="" />
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${user.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${user.status === 'Suspended' ? 'text-gray-500' : 'text-gray-900'}`}>{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    {editingId === user.id ? (
                      <div className="flex items-center gap-2">
                        <select 
                          value={selectedRole || user.role}
                          onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                          className="px-2 py-1.5 bg-white border border-primary-300 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-primary-100"
                        >
                          <option value={UserRole.EMPLOYEE}>Employee</option>
                          <option value={UserRole.MANAGER}>Manager</option>
                          <option value={UserRole.ADMIN}>Admin</option>
                          <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                        </select>
                        <button onClick={() => handleSaveRole(user)} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><Check size={14} /></button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"><X size={14} /></button>
                      </div>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getRoleColor(user.role)}`}>
                        {user.role === UserRole.SUPER_ADMIN && <Shield size={12} fill="currentColor" />}
                        {user.role.replace('_', ' ')}
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-600 font-medium">
                        {user.role === UserRole.EMPLOYEE && "Basic Access"}
                        {user.role === UserRole.MANAGER && "Approve, View Team"}
                        {user.role === UserRole.ADMIN && "System Config, Reports"}
                        {user.role === UserRole.SUPER_ADMIN && "Full System Control"}
                      </span>
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${user.role === UserRole.SUPER_ADMIN ? 'bg-purple-500 w-full' : user.role === UserRole.ADMIN ? 'bg-indigo-500 w-3/4' : user.role === UserRole.MANAGER ? 'bg-pink-500 w-1/2' : 'bg-gray-400 w-1/4'}`}
                        ></div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                     <button 
                      onClick={() => initiateStatusChange(user)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${user.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 hover:content-["Suspend"]' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-green-50 hover:text-green-700 hover:content-["Activate"]'}`}
                     >
                       {user.status}
                     </button>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {user.status === 'Suspended' ? (
                          <button onClick={() => initiateStatusChange(user)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Unlock Account">
                             <Unlock size={16} />
                          </button>
                       ) : (
                          <button onClick={() => initiateStatusChange(user)} className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Suspend Account">
                             <Lock size={16} />
                          </button>
                       )}
                       
                       <button onClick={() => handleEditClick(user)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Edit Role">
                          <Edit2 size={16} />
                       </button>
                       <button onClick={() => initiateDelete(user)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete User">
                          <Trash2 size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex justify-between items-center">
             <p className="text-xs text-gray-500">Showing <span className="font-bold text-gray-900">{users.length}</span> active accounts</p>
             <div className="flex gap-2">
                 <button className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">Previous</button>
                 <button className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">Next</button>
             </div>
        </div>
      </div>
      
      {/* Permission Matrix Preview */}
      <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6">
          <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-xl text-purple-600 shadow-sm">
                  <Shield size={24} />
              </div>
              <div>
                  <h3 className="font-bold text-gray-900 text-lg">Super Admin Privileges</h3>
                  <p className="text-sm text-gray-600 mt-1 mb-4 max-w-2xl">
                      As a Super Admin, you have the ability to override all system settings, manage other administrators, and access audit logs. 
                      Changes made to user roles are effective immediately.
                  </p>
                  <div className="flex gap-4">
                      <div className="flex items-center gap-2 text-sm text-purple-800 font-medium">
                          <Check size={16} /> Global Policy Override
                      </div>
                      <div className="flex items-center gap-2 text-sm text-purple-800 font-medium">
                          <Check size={16} /> User Role Management
                      </div>
                      <div className="flex items-center gap-2 text-sm text-purple-800 font-medium">
                          <Check size={16} /> System Health Monitor
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <ConfirmationModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        onConfirm={confirmAction}
        title={modalAction?.type === 'delete' ? 'Delete User?' : modalAction?.type === 'suspend' ? 'Suspend User Account?' : 'Activate User Account?'}
        message={
          modalAction?.type === 'delete' 
          ? `Are you sure you want to permanently delete ${modalAction.userName}? This action cannot be undone and will remove all associated data.`
          : modalAction?.type === 'suspend'
            ? `Are you sure you want to suspend ${modalAction.userName}? They will no longer be able to log in to the platform.`
            : `Re-activate ${modalAction?.userName}? They will regain access to their account immediately.`
        }
        type={modalAction?.type === 'activate' ? 'info' : 'danger'}
        confirmText={modalAction?.type === 'delete' ? 'Delete User' : modalAction?.type === 'suspend' ? 'Suspend Account' : 'Activate Account'}
      />
    </div>
  );
};

export default UserManagement;
