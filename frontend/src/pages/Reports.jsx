import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Download, Fuel, Percent, Wallet, LineChart, ArrowUpDown } from 'lucide-react';

const Reports = () => {
  const { token } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState('fuel_eff');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const reports = await res.json();
      setData(reports);
    } catch (e) {
      console.error('Error fetching reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchReports();
    }
  }, [token]);

  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const getSortedData = () => {
    if (!sortField) return data;

    return [...data].sort((a, b) => {
      let valA, valB;
      
      // Access nested fields
      if (activeReport === 'fuel_eff') {
        valA = a.fuel[sortField];
        valB = b.fuel[sortField];
      } else if (activeReport === 'utilization') {
        valA = a.utilization[sortField];
        valB = b.utilization[sortField];
      } else if (activeReport === 'costs') {
        valA = a.costs[sortField];
        valB = b.costs[sortField];
      } else if (activeReport === 'roi') {
        valA = a.roi[sortField];
        valB = b.roi[sortField];
      }

      // Handle simple string fallback (like vehicle name)
      if (sortField === 'make' || sortField === 'license_plate') {
        valA = a[sortField];
        valB = b[sortField];
      }

      if (valA === undefined) return 1;
      if (valB === undefined) return -1;

      if (typeof valA === 'string') {
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
    });
  };

  const exportCSV = () => {
    let headers = [];
    let rows = [];
    let filename = '';

    if (activeReport === 'fuel_eff') {
      filename = 'fuel_efficiency_report.csv';
      headers = ['Vehicle', 'License Plate', 'Total Distance (km)', 'Total Fuel (L)', 'Efficiency (km/L)'];
      rows = data.map(r => [
        `"${r.make} ${r.model}"`,
        r.license_plate,
        r.fuel.total_distance,
        r.fuel.total_fuel,
        r.fuel.efficiency
      ]);
    } else if (activeReport === 'utilization') {
      filename = 'fleet_utilization_report.csv';
      headers = ['Vehicle', 'License Plate', 'Total Trips', 'Estimated Active Days', 'Utilization %'];
      rows = data.map(r => [
        `"${r.make} ${r.model}"`,
        r.license_plate,
        r.utilization.trips_count,
        r.utilization.days_on_trips,
        r.utilization.percentage
      ]);
    } else if (activeReport === 'costs') {
      filename = 'operational_costs_report.csv';
      headers = ['Vehicle', 'License Plate', 'Fuel Cost ($)', 'Maintenance Cost ($)', 'Total Operational Cost ($)'];
      rows = data.map(r => [
        `"${r.make} ${r.model}"`,
        r.license_plate,
        r.costs.fuel_cost,
        r.costs.maintenance_cost,
        r.costs.operational_cost
      ]);
    } else if (activeReport === 'roi') {
      filename = 'vehicle_roi_report.csv';
      headers = ['Vehicle', 'License Plate', 'Revenue ($)', 'Operational Cost ($)', 'Acquisition Cost ($)', 'ROI Ratio'];
      rows = data.map(r => [
        `"${r.make} ${r.model}"`,
        r.license_plate,
        r.roi.revenue,
        r.roi.operational_cost,
        r.roi.acquisition_cost,
        r.roi.roi_value
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sortedData = getSortedData();

  return (
    <div className="space-y-6">
      
      {/* Top Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Fleet Reports & Analytics</h2>
          <p className="text-slate-400 text-sm mt-1">Exportable aggregated metrics and cost breakdowns</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm cursor-pointer shadow-md"
        >
          <Download size={16} />
          <span>Export to CSV</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => { setActiveReport('fuel_eff'); setSortField(''); }}
          className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-colors ${
            activeReport === 'fuel_eff'
              ? 'bg-blue-600/10 border-blue-500 text-blue-400'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
          }`}
        >
          <div className="p-2 bg-slate-950 rounded-lg text-blue-400 border border-slate-800">
            <Fuel size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold block">Fuel</span>
            <span className="text-xs font-semibold text-white block mt-0.5">Efficiency (km/L)</span>
          </div>
        </button>

        <button
          onClick={() => { setActiveReport('utilization'); setSortField(''); }}
          className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-colors ${
            activeReport === 'utilization'
              ? 'bg-blue-600/10 border-blue-500 text-blue-400'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
          }`}
        >
          <div className="p-2 bg-slate-950 rounded-lg text-blue-400 border border-slate-800">
            <Percent size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold block">Utilization</span>
            <span className="text-xs font-semibold text-white block mt-0.5">Fleet Usage %</span>
          </div>
        </button>

        <button
          onClick={() => { setActiveReport('costs'); setSortField(''); }}
          className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-colors ${
            activeReport === 'costs'
              ? 'bg-blue-600/10 border-blue-500 text-blue-400'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
          }`}
        >
          <div className="p-2 bg-slate-950 rounded-lg text-blue-400 border border-slate-800">
            <Wallet size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold block">Operational</span>
            <span className="text-xs font-semibold text-white block mt-0.5">Cost Breakdown</span>
          </div>
        </button>

        <button
          onClick={() => { setActiveReport('roi'); setSortField(''); }}
          className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-colors ${
            activeReport === 'roi'
              ? 'bg-blue-600/10 border-blue-500 text-blue-400'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
          }`}
        >
          <div className="p-2 bg-slate-950 rounded-lg text-blue-400 border border-slate-800">
            <LineChart size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold block">Financial</span>
            <span className="text-xs font-semibold text-white block mt-0.5">Vehicle ROI %</span>
          </div>
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading reports table...</div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          
          {/* Active Table: 1. Fuel Efficiency */}
          {activeReport === 'fuel_eff' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-850/50">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Vehicle</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">License Plate</th>
                  <th 
                    className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:bg-slate-800"
                    onClick={() => handleSort('total_distance')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Total Distance</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th 
                    className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:bg-slate-800"
                    onClick={() => handleSort('total_fuel')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Total Fuel</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th 
                    className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:bg-slate-800"
                    onClick={() => handleSort('efficiency')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Fuel Efficiency</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((row) => (
                  <tr key={row.vehicle_id} className="border-b border-slate-800 hover:bg-slate-850/30 transition-colors">
                    <td className="p-4 font-bold text-white text-sm">{row.make} {row.model}</td>
                    <td className="p-4 text-slate-300 font-medium text-sm">{row.license_plate}</td>
                    <td className="p-4 text-slate-300 text-sm">{parseFloat(row.fuel.total_distance).toLocaleString()} km</td>
                    <td className="p-4 text-slate-300 text-sm">{parseFloat(row.fuel.total_fuel).toFixed(2)} L</td>
                    <td className="p-4 font-semibold text-blue-400 text-sm">{row.fuel.efficiency} km/L</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Active Table: 2. Fleet Utilization */}
          {activeReport === 'utilization' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-850/50">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Vehicle</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">License Plate</th>
                  <th 
                    className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:bg-slate-800"
                    onClick={() => handleSort('trips_count')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Total Trips Logged</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th 
                    className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:bg-slate-800"
                    onClick={() => handleSort('days_on_trips')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Days Active</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th 
                    className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:bg-slate-800"
                    onClick={() => handleSort('percentage')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Utilization % (30d)</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((row) => (
                  <tr key={row.vehicle_id} className="border-b border-slate-800 hover:bg-slate-850/30 transition-colors">
                    <td className="p-4 font-bold text-white text-sm">{row.make} {row.model}</td>
                    <td className="p-4 text-slate-300 font-medium text-sm">{row.license_plate}</td>
                    <td className="p-4 text-slate-300 text-sm">{row.utilization.trips_count} trips</td>
                    <td className="p-4 text-slate-300 text-sm">{row.utilization.days_on_trips} days</td>
                    <td className="p-4 text-sm font-semibold text-blue-400">
                      {row.utilization.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Active Table: 3. Operational Cost */}
          {activeReport === 'costs' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-850/50">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Vehicle</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">License Plate</th>
                  <th 
                    className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:bg-slate-800"
                    onClick={() => handleSort('fuel_cost')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Fuel Cost</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th 
                    className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:bg-slate-800"
                    onClick={() => handleSort('maintenance_cost')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Maintenance Cost</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th 
                    className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:bg-slate-800"
                    onClick={() => handleSort('operational_cost')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Operational Cost</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((row) => (
                  <tr key={row.vehicle_id} className="border-b border-slate-800 hover:bg-slate-850/30 transition-colors">
                    <td className="p-4 font-bold text-white text-sm">{row.make} {row.model}</td>
                    <td className="p-4 text-slate-300 font-medium text-sm">{row.license_plate}</td>
                    <td className="p-4 text-slate-300 text-sm">${parseFloat(row.costs.fuel_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-4 text-slate-300 text-sm">${parseFloat(row.costs.maintenance_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-4 font-bold text-amber-400 text-sm">${parseFloat(row.costs.operational_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Active Table: 4. Vehicle ROI */}
          {activeReport === 'roi' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-850/50">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Vehicle</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">License Plate</th>
                  <th 
                    className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:bg-slate-800"
                    onClick={() => handleSort('revenue')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Total Revenue</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th 
                    className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:bg-slate-800"
                    onClick={() => handleSort('operational_cost')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Operational Cost</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th 
                    className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:bg-slate-800"
                    onClick={() => handleSort('acquisition_cost')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Acquisition Cost</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th 
                    className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:bg-slate-800"
                    onClick={() => handleSort('roi_value')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Return On Investment (ROI)</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((row) => {
                  const roiPercent = (row.roi.roi_value * 100).toFixed(1);
                  return (
                    <tr key={row.vehicle_id} className="border-b border-slate-800 hover:bg-slate-850/30 transition-colors">
                      <td className="p-4 font-bold text-white text-sm">{row.make} {row.model}</td>
                      <td className="p-4 text-slate-300 font-medium text-sm">{row.license_plate}</td>
                      <td className="p-4 text-slate-300 text-sm">${parseFloat(row.roi.revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="p-4 text-slate-300 text-sm">${parseFloat(row.roi.operational_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="p-4 text-slate-300 text-sm">${parseFloat(row.roi.acquisition_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className={`p-4 font-bold text-sm ${parseFloat(row.roi.roi_value) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {roiPercent}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

        </div>
      )}
    </div>
  );
};

export default Reports;
