import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const Vehicles = () => {
  const { token, user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editVehicleId, setEditVehicleId] = useState(null);

  // Form states
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [licensePlate, setLicensePlate] = useState('');
  const [maxCargoWeight, setMaxCargoWeight] = useState('');
  const [odometer, setOdometer] = useState(0);
  const [status, setStatus] = useState('Available');
  const [homeDepot, setHomeDepot] = useState('New York');
  const [acquisitionCost, setAcquisitionCost] = useState(0.0);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vehicles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setVehicles(data);
    } catch (e) {
      console.error('Error fetching vehicles:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchVehicles();
    }
  }, [token]);

  const resetForm = () => {
    setMake('');
    setModel('');
    setYear(new Date().getFullYear());
    setLicensePlate('');
    setMaxCargoWeight('');
    setOdometer(0);
    setStatus('Available');
    setHomeDepot('New York');
    setAcquisitionCost(0.0);
    setEditVehicleId(null);
    setShowAddForm(false);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          make,
          model,
          year: parseInt(year),
          license_plate: licensePlate,
          max_cargo_weight: parseFloat(maxCargoWeight),
          odometer: parseInt(odometer),
          status,
          home_depot: homeDepot,
          acquisition_cost: parseFloat(acquisitionCost)
        })
      });

      if (res.ok) {
        resetForm();
        fetchVehicles();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save vehicle');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (vehicle) => {
    setEditVehicleId(vehicle.id);
    setMake(vehicle.make);
    setModel(vehicle.model);
    setYear(vehicle.year);
    setLicensePlate(vehicle.license_plate);
    setMaxCargoWeight(vehicle.max_cargo_weight);
    setOdometer(vehicle.odometer);
    setStatus(vehicle.status);
    setHomeDepot(vehicle.home_depot);
    setAcquisitionCost(vehicle.acquisition_cost);
    setShowAddForm(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/vehicles/${editVehicleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          make,
          model,
          year: parseInt(year),
          license_plate: licensePlate,
          max_cargo_weight: parseFloat(maxCargoWeight),
          odometer: parseInt(odometer),
          status,
          home_depot: homeDepot,
          acquisition_cost: parseFloat(acquisitionCost)
        })
      });

      if (res.ok) {
        resetForm();
        fetchVehicles();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update vehicle');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchVehicles();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete vehicle');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isManager = user?.role === 'Fleet Manager';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Vehicles Registry</h2>
          <p className="text-slate-400 text-sm mt-1">Manage and track fleet vehicles</p>
        </div>
        {isManager && !showAddForm && (
          <button
            onClick={() => { resetForm(); setShowAddForm(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Plus size={16} />
            <span>Add Vehicle</span>
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={editVehicleId ? handleUpdateSubmit : handleAddSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">{editVehicleId ? 'Update Vehicle' : 'Add New Vehicle'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Make</label>
              <input
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                placeholder="e.g. Volvo"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                placeholder="e.g. VNL 860"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">License Plate</label>
              <input
                type="text"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                placeholder="e.g. LV-983-FM"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Max Capacity (kg)</label>
              <input
                type="number"
                value={maxCargoWeight}
                onChange={(e) => setMaxCargoWeight(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                placeholder="e.g. 36000"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Odometer (km)</label>
              <input
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Home Depot</label>
              <select
                value={homeDepot}
                onChange={(e) => setHomeDepot(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
              >
                <option value="New York">New York</option>
                <option value="Chicago">Chicago</option>
                <option value="Los Angeles">Los Angeles</option>
                <option value="Houston">Houston</option>
                <option value="Atlanta">Atlanta</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi">Delhi</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Chennai">Chennai</option>
                <option value="Kolkata">Kolkata</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Acquisition Cost (₹)</label>
              <input
                type="number"
                step="0.01"
                value={acquisitionCost}
                onChange={(e) => setAcquisitionCost(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
              >
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="In Shop">In Shop</option>
                <option value="Retired">Retired</option>
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
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              {editVehicleId ? 'Update Vehicle' : 'Save Vehicle'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading vehicles...</div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-850/50">
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Vehicle</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">License Plate</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Home Depot</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Max Capacity</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Odometer</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Acquisition Cost</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                {isManager && <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-b border-slate-800 hover:bg-slate-850/30 transition-colors">
                  <td className="p-4">
                    <span className="font-bold text-white text-sm block">{vehicle.make} {vehicle.model}</span>
                    <span className="text-[10px] text-slate-500 font-medium">Year: {vehicle.year}</span>
                  </td>
                  <td className="p-4 text-slate-300 font-medium text-sm">{vehicle.license_plate}</td>
                  <td className="p-4 text-slate-300 text-sm">{vehicle.home_depot}</td>
                  <td className="p-4 text-slate-300 text-sm">{parseFloat(vehicle.max_cargo_weight).toLocaleString()} kg</td>
                  <td className="p-4 text-slate-300 text-sm">{parseInt(vehicle.odometer).toLocaleString()} km</td>
                  <td className="p-4 text-slate-300 text-sm">₹{parseFloat(vehicle.acquisition_cost).toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      vehicle.status === 'Available' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      vehicle.status === 'On Trip' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      vehicle.status === 'In Shop' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {vehicle.status}
                    </span>
                  </td>
                  {isManager && (
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEditClick(vehicle)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-white rounded-lg transition-colors border border-slate-700"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(vehicle.id)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-750 text-red-400 hover:text-white rounded-lg transition-colors border border-slate-700"
                        >
                          <Trash2 size={14} />
                        </button>
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

export default Vehicles;
