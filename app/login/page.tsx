"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Mail, Phone, ArrowLeft, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loginMethod, setLoginMethod] = useState<"phone" | "email">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async () => {
    if ((loginMethod === "phone" && phoneNumber.length >= 10) || 
        (loginMethod === "email" && email.includes("@"))) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setShowOtpInput(true);
        setIsLoading(false);
      }, 1000);
    }
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
        login(); // Set authentication state
        router.push("/chat");
      }, 1000);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleBack = () => {
    setShowOtpInput(false);
    setOtp(["", "", "", "", "", ""]);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-r from-blue-500 to-purple-500 rounded-2xl mb-4">
            <MessageSquare className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to ChatApp</h1>
          <p className="text-gray-600">Connect with friends and family</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {!showOtpInput ? (
            <>
              {/* Login Method Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                <button
                  onClick={() => setLoginMethod("phone")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
                    loginMethod === "phone"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  <Phone size={18} />
                  <span className="text-sm font-medium">Phone</span>
                </button>
                <button
                  onClick={() => setLoginMethod("email")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
                    loginMethod === "email"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  <Mail size={18} />
                  <span className="text-sm font-medium">Email</span>
                </button>
              </div>

              {/* Input Form */}
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
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSendOtp}
                  disabled={isLoading || (loginMethod === "phone" ? phoneNumber.length < 10 : !email.includes("@"))}
                  className="w-full bg-linear-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Sending..." : "Send OTP"}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* OTP Input */}
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

              <div className="space-y-6">
                {/* OTP Digits */}
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
                  className="w-full bg-linear-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    "Verifying..."
                  ) : (
                    <>
                      <Check size={20} />
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
            </>
          )}
        </div>

        {/* Users Preview Section */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm mb-4">Join thousands of users already chatting</p>
          <div className="flex justify-center -space-x-2">
            {["JD", "AS", "MK", "RP", "KL"].map((initials, index) => (
              <div
                key={index}
                className="w-10 h-10 rounded-full bg-linear-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-sm font-semibold border-2 border-white"
              >
                {initials}
              </div>
            ))}
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-semibold border-2 border-white">
              +99
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
