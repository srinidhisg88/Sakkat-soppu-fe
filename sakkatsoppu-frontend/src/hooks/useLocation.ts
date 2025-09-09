import { useState } from 'react';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
  });

  const getLocation = async () => {
    // Geolocation requires secure context (HTTPS) except on localhost
    try {
      const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
      const isSecure = window.location.protocol === 'https:';
      if (!isSecure && !isLocalhost) {
        const msg = 'Location access requires HTTPS or localhost';
        setState(prev => ({ ...prev, error: msg }));
        return Promise.reject(new Error(msg));
      }
    } catch {
      // ignore env detection errors
    }

    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
      }));
      return Promise.reject(new Error('Geolocation not supported'));
    }

    // If Permissions API is available, check if permission was blocked
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const perms: any = (navigator as any).permissions;
      if (perms?.query) {
        const status = await perms.query({ name: 'geolocation' as PermissionName });
        if (status.state === 'denied') {
          const msg = 'Location permission is blocked. Enable it in your browser settings and retry.';
          setState(prev => ({ ...prev, error: msg }));
          return Promise.reject(new Error(msg));
        }
      }
    } catch {
      // ignore permission API errors
    }

    setState(prev => ({ ...prev, loading: true }));

    return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setState({
            latitude,
            longitude,
            error: null,
            loading: false,
          });
          resolve({ latitude, longitude });
        },
        (error) => {
          let message = 'An unknown error occurred';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Please allow location access to continue';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out';
              break;
          }
          setState({
            latitude: null,
            longitude: null,
            error: message,
            loading: false,
          });
          reject(new Error(message));
  },
  { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  return {
    ...state,
    getLocation,
  };
}
