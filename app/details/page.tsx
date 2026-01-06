"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, ArrowLeft, Check, Camera, Upload, ChevronLeft, ChevronRight, Shield, Users, Zap, ArrowUpDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authService, UpdateUserDetailsRequest } from "@/lib/services/authService";

export default function UserDetailsPage() {
  const router = useRouter();
  const { currentUser, token, login } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSwapped, setIsSwapped] = useState(false);

  useEffect(() => {
    if (!currentUser || !token) {
      router.push('/login');
      return;
    }

    // Pre-fill username if available
    if (currentUser.user_name) {
      setUserName(currentUser.user_name);
    }
  }, [currentUser, token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    if (!currentUser || !token) {
      setError("Authentication error. Please login again.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updateData: UpdateUserDetailsRequest = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        user_name: userName.trim() || undefined,
      };

      const response = await authService.updateUserDetails(currentUser.id, updateData, token);
      
      if (response.success && response.user) {
        setSuccessMessage("Profile updated successfully!");
        
        // Update user context with new details
        login(response.user, token);
        
        // Redirect to chat after a short delay
        setTimeout(() => {
          router.push('/chat');
        }, 1500);
      } else {
        setError(response.message || "Failed to update profile");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700" 
           style={{ backgroundImage: "url('/images/main-bg.jpg')" }}>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - User Details Form */}
        <div className={`w-full md:w-1/2 flex items-center justify-center p-8 transition-all duration-700 ease-in-out ${
          isSwapped ? 'order-2' : 'order-1'
        }`}>
          <div className="w-full max-w-md">
            {/* Logo Section */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-2xl mb-4">
                <User className="text-white w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
              <p className="text-gray-200">Tell us a bit about yourself</p>
            </div>

            {/* User Details Form */}
            <div className="bg-white bg-opacity-90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-200">
              {/* Error/Success Messages */}
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                </div>
              )}
              {successMessage && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    First Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="text-gray-500 w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter your first name"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
                      required
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Last Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="text-gray-500 w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
                      required
                    />
                  </div>
                </div>

                {/* Username (Optional) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Username (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="text-gray-500 w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Choose a username"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
                    />
                  </div>
                </div>

                {/* Contact Info Display */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-sm text-gray-600 space-y-1">
                    {currentUser?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{currentUser.email}</span>
                      </div>
                    )}
                    {currentUser?.phone_number && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{currentUser.phone_number}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !firstName.trim() || !lastName.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isLoading ? "Saving..." : "Complete Profile"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Side - Welcome Text */}
        <div className={`hidden md:flex w-1/2 items-center justify-center p-8 transition-all duration-700 ease-in-out ${
          isSwapped ? 'order-1' : 'order-2'
        }`}>
          <div className="text-center text-white">
            <h2 className="text-5xl font-bold mb-6">Welcome Aboard</h2>
            <p className="text-xl mb-8 text-gray-200">Complete your profile to start connecting with friends and family around the world</p>
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <Zap className="text-white w-7 h-7" />
                </div>
                <span className="text-xl font-semibold text-white drop-shadow-lg">Instant Messaging</span>
              </div>
              <div className="flex items-center justify-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <Users className="text-white w-7 h-7" />
                </div>
                <span className="text-xl font-semibold text-white drop-shadow-lg">Connect with Friends</span>
              </div>
              <div className="flex items-center justify-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <Shield className="text-white w-7 h-7" />
                </div>
                <span className="text-xl font-semibold text-white drop-shadow-lg">Secure & Private</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsSwapped(!isSwapped)}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 p-4 rounded-full shadow-lg hover:opacity-90 hover:scale-110 transition-all duration-300"
        >
          <ArrowUpDown size={24} className="text-white" />
        </button>
      </div>
    </div>
  );
}
