import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  Compass,
  LocateFixed,
  Radius,
  Layers,
  Map as MapIcon,
  Crosshair,
  AlertTriangle
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useData } from '../../context/DataContext';
import { Branch } from '../../types/database';

const TAMIL_NADU_PRESETS = [
  { name: 'Chennai - OMR Tech Corridor', city: 'Chennai', state: 'Tamil Nadu', lat: 12.9654, lng: 80.2461, address: 'Veyra Tech Park, OMR, Perungudi, Chennai - 600096' },
  { name: 'Chennai - Anna Nagar Central', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0850, lng: 80.2101, address: 'No. 42, 2nd Main Road, Anna Nagar, Chennai - 600040' },
  { name: 'Coimbatore - Gandhipuram Hub', city: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558, address: 'Cross Cut Road, Gandhipuram, Coimbatore - 641012' },
  { name: 'Madurai - KK Nagar Campus', city: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lng: 78.1198, address: '80 Feet Road, KK Nagar East, Madurai - 625020' },
  { name: 'Bangalore - Electronic City HQ', city: 'Bengaluru', state: 'Karnataka', lat: 12.8452, lng: 77.6602, address: 'Phase 1, Electronic City, Bengaluru - 560100' },
  { name: 'Hyderabad - HITEC City', city: 'Hyderabad', state: 'Telangana', lat: 17.4435, lng: 78.3772, address: 'Mindspace IT Park, HITEC City, Hyderabad - 500081' },
];

