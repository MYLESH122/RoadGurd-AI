import React, { useState, useEffect } from 'react';
import { User, Shield, Truck, Award, Save, CheckCircle } from 'lucide-react';
import { ApiService } from '../services/api';
import { DriverProfile as IDriverProfile } from '../types';

export const DriverProfile: React.FC = () => {
  const [profile, setProfile] = useState<IDriverProfile | null>(null);
  const [fullName, setFullName] = useState<string>('');
  const [license, setLicense] = useState<string>('');
  const [vehiclePlate, setVehiclePlate] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<string>('sedan');
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    ApiService.getDriverProfile().then((p) => {
      setProfile(p);
      setFullName(p.full_name);
      setLicense(p.license_number || '');
      setVehiclePlate(p.vehicle_plate || '');
      setVehicleType(p.vehicle_type || 'sedan');
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      const updated = await ApiService.updateDriverProfile({
        full_name: fullName,
        license_number: license,
        vehicle_plate: vehiclePlate,
        vehicle_type: vehicleType
      });
      setProfile(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-navy-900">Driver Credentials & Vehicle Profile</h2>
        <p className="text-xs text-slate-500">Manage identification, certified vehicles, and safety ratings.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left card: Stats */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-sm text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xl">
            <User className="w-10 h-10" />
          </div>
          <div>
            <h3 className="font-bold text-base text-navy-900">{profile?.full_name || 'Marcus Vance'}</h3>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
              Active Certified Driver
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-left">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-[10px] text-slate-400 block font-bold">SAFETY SCORE</span>
              <span className="text-xl font-black text-emerald-600">{profile?.safety_score ?? 98}/100</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-[10px] text-slate-400 block font-bold">DRIVE HOURS</span>
              <span className="text-xl font-black text-navy-900">{profile?.total_driving_hours?.toFixed(1) ?? '34.5'}h</span>
            </div>
          </div>
        </div>

        {/* Right 2 cols: Profile Form */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <form onSubmit={handleSave} className="space-y-4">
            {savedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Profile updated successfully in Firestore database.</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Driver License ID
                </label>
                <input
                  type="text"
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  placeholder="DL-XXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Assigned Vehicle Plate
                </label>
                <input
                  type="text"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder="RG-772-AI"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Vehicle Category
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
              >
                <option value="sedan">Passenger Sedan / Taxi</option>
                <option value="suv">SUV / Light Commercial</option>
                <option value="Commercial Van">Commercial Cargo Van</option>
                <option value="Heavy Truck">Heavy Transport Truck (Class 8)</option>
                <option value="Bus">Passenger Transit Bus</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

