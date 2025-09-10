import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { validateEmail } from "@/lib/validation";
import { PasswordStrengthBars } from "@/components/PasswordStrengthBars";

export default function Join() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user, signIn, signUp, signInWithGoogle, signInWithLinkedIn } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gameInfo, setGameInfo] = useState<any>(null);
  const [loadingGame, setLoadingGame] = useState(true);
  

  useEffect(() => {
    if (!gameId) {
      // If no gameId, just set loading to false and show generic join page
      setLoadingGame(false);
      return;
    }
    
    const fetchGameInfo = async () => {
      const { data, error } = await supabase
        .from("games")
        .select("name, status")
        .eq("id", gameId)
        .single();
      
      if (error) {
        toast.error("Game not found");
        // Don't redirect, just show generic join page
        setGameInfo({ name: "Stox Game" });
        setLoadingGame(false);
        return;
      }
      
      setGameInfo(data);
      setLoadingGame(false);
    };

    fetchGameInfo();
  }, [gameId, navigate]);

  useEffect(() => {
    if (user && gameId) {
      // Check if user is already a participant
      checkParticipation();
    }
  }, [user, gameId]);

  // Check if user is already a participant and redirect accordingly
  const checkParticipation = async () => {
    if (!user || !gameId) return;
    
    const { data } = await supabase
      .from("participants")
      .select("id, role, status")
      .eq("game_id", gameId)
      .eq("user_id", user.id)
      .single();
    
    if (data) {
      // Activate participant status on first login
      if (data.status === 'pending') {
        await supabase
          .from("participants")
          .update({ status: 'active' })
          .eq("id", data.id);
      }

      // If founder, check if they have a startup or need onboarding
      if (data.role === 'founder') {
        const { data: founderData } = await supabase
          .from("founder_members")
          .select("id")
          .eq("participant_id", data.id)
          .maybeSingle();
        
        if (!founderData) {
          navigate(`/games/${gameId}/founder-onboarding`);
          return;
        }
      }
      
      navigate(`/games/${gameId}/discover`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    
    try {
      // Always signup since this is the join page
      const { error } = await signUp(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        // Update profile with name after signup
        await supabase.from("users").upsert({
          id: user?.id,
          first_name: firstName,
          last_name: lastName,
        });
        toast.success("Account created! Check your email to confirm.");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error("Error signing in with Google: " + error.message);
      }
    } catch (error) {
      toast.error("An error occurred with Google signin");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithLinkedIn();
      if (error) {
        toast.error("Error signing in with LinkedIn: " + error.message);
      }
    } catch (error) {
      toast.error("An error occurred with LinkedIn signin");
    } finally {
      setLoading(false);
    }
  };

  if (loadingGame) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
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
              <div className="text-2xl font-bold text-gray-700">
                stox
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Already a member?</span>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="text-orange-600 font-medium p-0 h-auto hover:no-underline"
                >
                  Log in
                </Button>
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Create Account
              </h1>
              <p className="text-gray-600">
                {gameInfo?.name && gameInfo.name !== "Stox Game" 
                  ? `You're invited to join ${gameInfo.name}`
                  : "Join the startup stock market experience"
                }
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="space-y-4">
            {/* Social Sign In Buttons */}
            <div className="space-y-4">
              <Button
                onClick={handleLinkedInSignIn}
                variant="outline"
                className="w-full h-14 text-base font-medium bg-white border border-gray-200 hover:bg-gray-50 hover:text-black text-gray-700 shadow-sm transition-all duration-200"
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="#0A66C2">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                Sign up with LinkedIn
              </Button>

              <Button
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full h-14 text-base font-medium bg-white border border-gray-200 hover:bg-gray-50 hover:text-black text-gray-700 shadow-sm transition-all duration-200"
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign up with Google
              </Button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gray-50 px-4 text-gray-400 font-medium">
                  OR
                </span>
              </div>
            </div>

            {/* Form fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-14 text-base bg-white border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
                  required
                />
                <Input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-14 text-base bg-white border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
                  required
                />
              </div>

              <Input
                type="email"
                placeholder="EMAIL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 text-base bg-white border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
                required
              />

              <div className="space-y-3">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 text-base pr-12 bg-white border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-14 w-12 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                
                {/* Password strength bars */}
                <PasswordStrengthBars password={password} />
              </div>

              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat the password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-14 text-base pr-12 bg-white border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-14 w-12 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-base font-semibold bg-[#4285F4] hover:bg-[#3367D6] text-white border-0 rounded-lg shadow-sm transition-all duration-200" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            {/* Mode switcher - redirect to main auth page for login */}
            <div className="text-center pt-4">
              <Button
                type="button"
                variant="link" 
                className="p-0 h-auto text-gray-500 hover:text-orange-600 transition-colors"
                onClick={() => navigate('/auth')}
              >
                Already have an account? Sign in here
              </Button>
            </div>
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
        </div>
      </div>
    </div>
  );
}