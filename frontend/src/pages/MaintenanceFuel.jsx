import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Check, Fuel, Settings, DollarSign } from 'lucide-react';

const MaintenanceFuel = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('maintenance');

  // Logs data
  const [maintenance, setMaintenance] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form visibility
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [closeMaintId, setCloseMaintId] = useState(null);

  // Maint Form states
  const [maintVehId, setMaintVehId] = useState('');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintOdo, setMaintOdo] = useState('');
  const [maintCost, setMaintCost] = useState('');
  
  // Maint Close Form states
  const [closeCost, setCloseCost] = useState('');
  const [closeEndDate, setCloseEndDate] = useState('');

  // Fuel Form states
  const [fuelVehId, setFuelVehId] = useState('');
  const [fuelDriverId, setFuelDriverId] = useState('');
  const [fuelAmt, setFuelAmt] = useState('');
  const [fuelDist, setFuelDist] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [fuelDate, setFuelDate] = useState('');

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [maintRes, fuelRes, expRes, vehRes, drvRes] = await Promise.all([
        fetch('/api/maintenance', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/expenses/fuel', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/expenses/other', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/vehicles', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/drivers', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const maintData = await maintRes.json();
      const fuelData = await fuelRes.json();
      const expData = await expRes.json();
      const vehData = await vehRes.json();
      const drvData = await drvRes.json();

      setMaintenance(maintData);
      setFuelLogs(fuelData);
      setExpenses(expData);
      setVehicles(vehData);
      setDrivers(drvData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAllData();
    }
  }, [token]);

  const handleMaintSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicle_id: parseInt(maintVehId),
          description: maintDesc,
          odometer_at_service: parseInt(maintOdo),
          cost: parseFloat(maintCost) || 0.0,
          start_date: new Date().toISOString().split('T')[0]
        })
      });

      if (res.ok) {
        setShowMaintForm(false);
        setMaintVehId('');
        setMaintDesc('');
        setMaintOdo('');
        setMaintCost('');
        fetchAllData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create maintenance');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseMaintSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/maintenance/${closeMaintId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cost: parseFloat(closeCost) || 0.0,
          end_date: closeEndDate || new Date().toISOString().split('T')[0]
        })
      });

      if (res.ok) {
        setCloseMaintId(null);
        setCloseCost('');
        setCloseEndDate('');
        fetchAllData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to close maintenance');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/expenses/fuel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicle_id: parseInt(fuelVehId),
          driver_id: parseInt(fuelDriverId),
          fuel_amount: parseFloat(fuelAmt),
          distance_traveled: parseFloat(fuelDist),
          cost: parseFloat(fuelCost),
          date: fuelDate || new Date().toISOString().split('T')[0]
        })
      });

      if (res.ok) {
        setShowFuelForm(false);
        setFuelVehId('');
        setFuelDriverId('');
        setFuelAmt('');
        setFuelDist('');
        setFuelCost('');
        setFuelDate('');
        fetchAllData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add fuel entry');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isManager = user?.role === 'Fleet Manager';
  const isDriverOrManager = user?.role === 'Fleet Manager' || user?.role === 'Driver';

  return (
    <div className="space-y-6">
      
      {/* Header and Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Maintenance & Fuel logs</h2>
          <p className="text-slate-400 text-sm mt-1">Manage workshop orders and asset expenditures</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'maintenance' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings size={14} />
            <span>Maintenance</span>
          </button>
          <button
            onClick={() => setActiveTab('fuel')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'fuel' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Fuel size={14} />
            <span>Fuel Logs</span>
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'expenses' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign size={14} />
            <span>Tolls & Misc</span>
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading records...</div>
      ) : (
        <div className="space-y-6">
          
          {/* 1. Maintenance Tab */}
          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                {isManager && !showMaintForm && (
                  <button
                    onClick={() => setShowMaintForm(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
                  >
                    <Plus size={16} />
                    <span>Create Repair Order</span>
                  </button>
                )}
              </div>

              {showMaintForm && (
                <form onSubmit={handleMaintSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-bold text-white">Open Repair Order</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Select Vehicle</label>
                      <select
                        value={maintVehId}
                        onChange={(e) => setMaintVehId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                        required
                      >
                        <option value="">-- Choose Vehicle --</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.make} {v.model} ({v.license_plate})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Service Odometer (km)</label>
                      <input
                        type="number"
                        value={maintOdo}
                        onChange={(e) => setMaintOdo(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Initial Cost Estimation (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={maintCost}
                        onChange={(e) => setMaintCost(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Description</label>
                      <input
                        type="text"
                        value={maintDesc}
                        onChange={(e) => setMaintDesc(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                        placeholder="e.g. Brakes inspection"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => setShowMaintForm(false)}
                      className="bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-300 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                      Open Ticket
                    </button>
                  </div>
                </form>
              )}

              {/* Maintenance Close Modal */}
              {closeMaintId !== null && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                  <form onSubmit={handleCloseMaintSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                    <h3 className="text-lg font-bold text-white">Close Repair Order</h3>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Final Invoice Cost (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={closeCost}
                        onChange={(e) => setCloseCost(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Completion Date</label>
                      <input
                        type="date"
                        value={closeEndDate}
                        onChange={(e) => setCloseEndDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                        required
                      />
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                      <button
                        type="button"
                        onClick={() => setCloseMaintId(null)}
                        className="bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-300 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                      >
                        Close Ticket
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-850/50">
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Vehicle</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Description</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Odometer</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Cost</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Dates</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                      {isManager && <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {maintenance.map((m) => (
                      <tr key={m.id} className="border-b border-slate-800 hover:bg-slate-850/30 transition-colors">
                        <td className="p-4">
                          <span className="font-bold text-white text-sm block">{m.vehicle_make} {m.vehicle_model}</span>
                          <span className="text-[10px] text-slate-500 font-medium">Plate: {m.vehicle_plate}</span>
                        </td>
                        <td className="p-4 text-slate-300 text-sm font-medium">{m.description}</td>
                        <td className="p-4 text-slate-300 text-sm">{parseInt(m.odometer_at_service).toLocaleString()} km</td>
                        <td className="p-4 text-slate-300 text-sm font-semibold">₹{parseFloat(m.cost).toFixed(2)}</td>
                        <td className="p-4">
                          <div className="text-xs text-slate-300">
                            <span className="block font-medium">Start: {m.start_date ? m.start_date.split('T')[0] : 'N/A'}</span>
                            <span className="block text-slate-500">End: {m.end_date ? m.end_date.split('T')[0] : 'Open'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            m.status === 'Open' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                        {isManager && (
                          <td className="p-4 text-right">
                            {m.status === 'Open' && (
                              <button
                                onClick={() => setCloseMaintId(m.id)}
                                className="flex items-center gap-1.5 ml-auto p-1.5 bg-slate-800 hover:bg-slate-700 text-green-400 hover:text-white rounded-lg transition-colors border border-slate-700 text-xs font-medium cursor-pointer"
                              >
                                <Check size={12} />
                                <span>Close Ticket</span>
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Fuel Logs Tab */}
          {activeTab === 'fuel' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                {isDriverOrManager && !showFuelForm && (
                  <button
                    onClick={() => setShowFuelForm(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
                  >
                    <Plus size={16} />
                    <span>Log Fuel Intake</span>
                  </button>
                )}
              </div>

              {showFuelForm && (
                <form onSubmit={handleFuelSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-bold text-white">Log Fuel Intake</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Select Vehicle</label>
                      <select
                        value={fuelVehId}
                        onChange={(e) => setFuelVehId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                        required
                      >
                        <option value="">-- Choose Vehicle --</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.make} {v.model} ({v.license_plate})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Select Driver</label>
                      <select
                        value={fuelDriverId}
                        onChange={(e) => setFuelDriverId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                        required
                      >
                        <option value="">-- Choose Driver --</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Date</label>
                      <input
                        type="date"
                        value={fuelDate}
                        onChange={(e) => setFuelDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Fuel Amount (Liters)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={fuelAmt}
                        onChange={(e) => setFuelAmt(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                        placeholder="e.g. 150"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Distance Traveled (km)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={fuelDist}
                        onChange={(e) => setFuelDist(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                        placeholder="e.g. 450"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Total Price Paid (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={fuelCost}
                        onChange={(e) => setFuelCost(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                        placeholder="e.g. 210.00"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => setShowFuelForm(false)}
                      className="bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-300 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                      Save fuel log
                    </button>
                  </div>
                </form>
              )}

              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-850/50">
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Date</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Vehicle</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Driver</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Fuel Amount</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Distance</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Total Cost</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Efficiency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fuelLogs.map((log) => {
                      const eff = log.fuel_amount > 0 ? log.distance_traveled / log.fuel_amount : 0;
                      return (
                        <tr key={log.id} className="border-b border-slate-800 hover:bg-slate-850/30 transition-colors">
                          <td className="p-4 text-slate-300 text-sm font-medium">{log.date ? log.date.split('T')[0] : 'N/A'}</td>
                          <td className="p-4">
                            <span className="font-bold text-white text-sm block">{log.vehicle_make} {log.vehicle_model}</span>
                            <span className="text-[10px] text-slate-500 font-medium">Plate: {log.vehicle_plate}</span>
                          </td>
                          <td className="p-4 text-slate-300 text-sm font-semibold">{log.driver_name}</td>
                          <td className="p-4 text-slate-300 text-sm">{parseFloat(log.fuel_amount).toFixed(2)} L</td>
                          <td className="p-4 text-slate-300 text-sm">{parseFloat(log.distance_traveled).toLocaleString()} km</td>
                          <td className="p-4 text-slate-300 text-sm font-bold">₹{parseFloat(log.cost).toFixed(2)}</td>
                          <td className="p-4 text-sm font-semibold text-blue-400">
                            {eff.toFixed(2)} km/L
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Other Expenses Tab */}
          {activeTab === 'expenses' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-850/50">
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Expense ID</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Route</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Vehicle</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Expense Type</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Cost</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="border-b border-slate-800 hover:bg-slate-850/30 transition-colors">
                      <td className="p-4 text-slate-400 font-bold text-sm">#{exp.id}</td>
                      <td className="p-4 text-slate-300 font-medium text-sm">{exp.source} ➔ {exp.destination}</td>
                      <td className="p-4 text-slate-300 text-sm">{exp.license_plate || 'N/A'}</td>
                      <td className="p-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          exp.type === 'Toll' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}>
                          {exp.type}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300 text-sm font-bold">₹{parseFloat(exp.amount).toFixed(2)}</td>
                      <td className="p-4 text-slate-400 text-xs font-medium">{exp.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default MaintenanceFuel;
