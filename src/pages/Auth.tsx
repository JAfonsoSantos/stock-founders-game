import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { validateEmail } from "@/lib/validation";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { cn } from "@/lib/utils";

type AuthMode = 'login' | 'signup' | 'magic';

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const { signIn, signInWithPassword, signUp, signInWithGoogle } = useAuth();
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">S</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {authMode === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setAuthMode("login")}
                className="text-primary hover:underline font-medium"
              >
                Log in
              </button>
            </>
          ) : (
            <>
              Not a member yet?{" "}
              <button
                onClick={() => setAuthMode("signup")}
                className="text-primary hover:underline font-medium"
              >
                Join
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {authMode === "signup" ? "Sign up" : "Log in"}
            </h1>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {authMode === "signup" && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
                      First name
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="h-12 bg-muted border-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
                      Last name
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="h-12 bg-muted border-0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Work Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Work Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-muted border-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 bg-muted border-0"
                  />
                  {password && (
                    <PasswordStrengthIndicator password={password} />
                  )}
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-muted-foreground">Password is too weak</p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg" 
                  disabled={loading || !password || !firstName || !lastName}
                >
                  {loading ? <LoadingSpinner size="sm" /> : "Create account"}
                </Button>
              </form>
            )}

            {authMode === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Work Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Work Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-muted border-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 bg-muted border-0 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={() => setAuthMode("magic")}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Forgot password?
                  </button>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg" 
                  disabled={loading}
                >
                  {loading ? <LoadingSpinner size="sm" /> : "Log in"}
                </Button>
              </form>
            )}

            {authMode === "magic" && (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Work Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Work Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-muted border-0"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg" 
                  disabled={loading}
                >
                  {loading ? <LoadingSpinner size="sm" /> : "Send Magic Link"}
                </Button>
              </form>
            )}

            {/* Social Auth */}
            <div className="space-y-3">
              <Button
                variant="outline"
                type="button"
                className="w-full h-12 border border-border bg-background hover:bg-muted"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    {authMode === "signup" ? "Sign up with Google" : "Log in with Google"}
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                type="button"
                className="w-full h-12 border border-border bg-background hover:bg-muted"
                disabled
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M23.5 12h-2.22v-2.22h2.22V12zm-7.78-2.22h-2.22v2.22h2.22V9.78zM8.44 12H6.22v2.22h2.22V12zm7.33-7.33h2.22v2.22h-2.22V4.67zM8.44 4.67H6.22v2.22h2.22V4.67z"
                    fill="#f25022"
                  />
                  <path d="M16.89 4.67h2.22v2.22h-2.22V4.67z" fill="#7fba00" />
                  <path d="M16.89 12h2.22v2.22h-2.22V12z" fill="#00a4ef" />
                  <path d="M6.22 12h2.22v2.22H6.22V12z" fill="#ffb900" />
                </svg>
                {authMode === "signup" ? "Sign up with Microsoft" : "Log in with Microsoft"}
              </Button>
              
              <Button
                variant="outline"
                type="button"
                className="w-full h-12 border border-border bg-background hover:bg-muted"
                disabled
              >
                {authMode === "signup" ? "Sign up with SSO" : "Log in with SSO"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}