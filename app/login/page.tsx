"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Mail, Phone, Check, User, Camera, Upload, Shield, Users, Zap, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/lib/services/authService";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loginMethod, setLoginMethod] = useState<"phone" | "email">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Password validation
  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push("Password must contain at least one capital letter");
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      errors.push("Password must contain at least one special symbol");
    }
    return errors;
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (isRegister) {
      setPasswordErrors(validatePassword(value));
    } else {
      setPasswordErrors([]);
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const url = URL.createObjectURL(file);
      setProfilePictureUrl(url);
    }
  };

  const handleLogin = async () => {
    const isValid = (loginMethod === "phone" && phoneNumber.length >= 10) || 
                   (loginMethod === "email" && email.includes("@"));
    
    if (!isValid) {
      setError("Please enter a valid phone number or email");
      return;
    }

    if (!password) {
      setError("Please enter your password");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const requestData = loginMethod === "phone" 
        ? { phone: phoneNumber, password }
        : { email: email, password };
      
      const response = await authService.login(requestData);
      
      if (response.success && response.token && response.user) {
        login(response.user, response.token);
        router.push("/chat");
      } else {
        setError(response.message || "Login failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    const isValid = (loginMethod === "phone" && phoneNumber.length >= 10) || 
                   (loginMethod === "email" && email.includes("@"));
    
    if (!isValid) {
      setError("Please enter a valid phone number or email");
      return;
    }

    if (!username || username.length < 3) {
      setError("Username must be at least 3 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const errors = validatePassword(password);
    if (errors.length > 0) {
      setPasswordErrors(errors);
      setError("Please fix password validation errors");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // First, register without profile picture
      const requestData = loginMethod === "phone" 
        ? { 
            phone: phoneNumber || undefined, 
            email: undefined, 
            password, 
            user_name: username
          }
        : { 
            email: email || undefined, 
            phone: undefined, 
            password, 
            user_name: username
          };
      
      console.log('Registration request data:', requestData);
      
      const response = await authService.register(requestData);
      
      if (response.success && response.token && response.user) {
        login(response.user, response.token);
        
        // If there's a profile picture, upload it after successful registration
        if (profilePicture) {
          try {
            console.log('Uploading profile picture after registration...');
            const formData = new FormData();
            formData.append('profile_picture', profilePicture);
            const uploadResponse = await authService.uploadProfilePicture(formData);
            console.log('Profile picture upload response:', uploadResponse);
            
            if (uploadResponse.success && uploadResponse.user?.profile_picture) {
              // Update the user context with the new profile picture
              login(uploadResponse.user, response.token);
            }
          } catch (uploadError: any) {
            console.error('Profile picture upload failed:', uploadError);
            // Don't fail the registration, just log the error
            setError('Registration successful, but profile picture upload failed. You can upload it later from your profile.');
          }
        }
        
        // Always redirect to chat after registration
        router.push("/chat");
      } else {
        setError(response.message || "Registration failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to register. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (isRegister) {
      handleRegister();
    } else {
      handleLogin();
    }
  };

  const isFormValid = () => {
    const isValid = (loginMethod === "phone" && phoneNumber.length >= 10) || 
                   (loginMethod === "email" && email.includes("@"));
    const isPasswordValid = password.length > 0 && (isRegister ? passwordErrors.length === 0 : true);
    
    if (isRegister) {
      const isUsernameValid = username && username.length >= 3;
      const isConfirmPasswordValid = password === confirmPassword;
      return isValid && isPasswordValid && isUsernameValid && isConfirmPasswordValid;
    }
    
    return isValid && isPasswordValid;
  };

  return (
    <div className="h-screen relative" style={{
      background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)"
    }}>
      {/* Main Content */}
      <div className="relative z-10 h-screen flex">
        {/* Left Side - Welcome Text */}
        <div className="hidden md:flex w-1/2 items-center justify-center p-4">
          <div className="text-left text-white max-w-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-linear-to-r from-purple-500 via-pink-500 to-blue-500 rounded-xl flex items-center justify-center">
                <MessageSquare className="text-white w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-white">ChatApp</h1>
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
            <p className="text-md mb-4 text-gray-200">Experience seamless communication with friends and family around the world</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-linear-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <Zap className="text-white w-5 h-5" />
                </div>
                <span className="text-base font-semibold text-white drop-shadow-lg">Instant Messaging</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-linear-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <Users className="text-white w-5 h-5" />
                </div>
                <span className="text-base font-semibold text-white drop-shadow-lg">Connect with Friends</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-linear-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <Shield className="text-white w-5 h-5" />
                </div>
                <span className="text-base font-semibold text-white drop-shadow-lg">Secure & Private</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login/Register Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-4">
          <div className="w-full max-w-md">

            {/* Login/Register Form */}
            <div className="bg-white bg-opacity-90 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-gray-200">
              {/* Error/Success Messages */}
              {error && (
                <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {successMessage && (
                <div className="mb-3 p-2 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
                  {successMessage}
                </div>
              )}

              {/* Input Fields */}
              <div className="space-y-3">
                {/* Phone/Email Input with Toggle */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-semibold text-gray-800">
                      {loginMethod === "phone" ? "Phone Number" : "Email Address"}
                    </label>
                    <button
                      type="button"
                      onClick={() => setLoginMethod(loginMethod === "phone" ? "email" : "phone")}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      {loginMethod === "phone" ? "Use Email" : "Use Phone"}
                    </button>
                  </div>
                  {loginMethod === "phone" ? (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="text-gray-500 w-5 h-5" />
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                        placeholder="Enter your phone number"
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
                        maxLength={10}
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="text-gray-500 w-5 h-5" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
                      />
                    </div>
                  )}
                </div>

                {/* Register Only Fields */}
                {isRegister && (
                  <>
                    {/* Username Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1">
                        Username
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="text-gray-500 w-5 h-5" />
                        </div>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Choose a username"
                          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
                          minLength={3}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="text-gray-500 w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      placeholder={isRegister ? "Create a password" : "Enter your password"}
                      className="w-full pl-10 pr-12 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  
                  {/* Password Validation Messages */}
                  {isRegister && password && (
                    <div className="mt-1 space-y-0.5">
                      {passwordErrors.length > 0 ? (
                        passwordErrors.map((err, idx) => (
                          <p key={idx} className="text-xs text-red-600 flex items-center gap-1">
                            <span>✗</span> {err}
                          </p>
                        ))
                      ) : (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <span>✓</span> Password meets all requirements
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Register Only Fields */}
                {isRegister && (
                  <>
                    {/* Confirm Password Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="text-gray-500 w-5 h-5" />
                        </div>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm your password"
                          className="w-full pl-10 pr-12 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                      )}
                    </div>

                    {/* Profile Picture Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1">
                        Profile Picture (Optional)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Upload className="text-gray-500 w-5 h-5" />
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                      {profilePictureUrl && (
                        <div className="mt-1 flex items-center gap-2">
                          <img src={profilePictureUrl} alt="Profile preview" className="w-10 h-10 rounded-full object-cover" />
                          <span className="text-xs text-gray-600">{profilePicture?.name}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Password Requirements Info - Moved to end */}
                {isRegister && (
                  <div className="text-xs text-gray-600 border-t pt-2">
                    <p className="font-semibold mb-0.5">Password must contain:</p>
                    <ul className="list-disc list-inside space-y-0">
                      <li>Minimum 8 characters</li>
                      <li>At least one capital letter</li>
                      <li>At least one special symbol</li>
                    </ul>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !isFormValid()}
                  className="w-full bg-linear-to-r from-purple-500 via-pink-500 to-blue-500 text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isLoading 
                    ? (isRegister ? "Registering..." : "Logging in...") 
                    : (isRegister ? "Register" : "Login")
                  }
                </button>

                {/* Login/Register Toggle at Bottom */}
                <div className="text-center text-sm text-gray-600 pt-2">
                  {isRegister ? (
                    <p>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegister(false);
                          setError(null);
                          setPasswordErrors([]);
                          setUsername("");
                          setConfirmPassword("");
                          setProfilePicture(null);
                          setProfilePictureUrl("");
                        }}
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        Sign in
                      </button>
                    </p>
                  ) : (
                    <p>
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegister(true);
                          setError(null);
                          setPasswordErrors([]);
                          setUsername("");
                          setConfirmPassword("");
                          setProfilePicture(null);
                          setProfilePictureUrl("");
                        }}
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        Sign up
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}