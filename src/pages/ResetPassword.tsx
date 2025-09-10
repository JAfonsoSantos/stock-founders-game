import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { Eye, EyeOff, ArrowLeft, AlertTriangle, CheckCircle } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useI18n();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Check if we have recovery tokens in the URL hash (Supabase sends them as #...)
  useEffect(() => {
    const hash = window.location.hash || "";
    if (!hash) {
      // If user navigated here without a recovery link, don't show an error
      return;
    }

    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const type = params.get("type");
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (type === "recovery" && accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    } else {
      setError("Invalid or expired reset link. Please request a new password reset.");
    }
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Sign out the temporary recovery session and go to the login page
      await supabase.auth.signOut();
      navigate('/auth', { replace: true });

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex bg-gray-100">
        {/* Left Panel - Success */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-gray-50">
          <div className="w-full max-w-md animate-fade-in">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              
              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-gray-900">Password Updated!</h1>
                <p className="text-gray-600 text-lg">
                  Your password has been successfully updated. You will be redirected to the login page shortly.
                </p>
              </div>

              <Button 
                onClick={() => navigate('/auth')}
                className="w-full h-14 text-base font-semibold bg-[#FF6B35] hover:bg-[#E55A2B] text-white border-0 rounded-lg shadow-sm transition-all duration-200"
              >
                Go to Login
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - Visual */}
        <div className="hidden lg:flex flex-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600">
            {/* Organic shapes */}
            <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-32 left-16 w-80 h-80 bg-gradient-to-tr from-orange-300/30 to-transparent rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-orange-300/20 to-orange-600/20 rounded-full blur-3xl"></div>
            
            {/* Flowing curves */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 400 600"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M-50 200 Q100 150 200 200 T450 250 L450 600 L-50 600 Z"
                fill="url(#gradient1)"
                opacity="0.6"
              />
              <path
                d="M-50 300 Q150 250 250 300 T500 350 L500 600 L-50 600 Z"
                fill="url(#gradient2)"
                opacity="0.4"
              />
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                </linearGradient>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(251,146,60,0.4)" />
                  <stop offset="100%" stopColor="rgba(251,146,60,0.2)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-gray-50">
        <div className="w-full max-w-md animate-fade-in">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <div className="text-2xl font-bold text-gray-700">stox</div>
              <Button
                variant="link"
                onClick={() => navigate('/join')}
                className="text-orange-600 font-medium p-0 h-auto hover:no-underline"
              >
                Got the password? Log in
              </Button>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Reset Your Password</h1>
              <p className="text-gray-600 text-lg">
                Enter your new password below
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="border-red-200 bg-red-50 mb-6">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleResetPassword} className="space-y-6">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-medium text-gray-700">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="h-14 pr-12 text-base bg-white border-gray-200 rounded-lg focus:border-orange-500 focus:ring-orange-500"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <PasswordStrengthIndicator password={password} />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-base font-medium text-gray-700">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="h-14 pr-12 text-base bg-white border-gray-200 rounded-lg focus:border-orange-500 focus:ring-orange-500"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-red-500">Passwords do not match</p>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-14 text-base font-semibold bg-[#FF6B35] hover:bg-[#E55A2B] text-white border-0 rounded-lg shadow-sm transition-all duration-200"
              disabled={loading || !password || !confirmPassword || password !== confirmPassword}
            >
              {loading ? "Updating Password..." : "Update Password"}
            </Button>
          </form>

        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600">
          {/* Organic shapes */}
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-32 left-16 w-80 h-80 bg-gradient-to-tr from-orange-300/30 to-transparent rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-orange-300/20 to-orange-600/20 rounded-full blur-3xl"></div>
          
          {/* Flowing curves */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 400 600"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M-50 200 Q100 150 200 200 T450 250 L450 600 L-50 600 Z"
              fill="url(#gradient1)"
              opacity="0.6"
            />
            <path
              d="M-50 300 Q150 250 250 300 T500 350 L500 600 L-50 600 Z"
              fill="url(#gradient2)"
              opacity="0.4"
            />
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
              </linearGradient>
              <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(251,146,60,0.4)" />
                <stop offset="100%" stopColor="rgba(251,146,60,0.2)" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}