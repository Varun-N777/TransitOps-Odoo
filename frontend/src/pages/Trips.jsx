import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Check, Play, X, Star } from 'lucide-react';

const Trips = () => {
  const { token, user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [fetchingRecs, setFetchingRecs] = useState(false);

  // Completion modal state
  const [completeTripId, setCompleteTripId] = useState(null);
  const [odoReading, setOdoReading] = useState('');
  const [fuelAmt, setFuelAmt] = useState('');
  const [fuelCost, setFuelCost] = useState('');

  // Form states
  const [source, setSource] = useState('New York');
  const [destination, setDestination] = useState('Chicago');
  const [cargoWeight, setCargoWeight] = useState('');
  const [revenue, setRevenue] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/trips', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTrips(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const [vRes, dRes] = await Promise.all([
        fetch('/api/vehicles', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/drivers', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const vData = await vRes.json();
      const dData = await dRes.json();
      setVehicles(vData);
      setDrivers(dData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTrips();
      fetchAssets();
    }
  }, [token]);

  const handleFetchRecommendations = async () => {
    const w = parseFloat(cargoWeight);
    if (isNaN(w) || w <= 0) {
      alert('Please enter a valid cargo weight to generate recommendations.');
      return;
    }

    setFetchingRecs(true);
    try {
      const res = await fetch(`/api/trips/recommendations?cargo_weight=${w}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setRecommendations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingRecs(false);
    }
  };

  const selectRecommendation = (rec) => {
    setVehicleId(rec.vehicle_id);
    setDriverId(rec.driver_id);
  };

  const resetForm = () => {
    setSource('New York');
    setDestination('Chicago');
    setCargoWeight('');
    setRevenue('');
    setVehicleId('');
    setDriverId('');
    setRecommendations([]);
    setShowAddForm(false);
  };

  const handleCreateTrip = async (e, shouldDispatch = false) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          source,
          destination,
          cargo_weight: parseFloat(cargoWeight),
          revenue: parseFloat(revenue) || 0.0,
          vehicle_id: vehicleId ? parseInt(vehicleId) : null,
          driver_id: driverId ? parseInt(driverId) : null,
          status: shouldDispatch ? 'Dispatched' : 'Draft'
        })
      });

      if (res.ok) {
        resetForm();
        fetchTrips();
        fetchAssets(); // Refresh vehicle/driver lists
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create trip');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDispatch = async (tripId) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchTrips();
        fetchAssets();
      } else {
        const err = await res.json();
        alert(err.error || 'Dispatch failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async (tripId) => {
    if (!window.confirm('Are you sure you want to cancel this trip?')) return;
    try {
      const res = await fetch(`/api/trips/${tripId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchTrips();
        fetchAssets();
      } else {
        const err = await res.json();
        alert(err.error || 'Cancellation failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/trips/${completeTripId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          odometer_reading: parseInt(odoReading),
          fuel_amount: parseFloat(fuelAmt) || null,
          fuel_cost: parseFloat(fuelCost) || null
        })
      });

      if (res.ok) {
        setCompleteTripId(null);
        setOdoReading('');
        setFuelAmt('');
        setFuelCost('');
        fetchTrips();
        fetchAssets();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to complete trip');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isDriverOrManager = user?.role === 'Fleet Manager' || user?.role === 'Driver';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Trips & Dispatch</h2>
          <p className="text-slate-400 text-sm mt-1 font-sans">Dispatch planner, lifecycle controls, and smart pairings</p>
        </div>
        {isDriverOrManager && !showAddForm && (
          <button
            onClick={() => { resetForm(); setShowAddForm(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Plus size={16} />
            <span>Create Trip</span>
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white">Create New Trip</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Source Depot</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm font-sans"
              >
                <option value="New York">New York</option>
                <option value="Chicago">Chicago</option>
                <option value="Los Angeles">Los Angeles</option>
                <option value="Houston">Houston</option>
                <option value="Atlanta">Atlanta</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Destination Depot</label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm font-sans"
              >
                <option value="New York">New York</option>
                <option value="Chicago">Chicago</option>
                <option value="Los Angeles">Los Angeles</option>
                <option value="Houston">Houston</option>
                <option value="Atlanta">Atlanta</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Cargo Weight (kg)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={cargoWeight}
                  onChange={(e) => setCargoWeight(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm font-sans"
                  placeholder="e.g. 15000"
                  required
                />
                <button
                  type="button"
                  onClick={handleFetchRecommendations}
                  disabled={fetchingRecs}
                  className="bg-slate-950 border border-slate-800 hover:bg-slate-850 text-blue-400 hover:text-blue-300 font-semibold px-3 py-2.5 rounded-xl transition-colors text-xs shrink-0"
                >
                  {fetchingRecs ? 'Analyzing...' : 'Find Matches'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Revenue ($)</label>
              <input
                type="number"
                step="0.01"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm font-sans"
                placeholder="e.g. 3500.00"
                required
              />
            </div>
          </div>

          {/* Smart Recommendations Panel */}
          {recommendations.length > 0 && (
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider">
                <Star size={14} className="fill-current text-blue-400" />
                Smart Dispatch Recommended Pairings
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendations.map((rec, index) => (
                  <div 
                    key={index}
                    onClick={() => selectRecommendation(rec)}
                    className={`border p-4 rounded-xl cursor-pointer transition-all hover:bg-slate-900 ${
                      vehicleId === rec.vehicle_id && driverId === rec.driver_id
                        ? 'border-blue-500 bg-blue-500/5'
                        : 'border-slate-800 bg-slate-900/50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-white">{rec.vehicle_make} {rec.vehicle_model}</span>
                      <span className="text-[10px] bg-blue-500/10 text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-500/20">
                        Score: {rec.score}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">Driver: {rec.driver_name}</p>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-2 italic">
                      {rec.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fallback Selector Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Select Vehicle</label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm font-sans"
              >
                <option value="">-- No vehicle assigned (Draft mode) --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} ({v.license_plate}) - Cap: {v.max_cargo_weight} kg - Status: {v.status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Select Driver</label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm font-sans"
              >
                <option value="">-- No driver assigned (Draft mode) --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} - Safety: {d.safety_score} - Status: {d.status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-300 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => handleCreateTrip(e, false)}
              className="bg-slate-800 hover:bg-slate-750 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border border-slate-700"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={(e) => handleCreateTrip(e, true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              Dispatch Trip
            </button>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {completeTripId !== null && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCompleteSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Complete Dispatched Trip</h3>
            <p className="text-xs text-slate-400 font-medium">Record final trip metrics and update resources back to Available.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Current Odometer Reading (km)</label>
                <input
                  type="number"
                  value={odoReading}
                  onChange={(e) => setOdoReading(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm font-sans"
                  placeholder="e.g. 86200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Fuel Added (Liters)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={fuelAmt}
                    onChange={(e) => setFuelAmt(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm font-sans"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Fuel Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={fuelCost}
                    onChange={(e) => setFuelCost(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm font-sans"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={() => setCompleteTripId(null)}
                className="bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-300 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                Complete Trip
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading trips board...</div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-850/50">
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">ID</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Route</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Cargo Weight</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Billed Revenue</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Vehicle</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Driver</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                {isDriverOrManager && <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip.id} className="border-b border-slate-800 hover:bg-slate-850/30 transition-colors">
                  <td className="p-4 text-slate-400 font-semibold text-sm">#{trip.id}</td>
                  <td className="p-4">
                    <span className="font-bold text-white text-sm block">{trip.source} ➔ {trip.destination}</span>
                    <span className="text-[10px] text-slate-500 font-medium">Created: {new Date(trip.created_at).toLocaleDateString()}</span>
                  </td>
                  <td className="p-4 text-slate-300 text-sm">{parseFloat(trip.cargo_weight).toLocaleString()} kg</td>
                  <td className="p-4 text-slate-300 text-sm font-semibold">${parseFloat(trip.revenue).toFixed(2)}</td>
                  <td className="p-4 text-slate-300 text-sm">
                    {trip.vehicle_plate ? (
                      <div>
                        <span className="block font-bold text-white">{trip.vehicle_make} {trip.vehicle_model}</span>
                        <span className="text-[10px] text-slate-500">Plate: {trip.vehicle_plate}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-300 text-sm font-medium">
                    {trip.driver_name || <span className="text-slate-500 italic">Unassigned</span>}
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      trip.status === 'Draft' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                      trip.status === 'Dispatched' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      trip.status === 'Completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {trip.status}
                    </span>
                  </td>
                  {isDriverOrManager && (
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        {trip.status === 'Draft' && (
                          <button
                            onClick={() => handleDispatch(trip.id)}
                            className="flex items-center gap-1 p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-white rounded-lg transition-colors border border-slate-700 text-xs font-medium cursor-pointer"
                            title="Dispatch"
                          >
                            <Play size={12} className="fill-current" />
                            <span>Dispatch</span>
                          </button>
                        )}
                        {trip.status === 'Dispatched' && (
                          <button
                            onClick={() => setCompleteTripId(trip.id)}
                            className="flex items-center gap-1 p-1.5 bg-slate-800 hover:bg-slate-700 text-green-400 hover:text-white rounded-lg transition-colors border border-slate-700 text-xs font-medium cursor-pointer"
                            title="Complete"
                          >
                            <Check size={12} />
                            <span>Complete</span>
                          </button>
                        )}
                        {(trip.status === 'Draft' || trip.status === 'Dispatched') && (
                          <button
                            onClick={() => handleCancel(trip.id)}
                            className="flex items-center gap-1 p-1.5 bg-slate-800 hover:bg-slate-750 text-red-400 hover:text-white rounded-lg transition-colors border border-slate-700 text-xs font-medium cursor-pointer"
                            title="Cancel"
                          >
                            <X size={12} />
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Trips;
