"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Mail, Phone, ArrowLeft, Check, User, Camera, Upload, ChevronLeft, ChevronRight, Shield, Users, Zap, ArrowUpDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Static user data for demo
const staticUsers = [
  {
    phone: "0123456789",
    email: "dummy@gmail.com",
    firstName: "dummy",
    lastName: "user",
    username: "dummy-user",
    profileImage: null
  }
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loginMethod, setLoginMethod] = useState<"phone" | "email">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [userType, setUserType] = useState<"new" | "existing">("new");
  const [isSwapped, setIsSwapped] = useState(false);

  const handleSendOtp = async () => {
    const isValid = (loginMethod === "phone" && phoneNumber.length >= 10) || 
                   (loginMethod === "email" && email.includes("@"));
    
    if (isValid) {
      setIsLoading(true);
      // Set user type based on selection
      setIsExistingUser(userType === "existing");
      
      // Simulate API call
      setTimeout(() => {
        setShowOtpInput(true);
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleBack = () => {
    setShowOtpInput(false);
    setOtp(["", "", "", "", "", ""]);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleVerifyOtp = () => {
    const otpValue = otp.join("");
    if (otpValue.length === 6) {
      setIsLoading(true);
      // Simulate OTP verification - accept any 6-digit code for now
      setTimeout(() => {
        if (isExistingUser) {
          // Existing user - direct to chat
          login(); // Set authentication state
          router.push("/chat");
        } else {
          // New user - show registration form
          setShowOtpInput(false);
          setShowRegistration(true);
          // Pre-fill contact info
          if (loginMethod === "phone") {
            setPhoneNumber(phoneNumber);
          } else {
            setEmail(email);
          }
        }
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
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

  const handleRegistration = async () => {
    const isValid = firstName.trim() && lastName.trim() && username.trim() && 
                   ((loginMethod === "phone" && phoneNumber.length >= 10) || 
                    (loginMethod === "email" && email.includes("@")));
    
    if (isValid) {
      setIsLoading(true);
      // Simulate registration API call
      setTimeout(() => {
        login(); // Set authentication state
        router.push("/chat");
      }, 1000);
    }
  };

  const handleProfileUpdate = async () => {
    setIsLoading(true);
    // Simulate profile update API call
    setTimeout(() => {
      setIsLoading(false);
      alert("Profile updated successfully!");
    }, 1000);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
           style={{ backgroundImage: "url('/images/main-bg.jpg')" }}>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - OTP Form */}
        <div className={`w-full md:w-1/2 flex items-center justify-center p-8 transition-all duration-700 ease-in-out ${
          isSwapped ? 'order-2' : 'order-1'
        }`}>
          <div className="w-full max-w-md">
            {/* Logo Section */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-2xl mb-4">
                <MessageSquare className="text-white w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">ChatApp</h1>
              <p className="text-gray-200">Connect with friends and family</p>
            </div>

            {/* Login Form - More Visible */}
            <div className="bg-white bg-opacity-90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-200">
              {/* Login Method Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                <button
                  onClick={() => setLoginMethod("phone")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-all ${
                    loginMethod === "phone"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <Phone size={18} />
                  <span className="text-sm font-semibold">Phone</span>
                </button>
                <button
                  onClick={() => setLoginMethod("email")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-all ${
                    loginMethod === "email"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <Mail size={18} />
                  <span className="text-sm font-semibold">Email</span>
                </button>
              </div>

              {/* User Type Selection */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                <button
                  onClick={() => setUserType("new")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-all ${
                    userType === "new"
                      ? "bg-white shadow-sm text-green-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <User size={18} />
                  <span className="text-sm font-semibold">Register as New</span>
                </button>
                <button
                  onClick={() => setUserType("existing")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-all ${
                    userType === "existing"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <Check size={18} />
                  <span className="text-sm font-semibold">Existing User</span>
                </button>
              </div>

              {/* Input Fields */}
              <div className="space-y-4">
                {loginMethod === "phone" ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="text-gray-500 w-5 h-5" />
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                        placeholder="Enter your phone number"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
                        maxLength={10}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="text-gray-500 w-5 h-5" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSendOtp}
                  disabled={isLoading || (loginMethod === "phone" ? phoneNumber.length < 10 : !email.includes("@"))}
                  className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isLoading ? "Sending OTP..." : "Send OTP"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Welcome Text */}
        <div className={`hidden md:flex w-1/2 items-center justify-center p-8 transition-all duration-700 ease-in-out ${
          isSwapped ? 'order-1' : 'order-2'
        }`}>
          <div className="text-center text-white">
            <h2 className="text-5xl font-bold mb-6">Welcome Back</h2>
            <p className="text-xl mb-8 text-gray-200">Experience seamless communication with friends and family around the world</p>
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

      {/* Registration Form Overlay */}
      {showRegistration && (
        <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Complete Your Profile</h2>
              <button
                onClick={() => {
                  setShowRegistration(false);
                  setShowOtpInput(false);
                  setOtp(["", "", "", "", "", ""]);
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft size={20} />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Welcome! Please complete your profile to continue
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="text-gray-400 w-8 h-8" />
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
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Upload size={16} />
                </button>
              </div>
            </div>

            {/* Contact Info (Pre-filled) */}
            <div className="space-y-4">
              {loginMethod === "phone" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="text-gray-400 w-5 h-5" />
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder="Enter your phone number"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={10}
                      disabled
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="text-gray-400 w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleRegistration}
                disabled={isLoading || !firstName.trim() || !lastName.trim() || !username.trim()}
                className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating Account..." : "Save & Continue"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Input Modal */}
      {showOtpInput && (
        <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md border border-gray-200">
            <div className="text-center mb-6">
              <button
                onClick={handleBack}
                className="absolute left-6 top-6 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-xl font-bold text-gray-800">Enter OTP</h2>
              <p className="text-gray-600 mt-2">
                We've sent a 6-digit code to {loginMethod === "phone" ? phoneNumber : email}
              </p>
              {userType === "existing" && (
                <p className="text-green-600 text-sm mt-2">Existing user login selected!</p>
              )}
              {userType === "new" && (
                <p className="text-blue-600 text-sm mt-2">New user registration selected!</p>
              )}
            </div>

            {/* OTP Digits */}
            <div className="space-y-6">
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    maxLength={1}
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={isLoading || otp.join("").length !== 6}
                className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  "Verifying..."
                ) : (
                  <>
                    <Check size={20} />
                    {userType === "existing" ? "Verify & Login" : "Verify & Continue"}
                  </>
                )}
              </button>

              <div className="text-center">
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Resend OTP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