export const AdminBranchesPage: React.FC = () => {
  const { branches: globalBranches, createCompanyBranch, deleteCompanyBranch, employees } = useData();

  const [branches, setBranches] = useState<Branch[]>(() => {
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
        company_id: 'comp_veyra_tn',
        name: 'Chennai Corporate HQ',
        code: 'VEY-MAA-01',
        city: 'Chennai',
        state: 'Tamil Nadu',
        address: 'VeyraHR Tech Tower, OMR IT Corridor, Perungudi, Chennai - 600096',
        latitude: 12.9654,
        longitude: 80.2461,
        radius_meters: 150,
        working_hours: '09:00 AM - 06:00 PM',
        is_headquarters: true,
      },
      {
        id: 'br_02',
        company_id: 'comp_veyra_tn',
        name: 'Coimbatore Regional Office',
        code: 'VEY-CJB-02',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        address: 'Cross Cut Road, Gandhipuram, Coimbatore - 641012',
        latitude: 11.0168,
        longitude: 76.9558,
        radius_meters: 200,
        working_hours: '09:00 AM - 06:00 PM',
        is_headquarters: false,
      },
      {
        id: 'br_03',
        company_id: 'comp_veyra_tn',
        name: 'Madurai Branch',
        code: 'VEY-IXM-03',
        city: 'Madurai',
        state: 'Tamil Nadu',
        address: '80 Feet Road, KK Nagar East, Madurai - 625020',
        latitude: 9.9252,
        longitude: 78.1198,
        radius_meters: 200,
        working_hours: '09:00 AM - 06:00 PM',
        is_headquarters: false,
      },
    ];
  });

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userGps, setUserGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [detectingGps, setDetectingGps] = useState(false);

  // New Branch Form State
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('Tamil Nadu');
  const [newAddress, setNewAddress] = useState('');
  const [newLat, setNewLat] = useState('12.9654');
  const [newLng, setNewLng] = useState('80.2461');
  const [newRadius, setNewRadius] = useState('150');
  const [newWorkingHours, setNewWorkingHours] = useState('09:00 AM - 06:00 PM');
  const [isHq, setIsHq] = useState(false);

  // Acquire admin current GPS for geofence verification preview
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.log('GPS status:', err.message);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  const handleDetectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewLat(pos.coords.latitude.toFixed(6));
        setNewLng(pos.coords.longitude.toFixed(6));
        setUserGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setDetectingGps(false);
      },
      (err) => {
        setGpsError(`Unable to fetch device GPS: ${err.message}. Please allow location permissions.`);
        setDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleApplyPreset = (preset: typeof TAMIL_NADU_PRESETS[0]) => {
    setNewBranchName(preset.name);
    setNewCity(preset.city);
    setNewState(preset.state);
    setNewAddress(preset.address);
    setNewLat(preset.lat.toFixed(6));
    setNewLng(preset.lng.toFixed(6));
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName || !newCity) return;

    const created: Branch = {
      id: 'br_' + Date.now(),
      company_id: 'comp_veyra_tn',
      name: newBranchName,
      code: newBranchCode || `VEY-${newCity.substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`,
      city: newCity,
      state: newState || 'Tamil Nadu',
      address: newAddress || `${newCity} Office`,
      latitude: parseFloat(newLat) || 12.9654,
      longitude: parseFloat(newLng) || 80.2461,
      radius_meters: parseInt(newRadius) || 150,
      working_hours: newWorkingHours,
      is_headquarters: isHq,
    };

    const updated = [created, ...branches];
    setBranches(updated);
    localStorage.setItem('veyra_branches_data', JSON.stringify(updated));
    if (createCompanyBranch) {
      await createCompanyBranch(created);
    }
    setIsAddModalOpen(false);

    // Reset Form
    setNewBranchName('');
    setNewBranchCode('');
    setNewCity('');
    setNewAddress('');
    setIsHq(false);
  };

  const handleDeleteBranch = async (id: string) => {
    const updated = branches.filter((b) => b.id !== id);
    setBranches(updated);
    localStorage.setItem('veyra_branches_data', JSON.stringify(updated));
    if (deleteCompanyBranch) {
      await deleteCompanyBranch(id);
    }
  };

  // Calculate distance between user current GPS and branch location
  const calculateDistance = (lat1: number, lon1: number, lat2?: number, lon2?: number): number => {
    if (lat2 === undefined || lon2 === undefined) return 0;
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.city && b.city.toLowerCase().includes(search.toLowerCase())) ||
      (b.code && b.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-left">
      {/* ─── 1. HEADER ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-[#172033] tracking-tight">Branch & Geofence Locations</h1>
            <Badge variant="blue">{branches.length} Operating Locations</Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] font-medium mt-0.5">
            Configure physical office coordinates, interactive GPS map boundaries, and radius rules for mobile clock-ins.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddModalOpen(true)}
          className="font-bold shrink-0 shadow-xs"
        >
          Add Branch with GPS Map
        </Button>
      </div>

      {/* ─── 2. GEOFENCE ACCURACY ADVISORY ────────────────────────────── */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Crosshair className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#172033]">High-Precision Geofencing Active</h4>
            <p className="text-xs text-[#64748B] mt-0.5">
              Employees can only complete QR/Selfie attendance check-ins when their device GPS falls within the assigned branch radius.
            </p>
          </div>
        </div>

        {userGps && (
          <div className="px-3 py-1.5 bg-white rounded-xl border border-blue-200 text-[11px] font-mono text-blue-900 font-bold shrink-0">
            Current Device GPS: {userGps.lat.toFixed(4)}, {userGps.lng.toFixed(4)}
          </div>
        )}
      </div>

      {/* ─── 3. SEARCH & FILTERS ──────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search branches by name, city, or branch code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E2D9] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-veyra-blue"
          />
        </div>
      </div>

      {/* ─── 4. BRANCHES GRID ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBranches.map((b) => {
          const branchEmpCount = employees.filter(e => e.branch_name === b.name || e.work_location?.includes(b.city || '')).length;
          const distMeters = userGps && b.latitude && b.longitude
            ? calculateDistance(userGps.lat, userGps.lng, b.latitude, b.longitude)
            : null;
          const isInside = distMeters !== null && distMeters <= (b.radius_meters || 150);

          return (
            <Card
              key={b.id}
              padded={false}
              className="p-5 bg-white border-[#E8E2D9] rounded-2xl shadow-2xs hover:border-veyra-blue/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-veyra-blue shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-[#172033] leading-snug">{b.name}</h3>
                      <span className="text-[10px] font-mono font-bold text-[#64748B]">{b.code || 'VEY-BR-01'}</span>
                    </div>
                  </div>

                  {b.is_headquarters ? (
                    <Badge variant="blue" size="sm">HQ Campus</Badge>
                  ) : (
                    <Badge variant="gray" size="sm">Branch</Badge>
                  )}
                </div>

                {/* Address & City */}
                <div className="flex items-start gap-2 text-xs text-[#64748B]">
                  <MapPin className="w-3.5 h-3.5 text-[#94A3B8] shrink-0 mt-0.5" />
                  <p className="line-clamp-2 leading-relaxed">{b.address}</p>
                </div>

                {/* GPS Coordinates & Geofence Badge */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#64748B]">GPS Center:</span>
                    <span className="font-bold text-[#172033]">{b.latitude?.toFixed(4)}, {b.longitude?.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#64748B]">Geofence Radius:</span>
                    <span className="font-bold text-blue-700">{b.radius_meters || 150} meters</span>
                  </div>

                  {/* Live Distance Check */}
                  {distMeters !== null && (
                    <div className={`mt-1 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-bold ${
                      isInside ? 'text-emerald-700' : 'text-slate-600'
                    }`}>
                      <span>Distance from you:</span>
                      <span>{distMeters > 1000 ? `${(distMeters / 1000).toFixed(1)} km` : `${distMeters} m`} ({isInside ? 'Inside Zone' : 'Outside'})</span>
                    </div>
                  )}
                </div>

                {/* Map Mini Embed Preview */}
                {b.latitude && b.longitude && (
                  <div className="relative w-full h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <iframe
                      title={`Map for ${b.name}`}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight={0}
                      marginWidth={0}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${b.longitude - 0.005}%2C${b.latitude - 0.005}%2C${b.longitude + 0.005}%2C${b.latitude + 0.005}&layer=mapnik&marker=${b.latitude}%2C${b.longitude}`}
                      className="opacity-90 hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 text-white text-[9px] rounded font-mono backdrop-blur-xs">
                      Radius: {b.radius_meters || 150}m
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-3 mt-3 border-t border-[#E8E2D9]/70 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[#64748B] font-bold">
                  <Users className="w-3.5 h-3.5" />
                  <span>{branchEmpCount} Staff Assigned</span>
                </div>

                {!b.is_headquarters && (
                  <button
                    onClick={() => handleDeleteBranch(b.id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Branch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* ─── 5. MODAL: ADD NEW BRANCH WITH MAP PICKER ─────────────────── */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register Branch Location & GPS Geofence">
        <form onSubmit={handleAddBranch} className="space-y-4 text-left">
          {/* Quick Presets for Tamil Nadu Hubs */}
          <div>
            <label className="block text-[11px] font-bold text-[#172033] uppercase tracking-wider mb-1.5">
              Quick Presets (Major Hubs)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TAMIL_NADU_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-veyra-blue hover:border-blue-200 border border-slate-200 rounded-lg text-[11px] font-bold transition-all"
                >
                  {p.city} ({p.name.split(' - ')[1] || p.city})
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1">Branch Name *</label>
              <input
                type="text"
                placeholder="e.g. Chennai OMR Innovation Hub"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1">Branch Code</label>
              <input
                type="text"
                placeholder="e.g. VEY-MAA-05"
                value={newBranchCode}
                onChange={(e) => setNewBranchCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1">City *</label>
              <input
                type="text"
                placeholder="e.g. Chennai"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1">State</label>
              <input
                type="text"
                placeholder="e.g. Tamil Nadu"
                value={newState}
                onChange={(e) => setNewState(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172033] mb-1">Full Physical Address *</label>
            <input
              type="text"
              placeholder="e.g. 42 OMR IT Corridor, Perungudi, Chennai - 600096"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
              required
            />
          </div>

          {/* GPS Coordinates Section with Auto-detect */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-veyra-blue" />
                Geofence Coordinates & Boundary
              </span>
              <button
                type="button"
                onClick={handleDetectCurrentLocation}
                disabled={detectingGps}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-blue-50 text-veyra-blue border border-blue-200 rounded-lg text-[11px] font-bold shadow-2xs transition-colors"
              >
                <LocateFixed className="w-3.5 h-3.5" />
                {detectingGps ? 'Locating...' : 'Use My Current Location'}
              </button>
            </div>

            {gpsError && (
              <p className="text-[11px] text-rose-600 font-medium">{gpsError}</p>
            )}

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] mb-1">Latitude</label>
                <input
                  type="text"
                  value={newLat}
                  onChange={(e) => setNewLat(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E8E2D9] rounded-lg text-xs font-mono font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] mb-1">Longitude</label>
                <input
                  type="text"
                  value={newLng}
                  onChange={(e) => setNewLng(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E8E2D9] rounded-lg text-xs font-mono font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] mb-1">Radius (Meters)</label>
                <select
                  value={newRadius}
                  onChange={(e) => setNewRadius(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-[#E8E2D9] rounded-lg text-xs font-bold"
                >
                  <option value="50">50m (Strict Room)</option>
                  <option value="100">100m (Office Floor)</option>
                  <option value="150">150m (Building)</option>
                  <option value="300">300m (Campus Park)</option>
                  <option value="500">500m (Tech Zone)</option>
                </select>
              </div>
            </div>

            {/* Live Map Preview for Selected Lat/Lng */}
            {newLat && newLng && (
              <div className="w-full h-32 rounded-lg overflow-hidden border border-slate-300">
                <iframe
                  title="Branch Map Preview"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(newLng) - 0.005}%2C${parseFloat(newLat) - 0.005}%2C${parseFloat(newLng) + 0.005}%2C${parseFloat(newLat) + 0.005}&layer=mapnik&marker=${parseFloat(newLat)}%2C${parseFloat(newLng)}`}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_hq"
              checked={isHq}
              onChange={(e) => setIsHq(e.target.checked)}
              className="rounded text-veyra-blue focus:ring-veyra-blue"
            />
            <label htmlFor="is_hq" className="text-xs font-bold text-[#172033]">
              Set as Principal Corporate Headquarters
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E8E2D9]">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="font-bold shadow-xs">
              Save Branch Location
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
