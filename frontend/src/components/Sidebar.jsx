import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  MapPin, 
  Wrench, 
  BarChart3, 
  LogOut,
  Lock
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const role = user?.role || '';

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      allowedRoles: ['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst']
    },
    {
      name: 'Vehicles',
      path: '/vehicles',
      icon: Truck,
      allowedRoles: ['Fleet Manager']
    },
    {
      name: 'Drivers',
      path: '/drivers',
      icon: Users,
      allowedRoles: ['Fleet Manager', 'Safety Officer']
    },
    {
      name: 'Trips & Dispatch',
      path: '/trips',
      icon: MapPin,
      allowedRoles: ['Fleet Manager', 'Driver']
    },
    {
      name: 'Maintenance & Fuel',
      path: '/maintenance',
      icon: Wrench,
      allowedRoles: ['Fleet Manager', 'Driver']
    },
    {
      name: 'Reports & Analytics',
      path: '/reports',
      icon: BarChart3,
      allowedRoles: ['Fleet Manager', 'Financial Analyst']
    }
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen text-slate-300">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg text-white">
          <Truck size={24} />
        </div>
        <div>
          <h1 className="font-bold text-white text-lg tracking-tight">TransitOps</h1>
          <span className="text-xs text-slate-500 font-medium font-sans">Fleet Operations</span>
        </div>
      </div>

      {/* User Info Block */}
      <div className="p-4 mx-4 my-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-850 border border-slate-700 flex items-center justify-center text-blue-400 font-bold">
          {user?.username?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-semibold text-white truncate">{user?.username || 'Guest'}</p>
          <p className="text-xs text-slate-500 font-medium truncate">{user?.role || 'Guest Role'}</p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isAllowed = item.allowedRoles.includes(role);
          
          if (!isAllowed) {
            return (
              <div 
                key={item.name} 
                className="flex items-center justify-between p-3 rounded-lg text-slate-600 cursor-not-allowed group relative"
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <Lock size={14} className="text-slate-700" />
                
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-950 text-xs text-slate-400 rounded border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                  Requires: {item.allowedRoles.join(', ')}
                </div>
              </div>
            );
          }

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 pl-2.5' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout button */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full p-3 rounded-lg text-sm font-medium hover:bg-red-500/10 hover:text-red-400 transition-colors text-slate-400"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
