import React, { useState, useEffect } from 'react';
import { HeartHandshake, Plus, Phone, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ApiService } from '../services/api';
import { EmergencyContact } from '../types';

export const EmergencyContacts: React.FC = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Form fields
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [relationship, setRelationship] = useState<string>('Family');
  const [notifyOnCritical, setNotifyOnCritical] = useState<boolean>(true);

  const fetchContacts = () => {
    setLoading(true);
    ApiService.getEmergencyContacts()
      .then((data) => setContacts(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.createEmergencyContact({
        name,
        phone_number: phone,
        relationship,
        notify_on_critical: notifyOnCritical
      });
      setName('');
      setPhone('');
      setShowAddForm(false);
      fetchContacts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await ApiService.deleteEmergencyContact(id);
      fetchContacts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-navy-900">Registered Emergency Contacts</h2>
          <p className="text-xs text-slate-500">
            Contacts alerted via high-priority FCM notification upon confirmed Level 3 Critical alerts or SOS.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5 self-start"
        >
          <Plus className="w-4 h-4" />
          Add Emergency Contact
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-blue-200 p-6 space-y-4 shadow-md">
          <h3 className="font-bold text-sm text-navy-900">Add Trusted Safety Contact</h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Contact Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Vance"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Mobile Telephone</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 987-6543"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Relationship</label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
              >
                <option value="Spouse">Spouse / Partner</option>
                <option value="Family">Family Member</option>
                <option value="Fleet Dispatcher">Fleet Dispatch Supervisor</option>
                <option value="Colleague">Colleague / Relief Driver</option>
                <option value="Friend">Personal Contact</option>
              </select>
            </div>

            <div className="pt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="notifyCritical"
                checked={notifyOnCritical}
                onChange={(e) => setNotifyOnCritical(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="notifyCritical" className="text-xs text-slate-700 font-medium cursor-pointer">
                Notify automatically on Level 3 Critical event
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              Save Contact
            </button>
          </div>
        </form>
      )}

      {/* Contacts List */}
      <div className="grid sm:grid-cols-2 gap-4">
        {contacts.map((c) => (
          <div key={c.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-navy-900">{c.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {c.relationship}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono">{c.phone_number}</span>
              </div>
              {c.notify_on_critical && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Authorized for Critical & SOS notifications</span>
                </div>
              )}
            </div>

            <button
              onClick={() => handleDelete(c.id)}
              className="p-1.5 text-slate-400 hover:text-red-600 transition"
              title="Delete Contact"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 bg-slate-100 rounded-xl text-xs text-slate-600 space-y-1">
        <p className="font-bold text-slate-800">Privacy & Emergency Protocols:</p>
        <p>• Contacts only receive text and situational metadata (time, status, coordinates if enabled).</p>
        <p>• Under no circumstance is webcam video transmitted to contacts.</p>
        <p>• Public emergency services (911) are NOT automatically called; driver or contact retains decision authority.</p>
      </div>
    </div>
  );
};

