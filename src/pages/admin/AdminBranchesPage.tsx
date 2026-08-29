import React, { useState, useEffect, useMemo } from 'react';
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
  AlertTriangle,
  Radar,
  Sparkles,
  RefreshCw,
  Eye
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useData } from '../../context/DataContext';
import { Branch } from '../../types/database';

const TAMIL_NADU_PRESETS = [
  { name: 'Chennai - OMR Tech Corridor HQ', city: 'Chennai', state: 'Tamil Nadu', lat: 12.9654, lng: 80.2461, address: 'Veyra Tech Park, OMR, Perungudi, Chennai - 600096' },
  { name: 'Chennai - Anna Nagar Central', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0850, lng: 80.2101, address: 'No. 42, 2nd Main Road, Anna Nagar, Chennai - 600040' },
  { name: 'Coimbatore - Gandhipuram Hub', city: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558, address: 'Cross Cut Road, Gandhipuram, Coimbatore - 641012' },
  { name: 'Madurai - KK Nagar Campus', city: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lng: 78.1198, address: '80 Feet Road, KK Nagar East, Madurai - 625020' },
  { name: 'Bengaluru - Electronic City Hub', city: 'Bengaluru', state: 'Karnataka', lat: 12.8452, lng: 77.6602, address: 'Phase 1, Electronic City, Bengaluru - 560100' },
  { name: 'Hyderabad - HITEC City Hub', city: 'Hyderabad', state: 'Telangana', lat: 17.4435, lng: 78.3772, address: 'Mindspace IT Park, HITEC City, Hyderabad - 500081' },
];

