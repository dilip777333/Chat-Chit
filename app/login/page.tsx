"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Mail, Phone, ArrowLeft, Check, User, Camera, Upload, ChevronLeft, ChevronRight, Shield, Users, Zap, ArrowUpDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/lib/services/authService";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loginMethod, setLoginMethod] = useState<"phone" | "email">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSwapped, setIsSwapped] = useState(false);

  const handleSendOtp = async () => {
    const isValid = (loginMethod === "phone" && phoneNumber.length >= 10) || 
                   (loginMethod === "email" && email.includes("@"));
    
    if (isValid) {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      try {
        const requestData = loginMethod === "phone" 
          ? { phone: phoneNumber }
          : { email: email };
        
        const response = await authService.sendOtp(requestData);
        
        if (response.success) {
          setSuccessMessage(response.message);
          if (response.otp) {
            setSuccessMessage(prev => prev + ` (Development OTP: ${response.otp})`);
          }
          setShowOtpInput(true);
        } else {
          setError(response.message);
        }
      } catch (err: any) {
        setError(err.message || "Failed to send OTP. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setError("Please enter a valid phone number or email");
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

  const handleVerifyOtp = async () => {
    const otpValue = otp.join("");
    if (otpValue.length === 6) {
      setIsLoading(true);
      setError(null);
      
      try {
        const requestData = loginMethod === "phone" 
          ? { phone: phoneNumber, otp: otpValue }
          : { email: email, otp: otpValue };
        
        const response = await authService.verifyOtp(requestData);
        
        if (response.success && response.token && response.user) {
          login(response.user, response.token);
          
          // Check if user is new and redirect accordingly
          if (response.isNewUser) {
            router.push("/details");
          } else {
            router.push("/chat");
          }
        } else {
          setError(response.message || "Invalid OTP");
        }
      } catch (err: any) {
        setError(err.message || "Failed to verify OTP. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setError("Please enter a valid 6-digit OTP");
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700" 
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

            {/* Login Form */}
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

      {/* OTP Input Modal */}
      {showOtpInput && (
        <div className="fixed inset-0 bg-cover bg-center bg-no-repeat flex items-center justify-center sm:justify-start z-50 p-4" 
             style={{ backgroundImage: "url('/images/otp-bg.jpg')" }}>
          <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-xl p-6 w-full max-w-md border border-gray-200 sm:ml-60">
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
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}
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
                    <ArrowLeft size={20} />
                    Verify & Login
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
