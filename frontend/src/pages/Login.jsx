import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Truck } from 'lucide-react';

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
        // Register flow
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password, role })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Registration failed');
        }

        setSuccess('Registration successful! Logging you in...');
        // Auto login
        await login(username, password);
        navigate('/');
      } else {
        // Login flow
        await login(username, password);
        navigate('/');
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
      navigate('/');
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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl text-white mb-4">
            <Truck size={36} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Welcome to TransitOps</h2>
          <p className="text-slate-400 text-sm mt-1">
            {isRegister ? 'Register a new account' : 'Log in to manage transport fleet operations'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm mb-6 text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-lg text-sm mb-6 text-center">
            {success}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
              placeholder="Enter password"
              required
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Select Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm font-sans"
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
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-3 rounded-xl transition-colors text-sm mt-6 cursor-pointer"
          >
            {submitting 
              ? (isRegister ? 'Creating Account...' : 'Authenticating...') 
              : (isRegister ? 'Register Account' : 'Sign In')
            }
          </button>
        </form>

        {/* Toggle Mode Button */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 underline cursor-pointer"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register / Sign Up"}
          </button>
        </div>

        {/* Quick Select Panel */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 text-center mb-4">
            Quick-Select Test Role
          </span>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleQuickSelect('manager', 'password')}
              className="bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-300 py-2.5 px-3 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer"
            >
              💼 Fleet Manager
              <span className="block text-[10px] text-slate-500 mt-0.5">manager / password</span>
            </button>

            <button
              onClick={() => handleQuickSelect('driver1', 'password')}
              className="bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-300 py-2.5 px-3 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer"
            >
              🚚 Driver
              <span className="block text-[10px] text-slate-500 mt-0.5">driver1 / password</span>
            </button>

            <button
              onClick={() => handleQuickSelect('safety', 'password')}
              className="bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-300 py-2.5 px-3 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer"
            >
              🛡️ Safety Officer
              <span className="block text-[10px] text-slate-500 mt-0.5">safety / password</span>
            </button>

            <button
              onClick={() => handleQuickSelect('analyst', 'password')}
              className="bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-300 py-2.5 px-3 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer"
            >
              📊 Financial Analyst
              <span className="block text-[10px] text-slate-500 mt-0.5">analyst / password</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;

