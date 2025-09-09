import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { validateEmail } from "@/lib/validation";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'magic' | 'password' | 'signup'>('magic');
  const { signIn, signInWithPassword, signUp, signInWithGoogle, signInWithLinkedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("gameId");

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast({
        variant: "destructive",
        title: "Email inválido",
        description: "Escreve um email completo (ex: nome@dominio.com).",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await signIn(email);
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: error.message,
        });
      } else {
        toast({
          title: "Verifica o teu email",
          description: "Enviámos-te um link mágico. Se não encontrares, verifica o Spam.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Algo correu mal. Tenta novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signInWithPassword(email, password);
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro no login",
          description: error.message,
        });
      } else {
        toast({
          title: "Login efetuado",
          description: "Bem-vindo de volta!",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Algo correu mal. Tenta novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast({
        variant: "destructive",
        title: "Email inválido",
        description: "Escreve um email completo (ex: nome@dominio.com).",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        variant: "destructive",
        title: "Password muito curta",
        description: "A password deve ter pelo menos 8 caracteres.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "As passwords não coincidem.",
      });
      return;
    }

    setLoading(true);

    try {
      // First check if user already exists and handle accordingly
      const { data: signupCheck } = await supabase.functions.invoke('handle-signup-attempt', {
        body: { email }
      });

      if (signupCheck?.userExists) {
        toast({
          title: "✉️ Email já registado",
          description: "Enviámos-te um link mágico para entrar. Verifica o email (e o Spam).",
        });
        setLoading(false);
        return;
      }

      // If user doesn't exist, proceed with normal signup
      const { error } = await signUp(email, password);
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro no registo",
          description: error.message,
        });
      } else {
        toast({
          title: "Conta criada",
          description: "Verifica o teu email para confirmar a conta. Se não encontrares, verifica o Spam.",
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Algo correu mal. Tenta novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro no login com Google",
          description: error.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Algo correu mal. Tenta novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithLinkedIn();
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro no login com LinkedIn",
          description: error.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Algo correu mal. Tenta novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-white">
        <div className="w-full max-w-md animate-fade-in">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <div className="w-3 h-3 rounded bg-primary"></div>
              </div>
              {authMode !== 'signup' && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Not a member?</span>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setAuthMode('signup')}
                    className="text-primary font-medium p-0 h-auto hover:no-underline"
                  >
                    Join
                  </Button>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
              </h1>
              <p className="text-muted-foreground">
                {authMode === 'signup' 
                  ? 'Join the startup stock market experience' 
                  : 'Enter your credentials to access your account'
                }
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="space-y-4">
            {/* Social Sign In Buttons - First */}
            <div className="space-y-3">
              <Button
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full h-14 text-base font-medium bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 shadow-sm transition-all duration-200"
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
                Continue with Google
              </Button>

              <Button
                onClick={handleLinkedInSignIn}
                variant="outline"
                className="w-full h-14 text-base font-medium bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 shadow-sm transition-all duration-200"
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="#0A66C2">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                Continue with LinkedIn
              </Button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-4 text-gray-500 font-medium">
                  OR
                </span>
              </div>
            </div>

            {/* Email input */}
            <div className="space-y-2">
              <Input
                id="primary-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 text-base bg-white border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
                required
              />
            </div>

            {/* Password field - always show */}
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
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
            </div>

            {/* Confirm Password field - only for signup */}
            {authMode === 'signup' && (
              <>
                <PasswordStrengthIndicator password={password} />
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="confirm-new-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-14 text-base pr-12 bg-white border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
                      required
                      minLength={8}
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
                  {confirmPassword && (
                    <div className="mt-1">
                      {password === confirmPassword ? (
                        <p className="text-xs text-green-500 flex items-center gap-1">
                          ✓ Passwords match
                        </p>
                      ) : (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          ✗ Passwords don't match
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Submit button */}
            {authMode === 'magic' && (
              <form onSubmit={handleMagicLink}>
                <Button 
                  type="submit" 
                  className="w-full h-14 text-base font-semibold bg-[#FF6B35] hover:bg-[#E55A2B] text-white border-0 rounded-lg shadow-sm transition-all duration-200" 
                  disabled={loading || !email}
                >
                  {loading ? "Sending..." : "Continue"}
                </Button>
              </form>
            )}

            {authMode === 'password' && (
              <form onSubmit={handleLogin}>
                <Button 
                  type="submit" 
                  className="w-full h-14 text-base font-semibold bg-[#FF6B35] hover:bg-[#E55A2B] text-white border-0 rounded-lg shadow-sm transition-all duration-200" 
                  disabled={loading || !email || !password}
                >
                  {loading ? "Signing in..." : "Continue"}
                </Button>
              </form>
            )}

            {authMode === 'signup' && (
              <form onSubmit={handleSignUp}>
                <Button 
                  type="submit" 
                  className="w-full h-14 text-base font-semibold bg-[#FF6B35] hover:bg-[#E55A2B] text-white border-0 rounded-lg shadow-sm transition-all duration-200" 
                  disabled={loading || !email || !password || !confirmPassword}
                >
                  {loading ? "Creating account..." : "Continue"}
                </Button>
              </form>
            )}

            {/* Auth mode switcher */}
            <div className="flex justify-center gap-6 text-sm pt-6">
              {authMode !== 'magic' && (
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setAuthMode('magic')}
                >
                  Use magic link instead
                </Button>
              )}
              
              {authMode === 'signup' && (
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setAuthMode('magic')}
                >
                  Already have an account?
                </Button>
              )}
              
              {authMode === 'password' && (
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setAuthMode('magic')}
                >
                  Forgot password?
                </Button>
              )}
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