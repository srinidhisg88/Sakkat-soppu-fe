import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLocation as useGeoLocation } from "../hooks/useLocation";
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  PhoneIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

interface SignupFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

export function SignupPage() {
  const [formData, setFormData] = useState<SignupFormData>({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });
  const [error, setError] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  // Location is optional; no restriction
  const { getLocation, error: locationError } = useGeoLocation();
  const googleBtnRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGetLocation = async () => {
    try {
      setIsGettingLocation(true);
      const coords = await getLocation();
      setFormData((prev) => ({
        ...prev,
        latitude: coords.latitude,
        longitude: coords.longitude,
      }));
  setLocationConfirmed(true);
    } catch (err) {
      setError("Failed to get location. Please try again or enter address manually.");
  setLocationConfirmed(false);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
  // No geofencing: proceed without location checks
  const payloadBase: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      };
  if (formData.phone) payloadBase.phone = formData.phone;
  if (formData.address) payloadBase.address = formData.address;
  if (typeof formData.latitude === 'number') payloadBase.latitude = formData.latitude;
  if (typeof formData.longitude === 'number') payloadBase.longitude = formData.longitude;
  const payload: Parameters<typeof signup>[0] = payloadBase as Parameters<typeof signup>[0];
  await signup(payload);
      navigate("/");
    } catch (err) {
      const e = err as unknown as { response?: { data?: { message?: string; error?: string } } ; message?: string };
      const message = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Failed to create account. Please try again.';
      setError(message);
    }
  };

  // Google Identity Services on signup
  useEffect(() => {
  const clientId = googleClientId;
  if (!clientId) return;
    const id = 'google-identity';
    if (!document.getElementById(id)) {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      s.id = id;
      document.body.appendChild(s);
      s.onload = initGoogle;
    } else {
      initGoogle();
    }

    function initGoogle() {
      // @ts-expect-error GIS global is injected by external script
      if (!window.google || !google.accounts || !google.accounts.id) return;
      // @ts-expect-error GIS global is injected by external script
      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential?: string }) => {
          const idToken = response.credential;
          if (!idToken) return;
          try {
            // No geofencing in Google signup either
            const result = await loginWithGoogle(idToken);
            const needs = result && 'needsProfileCompletion' in result ? result.needsProfileCompletion : false;
            if (needs) {
              navigate('/profile', { replace: true, state: { promptComplete: true } });
            } else {
              navigate('/', { replace: true });
            }
          } catch {
            // ignore
          }
        },
        ux_mode: 'popup',
      });
      if (googleBtnRef.current) {
        // @ts-expect-error GIS global is injected by external script
        google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_blue',
          size: 'large',
          shape: 'pill',
          width: 320,
          text: 'signup_with',
        });
      }
    }
  }, [loginWithGoogle, navigate, googleClientId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white overflow-hidden shadow">
            <img src={new URL('../../logo_final.jpg', import.meta.url).href} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create account</h2>
          <p className="mt-2 text-sm text-gray-600">Sign up to start ordering fresh produce</p>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg">{error}</div>}

  <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="relative">
            <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full px-3 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <EnvelopeIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="w-full px-3 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <LockClosedIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full px-3 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Phone */}
          <div className="relative">
            <PhoneIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              className="w-full px-3 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Address */}
          <div className="relative">
            <MapPinIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              id="address"
              name="address"
              type="text"
              required
              value={formData.address}
              onChange={handleChange}
              onFocus={() => {
                // Prompt for location permission when user focuses the address field
                if (!formData.address) {
                  handleGetLocation();
                }
              }}
              placeholder="Address"
              className="w-full px-3 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          {locationError && <p className="text-sm text-red-600 mt-1">{locationError}</p>}
          {locationConfirmed && !locationError && (
            <p className="text-sm text-green-700 mt-1">Location confirmed</p>
          )}

          {/* Location Button */}
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={isGettingLocation}
            className="w-full py-3 px-4 rounded-lg border bg-green-50 text-green-700 hover:bg-green-100"
          >
            {isGettingLocation ? "Getting Location..." : "Use my current location"}
          </button>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-lg bg-green-600 text-white hover:bg-green-700"
          >
            Create Account
          </button>

          <div className="relative">
            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-gray-200" />
              <span className="mx-3 text-gray-400 text-sm">or</span>
              <div className="flex-grow border-t border-gray-200" />
            </div>
            {googleClientId ? (
              <div ref={googleBtnRef} className="flex justify-center" style={{ minHeight: 44 }} />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  disabled
                  className="w-full max-w-xs flex items-center justify-center gap-2 rounded-full bg-blue-600 text-white px-4 py-3 opacity-70 cursor-not-allowed"
                  title="Google sign-up unavailable"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.8 31.7 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.6 5.1 29.6 3 24 3 12 3 9 7.3 6.3 14.7z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.2 16.5 18.7 13 24 13c3 0 5.7 1.1 7.8 3l5.7-5.7C34.6 5.1 29.6 3 24 3 16 3 9 7.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 45c5.2 0 10-2 13.6-5.3l-6.3-5.3C29.1 35.5 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.6 5.1C8.7 40.6 15.8 45 24 45z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.9-3.1 5.2-5.7 6.8l.1.1 6.3 5.3c-.4.3 7 5 7 5 4.1-3.8 6.5-9.4 6.5-15.9 0-1.2-.1-2.3-.4-3.5z"/></svg>
                  Sign up with Google
                </button>
                <p className="text-xs text-gray-500">Set VITE_GOOGLE_CLIENT_ID to enable</p>
              </div>
            )}
          </div>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-green-600 hover:text-green-500">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}