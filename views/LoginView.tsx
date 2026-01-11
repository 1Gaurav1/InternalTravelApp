
import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { Plane, Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: User) => void;
  users: User[];
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, users }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
        const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!foundUser) {
            setError('Account not found. Please check your email.');
            return;
        }

        if (foundUser.status === 'Suspended') {
            setError('This account has been suspended. Contact IT.');
            return;
        }

        // Simple prototype password check
        if (foundUser.password && password !== foundUser.password) {
            setError('Incorrect password. (Try "123")');
            return;
        }

        onLogin(foundUser);
    } else {
        setError('Registration is disabled for this prototype.');
    }
  };

  const prefillUser = (selectedEmail: string) => {
      setEmail(selectedEmail);
      setPassword('123');
      setError('');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-purple-200/20 rounded-full blur-3xl mix-blend-multiply animate-blob"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-primary-200/20 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000"></div>
         <div className="absolute top-[20%] right-[20%] w-[600px] h-[600px] bg-pink-200/20 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-4000"></div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-lg p-8 md:p-12 relative z-10 border border-white/50">
        
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-primary-500/30 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <Plane size={36} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Renee Travel</h1>
          <p className="text-gray-500 text-lg">Corporate Travel Website</p>
        </div>

        <div className="flex p-1 bg-gray-100 rounded-xl mb-8">
            <button 
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Log In
            </button>
            <button 
                 onClick={() => setIsLogin(false)}
                 className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${!isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Sign Up
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2 animate-fade-in">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 block p-4 pl-12 outline-none transition-all" 
                placeholder="name@company.com"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 block p-4 pl-12 outline-none transition-all" 
                placeholder="••••••••"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full text-white bg-gray-900 hover:bg-black focus:ring-4 focus:ring-gray-200 font-bold rounded-xl text-base px-5 py-4 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-8 bg-blue-50/50 rounded-xl p-4 border border-blue-100">
             <p className="text-xs text-center text-blue-600 mb-2 font-semibold">Prototype Login (Click to auto-fill)</p>
             <div className="flex flex-wrap justify-center gap-2 text-[10px] text-gray-500">
                 {users.slice(0, 5).map(u => (
                    <span 
                        key={u.id}
                        className="px-2 py-1 bg-white rounded border border-gray-200 cursor-pointer hover:border-primary-300 transition-colors" 
                        onClick={() => prefillUser(u.email)}
                    >
                        {u.role.toLowerCase().replace('_', ' ')}: {u.email}
                    </span>
                 ))}
             </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
