import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import KPICard from '../components/KPICard';
import LiveMap from '../components/LiveMap';
import { 
  Truck, 
  MapPin, 
  DollarSign, 
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  Activity
} from 'lucide-react';

const getContainerVariants = (shouldReduceMotion) => ({
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: shouldReduceMotion ? 0 : 0.1 }
  }
});

const getItemVariants = (shouldReduceMotion) => ({
  hidden: { opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20, duration: shouldReduceMotion ? 0.1 : undefined } }
});

const Dashboard = () => {
  const { token } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const containerVariants = getContainerVariants(shouldReduceMotion);
  const itemVariants = getItemVariants(shouldReduceMotion);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = region ? `/api/dashboard?region=${encodeURIComponent(region)}` : '/api/dashboard';
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      setData(result);

      const [vehRes, tripsRes] = await Promise.all([
        fetch(region ? `/api/vehicles?home_depot=${encodeURIComponent(region)}` : '/api/vehicles', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/trips', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const vehList = await vehRes.json();
      const tripsList = await tripsRes.json();

      setVehicles(vehList);
      setTrips(tripsList);
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token, region]);

  const handleResolveAlert = async (alertId) => {
    try {
      const res = await fetch(`/api/dashboard/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to resolve alert');
      }
    } catch (e) {
      console.error('Error resolving alert:', e);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex h-full items-center justify-center min-h-[50vh]">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="text-blue-500 bg-white p-4 rounded-2xl shadow-xl border border-slate-100"
        >
          <Activity size={32} />
        </motion.div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const alerts = data?.alerts || [];

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="show" 
      className="max-w-7xl mx-auto space-y-8 pb-12"
    >
      {/* Cinematic Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200/60 pb-6 pt-2">
        <div className="max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tighter leading-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500">
            Fleet Intelligence
          </h2>
          <p className="text-slate-500 text-lg mt-3 font-medium">Real-time status overview and predictive anomaly detection.</p>
        </div>

        {/* Region Filter */}
        <div className="flex items-center gap-3 bg-white/80 p-2 rounded-2xl shadow-sm backdrop-blur-md border border-slate-200">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="bg-transparent text-slate-700 focus:outline-none focus:ring-0 px-3 py-1 font-bold cursor-pointer"
          >
            <option value="">All Regions</option>
            <option value="New York">New York</option>
            <option value="Chicago">Chicago</option>
            <option value="Los Angeles">Los Angeles</option>
            <option value="Houston">Houston</option>
            <option value="Atlanta">Atlanta</option>
          </select>
          <button 
            onClick={fetchData} 
            className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors shadow-sm cursor-pointer"
            title="Refresh statistics"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </motion.div>

      {/* Grid Flow Dense Layout (Gapless Bento Grid concept) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 grid-flow-dense">
        
        {/* KPIs */}
        <div className="col-span-1 md:col-span-1 lg:col-span-1">
          <KPICard
            title="Utilization"
            value={kpis.vehicles ? `${kpis.vehicles.onTrip}/${kpis.vehicles.total}` : '0/0'}
            subtitle="Active / Total"
            icon={Truck}
            color="text-blue-500"
            delay={0.1}
          />
        </div>
        <div className="col-span-1 md:col-span-1 lg:col-span-1">
          <KPICard
            title="Status"
            value={kpis.vehicles ? `${kpis.vehicles.available} Avail` : '0 Avail'}
            subtitle={kpis.vehicles ? `${kpis.vehicles.inShop} Shop / ${kpis.vehicles.retired} Ret` : '0 Shop'}
            icon={MapPin}
            color="text-emerald-500"
            delay={0.2}
          />
        </div>
        <div className="col-span-1 md:col-span-1 lg:col-span-1">
          <KPICard
            title="Billed Rev"
            value={kpis.financials ? `$${parseFloat(kpis.financials.revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '$0.00'}
            subtitle="Dispatched & Completed"
            icon={DollarSign}
            color="text-indigo-500"
            delay={0.3}
          />
        </div>
        <div className="col-span-1 md:col-span-1 lg:col-span-1">
          <KPICard
            title="Op Cost"
            value={kpis.financials ? `$${parseFloat(kpis.financials.operationalCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '$0.00'}
            subtitle="Fuel + Maintenance"
            icon={Activity}
            color="text-amber-500"
            delay={0.4}
          />
        </div>

        {/* Live Map (Spans 3 cols) */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 lg:col-span-3 row-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col relative group">
          <div className="absolute top-6 left-6 z-[1000] bg-white/90 backdrop-blur-xl px-5 py-2.5 rounded-full border border-slate-200 shadow-lg flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <span className="text-sm font-extrabold text-slate-800 tracking-wide uppercase">Live Tracking</span>
          </div>
          <div className="flex-1 w-full min-h-[400px] lg:h-[600px] z-0">
             <LiveMap vehicles={vehicles} trips={trips} />
          </div>
        </motion.div>

        {/* Alerts (Spans 1 col, 2 rows) */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 lg:col-span-1 row-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8 flex flex-col min-h-[400px] lg:h-[600px]">
          <div className="flex justify-between items-end mb-6 border-b border-slate-100 pb-5">
            <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Anomalies</h3>
            <span className="bg-red-50 text-red-600 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm">
              {alerts.length} Detect
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                <div className="p-4 bg-emerald-50 rounded-full">
                  <CheckCircle size={40} className="text-emerald-500" />
                </div>
                <p className="text-base font-bold text-slate-500">Fleet operating normally</p>
              </div>
            ) : (
              alerts.map((alert, idx) => (
                <motion.div 
                  initial={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: shouldReduceMotion ? 0 : 0.5 + (idx * 0.1) }}
                  key={alert.id}
                  className={`border rounded-2xl p-5 space-y-4 transition-all hover:shadow-lg ${
                    alert.severity === 'Critical'
                      ? 'bg-gradient-to-br from-red-50/50 to-white border-red-100'
                      : 'bg-gradient-to-br from-amber-50/50 to-white border-amber-100'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${alert.severity === 'Critical' ? 'bg-red-100' : 'bg-amber-100'}`}>
                        <AlertTriangle size={16} className={alert.severity === 'Critical' ? 'text-red-600' : 'text-amber-600'} />
                      </div>
                      <span className="text-sm font-extrabold text-slate-800 leading-tight">{alert.type}</span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    {alert.description}
                  </p>

                  <div className="flex justify-between items-center text-xs text-slate-500 pt-3 border-t border-slate-200/60 mt-3">
                    <span className="font-bold bg-slate-100 px-2 py-1 rounded-md">{alert.vehicle_plate}</span>
                    {!String(alert.id).startsWith('pred-') && (
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        className="text-blue-600 hover:text-blue-800 font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
};

export default Dashboard;
