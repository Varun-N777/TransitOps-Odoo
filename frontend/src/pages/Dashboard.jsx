import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import KPICard from '../components/KPICard';
import LiveMap from '../components/LiveMap';
import { 
  Truck, 
  MapPin, 
  DollarSign, 
  AlertTriangle,
  RotateCcw,
  CheckCircle
} from 'lucide-react';

const Dashboard = () => {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = region ? `/api/dashboard?region=${encodeURIComponent(region)}` : '/api/dashboard';
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await res.json();
      setData(result);

      // Fetch vehicles and trips list directly for Leaflet
      const [vehRes, tripsRes] = await Promise.all([
        fetch(region ? `/api/vehicles?home_depot=${encodeURIComponent(region)}` : '/api/vehicles', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/trips', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
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
    if (token) {
      fetchData();
    }
  }, [token, region]);

  const handleResolveAlert = async (alertId) => {
    try {
      const res = await fetch(`/api/dashboard/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
    return <div className="p-8 text-center text-slate-400">Loading dashboard metrics...</div>;
  }

  const kpis = data?.kpis || {};
  const alerts = data?.alerts || [];

  return (
    <div className="space-y-6">
      
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Fleet Command Center</h2>
          <p className="text-slate-400 text-sm mt-1">Real-time status overview and alert metrics</p>
        </div>

        {/* Region Filter */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Depot Region:</span>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm font-medium"
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
            className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-850 text-slate-400 hover:text-white transition-colors"
            title="Refresh statistics"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Fleet Utilization"
          value={kpis.vehicles ? `${kpis.vehicles.onTrip}/${kpis.vehicles.total}` : '0/0'}
          subtitle="Vehicles On Trip vs Total"
          icon={Truck}
          color="text-blue-400"
        />
        <KPICard
          title="Operational Status"
          value={kpis.vehicles ? `${kpis.vehicles.available} Available` : '0 Available'}
          subtitle={kpis.vehicles ? `${kpis.vehicles.inShop} In Shop / ${kpis.vehicles.retired} Retired` : '0 In Shop'}
          icon={MapPin}
          color="text-green-400"
        />
        <KPICard
          title="Billed Revenue"
          value={kpis.financials ? `$${parseFloat(kpis.financials.revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '$0.00'}
          subtitle="Dispatched + Completed trips"
          icon={DollarSign}
          color="text-emerald-400"
        />
        <KPICard
          title="Operational Cost"
          value={kpis.financials ? `$${parseFloat(kpis.financials.operationalCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '$0.00'}
          subtitle="Fuel Cost + Maintenance Cost"
          icon={DollarSign}
          color="text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Live Map Panel */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Live Operations Map</h3>
            <span className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Live Sync (30x Multiplier)
            </span>
          </div>
          <LiveMap vehicles={vehicles} trips={trips} />
        </div>

        {/* Alerts card */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white font-sans">Predictive Alerts & Fuel Anomalies</h3>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-[550px] flex flex-col">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-4 border-b border-slate-800 pb-3">
              Active Alerts ({alerts.length})
            </span>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                  <CheckCircle size={32} className="text-green-500/40" />
                  <p className="text-sm font-medium">No alerts detected in fleet</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className={`border rounded-xl p-4 space-y-3 transition-colors ${
                      alert.severity === 'Critical'
                        ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                        : 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className={alert.severity === 'Critical' ? 'text-red-400' : 'text-amber-400'} />
                        <span className="text-xs font-bold text-white">{alert.type}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        alert.severity === 'Critical' 
                          ? 'bg-red-500/15 text-red-400' 
                          : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                      {alert.description}
                    </p>

                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>Vehicle: {alert.vehicle_plate}</span>
                      {!String(alert.id).startsWith('pred-') && (
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          className="text-blue-400 hover:text-blue-300 font-semibold uppercase tracking-wider cursor-pointer"
                        >
                          Resolve Alert
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
