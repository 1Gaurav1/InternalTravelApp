import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../api'; // Ensure this points to your api.ts
import { Plane, Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, Loader2, User as UserIcon } from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Only for signup
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // --- REAL LOGIN ---
        const user = await api.login(email, password);
        onLogin(user);
      } else {
        // --- REAL SIGNUP ---
        if (!name) throw new Error('Name is required for sign up');
        
        const newUser = await api.signup({
            name,
            email,
            password,
            department: 'Unassigned' // Default department
        });
        
        // Auto-login after signup
        onLogin(newUser);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
         <img
          src="/travel.png"
          alt="Renee Travel"
          className="w-20 h-20 mx-auto mb-6 rounded-3xl shadow-lg shadow-primary-500/30 transform -rotate-3 hover:rotate-0 transition-transform duration-300 object-cover"
        />
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Renee Travel</h1>
          <p className="text-gray-500 text-lg">Corporate Travel Website</p>
        </div>

        {/* Toggle Login/Signup */}
        <div className="flex p-1 bg-gray-100 rounded-xl mb-8">
            <button 
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Log In
            </button>
            <button 
                 onClick={() => { setIsLogin(false); setError(''); }}
                 className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${!isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Sign Up
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2 animate-fade-in border border-red-100">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

          {/* Name Field (Only for Signup) */}
          {!isLogin && (
             <div className="space-y-1.5 animate-fade-in">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">Full Name</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 block p-4 pl-12 outline-none transition-all" 
                    placeholder="John Doe"
                    required={!isLogin}
                  />
                </div>
             </div>
          )}

          {/* Email Field */}
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

          {/* Password Field */}
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
            disabled={isLoading}
            className="w-full text-white bg-gray-900 hover:bg-black focus:ring-4 focus:ring-gray-200 font-bold rounded-xl text-base px-5 py-4 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
                <>
                    <Loader2 size={20} className="animate-spin" />
                    Please wait...
                </>
            ) : (
                <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginView;