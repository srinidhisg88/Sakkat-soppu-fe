import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L, { Icon, LeafletEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { geocodeReverse, geocodeSearch, getPublicDeliverySettings } from '../services/api';
import { useQuery } from '@tanstack/react-query';

// Fix default icon paths for Leaflet in bundlers
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
// Ensure Leaflet uses our provided URLs without trying to prefix them
// This avoids paths like /node_modules/... being duplicated
// @ts-expect-error private API used for bundler compatibility
delete L.Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

type LatLng = { lat: number; lon: number };
const FALLBACK_CENTER: LatLng = { lat: 12.2958, lon: 76.6394 };

export type MapAddressModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { 
    address: {
      houseNo: string;
      landmark: string;
      area: string;
      city: string;
      state: string;
      pincode: string;
    }; 
    latitude: number; 
    longitude: number;
    saveToProfile?: boolean;
  }) => void;
  defaultCenter?: LatLng | null; // preferred default from geolocation
  autoGeo?: boolean; // whether to attempt browser geolocation on open when defaultCenter is absent
  initialAddress?: {
    houseNo: string;
    landmark: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
  }; // initial address object to populate fields
  showSaveCheckbox?: boolean;
  saveCheckboxLabel?: string;
  showMap?: boolean; // whether to show the map component
};

type SearchResult = {
  displayName: string;
  lat: number;
  lon: number;
};

