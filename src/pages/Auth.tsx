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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Main Form - Full width on mobile, left side on desktop */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-background">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Stox</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {gameId ? "🎯 Junta-te ao jogo" : "Mercado de startups"}
            </p>
            
            {/* Mobile auth mode switcher at top */}
            <div className="flex justify-center gap-1 mt-4 lg:hidden">
              {authMode !== 'magic' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAuthMode('magic')}
                  className="text-primary text-xs"
                >
                  Link Mágico
                </Button>
              )}
              {authMode !== 'password' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAuthMode('password')}
                  className="text-muted-foreground text-xs"
                >
                  Tenho password
                </Button>
              )}
              {authMode !== 'signup' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAuthMode('signup')}
                  className="text-muted-foreground text-xs"
                >
                  Criar conta
                </Button>
              )}
            </div>
          </div>

          {/* Form Content */}
          <div className="space-y-6">
            {/* Email input */}
            <div className="space-y-2">
              <Label htmlFor="primary-email" className="text-sm font-medium">Email</Label>
              <Input
                id="primary-email"
                type="email"
                placeholder="o.teu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base"
                required
              />
            </div>

            {/* Auth forms */}
            {authMode === 'magic' && (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium" 
                  disabled={loading || !email}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {loading ? "A enviar..." : "🚀 Entrar com Link Mágico"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Rápido, seguro e sem passwords
                </p>
              </form>
            )}

            {authMode === 'password' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="A tua password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 text-base pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-12 w-10 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium" 
                  disabled={loading || !email || !password}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  {loading ? "A entrar..." : "Entrar"}
                </Button>
              </form>
            )}

            {authMode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-sm font-medium">Nova Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 8 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 text-base pr-10"
                        required
                        minLength={8}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-12 w-10 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <PasswordStrengthIndicator password={password} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password" className="text-sm font-medium">Confirmar Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-new-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Repete a password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-12 text-base pr-10"
                        required
                        minLength={8}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-12 w-10 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {confirmPassword && (
                      <div className="mt-1">
                        {password === confirmPassword ? (
                          <p className="text-xs text-green-500 flex items-center gap-1">
                            ✓ Passwords coincidem
                          </p>
                        ) : (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            ✗ Passwords não coincidem
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium" 
                  disabled={loading || !email || !password || !confirmPassword}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  {loading ? "A criar..." : "Criar Conta"}
                </Button>
              </form>
            )}

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground">
                  Ou
                </span>
              </div>
            </div>

            {/* Google Sign In */}
            <Button
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full h-12 text-base font-medium"
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? "A conectar..." : "Continuar com Google"}
            </Button>

            {/* Desktop auth mode switcher */}
            <div className="hidden lg:flex flex-wrap justify-center gap-2 text-sm">
              {authMode !== 'magic' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAuthMode('magic')}
                  className="text-primary hover:text-primary/80 h-auto p-1"
                >
                  Usar Link Mágico
                </Button>
              )}
              {authMode !== 'password' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAuthMode('password')}
                  className="text-muted-foreground hover:text-foreground h-auto p-1"
                >
                  Tenho password
                </Button>
              )}
              {authMode !== 'signup' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAuthMode('signup')}
                  className="text-muted-foreground hover:text-foreground h-auto p-1"
                >
                  Criar conta
                </Button>
              )}
            </div>

            {authMode === 'magic' && (
              <div className="text-center text-xs text-muted-foreground space-y-1">
                <p>📧 Vais receber um link seguro no email</p>
                <p>✨ Sem passwords, sem complicações</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side - Testimonials (hidden on mobile) */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 items-center justify-center p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 via-blue-600/90 to-indigo-700/90"></div>
        
        <div className="relative z-10 max-w-lg text-center text-white">
          {authMode === 'signup' ? (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mx-auto flex items-center justify-center">
                <span className="text-2xl">👩‍💼</span>
              </div>
              <blockquote className="text-lg leading-relaxed">
                "O Stox revolucionou como organizamos os nossos pitch days. Os investidores adoram a gamificação e os fundadores sentem-se mais confiantes a apresentar."
              </blockquote>
              <div className="bg-orange-500 text-white px-4 py-2 rounded-lg inline-block">
                <div className="font-semibold">Sofia Pereira</div>
                <div className="text-sm opacity-90">Event Manager, StartupLisboa</div>
              </div>
            </div>
          ) : authMode === 'password' ? (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mx-auto flex items-center justify-center">
                <span className="text-2xl">🚀</span>
              </div>
              <blockquote className="text-lg leading-relaxed">
                "Consegui levantar a minha seed round após um evento Stox. A transparência do mercado de ações ajudou os investidores a perceberem o valor da startup."
              </blockquote>
              <div className="bg-orange-500 text-white px-4 py-2 rounded-lg inline-block">
                <div className="font-semibold">Miguel Santos</div>
                <div className="text-sm opacity-90">Founder & CEO, TechFlow</div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mx-auto flex items-center justify-center">
                <span className="text-2xl">💎</span>
              </div>
              <blockquote className="text-lg leading-relaxed">
                "Como Angel Investor, o Stox dá-me insights únicos sobre como o mercado valoriza diferentes startups. É networking e due diligence numa plataforma só."
              </blockquote>
              <div className="bg-orange-500 text-white px-4 py-2 rounded-lg inline-block">
                <div className="font-semibold">Ana Rodrigues</div>
                <div className="text-sm opacity-90">Angel Investor, Ex-Farfetch</div>
              </div>
            </div>
          )}
          
          <div className="mt-12 text-center">
            <p className="text-white/80 text-base font-medium">
              Junta-te a 500+ profissionais que usam Stox
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}