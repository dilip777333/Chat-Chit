"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, ArrowLeft, Mail, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/lib/services/authService";

export default function UserDetailsPage() {
  const router = useRouter();
  const { currentUser, token, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || !token) {
      router.push('/login');
      return;
    }
  }, [currentUser, token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Fetch latest profile to ensure data is up-to-date before proceeding
      const response = await authService.getProfile();

      if (response.success && response.user) {
        setSuccessMessage("Profile completed successfully!");
        login(response.user, token!);
        setTimeout(() => {
          router.push('/chat');
        }, 1500);
      } else {
        setError(response.message || "Failed to complete profile");
      }
    } catch (err: any) {
      setError(err.message || "Failed to complete profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/images/main-bg.jpg')" }}></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white bg-opacity-90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-200">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-2xl mb-4">
              <User className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
            <p className="text-gray-600">Your details are ready</p>
          </div>

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

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center"
              >
                <ArrowLeft className="mr-2 w-5 h-5" />
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoading ? "Saving..." : "Complete Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}