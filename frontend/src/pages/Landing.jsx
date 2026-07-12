import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Truck, ShieldCheck, Activity, Globe2, ArrowRight } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-[#F0F4F8] p-4 md:p-8 font-sans selection:bg-blue-600 selection:text-white flex flex-col items-center">
      
      {/* Simple Pill Navbar */}
      <nav className="w-full max-w-6xl bg-white rounded-full px-6 py-4 flex justify-between items-center shadow-sm border border-slate-100 mb-8">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-full text-white">
            <Truck size={20} />
          </div>
          <span className="font-display font-bold text-xl text-slate-800">
            TransitOps
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="bg-slate-900 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-slate-800 transition-colors">
            Login
          </Link>
        </div>
      </nav>

      {/* Main Bento Grid Container */}
      <main className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]">
        
        {/* HERO CARD - Spans 8 cols */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="col-span-1 md:col-span-4 lg:col-span-8 row-span-2 bg-white rounded-[2rem] p-10 flex flex-col justify-between shadow-sm border border-slate-100 overflow-hidden relative"
        >
          <div className="relative z-10 max-w-lg">
            <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              Fleet Management System
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-slate-900 leading-tight mb-6">
              Orchestrate your fleet with simplicity.
            </h1>
            <p className="text-slate-500 text-lg mb-8">
              The modern backbone of logistics. Live telemetry, automated dispatching, and global asset tracking in one unified interface.
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full font-bold hover:bg-blue-700 transition-colors w-max">
              Get Started <ArrowRight size={18} />
            </Link>
          </div>

          {/* Contextual Hero SVG (Abstract Logistics Route) */}
          <svg className="absolute right-[-10%] bottom-[-10%] w-[60%] h-[120%] opacity-20 pointer-events-none" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 350 C 100 200, 200 300, 350 50" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" strokeDasharray="20 20"/>
            <circle cx="50" cy="350" r="24" fill="#3b82f6"/>
            <circle cx="350" cy="50" r="32" fill="#3b82f6"/>
            <rect x="180" y="240" width="80" height="80" rx="20" fill="#cbd5e1"/>
          </svg>
        </motion.div>

        {/* STAT 1 - Spans 4 cols */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="col-span-1 md:col-span-2 lg:col-span-4 bg-slate-900 rounded-[2rem] p-8 flex flex-col justify-center items-start shadow-sm border border-slate-800 relative overflow-hidden"
        >
          <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-blue-500/20 rounded-full blur-[40px]"></div>
          <Activity size={32} className="text-blue-400 mb-6" />
          <h3 className="text-5xl font-display font-bold text-white mb-2">99.9%</h3>
          <p className="text-slate-400 font-medium">Uptime Reliability</p>
        </motion.div>

        {/* STAT 2 - Spans 4 cols */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="col-span-1 md:col-span-2 lg:col-span-4 bg-blue-50 rounded-[2rem] p-8 flex flex-col justify-center items-start shadow-sm border border-blue-100"
        >
          <Globe2 size={32} className="text-blue-600 mb-6" />
          <h3 className="text-5xl font-display font-bold text-blue-900 mb-2">10k+</h3>
          <p className="text-blue-600/80 font-medium">Active Vehicles Tracked</p>
        </motion.div>

        {/* FEATURE 1 - Spans 4 cols */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="col-span-1 md:col-span-2 lg:col-span-4 row-span-2 bg-white rounded-[2rem] p-8 flex flex-col shadow-sm border border-slate-100 relative overflow-hidden"
        >
          <div className="bg-emerald-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
            <ShieldCheck size={28} className="text-emerald-600" />
          </div>
          <h3 className="text-2xl font-display font-bold text-slate-900 mb-3">Secure Operations</h3>
          <p className="text-slate-500 mb-8">Impenetrable encryption for all transit logs, driver data, and routing analytics.</p>
          
          {/* High Quality Security SVG */}
          <div className="mt-auto flex justify-center">
            <svg className="w-full h-40" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="50" y="25" width="100" height="100" rx="24" fill="#ecfdf5" />
              <path d="M100 50L130 65V90C130 110 100 120 100 120C100 120 70 110 70 90V65L100 50Z" stroke="#059669" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M90 90L96.6667 96.6667L110 83.3333" stroke="#059669" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </motion.div>

        {/* FEATURE 2 - Spans 8 cols */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="col-span-1 md:col-span-4 lg:col-span-8 bg-white rounded-[2rem] p-8 flex flex-col md:flex-row shadow-sm border border-slate-100 items-center justify-between gap-8"
        >
          <div className="max-w-md">
            <h3 className="text-3xl font-display font-bold text-slate-900 mb-4">Instant Predictive Dispatch</h3>
            <p className="text-slate-500 text-lg">
              Automated driver assignment based on operational constraints, hours of service, and predictive maintenance schedules.
            </p>
          </div>
          
          {/* High Quality Dispatch/Dashboard SVG */}
          <div className="w-full md:w-1/2 flex justify-end">
            <svg className="w-full max-w-[250px] h-auto" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="10" y="10" width="280" height="180" rx="20" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="6"/>
              <rect x="30" y="40" width="100" height="30" rx="8" fill="#cbd5e1"/>
              <rect x="30" y="90" width="180" height="20" rx="6" fill="#e2e8f0"/>
              <rect x="30" y="130" width="240" height="20" rx="6" fill="#e2e8f0"/>
              <circle cx="230" cy="55" r="20" fill="#3b82f6"/>
              <path d="M225 55L230 60L240 50" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </motion.div>

        {/* CTA CARD - Spans 12 cols */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="col-span-1 md:col-span-4 lg:col-span-12 bg-slate-900 rounded-[2rem] p-12 text-center flex flex-col items-center justify-center relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-8 relative z-10">
            Ready to upgrade your logistics?
          </h2>
          <Link to="/login" className="bg-white text-slate-900 px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform relative z-10 shadow-xl">
            Access Terminal
          </Link>
        </motion.div>
        
      </main>

      {/* Simple Footer */}
      <footer className="w-full max-w-6xl mt-12 py-8 flex justify-between items-center text-slate-400 font-medium text-sm">
        <span>© 2026 TransitOps. All rights reserved.</span>
        <div className="flex gap-6">
          <a href="#" className="hover:text-slate-600 transition-colors">Privacy</a>
          <a href="#" className="hover:text-slate-600 transition-colors">Terms</a>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