function useDebounced<T>(value: T, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function ClickHandler({ onClick }: { onClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapAddressModal({ isOpen, onClose, onConfirm, defaultCenter, autoGeo = true, initialAddress, showSaveCheckbox = false, saveCheckboxLabel = "Save this address for next delivery", showMap = true }: MapAddressModalProps) {
  const mapKey = import.meta.env.VITE_MAPTILER_KEY as string | undefined;
  const [center, setCenter] = useState<LatLng | null>(defaultCenter || null);
  const [marker, setMarker] = useState<LatLng | null>(defaultCenter || null);
  const [address, setAddress] = useState('');
  // Address fields
  const [flatNo, setFlatNo] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Mysuru');
  const [stateName, setStateName] = useState('Karnataka');
  const [pincode, setPincode] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saveToProfile, setSaveToProfile] = useState(false);
  const debSearch = useDebounced(search, 450);
  const [mapSeed, setMapSeed] = useState(0);
  const pinInvalid = useMemo(() => {
    const p = (pincode || '').trim();
    if (p.length === 0) return false; // optional; only validate when provided
    return !/^\d{6}$/.test(p);
  }, [pincode]);
  // City and State are fixed; no emptiness checks required

  // Fetch available cities from delivery settings
  type DeliverySettings = {
    enabled: boolean;
    minOrderSubtotal: number;
    cities: Array<{
      name: string;
      basePrice: number;
      pricePerKg: number;
      freeDeliveryThreshold: number;
    }>;
  };

  const { data: deliverySettings } = useQuery<DeliverySettings, Error>(
    ['public', 'delivery-settings'],
    async () => {
      try {
        const res = await getPublicDeliverySettings();
        const d = res.data as Record<string, unknown>;
        if (!d) throw new Error('No data');

        // Backend schema: { enabled, minOrderSubtotal, cities: [{name, basePrice, pricePerKg, freeDeliveryThreshold}] }
        const citiesArray = (d.cities || []) as DeliverySettings['cities'];

        return {
          enabled: (d.enabled as boolean) ?? true,
          minOrderSubtotal: (d.minOrderSubtotal as number) ?? 0,
          cities: citiesArray,
        };
      } catch {
        // Fallback to default cities if API fails
        return {
          enabled: true,
          minOrderSubtotal: 0,
          cities: [
            { name: 'Mysuru', basePrice: 50, pricePerKg: 15, freeDeliveryThreshold: 600 },
            { name: 'Bengaluru', basePrice: 40, pricePerKg: 10, freeDeliveryThreshold: 500 }
          ],
        };
      }
    },
    {
      staleTime: 10 * 60_000,
    }
  );

  const availableCities = useMemo(() => {
    return deliverySettings?.cities?.map(c => c.name) || ['Mysuru', 'Bengaluru'];
  }, [deliverySettings]);

  // Reverse geocode on marker move or initialization
  const reverse = useMemo(() => async (lat: number, lon: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await geocodeReverse({ lat, lon });
      const data: unknown = res.data;
      const addr = (data && typeof data === 'object' && ('display_name' in data))
        ? (data as { display_name?: string }).display_name || ''
        : (data && typeof data === 'object' && 'address' in data)
        ? String((data as { address?: unknown }).address || '')
        : '';
      setAddress(addr);
    } catch (e) {
      setError('Failed to get address for this location.');
      setAddress('');
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync default center when opening; if none, try browser geolocation
  useEffect(() => {
    if (isOpen) {
      const initial = defaultCenter || FALLBACK_CENTER;
      setCenter(initial);
      setMarker(initial);

      // Get default city from available cities (first one)
      const defaultCity = availableCities[0] || 'Mysuru';

      if (initialAddress) {
        setFlatNo(initialAddress.houseNo || '');
        setAddress(initialAddress.area || '');
        setLandmark(initialAddress.landmark || '');

        // Check if the initial city is in available cities (case-insensitive)
        const initialCityLower = (initialAddress.city || '').toLowerCase();
        const matchingCity = availableCities.find(c => c.toLowerCase() === initialCityLower);
        setCity(matchingCity || defaultCity);

        setStateName(initialAddress.state || 'Karnataka');
        setPincode(initialAddress.pincode || '');
      } else {
        setAddress('');
        setFlatNo('');
        setLandmark('');
        setCity(defaultCity);
        setStateName('Karnataka');
        setPincode('');
        // Immediately get address for initial marker
        reverse(initial.lat, initial.lon);
      }
      setSearch('');
      setResults([]);
      setError(null);
      // Try to improve accuracy with geolocation when available
      if (autoGeo && !defaultCenter && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const c = { lat: pos.coords.latitude, lon: pos.coords.longitude };
            setCenter(c);
            setMarker(c);
            reverse(c.lat, c.lon);
            // Remount map to center smoothly
            setMapSeed((s) => s + 1);
          },
          undefined,
          { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );
      }
    }
  }, [isOpen, defaultCenter, reverse, autoGeo, initialAddress, availableCities]);

  // Forward geocoding (search)
  useEffect(() => {
    const run = async () => {
      if (!isOpen) return;
      const q = debSearch.trim();
      if (q.length < 3) { setResults([]); return; }
      try {
        setLoading(true);
        setError(null);
  const res = await geocodeSearch({ q, limit: 6 });
        type NominatimItem = { display_name?: string; name?: string; lat: string | number; lon: string | number };
        const raw: unknown = res.data;
        let list: NominatimItem[] = [];
        if (Array.isArray(raw)) list = raw as NominatimItem[];
        else if (raw && typeof raw === 'object' && Array.isArray((raw as { results?: unknown[] }).results)) list = ((raw as { results?: unknown[] }).results || []) as NominatimItem[];
        const items: SearchResult[] = list.map((r) => ({
          displayName: (r.display_name || r.name || '') as string,
          lat: Number(r.lat),
          lon: Number(r.lon),
        }));
        setResults(items.filter((i) => isFinite(i.lat) && isFinite(i.lon)));
      } catch (e) {
        setError('Search failed. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [debSearch, isOpen]);

  // ... reverse defined above

  const pickResult = async (r: SearchResult) => {
    setCenter({ lat: r.lat, lon: r.lon });
    setMarker({ lat: r.lat, lon: r.lon });
    // Remount map to recenter
    setMapSeed((s) => s + 1);
    await reverse(r.lat, r.lon);
  };

  const onMapClick = async (lat: number, lon: number) => {
    setMarker({ lat, lon });
    await reverse(lat, lon);
  };

  const markerDragEnd = async (e: LeafletEvent) => {
    const mk = e.target as L.Marker<unknown>;
    const ll = mk.getLatLng();
    await reverse(ll.lat, ll.lng);
    setMarker({ lat: ll.lat, lon: ll.lng });
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-stretch md:items-center justify-center bg-white md:bg-black/40 p-0 md:p-4 overflow-y-auto">
      <div className="w-full md:max-w-3xl bg-white rounded-none md:rounded-2xl shadow-2xl border-0 md:border border-gray-200 mx-0 md:mx-auto my-0 md:my-8 h-screen md:max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-green-50 to-blue-50 border-b-2 border-green-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-green-900">📍 Set Delivery Address</h2>
            <button onClick={onClose} className="p-2 text-gray-700 hover:bg-white rounded-xl transition-all">
              <span className="text-xl">✕</span>
            </button>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for your address or landmark..."
            className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        {results.length > 0 && (
          <div className="max-h-48 overflow-auto border-b bg-green-50">
            <p className="text-xs font-semibold text-gray-600 px-4 py-2 bg-white border-b">Search Results:</p>
            {results.map((r, idx) => (
              <button
                key={`${r.lat}-${r.lon}-${idx}`}
                onClick={() => pickResult(r)}
                className="block w-full text-left px-4 py-3 text-sm hover:bg-green-100 border-b border-green-100 last:border-0 transition-colors"
              >
                <span className="text-green-700">📍</span> {r.displayName}
              </button>
            ))}
          </div>
        )}
        {showMap && (
          <div className="relative h-72 md:h-[420px] min-h-[18rem]">
            {!mapKey && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 text-center p-6">
                <div>
                  <p className="font-semibold">Map key missing</p>
                  <p className="text-sm text-gray-600 mt-1">Set VITE_MAPTILER_KEY in your environment to load the map.</p>
                </div>
              </div>
            )}
            <MapContainer
              center={center ? [center.lat, center.lon] as [number, number] : [12.9716, 77.5946]}
              zoom={center ? 15 : 12}
              style={{ height: '100%', width: '100%' }}
              key={mapSeed}
            >
              <TileLayer
                url={`https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${mapKey || 'no-key'}`}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>'
              />
              <ClickHandler onClick={onMapClick} />
              {marker && (
                <Marker
                  position={[marker.lat, marker.lon]}
                  draggable
                  eventHandlers={{ dragend: markerDragEnd }}
                />
              )}
            </MapContainer>
          </div>
        )}
        <div className="p-4 border-t bg-gradient-to-b from-white to-green-50 space-y-3">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">{error}</p>}
          <div className="bg-white rounded-2xl p-4 border-2 border-green-100 space-y-3">
            <h3 className="text-sm font-bold text-green-900 mb-2">Complete Your Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Flat / House No. *</label>
                <input
                  value={flatNo}
                  onChange={(e) => setFlatNo(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  placeholder="e.g., 12A"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Landmark</label>
                <input
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  placeholder="Near park / temple / mall"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Street / Area *</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  placeholder="Street name, locality"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City *</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white"
                >
                  {availableCities.map((cityName) => (
                    <option key={cityName} value={cityName}>
                      {cityName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                <input
                  value={stateName}
                  readOnly
                  aria-readonly
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 cursor-not-allowed text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={`w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:ring-2 ${pinInvalid ? 'border-red-400 focus:ring-red-500' : 'border-green-200 focus:ring-green-500 focus:border-transparent'}`}
                  inputMode="numeric"
                  pattern="\\d{6}"
                  maxLength={6}
                  aria-invalid={pinInvalid}
                  placeholder="6-digit pincode"
                />
                {pinInvalid && (
                  <p className="mt-1 text-[11px] text-red-600">Enter a valid 6-digit pincode</p>
                )}
              </div>
            </div>
          </div>
          {/* Composed preview */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <span className="text-xs font-semibold text-gray-700">📝 Address Preview:</span>
            <div className="mt-1.5 text-xs text-gray-700 whitespace-pre-line">
              {[flatNo, address, landmark, city, stateName, pincode]
                .map((s) => (s || '').trim())
                .filter(Boolean)
                .join(', ') || 'Fill in the details above'}
            </div>
          </div>
          {showSaveCheckbox && (
            <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-xl p-3">
              <input
                type="checkbox"
                id="save-address"
                checked={saveToProfile}
                onChange={(e) => setSaveToProfile(e.target.checked)}
                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="save-address" className="text-xs text-gray-700 font-medium">
                {saveCheckboxLabel}
              </label>
            </div>
          )}
          <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent backdrop-blur-sm border-t-2 border-green-200 -mx-4 px-4 pt-4 pb-2 mt-2 space-y-3">
            {showMap && (
              <div className="text-[10px] text-gray-600 text-center bg-green-50 py-1.5 px-2 rounded-lg">
                {marker ? (
                  <span>📍 Lat: {marker.lat.toFixed(5)} • Lon: {marker.lon.toFixed(5)}</span>
                ) : (
                  <span>🗺️ Tap on map to set location</span>
                )}
                {loading && <span className="ml-2">• Loading…</span>}
              </div>
            )}
            <button
              onClick={() => {
                // Use default coordinates if map is disabled
                const finalLat = showMap && marker ? marker.lat : (defaultCenter?.lat || FALLBACK_CENTER.lat);
                const finalLon = showMap && marker ? marker.lon : (defaultCenter?.lon || FALLBACK_CENTER.lon);

                const addressObj = {
                  houseNo: flatNo.trim(),
                  landmark: landmark.trim(),
                  area: address.trim(),
                  city: city.trim(),
                  state: stateName.trim(),
                  pincode: pincode.trim(),
                };
                onConfirm({ address: addressObj, latitude: finalLat, longitude: finalLon, saveToProfile });
                onClose();
              }}
              disabled={pinInvalid || [flatNo, address, landmark, city, stateName, pincode].every((s) => (s || '').trim().length === 0)}
              className={`w-full py-4 rounded-2xl text-white font-bold text-base transition-all ${pinInvalid || [flatNo, address, landmark, city, stateName, pincode].every((s) => (s || '').trim().length === 0) ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg active:scale-95'}`}
            >
              {showMap ? '✓ Confirm & Use This Location' : '✓ Save Address'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
