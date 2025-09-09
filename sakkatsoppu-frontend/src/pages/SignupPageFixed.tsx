import { useState } from "react";
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
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { getLocation } = useGeoLocation();

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
    } catch (err) {
      setError("Failed to get location. Please try again or enter address manually.");
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      await signup({
        ...formData,
        latitude: formData.latitude || 0,
        longitude: formData.longitude || 0,
      });
      navigate("/");
    } catch (err) {
      setError("Failed to create account. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-center text-3xl">🌱</div>
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
              placeholder="Address"
              className="w-full px-3 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

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