import React, { useState } from 'react';
import { MapPin, Navigation, Check, X, ShieldCheck } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface LocationMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (data: { district: string; city: string; address: string; pincode: string }) => void;
}

export const LocationMapModal: React.FC<LocationMapModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
}) => {
  const [selectedLocation, setSelectedLocation] = useState({
    district: 'Chennai',
    city: 'Anna Nagar',
    address: 'No. 42, 2nd Main Road, Anna Nagar',
    pincode: '600040',
    lat: 13.0878,
    lng: 80.217,
  });

  const presetLocations = [
    { district: 'Chennai', city: 'Anna Nagar', address: 'No. 42, 2nd Main Road, Anna Nagar', pincode: '600040', lat: 13.0878, lng: 80.217 },
    { district: 'Chennai', city: 'Velachery', address: '100 Feet Bypass Road, Velachery', pincode: '600042', lat: 12.9759, lng: 80.2212 },
    { district: 'Coimbatore', city: 'Gandhipuram', address: 'Cross Cut Road, Gandhipuram', pincode: '641012', lat: 11.0168, lng: 76.9558 },
    { district: 'Karur', city: 'Thanthonimalai', address: 'Bye-pass Road, Thanthonimalai', pincode: '639005', lat: 10.9601, lng: 78.0766 },
    { district: 'Madurai', city: 'KK Nagar', address: '80 Feet Road, KK Nagar', pincode: '625020', lat: 9.9252, lng: 78.1198 },
  ];

  const handleConfirm = () => {
    onSelectLocation({
      district: selectedLocation.district,
      city: selectedLocation.city,
      address: selectedLocation.address,
      pincode: selectedLocation.pincode,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="space-y-4 select-none text-left">
        <div className="flex items-center justify-between pb-2 border-b border-veyra-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-veyra-blue-soft text-veyra-blue flex items-center justify-center border border-veyra-blue-border/40">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-veyra-text">Interactive Location Map Selector</h3>
              <p className="text-[11px] text-veyra-text-sub">Drop pin to auto-fill HQ address details</p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-veyra-blue bg-veyra-blue-soft px-2.5 py-1 rounded-full border border-veyra-blue-border/40">
            Tamil Nadu, India 🇮🇳
          </span>
        </div>

        {/* Visual Simulated Map Interface */}
        <div className="relative w-full h-56 bg-slate-900 rounded-2xl overflow-hidden border border-veyra-border shadow-inner flex items-center justify-center">
          {/* Map Grid Pattern background */}
          <div
            className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)]"
            style={{ backgroundSize: '16px 16px' }}
          />

          {/* Interactive Map Preset Pins */}
          {presetLocations.map((loc) => {
            const isSelected = loc.city === selectedLocation.city;
            return (
              <button
                key={loc.city}
                onClick={() => setSelectedLocation(loc)}
                className={`absolute p-2 rounded-xl text-[10px] font-bold transition-all transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 shadow-md ${
                  isSelected
                    ? 'bg-veyra-blue text-white ring-4 ring-veyra-blue/30 z-20 scale-110'
                    : 'bg-white text-veyra-text hover:bg-veyra-bg-secondary z-10'
                }`}
                style={{
                  top: `${40 + (loc.lat % 5) * 8}%`,
                  left: `${20 + (loc.lng % 5) * 15}%`,
                }}
              >
                <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-veyra-blue'}`} />
                <span>{loc.city}</span>
              </button>
            );
          })}

          <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-[10px] text-slate-200 font-mono">
            Lat: {selectedLocation.lat} | Lng: {selectedLocation.lng}
          </div>
        </div>

        {/* Selected Location Summary Box */}
        <div className="p-3 bg-veyra-bg-secondary rounded-xl border border-veyra-border text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-veyra-text-sub">Selected District:</span>
            <span className="font-bold text-veyra-text">{selectedLocation.district}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-veyra-text-sub">City / Area:</span>
            <span className="font-bold text-veyra-blue">{selectedLocation.city}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-veyra-text-sub">Street Address:</span>
            <span className="font-medium text-veyra-text truncate max-w-[220px]">{selectedLocation.address}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-veyra-text-sub">PIN Code:</span>
            <span className="font-mono font-bold text-emerald-700">{selectedLocation.pincode}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleConfirm} icon={<Check className="w-4 h-4" />}>
            Use Selected Location
          </Button>
        </div>
      </div>
    </Modal>
  );
};
