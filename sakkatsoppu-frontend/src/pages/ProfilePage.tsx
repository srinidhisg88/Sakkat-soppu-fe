import { useEffect, useState } from 'react';
import { useLocation as useRouteLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/api';
import MapAddressModal from '../components/MapAddressModal';
import { Shimmer } from '../components/Shimmer';

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
    address: (user?.address && typeof user.address === 'object' && 'houseNo' in user.address)
      ? user.address
      : {
          houseNo: '',
          landmark: '',
          area: typeof user?.address === 'string' ? user.address : '',
          city: 'Mysore',
          state: 'Karnataka',
          pincode: '',
        },
    latitude: user?.latitude || 0,
    longitude: user?.longitude || 0,
  });

  // Keep form in sync when user loads/updates (e.g., right after login)
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: (user.address && typeof user.address === 'object' && 'houseNo' in user.address)
          ? user.address
          : {
              houseNo: '',
              landmark: '',
              area: typeof user.address === 'string' ? user.address : '',
              city: 'Mysore',
              state: 'Karnataka',
              pincode: '',
            },
        latitude: user.latitude || 0,
        longitude: user.longitude || 0,
      });
    }
  }, [user]);

  if (initializing) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <Shimmer width="w-48" height="h-8" />
        <div className="bg-white rounded-lg p-6 space-y-4">
          <Shimmer width="w-full" height="h-10" />
          <Shimmer width="w-full" height="h-10" />
          <Shimmer width="w-full" height="h-24" />
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return null;
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <Shimmer width="w-48" height="h-8" />
        <div className="bg-white rounded-lg p-6 space-y-4">
          <Shimmer width="w-full" height="h-10" />
          <Shimmer width="w-full" height="h-10" />
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMapConfirm = (data: { address: { houseNo: string; landmark: string; area: string; city: string; state: string; pincode: string }; latitude: number; longitude: number }) => {
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
      // After refresh, update formData with latest user values
      if (user) {
        setFormData({
          name: user.name || '',
          phone: user.phone || '',
          address: (user.address && typeof user.address === 'object' && 'houseNo' in user.address)
            ? user.address
            : {
                houseNo: '',
                landmark: '',
                area: typeof user.address === 'string' ? user.address : '',
                city: 'Mysore',
                state: 'Karnataka',
                pincode: '',
              },
          latitude: user.latitude || 0,
          longitude: user.longitude || 0,
        });
      }
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <div className="space-y-2">
                <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 min-h-[2.5rem]">
                  {formData.address.houseNo || formData.address.area || formData.address.landmark || formData.address.city || formData.address.state || formData.address.pincode
                    ? [formData.address.houseNo, formData.address.area, formData.address.landmark, formData.address.city, formData.address.state, formData.address.pincode]
                        .filter(Boolean)
                        .join(', ')
                    : 'No address set'}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setMapOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Edit address
                  </button>
                </div>
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
              <p className="mt-1">
                {user.address && typeof user.address === 'object' && 'houseNo' in user.address
                  ? [user.address.houseNo, user.address.area, user.address.landmark, user.address.city, user.address.state, user.address.pincode]
                      .filter(Boolean)
                      .join(', ')
                  : typeof user.address === 'string'
                  ? user.address
                  : 'Not provided'}
              </p>
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
        defaultCenter={formData.latitude && formData.longitude && formData.latitude !== 0 && formData.longitude !== 0 ? { lat: formData.latitude, lon: formData.longitude } : null}
        initialAddress={formData.address}
        showMap={false}
      />
    </div>
  );
}