export const AdminBranchesPage: React.FC = () => {
  const { branches: globalBranches, createCompanyBranch, deleteCompanyBranch, employees, attendance } = useData();
  const branches = globalBranches;

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || 'b1');
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

  // Acquire admin current GPS for geofence verification
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
        setGpsError(`Unable to fetch device GPS: ${err.message}.`);
        setDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
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

    await createCompanyBranch({
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
    });

    setIsAddModalOpen(false);
    setNewBranchName('');
    setNewBranchCode('');
    setNewCity('');
    setNewAddress('');
    setIsHq(false);
  };

  const handleDeleteBranch = async (id: string) => {
    await deleteCompanyBranch(id);
  };

  // Haversine formula for distance in meters
  const calculateDistance = (lat1: number, lon1: number, lat2?: number, lon2?: number): number => {
    if (lat2 === undefined || lon2 === undefined) return 0;
    const R = 6371e3;
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

  const selectedBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Branch & Geofence Locations</h1>
            <Badge variant="blue">{branches.length} Operating Hubs</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Manage high-precision GPS geofences, circular radius perimeters & live check-in location verifications
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddModalOpen(true)}
          className="font-bold shrink-0 shadow-xs text-xs"
        >
          Add Branch with GPS Map
        </Button>
      </div>

      {/* ─── 2. INTERACTIVE GEOFENCE RADAR STATION ────────────────────────── */}
      {selectedBranch && (
        <Card padded={false} className="p-6 bg-slate-900 text-white shadow-lg border border-slate-800 rounded-3xl overflow-hidden relative">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            
            {/* Left Info */}
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-mono font-bold border border-cyan-500/30 flex items-center gap-1">
                  <Radar className="w-3.5 h-3.5 animate-spin text-cyan-400" /> LIVE GEOFENCE RADAR
                </span>
                {selectedBranch.is_headquarters && (
                  <Badge variant="blue" size="sm">Headquarters</Badge>
                )}
              </div>

              <div>
                <h3 className="text-xl font-black text-white tracking-tight">{selectedBranch.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> {selectedBranch.address}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">GPS Coordinates</span>
                  <span className="font-mono text-xs font-bold text-white block">
                    {selectedBranch.latitude?.toFixed(4)}, {selectedBranch.longitude?.toFixed(4)}
                  </span>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Radius Perimeter</span>
                  <span className="font-mono text-xs font-bold text-cyan-300 block">
                    {selectedBranch.radius_meters || 150} Meters
                  </span>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700 col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Assigned Staff</span>
                  <span className="font-mono text-xs font-bold text-emerald-400 block">
                    {employees.filter(e => e.branch_name === selectedBranch.name).length} Active Members
                  </span>
                </div>
              </div>
            </div>

            {/* Right Mini Map Embed & Geofence Simulation */}
            <div className="w-full lg:w-80 h-44 rounded-2xl overflow-hidden border-2 border-cyan-500/40 relative shadow-xl shrink-0 bg-slate-950">
              {selectedBranch.latitude && selectedBranch.longitude && (
                <iframe
                  title={`Map for ${selectedBranch.name}`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedBranch.longitude - 0.006}%2C${selectedBranch.latitude - 0.006}%2C${selectedBranch.longitude + 0.006}%2C${selectedBranch.latitude + 0.006}&layer=mapnik&marker=${selectedBranch.latitude}%2C${selectedBranch.longitude}`}
                  className="opacity-80"
                />
              )}
              
              {/* Radar Perimeter Ring Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-2 border-cyan-400 bg-cyan-400/15 animate-ping" />
              </div>

              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/90 text-cyan-300 text-[10px] font-mono border border-cyan-500/30 backdrop-blur-md">
                GPS Verified
              </div>
            </div>

          </div>
        </Card>
      )}

      {/* ─── 3. SEARCH & BRANCH SELECTOR ──────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search branches by name, city, or branch code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* ─── 4. BRANCH CARDS GRID ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBranches.map((b) => {
          const branchEmpCount = employees.filter(e => e.branch_name === b.name || e.work_location?.includes(b.city || '')).length;
          const distMeters = userGps && b.latitude && b.longitude
            ? calculateDistance(userGps.lat, userGps.lng, b.latitude, b.longitude)
            : null;
          const isInside = distMeters !== null && distMeters <= (b.radius_meters || 150);
          const isSelected = selectedBranchId === b.id;

          return (
            <Card
              key={b.id}
              padded={false}
              className={`p-5 bg-white border rounded-2xl shadow-2xs transition-all flex flex-col justify-between cursor-pointer ${
                isSelected ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-blue-300'
              }`}
              onClick={() => setSelectedBranchId(b.id)}
            >
              <div className="space-y-3">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 leading-snug">{b.name}</h3>
                      <span className="text-[10px] font-mono font-bold text-slate-500">{b.code || 'VEY-BR-01'}</span>
                    </div>
                  </div>

                  {b.is_headquarters ? (
                    <Badge variant="blue" size="sm">HQ Campus</Badge>
                  ) : (
                    <Badge variant="gray" size="sm">Branch</Badge>
                  )}
                </div>

                {/* Address & City */}
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <p className="line-clamp-2 leading-relaxed">{b.address}</p>
                </div>

                {/* GPS Coordinates & Geofence Badge */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">GPS Center:</span>
                    <span className="font-bold text-slate-900">{b.latitude?.toFixed(4)}, {b.longitude?.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Geofence Radius:</span>
                    <span className="font-bold text-blue-700">{b.radius_meters || 150} meters</span>
                  </div>

                  {/* Live Distance Check */}
                  {distMeters !== null && (
                    <div className={`mt-1 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-bold ${
                      isInside ? 'text-emerald-700' : 'text-slate-600'
                    }`}>
                      <span>Distance from your device:</span>
                      <span>{distMeters > 1000 ? `${(distMeters / 1000).toFixed(1)} km` : `${distMeters} m`} ({isInside ? 'Inside Radius' : 'Outside'})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>{branchEmpCount} Staff Assigned</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBranchId(b.id);
                    }}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg text-[11px] font-bold"
                  >
                    View Radar
                  </button>

                  {!b.is_headquarters && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBranch(b.id);
                      }}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Branch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ─── 5. MODAL: ADD NEW BRANCH WITH MAP PICKER ─────────────────── */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register Branch Location & GPS Geofence">
        <form onSubmit={handleAddBranch} className="space-y-4 text-left">
          {/* Quick Presets */}
          <div>
            <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Quick Presets (Major Hubs)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TAMIL_NADU_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-lg text-[11px] font-bold transition-all"
                >
                  {p.city} ({p.name.split(' - ')[1] || p.city})
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Branch Name *</label>
              <input
                type="text"
                placeholder="e.g. Chennai OMR Innovation Hub"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Branch Code</label>
              <input
                type="text"
                placeholder="e.g. VEY-MAA-05"
                value={newBranchCode}
                onChange={(e) => setNewBranchCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">City *</label>
              <input
                type="text"
                placeholder="e.g. Chennai"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">State</label>
              <input
                type="text"
                value={newState}
                onChange={(e) => setNewState(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Physical Street Address</label>
            <input
              type="text"
              placeholder="e.g. No 42, OMR IT Expressway, Chennai"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* GPS Coordinates & Device Locator */}
          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Crosshair className="w-4 h-4 text-blue-600" /> GPS Geofence Coordinates
              </span>
              <button
                type="button"
                onClick={handleDetectCurrentLocation}
                disabled={detectingGps}
                className="px-2.5 py-1 bg-white border border-blue-300 hover:bg-blue-100 rounded-lg text-[11px] font-bold text-blue-700 flex items-center gap-1 transition-all"
              >
                <LocateFixed className="w-3.5 h-3.5" />
                {detectingGps ? 'Acquiring GPS...' : 'Use Current Device Location'}
              </button>
            </div>

            {gpsError && (
              <p className="text-[11px] text-rose-600 font-bold">{gpsError}</p>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Latitude</label>
                <input
                  type="text"
                  value={newLat}
                  onChange={(e) => setNewLat(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Longitude</label>
                <input
                  type="text"
                  value={newLng}
                  onChange={(e) => setNewLng(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Radius (Meters)</label>
                <input
                  type="number"
                  value={newRadius}
                  onChange={(e) => setNewRadius(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isHqCheck"
              checked={isHq}
              onChange={(e) => setIsHq(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="isHqCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
              Set as Corporate Headquarters Campus
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Register Branch Location
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
