"use client";
import { useState, useEffect } from "react";
import { X, Camera, Upload, User, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/lib/services/authService";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { currentUser, updateUser } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);

  // Fetch user profile when modal opens
  useEffect(() => {
    if (isOpen && currentUser) {
      fetchProfile();
    }
  }, [isOpen, currentUser]);

  // Get token from localStorage (can be empty since cookie will be sent automatically)
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    setToken(storedToken);
  }, []);

  const fetchProfile = async () => {
    try {
      setIsFetching(true);
      setError("");
      
      // Token will be sent automatically in cookies by the browser
      const response = await authService.getProfile("");
      
      if (response.success && response.user) {
        const user = response.user;
        setFirstName(user.first_name || "");
        setLastName(user.last_name || "");
        setUsername(user.user_name || "");
        setPhoneNumber(user.phone_number || "");
        setEmail(user.email || "");
        if (user.profile_picture) {
          setProfileImage(user.profile_picture);
        }
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile");
    } finally {
      setIsFetching(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true);
      setError("");

      if (!firstName.trim() || !lastName.trim() || !username.trim()) {
        setError("Please fill in all required fields");
        return;
      }

      // Get token from localStorage
      const authToken = localStorage.getItem('token');
      
      if (!authToken) {
        setError("Authentication token not found. Please login again.");
        return;
      }

      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('user_name', username);
      formData.append('phone_number', phoneNumber);
      formData.append('email', email);

      // Add image file if it was selected
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput?.files?.[0]) {
        formData.append('profile_picture', fileInput.files[0]);
      }

      // Send FormData request
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/v1/api'}/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update profile');
      }

      if (result.success) {
        alert("Profile updated successfully!");
        
        // Update the current user in context
        if (result.user) {
          const updatedUser = {
            ...currentUser,
            first_name: result.user.first_name,
            last_name: result.user.last_name,
            user_name: result.user.user_name,
            phone_number: result.user.phone_number,
            email: result.user.email,
            profile_picture: result.user.profile_picture,
          } as any;
          updateUser(updatedUser);
          setProfileImage(result.user.profile_picture);
        }
        
        onClose();
      } else {
        setError(result.message || "Failed to update profile");
      }
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-700 scrollbar-hide" style={{background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)", scrollbarWidth: "none"}}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Your Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {isFetching && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        )}

        {!isFetching && (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-900 bg-opacity-30 text-red-400 rounded-lg text-sm border border-red-700">
                {error}
              </div>
            )}

            {/* Profile Image */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border-4 border-gray-600">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="text-gray-400 w-12 h-12" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="profile-upload"
              />
              <button
                onClick={() => document.getElementById('profile-upload')?.click()}
                className="mt-4 px-4 py-2 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors border border-gray-600"
              >
                <Upload size={16} className="inline mr-2" />
                Change Photo
              </button>
            </div>

            {/* Profile Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleUpdateProfile}
                disabled={isLoading || !firstName.trim() || !lastName.trim() || !username.trim()}
                className="w-full bg-linear-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="animate-spin" size={20} />}
                {isLoading ? "Updating..." : "Update Profile"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
