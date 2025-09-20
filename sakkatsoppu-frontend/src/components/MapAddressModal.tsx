import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L, { Icon, LeafletEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { geocodeReverse, geocodeSearch } from '../services/api';

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
const FALLBACK_CENTER: LatLng = { lat: 12.9716, lon: 77.5946 };

export type MapAddressModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { address: string; latitude: number; longitude: number }) => void;
  defaultCenter?: LatLng | null; // preferred default from geolocation
  autoGeo?: boolean; // whether to attempt browser geolocation on open when defaultCenter is absent
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

export default function MapAddressModal({ isOpen, onClose, onConfirm, defaultCenter, autoGeo = true }: MapAddressModalProps) {
  const mapKey = import.meta.env.VITE_MAPTILER_KEY as string | undefined;
  const [center, setCenter] = useState<LatLng | null>(defaultCenter || null);
  const [marker, setMarker] = useState<LatLng | null>(defaultCenter || null);
  const [address, setAddress] = useState('');
  // Address fields
  const [flatNo, setFlatNo] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const debSearch = useDebounced(search, 450);
  const [mapSeed, setMapSeed] = useState(0);
  const pinInvalid = useMemo(() => {
    const p = (pincode || '').trim();
    if (p.length === 0) return false; // optional; only validate when provided
    return !/^\d{6}$/.test(p);
  }, [pincode]);
  const cityEmpty = (city || '').trim().length === 0;
  const stateEmpty = (stateName || '').trim().length === 0;

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
      setAddress('');
      setFlatNo('');
      setLandmark('');
      setCity('');
      setStateName('');
      setPincode('');
      setSearch('');
      setResults([]);
      setError(null);
      // Immediately get address for initial marker
      reverse(initial.lat, initial.lon);
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
          { enableHighAccuracy: true, maximumAge: 30000, timeout: 5000 }
        );
      }
    }
  }, [isOpen, defaultCenter, reverse, autoGeo]);

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
    <div className="fixed inset-0 z-[9999] flex items-stretch md:items-center justify-center bg-black/40 p-0 md:p-4 overflow-y-auto">
      <div className="w-full md:max-w-3xl bg-white rounded-none md:rounded-xl shadow-lg border border-gray-200 mx-0 md:mx-auto my-0 md:my-8 h-screen md:max-h-[92vh] overflow-y-auto flex flex-col">
        <div className="p-4 border-b flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search address or place"
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <button onClick={onClose} className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">Close</button>
        </div>
        {results.length > 0 && (
          <div className="max-h-48 overflow-auto border-b">
            {results.map((r, idx) => (
              <button
                key={`${r.lat}-${r.lon}-${idx}`}
                onClick={() => pickResult(r)}
                className="block w-full text-left px-4 py-2 hover:bg-gray-50"
              >
                {r.displayName}
              </button>
            ))}
          </div>
        )}
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
        <div className="p-4 border-t space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Flat / House No.</label>
              <input
                value={flatNo}
                onChange={(e) => setFlatNo(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., 12A"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Landmark</label>
              <input
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Near park / temple / mall"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Street / Area</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Street name, locality"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">City</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${cityEmpty ? 'border-amber-300' : ''}`}
                aria-invalid={cityEmpty}
              />
              {cityEmpty && (
                <p className="mt-1 text-[11px] text-amber-600">Recommended: add a city</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">State</label>
              <input
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${stateEmpty ? 'border-amber-300' : ''}`}
                aria-invalid={stateEmpty}
              />
              {stateEmpty && (
                <p className="mt-1 text-[11px] text-amber-600">Recommended: add a state</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Pincode</label>
              <input
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={`w-full px-3 py-2 border rounded-md ${pinInvalid ? 'border-red-400' : ''}`}
                inputMode="numeric"
                pattern="\\d{6}"
                maxLength={6}
                aria-invalid={pinInvalid}
              />
              {pinInvalid && (
                <p className="mt-1 text-[11px] text-red-600">Enter a valid 6-digit pincode</p>
              )}
            </div>
          </div>
          {/* Composed preview */}
          <div className="text-xs text-gray-600">
            <span className="font-medium">Preview:</span>
            <div className="mt-1 whitespace-pre-line">
              {[flatNo, address, landmark, city, stateName, pincode]
                .map((s) => (s || '').trim())
                .filter(Boolean)
                .join('\n') || '—'}
            </div>
          </div>
          <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur border-t border-gray-200 -mx-4 px-4 pt-3 mt-2 flex items-center justify-between">
            <div className="text-xs text-gray-600">
              {marker ? (
                <span>Lat: {marker.lat.toFixed(5)} • Lon: {marker.lon.toFixed(5)}</span>
              ) : (
                <span>Select a point on the map</span>
              )}
              {loading && <span className="ml-2">· Loading…</span>}
            </div>
            <button
              onClick={() => {
                if (!marker) return;
                const composed = [flatNo, address, landmark, city, stateName, pincode]
                  .map((s) => (s || '').trim())
                  .filter((s) => s.length > 0)
                  .join(', ');
                onConfirm({ address: composed, latitude: marker.lat, longitude: marker.lon });
                onClose();
              }}
              disabled={!marker || pinInvalid || [flatNo, address, landmark, city, stateName, pincode].every((s) => (s || '').trim().length === 0)}
              className={`px-4 py-2 rounded-md text-white w-full md:w-auto ${!marker || pinInvalid || [flatNo, address, landmark, city, stateName, pincode].every((s) => (s || '').trim().length === 0) ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
            >
              Use this location
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
