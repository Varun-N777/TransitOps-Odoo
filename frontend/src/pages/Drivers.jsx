import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';

const Drivers = () => {
  const { token, user } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editDriverId, setEditDriverId] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [safetyScore, setSafetyScore] = useState(100.00);
  const [status, setStatus] = useState('Available');

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/drivers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setDrivers(data);
    } catch (e) {
      console.error('Error fetching drivers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDrivers();
    }
  }, [token]);

  const resetForm = () => {
    setName('');
    setLicenseNumber('');
    setLicenseExpiry('');
    setSafetyScore(100.00);
    setStatus('Available');
    setEditDriverId(null);
    setShowAddForm(false);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          license_number: licenseNumber,
          license_expiry: licenseExpiry,
          safety_score: parseFloat(safetyScore),
          status
        })
      });

      if (res.ok) {
        resetForm();
        fetchDrivers();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save driver');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (driver) => {
    setEditDriverId(driver.id);
    setName(driver.name);
    setLicenseNumber(driver.license_number);
    // Format date to YYYY-MM-DD
    const dateFormatted = driver.license_expiry ? driver.license_expiry.split('T')[0] : '';
    setLicenseExpiry(dateFormatted);
    setSafetyScore(driver.safety_score);
    setStatus(driver.status);
    setShowAddForm(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/drivers/${editDriverId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          license_number: licenseNumber,
          license_expiry: licenseExpiry,
          safety_score: parseFloat(safetyScore),
          status
        })
      });

      if (res.ok) {
        resetForm();
        fetchDrivers();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update driver');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) return;
    try {
      const res = await fetch(`/api/drivers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDrivers();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete driver');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const hasWriteAccess = user?.role === 'Fleet Manager' || user?.role === 'Safety Officer';
  const isManager = user?.role === 'Fleet Manager';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-sans">Drivers Registry</h2>
          <p className="text-slate-400 text-sm mt-1">Manage driver registry, license expiry dates, and safety scores</p>
        </div>
        {hasWriteAccess && !showAddForm && (
          <button
            onClick={() => { resetForm(); setShowAddForm(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Plus size={16} />
            <span>Add Driver</span>
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={editDriverId ? handleUpdateSubmit : handleAddSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">{editDriverId ? 'Update Driver Information' : 'Add New Driver'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Driver Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                placeholder="e.g. John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">License Number</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                placeholder="e.g. DL-882736"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">License Expiry Date</label>
              <input
                type="date"
                value={licenseExpiry}
                onChange={(e) => setLicenseExpiry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Safety Score (0-100)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={safetyScore}
                onChange={(e) => setSafetyScore(e.target.value)}
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
                <option value="Suspended">Suspended</option>
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
              {editDriverId ? 'Update Driver' : 'Save Driver'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading drivers database...</div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-850/50">
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Driver Name</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">License Number</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">License Expiry</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Safety Score</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                {hasWriteAccess && <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => {
                const isExpired = new Date(driver.license_expiry) < new Date();
                return (
                  <tr key={driver.id} className="border-b border-slate-800 hover:bg-slate-850/30 transition-colors">
                    <td className="p-4 font-bold text-white text-sm">{driver.name}</td>
                    <td className="p-4 text-slate-300 font-medium text-sm">{driver.license_number}</td>
                    <td className="p-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className={isExpired ? 'text-red-400 font-bold' : 'text-slate-300'}>
                          {driver.license_expiry ? driver.license_expiry.split('T')[0] : 'N/A'}
                        </span>
                        {isExpired && (
                          <span className="flex items-center gap-0.5 text-[10px] bg-red-500/10 text-red-400 border border-red-500/25 px-1.5 py-0.5 rounded-full font-bold">
                            <AlertCircle size={10} />
                            EXPIRED
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-semibold">
                      <span className={
                        driver.safety_score >= 90 ? 'text-green-400' :
                        driver.safety_score >= 80 ? 'text-amber-400' :
                        'text-red-400'
                      }>
                        {parseFloat(driver.safety_score).toFixed(1)}/100
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        driver.status === 'Available' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        driver.status === 'On Trip' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {driver.status}
                      </span>
                    </td>
                    {hasWriteAccess && (
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEditClick(driver)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-white rounded-lg transition-colors border border-slate-700"
                          >
                            <Edit2 size={14} />
                          </button>
                          {isManager && (
                            <button
                              onClick={() => handleDeleteClick(driver.id)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-750 text-red-400 hover:text-white rounded-lg transition-colors border border-slate-700"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Drivers;
