import { useEffect, useState } from 'react';
import { useLocation as useRouteLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/api';
import MapAddressModal from '../components/MapAddressModal';

export function ProfilePage() {
  const { user, isAuthenticated, initializing, refreshProfile } = useAuth();
  const routeLocation = useRouteLocation();
  const promptComplete = ((routeLocation.state as unknown as { promptComplete?: boolean })?.promptComplete) || false;
  const [isEditing, setIsEditing] = useState<boolean>(promptComplete);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mapOpen, setMapOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    latitude: user?.latitude || 0,
    longitude: user?.longitude || 0,
  });

  // Keep form in sync when user loads/updates (e.g., right after login)
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        latitude: user.latitude || 0,
        longitude: user.longitude || 0,
      });
    }
  }, [user]);

  if (initializing) return <div className="py-8 text-center">Loading profile…</div>;
  if (!isAuthenticated) return null;
  if (!user) return <div className="py-8 text-center">Loading user…</div>;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMapConfirm = (data: { address: string; latitude: number; longitude: number }) => {
    setFormData(prev => ({
      ...prev,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
    }));
    setMapOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      setSuccess('Profile updated successfully');
  // Refresh auth user so read-only view is up-to-date
  await refreshProfile();
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      {((routeLocation.state as unknown as { promptComplete?: boolean })?.promptComplete) && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm">
          Complete your profile to finish sign-in
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="name" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label 
                htmlFor="phone" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label 
                htmlFor="address" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Address
              </label>
              <div className="flex items-center gap-2">
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  readOnly
                  rows={2}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
                <button
                  type="button"
                  onClick={() => setMapOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit on map
                </button>
              </div>
            </div>

            {/* Coordinates hidden per requirement; still stored in formData for API */}

            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-medium text-gray-700">Full Name</h2>
              <p className="mt-1">{user.name}</p>
            </div>

            <div>
              <h2 className="text-sm font-medium text-gray-700">Email</h2>
              <p className="mt-1">{user.email}</p>
            </div>

            <div>
              <h2 className="text-sm font-medium text-gray-700">Phone Number</h2>
              <p className="mt-1">{user.phone}</p>
            </div>

            <div>
              <h2 className="text-sm font-medium text-gray-700">Address</h2>
              <p className="mt-1">{user.address}</p>
            </div>

            {/* Coordinates hidden per requirement on read-only view */}

            <button
              onClick={() => setIsEditing(true)}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700"
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>

      <MapAddressModal
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        onConfirm={handleMapConfirm}
        defaultCenter={formData.latitude && formData.longitude ? { lat: formData.latitude, lon: formData.longitude } : null}
      />
    </div>
  );
}
