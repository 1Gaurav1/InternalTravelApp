import React, { useState, useEffect } from 'react';
import { User, UserStatus } from '../types';
import { api } from '../api';
import { Search, Plus, Filter, MoreVertical, Edit2, Trash2, Shield, Mail, CheckSquare, Square, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Form Data State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: [] as string[],
    department: 'Sales',
    status: 'Active' as UserStatus
  });

  const availableRoles = ['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN', 'TRAVEL_AGENT'];
  const departments = ['Sales', 'IT', 'HR', 'Product', 'Executive', 'Operations'];

  // --- DATA LOADING ---
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await api.getUsers();
      
      // Safety: Ensure 'role' is always an array (handles legacy data)
      const sanitizedUsers = data.map((u: any) => ({
          ...u,
          role: Array.isArray(u.role) ? u.role : [u.role] 
      }));
      setUsers(sanitizedUsers);
    } catch (error) {
      console.error('Failed to load users', error);
      toast.error("Failed to load user list");
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTIONS ---

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role, 
      department: user.department,
      status: user.status as UserStatus
    });
    setIsFormOpen(true);
  };

  const initiateDelete = (id: string) => {
    setUserToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await api.deleteUser(userToDelete);
      setUsers(prev => prev.filter(u => u.id !== userToDelete));
      toast.success("User deleted successfully");
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.role.length === 0) {
        toast.error("Please select at least one role.");
        return;
    }

    try {
      if (editingUser) {
        // Update existing
        await api.updateUser(editingUser.id, formData);
        setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
        toast.success("User updated successfully");
      } else {
        // Create new
        const newUser = await api.createUser({
            ...formData,
            id: '', // Backend generates ID
            password: '123' // Default password logic
        } as User);
        setUsers(prev => [...prev, newUser]);
        toast.success("User created successfully");
      }
      closeForm();
    } catch (error) {
      console.error(error);
      toast.error("Operation failed");
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: ['EMPLOYEE'],
      department: 'Sales',
      status: 'Active'
    });
  };

  const toggleRole = (roleToToggle: string) => {
    setFormData(prev => {
      const roles = prev.role.includes(roleToToggle)
        ? prev.role.filter(r => r !== roleToToggle)
        : [...prev.role, roleToToggle];
      return { ...prev, role: roles };
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage system access, roles, and permissions.</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setIsFormOpen(true); }}
          className="bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-gray-900/20"
        >
          <Plus size={18} /> Add User
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full mb-4"></div>
                Loading users...
            </div>
        ) : users.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No users found. Create one to get started.</div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User Profile</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned Roles</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                        alt="" 
                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" 
                      />
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                        {user.role.map((r) => (
                            <span key={r} className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                r === 'SUPER_ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                r === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                'bg-gray-50 text-gray-600 border-gray-200'
                            }`}>
                                {r.replace('_', ' ')}
                            </span>
                        ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 font-medium bg-gray-100/50 px-2 py-1 rounded-md border border-gray-100">
                        {user.department}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      user.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                      user.status === 'Suspended' ? 'bg-red-50 text-red-700 border-red-100' :
                      'bg-gray-50 text-gray-600 border-gray-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        user.status === 'Active' ? 'bg-emerald-500' : 
                        user.status === 'Suspended' ? 'bg-red-500' : 'bg-gray-400'
                      }`}></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(user)} 
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit User"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => initiateDelete(user.id)} 
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">{editingUser ? 'Edit User Profile' : 'Create New User'}</h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Full Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-sm font-medium"
                      placeholder="e.g. John Doe"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Department</label>
                    <select 
                        value={formData.department}
                        onChange={e => setFormData({...formData, department: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-sm bg-white"
                    >
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-sm"
                    placeholder="john@company.com"
                    required 
                  />
                </div>
              </div>

              {/* Roles Section */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-3">System Roles (Multi-Select)</label>
                <div className="grid grid-cols-2 gap-2">
                    {availableRoles.map(role => {
                        const isSelected = formData.role.includes(role);
                        return (
                            <div 
                                key={role}
                                onClick={() => toggleRole(role)}
                                className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all select-none ${
                                    isSelected 
                                    ? 'bg-white border-blue-500 ring-1 ring-blue-500 shadow-sm' 
                                    : 'bg-white border-gray-200 hover:border-gray-300 text-gray-500'
                                }`}
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                    isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                                }`}>
                                    {isSelected && <CheckSquare size={12} className="text-white" />}
                                </div>
                                <span className={`text-xs font-bold ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                                    {role.replace('_', ' ')}
                                </span>
                            </div>
                        );
                    })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Account Status</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as UserStatus})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-sm bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={closeForm}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-black font-bold text-sm transition-all shadow-lg shadow-gray-900/20"
                >
                  {editingUser ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete User Account"
        message="Are you sure you want to permanently delete this user? This action cannot be undone and they will lose access immediately."
        confirmText="Yes, Delete User"
        type="danger"
      />
    </div>
  );
};

export default UserManagement;