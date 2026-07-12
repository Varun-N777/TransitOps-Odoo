import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Truck, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Driver');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (isRegister) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, role })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');

        setSuccess('Registration successful! Logging you in...');
        await login(username, password);
        navigate('/dashboard');
      } else {
        await login(username, password);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Action failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickSelect = async (uname, pwd) => {
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await login(uname, pwd);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setSuccess('');
    setUsername('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4 font-sans selection:bg-blue-600 selection:text-white relative">
      
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
        <ArrowLeft size={16} /> Back
      </Link>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row overflow-hidden"
      >
        {/* Left Form Side */}
        <div className="w-full md:w-1/2 p-10 md:p-12 flex flex-col justify-center bg-white">
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-sm">
              <Truck size={20} />
            </div>
            <span className="font-display font-bold text-xl text-slate-900">
              TransitOps
            </span>
          </div>

          <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">
            {isRegister ? 'Create Account' : 'Welcome back'}
          </h2>
          <p className="text-slate-500 font-medium mb-8">
            {isRegister ? 'Enter details to provision a new user profile.' : 'Please enter your credentials to access your terminal.'}
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl text-sm font-bold mb-6">
              {success}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-medium"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-medium"
                placeholder="••••••••"
                required
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-medium"
                >
                  <option value="Driver">Driver</option>
                  <option value="Fleet Manager">Fleet Manager</option>
                  <option value="Safety Officer">Safety Officer</option>
                  <option value="Financial Analyst">Financial Analyst</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl transition-all text-base mt-2 shadow-sm"
            >
              {submitting ? 'Authenticating...' : (isRegister ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              {isRegister ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
            </button>
          </div>

        </div>

        {/* Right Info / SVG Side */}
        <div className="hidden md:flex w-1/2 bg-slate-50 p-12 flex-col items-center justify-center border-l border-slate-100">
          <div className="w-full max-w-sm mb-12">
            {/* Contextual Fleet SVG */}
            <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto drop-shadow-xl">
              {/* Dashboard Window */}
              <rect x="40" y="40" width="320" height="220" rx="24" fill="white" stroke="#e2e8f0" strokeWidth="8"/>
              {/* Header */}
              <rect x="40" y="40" width="320" height="50" rx="24" fill="#f8fafc"/>
              <circle cx="80" cy="65" r="8" fill="#ef4444"/>
              <circle cx="110" cy="65" r="8" fill="#f59e0b"/>
              <circle cx="140" cy="65" r="8" fill="#22c55e"/>
              
              {/* Map UI Element */}
              <rect x="70" y="110" width="160" height="120" rx="16" fill="#f1f5f9"/>
              <path d="M90 190 Q 120 120, 190 140" stroke="#3b82f6" strokeWidth="8" strokeLinecap="round" strokeDasharray="12 12"/>
              <circle cx="90" cy="190" r="12" fill="#3b82f6"/>
              <circle cx="190" cy="140" r="12" fill="#3b82f6"/>

              {/* Side Panels */}
              <rect x="250" y="110" width="80" height="30" rx="10" fill="#e2e8f0"/>
              <rect x="250" y="150" width="80" height="30" rx="10" fill="#e2e8f0"/>
              <rect x="250" y="190" width="80" height="30" rx="10" fill="#e2e8f0"/>
            </svg>
          </div>
          
          <div className="w-full max-w-sm bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
             <h4 className="font-display font-bold text-slate-800 mb-2">Test Credentials</h4>
             <div className="flex flex-wrap justify-center gap-2">
                <button onClick={() => handleQuickSelect('manager', 'password')} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200">Manager</button>
                <button onClick={() => handleQuickSelect('driver1', 'password')} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200">Driver</button>
                <button onClick={() => handleQuickSelect('safety', 'password')} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200">Safety</button>
             </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default Login;
