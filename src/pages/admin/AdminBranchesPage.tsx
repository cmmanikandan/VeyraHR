import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Plus, 
  Users, 
  Clock, 
  Globe, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Navigation,
  ShieldCheck
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useData } from '../../context/DataContext';

interface BranchItem {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  employee_count: number;
  timezone: string;
  working_hours: string;
  is_headquarters: boolean;
  status: 'active' | 'inactive';
}

export const AdminBranchesPage: React.FC = () => {
  const { branches: globalBranches, createCompanyBranch, employees } = useData();

  const [branches, setBranches] = useState<BranchItem[]>(() => {
    const saved = localStorage.getItem('veyra_branches_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn('Branch parse notice:', e);
      }
    }
    return [
      {
        id: 'br_01',
        name: 'Chennai Corporate HQ',
        code: 'VEY-MAA-01',
        city: 'Chennai',
        state: 'Tamil Nadu',
        address: 'VeyraHR Tech Tower, OMR IT Corridor, Perungudi, Chennai - 600096',
        latitude: 12.9654,
        longitude: 80.2461,
        radius_meters: 150,
        employee_count: employees.length || 0,
        timezone: 'IST (UTC+5:30)',
        working_hours: '09:00 AM - 06:00 PM',
        is_headquarters: true,
        status: 'active',
      },
    ];
  });

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Branch Form State
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newLat, setNewLat] = useState('13.0827');
  const [newLng, setNewLng] = useState('80.2707');
  const [newRadius, setNewRadius] = useState('150');
  const [newWorkingHours, setNewWorkingHours] = useState('09:00 AM - 06:00 PM');

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName || !newCity) return;

    const created: BranchItem = {
      id: 'br_' + Date.now(),
      name: newBranchName,
      code: newBranchCode || `VEY-${newCity.substring(0, 3).toUpperCase()}-05`,
      city: newCity,
      state: newState || 'Tamil Nadu',
      address: newAddress || `${newCity} Office`,
      latitude: parseFloat(newLat) || 13.0827,
      longitude: parseFloat(newLng) || 80.2707,
      radius_meters: parseInt(newRadius) || 150,
      employee_count: 0,
      timezone: 'IST (UTC+5:30)',
      working_hours: newWorkingHours,
      is_headquarters: false,
      status: 'active',
    };

    const updated = [created, ...branches];
    setBranches(updated);
    localStorage.setItem('veyra_branches_data', JSON.stringify(updated));
    if (createCompanyBranch) {
      createCompanyBranch({ company_id: 'comp_veyra_tn', name: created.name, city: created.city, address: created.address });
    }
    setIsAddModalOpen(false);

    // Reset Form
    setNewBranchName('');
    setNewBranchCode('');
    setNewCity('');
    setNewState('');
    setNewAddress('');
  };

  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.city.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-[#172033] tracking-tight">Branch Management</h1>
            <Badge variant="blue">{branches.length} Registered Locations</Badge>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Configure multi-office locations, GPS geofencing radius, and regional attendance parameters.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddModalOpen(true)}
          className="font-bold shrink-0"
        >
          Add New Branch
        </Button>
      </div>

      {/* SEARCH BAR */}
      <Card className="p-4 border-[#E8E2D9] bg-white">
        <div className="relative">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search branches by city, office name, or branch code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E8E2D9] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>
      </Card>

      {/* BRANCH CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        {filteredBranches.map((b) => (
          <Card key={b.id} className="p-6 border-[#E8E2D9] bg-white space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${b.is_headquarters ? 'bg-blue-50 text-[#2563EB]' : 'bg-[#FCFAF7] text-[#64748B]'}`}>
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-[#172033]">{b.name}</h3>
                    {b.is_headquarters && (
                      <Badge variant="blue" className="text-[10px] uppercase font-bold">
                        Corporate HQ
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs font-bold text-[#2563EB] tracking-wider block mt-0.5">{b.code}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-[#64748B] shrink-0 mt-0.5" />
              {b.address}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#E8E2D9] text-xs">
              <div>
                <span className="text-[11px] text-[#64748B] block font-medium">GPS Geofence</span>
                <span className="font-bold text-[#172033] flex items-center gap-1 mt-0.5">
                  <Navigation className="w-3.5 h-3.5 text-[#2563EB]" />
                  {b.radius_meters} meters radius
                </span>
              </div>

              <div>
                <span className="text-[11px] text-[#64748B] block font-medium">Active Employees</span>
                <span className="font-bold text-[#172033] flex items-center gap-1 mt-0.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  {b.employee_count} Staff Members
                </span>
              </div>

              <div>
                <span className="text-[11px] text-[#64748B] block font-medium">Timezone</span>
                <span className="font-bold text-[#172033] mt-0.5 block">{b.timezone}</span>
              </div>

              <div>
                <span className="text-[11px] text-[#64748B] block font-medium">Working Hours</span>
                <span className="font-bold text-[#172033] mt-0.5 block">{b.working_hours}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ADD BRANCH MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Branch Office">
        <form onSubmit={handleAddBranch} className="space-y-4 text-left pt-2">
          <div>
            <label className="block text-xs font-extrabold text-[#172033] mb-1">Branch Name</label>
            <input
              type="text"
              placeholder="e.g. Pune Regional Tech Center"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-[#172033] mb-1">City</label>
              <input
                type="text"
                placeholder="e.g. Pune"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#172033] mb-1">State</label>
              <input
                type="text"
                placeholder="e.g. Maharashtra"
                value={newState}
                onChange={(e) => setNewState(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#172033] mb-1">Office Address</label>
            <input
              type="text"
              placeholder="Full street address"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-[#172033] mb-1">Latitude</label>
              <input
                type="text"
                value={newLat}
                onChange={(e) => setNewLat(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#172033] mb-1">Longitude</label>
              <input
                type="text"
                value={newLng}
                onChange={(e) => setNewLng(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#172033] mb-1">Radius (Meters)</label>
              <input
                type="number"
                value={newRadius}
                onChange={(e) => setNewRadius(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs font-semibold"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-blue-900 block">GPS Coordinates & Geofence</span>
              <span className="text-[11px] text-blue-700">Radius: {newRadius}m allowed perimeter</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((pos) => {
                    setNewLat(pos.coords.latitude.toFixed(4));
                    setNewLng(pos.coords.longitude.toFixed(4));
                  });
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 active:scale-95 transition-all shadow-2xs"
            >
              📍 Auto-Detect GPS
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E2D9]">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="font-bold">
              Save Branch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
