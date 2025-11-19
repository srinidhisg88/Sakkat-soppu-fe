import { useEffect, useState } from 'react';
import { useLocation as useRouteLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { updateProfile } from '../services/api';
import MapAddressModal from '../components/MapAddressModal';
import { Shimmer } from '../components/Shimmer';
import { UserCircleIcon, ShoppingBagIcon, ChevronRightIcon,CheckCircleIcon } from '@heroicons/react/24/outline';

export function ProfilePage() {
  const { user, isAuthenticated, initializing, refreshProfile, avatarUrl } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const routeLocation = useRouteLocation();
  const promptComplete = ((routeLocation.state as unknown as { promptComplete?: boolean })?.promptComplete) || false;
  const [activeSection, setActiveSection] = useState<'overview' | 'profile' | 'orders'>('overview');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      setActiveSection('overview');
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  const handleLanguageChange = (lang: 'en' | 'hi' | 'kn') => {
    setLanguage(lang);
    setSuccess(t('profile.updateSuccess'));
    setTimeout(() => {
      setActiveSection('overview');
      setSuccess('');
    }, 1000);
  };

  const menuItems = [
    {
      id: 'profile' as const,
      label: t('profile.myProfile'),
      icon: UserCircleIcon,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      id: 'orders' as const,
      label: t('profile.myOrders'),
      icon: ShoppingBagIcon,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      onClick: () => navigate('/orders'),
    },
  ];

  const formatPhoneNumber = (phone: string) => {
    return `+91${phone}`;
  };

  const renderOverview = () => (
    <div className="space-y-4">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => item.onClick ? item.onClick() : setActiveSection(item.id)}
          className="w-full flex items-center justify-between p-4 bg-white rounded-2xl hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${item.bgColor}`}>
              <item.icon className={`h-6 w-6 ${item.iconColor}`} />
            </div>
            <span className="font-medium text-gray-800">{item.label}</span>
          </div>
          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
        </button>
      ))}
    </div>
  );

  const renderProfileEdit = () => (
    <div className="bg-white rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">{t('profile.editProfile')}</h2>
        <button
          onClick={() => setActiveSection('overview')}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          {t('profile.cancel')}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
            {t('profile.fullName')}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
            {t('profile.phoneNumber')}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t('profile.address')}
          </label>
          <div className="space-y-3">
            <div className="px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 min-h-[3rem]">
              {formData.address.houseNo || formData.address.area || formData.address.landmark || formData.address.city || formData.address.state || formData.address.pincode
                ? [formData.address.houseNo, formData.address.area, formData.address.landmark, formData.address.city, formData.address.state, formData.address.pincode]
                    .filter(Boolean)
                    .join(', ')
                : t('profile.noAddressSet')}
            </div>
            <button
              type="button"
              onClick={() => setMapOpen(true)}
              className="w-full px-4 py-3 bg-blue-50 text-blue-800 rounded-xl hover:bg-blue-100 border-2 border-blue-200 font-medium transition-all"
            >
              📍 {t('profile.editAddress')}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
        >
          {t('profile.saveChanges')}
        </button>
      </form>
    </div>
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderLanguageSelector = () => {
    const languages = [
      { code: 'en' as const, name: t('language.english'), flag: '🇬🇧' },
      { code: 'hi' as const, name: t('language.hindi'), flag: '🇮🇳' },
      { code: 'kn' as const, name: t('language.kannada'), flag: '🇮🇳' },
    ];

    return (
      <div className="bg-white rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">{t('language.title')}</h2>
          <button
            onClick={() => setActiveSection('overview')}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            {t('profile.cancel')}
          </button>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">
            {success}
          </div>
        )}

        <p className="text-sm text-gray-600">{t('language.selectLanguage')}</p>

        <div className="space-y-3">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                language === lang.code
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{lang.flag}</span>
                <span className={`font-medium ${language === lang.code ? 'text-green-900' : 'text-gray-800'}`}>
                  {lang.name}
                </span>
              </div>
              {language === lang.code && (
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section with dark green background and decorative shapes */}
      <div className="relative bg-gradient-to-br from-green-800 via-green-700 to-green-900 overflow-hidden pb-20 pt-8 md:pt-12">
        {/* Decorative shapes */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-green-600 opacity-30 rounded-full -translate-x-12 -translate-y-12"></div>
        <div className="absolute top-10 right-10 w-24 h-24 bg-green-900 opacity-20 rounded-full"></div>
        <div className="absolute bottom-10 left-1/4 w-20 h-20 bg-green-600 opacity-25 rounded-full"></div>
        <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-green-800 opacity-20 rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-green-900 opacity-15 rounded-full"></div>

        {/* Profile Header Content */}
        <div className="relative z-10 max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-white mb-8">{t('profile.title')}</h1>

          {/* Avatar */}
          <div className="relative inline-block mb-4">
            <div className="w-32 h-32 rounded-full bg-white overflow-hidden border-4 border-white shadow-xl">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user.name || 'Profile'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-green-200">
                  <UserCircleIcon className="w-20 h-20 text-green-700" />
                </div>
              )}
            </div>
          </div>

          {/* User Info */}
          <h2 className="text-2xl font-bold text-white mb-2">{user.name}</h2>
          <p className="text-green-100 text-lg">{formatPhoneNumber(user.phone)}</p>
        </div>
      </div>

      {/* Account Overview Section */}
      <div className="relative z-20 -mt-12 max-w-2xl mx-auto px-4 pb-20 md:pb-8">
        <div className="bg-white rounded-t-3xl shadow-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">{t('profile.accountOverview')}</h3>

          {activeSection === 'overview' && renderOverview()}
          {activeSection === 'profile' && renderProfileEdit()}
        </div>
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
