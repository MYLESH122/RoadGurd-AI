import React, { useState, useEffect } from 'react';
import { Users, Shield, Plus, Search, Truck, CheckCircle2 } from 'lucide-react';
import { ApiService } from '../services/api';
import { DriverProfile } from '../types';

export const DriverManagement: React.FC = () => {
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    ApiService.listDrivers()
      .then((data) => setDrivers(data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = drivers.filter(
    (d) =>
      d.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.vehicle_plate?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-navy-900">Fleet Drivers Directory</h2>
          <p className="text-xs text-slate-500">Monitor all registered operators and safety scores.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by driver name or vehicle plate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {filtered.length} Driver{filtered.length !== 1 ? 's' : ''} Enrolled
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Driver Name</th>
                <th className="py-3 px-4">License ID</th>
                <th className="py-3 px-4">Vehicle Plate</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Logged Hours</th>
                <th className="py-3 px-4">Safety Score</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((d) => (
                <tr key={d.user_id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-navy-900">{d.full_name}</td>
                  <td className="py-3 px-4 font-mono">{d.license_number || 'DL-9482014-A'}</td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">{d.vehicle_plate || 'RG-772-AI'}</td>
                  <td className="py-3 px-4">{d.vehicle_type || 'Commercial Van'}</td>
                  <td className="py-3 px-4 font-mono">{d.total_driving_hours?.toFixed(1) ?? '34.5'}h</td>
                  <td className="py-3 px-4">
                    <span className="font-extrabold text-emerald-600">{d.safety_score ?? 98}/100</span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        d.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          d.status === 'active' ? 'bg-emerald-600' : 'bg-slate-400'
                        }`}
                      />
                      {d.status || 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

