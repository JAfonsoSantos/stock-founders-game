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
          description: "Enviámos-te um link mágico para entrares.",
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
    setLoading(true);

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "As passwords não coincidem.",
      });
      setLoading(false);
      return;
    }

    try {
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
          description: "Verifica o teu email para confirmar a conta.",
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 hover-scale">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Stox
          </CardTitle>
          <CardDescription className="text-base">
            {gameId ? "🎯 Junta-te ao jogo" : "Bem-vindo ao mercado de startups"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Primary email input */}
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

          {/* Primary actions */}
          <div className="space-y-3">
            {authMode === 'magic' && (
              <form onSubmit={handleMagicLink} className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium" 
                  disabled={loading || !email}
                >
                  <Mail className="mr-2 h-5 w-5" />
                  {loading ? "A enviar..." : "🚀 Entrar com Link Mágico"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Rápido, seguro e sem passwords
                </p>
              </form>
            )}

            {authMode === 'password' && (
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="A tua password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 text-base pr-12"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
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
                  <Lock className="mr-2 h-5 w-5" />
                  {loading ? "A entrar..." : "Entrar"}
                </Button>
              </form>
            )}

            {authMode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-sm font-medium">Nova Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 text-base pr-12"
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <PasswordStrengthIndicator password={password} className="mt-2" />
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
                        className="h-12 text-base pr-12"
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium" 
                  disabled={loading || !email || !password || !confirmPassword}
                >
                  <Lock className="mr-2 h-5 w-5" />
                  {loading ? "A criar..." : "Criar Conta"}
                </Button>
              </form>
            )}
          </div>

          {/* Secondary options */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground font-medium">
                  Ou
                </span>
              </div>
            </div>

            <Button
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full h-12 text-base font-medium border-2 hover:border-primary/50"
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
          </div>

          {/* Auth mode switcher */}
          <div className="flex flex-wrap justify-center gap-2 text-sm">
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
        </CardContent>
      </Card>
    </div>
  );
}