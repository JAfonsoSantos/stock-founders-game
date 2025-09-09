import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ArrowLeft, Camera, User, Lock, Globe, Upload, Link2, Unlink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useI18n } from "@/hooks/useI18n";

export default function Profile() {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    avatar_url: "",
  });
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("users")
        .select("first_name, last_name, avatar_url")
        .eq("id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setProfile({
        first_name: data?.first_name || "",
        last_name: data?.last_name || "",
        email: user.email || "",
        avatar_url: data?.avatar_url || "",
      });
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Erro ao carregar perfil");
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 5MB.");
        return;
      }
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null;

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Erro ao fazer upload da foto");
      return null;
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      let avatarUrl = profile.avatar_url;
      
      if (avatarFile) {
        const newAvatarUrl = await uploadAvatar();
        if (newAvatarUrl) {
          avatarUrl = newAvatarUrl;
        }
      }

      // Update profile in users table
      const { error: profileError } = await supabase
        .from("users")
        .upsert({
          id: user.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          avatar_url: avatarUrl,
        });

      if (profileError) throw profileError;

      // Update email if changed
      if (profile.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: profile.email,
        });
        if (emailError) throw emailError;
        toast.success("Email atualizado. Verifique seu email para confirmar.");
      }

      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
      setAvatarFile(null);
      setPreviewUrl("");
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.new !== passwords.confirm) {
      toast.error("As passwords não coincidem");
      return;
    }

    if (passwords.new.length < 6) {
      toast.error("Password deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      });

      if (error) throw error;

      setPasswords({ current: "", new: "", confirm: "" });
      toast.success("Password atualizada com sucesso!");
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Erro ao atualizar password");
    } finally {
      setLoading(false);
    }
  };

  const addPasswordToGoogleAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.new !== passwords.confirm) {
      toast.error("As passwords não coincidem");
      return;
    }

    if (passwords.new.length < 6) {
      toast.error("Password deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      });

      if (error) throw error;

      setPasswords({ current: "", new: "", confirm: "" });
      toast.success("Password adicionada à sua conta Google!");
    } catch (error) {
      console.error("Error adding password:", error);
      toast.error("Erro ao adicionar password");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const isGoogleUser = user?.app_metadata?.provider === 'google';
  const isLinkedInUser = user?.app_metadata?.provider === 'linkedin_oidc';
  const isOAuthUser = isGoogleUser || isLinkedInUser;

  const unlinkProvider = async (provider: string) => {
    if (!confirm(`Desligar a conexão com ${provider === 'google' ? 'Google' : 'LinkedIn'}?`)) return;
    
    toast.info("Funcionalidade de desligar conexões será implementada em breve.");
    
    // Note: Supabase doesn't have a direct unlink method in the client
    // This would typically require a server-side implementation
    // For now, we show a message about the feature being planned
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
        </div>

        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200">
              <TabsTrigger value="profile" className="flex items-center gap-2 text-gray-600 data-[state=active]:text-orange-600 data-[state=active]:bg-orange-50">
                <User className="h-4 w-4" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2 text-gray-600 data-[state=active]:text-orange-600 data-[state=active]:bg-orange-50">
                <Lock className="h-4 w-4" />
                Segurança
              </TabsTrigger>
              <TabsTrigger value="connections" className="flex items-center gap-2 text-gray-600 data-[state=active]:text-orange-600 data-[state=active]:bg-orange-50">
                <Link2 className="h-4 w-4" />
                Conexões
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2 text-gray-600 data-[state=active]:text-orange-600 data-[state=active]:bg-orange-50">
                <Globe className="h-4 w-4" />
                Preferências
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900">Informações Pessoais</CardTitle>
                  <CardDescription className="text-gray-600">
                    Atualize suas informações pessoais e foto de perfil.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={updateProfile} className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <Avatar className="h-24 w-24">
                          <AvatarImage 
                            src={previewUrl || profile.avatar_url} 
                            alt="Avatar" 
                          />
                          <AvatarFallback>
                            {getInitials(profile.first_name, profile.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <label 
                          htmlFor="avatar-upload" 
                          className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/80 transition-colors"
                        >
                          <Camera className="h-4 w-4" />
                        </label>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold">Foto de Perfil</h3>
                        <p className="text-sm text-muted-foreground">
                          Clique no ícone da câmera para alterar sua foto
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Máximo 5MB. Formatos: JPG, PNG, GIF
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">Primeiro Nome</Label>
                        <Input
                          id="first_name"
                          value={profile.first_name}
                          onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                          placeholder="Seu primeiro nome"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Último Nome</Label>
                        <Input
                          id="last_name"
                          value={profile.last_name}
                          onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                          placeholder="Seu último nome"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="seu@email.com"
                      />
                      <p className="text-sm text-muted-foreground">
                        Ao alterar o email, você receberá um link de confirmação.
                      </p>
                    </div>

                    <Button type="submit" disabled={loading} className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white">
                      {loading ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {isOAuthUser ? "Adicionar Password" : "Alterar Password"}
                  </CardTitle>
                  <CardDescription>
                    {isOAuthUser 
                      ? "Adicione uma password à sua conta para poder fazer login com email/password também."
                      : "Altere sua password para manter sua conta segura."
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={isOAuthUser ? addPasswordToGoogleAccount : updatePassword} className="space-y-4">
                    {!isOAuthUser && (
                      <div className="space-y-2">
                        <Label htmlFor="current_password">Password Atual</Label>
                        <Input
                          id="current_password"
                          type="password"
                          value={passwords.current}
                          onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                          placeholder="Digite sua password atual"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="new_password">
                        {isOAuthUser ? "Nova Password" : "Nova Password"}
                      </Label>
                      <Input
                        id="new_password"
                        type="password"
                        value={passwords.new}
                        onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                        placeholder="Digite a nova password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm_password">Confirmar Password</Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                        placeholder="Confirme a nova password"
                      />
                    </div>

                    <Button type="submit" disabled={loading}>
                      {loading ? "Salvando..." : (isOAuthUser ? "Adicionar Password" : "Alterar Password")}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="connections">
              <Card>
                <CardHeader>
                  <CardTitle>Conexões OAuth</CardTitle>
                  <CardDescription>
                    Gerencie suas conexões com provedores externos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">G</span>
                        </div>
                        <div>
                          <p className="font-medium">Google</p>
                          <p className="text-sm text-muted-foreground">
                            {isGoogleUser ? "Conectado" : "Não conectado"}
                          </p>
                        </div>
                      </div>
                      {isGoogleUser && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => unlinkProvider('google')}
                          disabled={loading}
                        >
                          <Unlink className="h-4 w-4 mr-2" />
                          Desligar
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">Li</span>
                        </div>
                        <div>
                          <p className="font-medium">LinkedIn</p>
                          <p className="text-sm text-muted-foreground">
                            {isLinkedInUser ? "Conectado" : "Não conectado"}
                          </p>
                        </div>
                      </div>
                      {isLinkedInUser && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => unlinkProvider('linkedin_oidc')}
                          disabled={loading}
                        >
                          <Unlink className="h-4 w-4 mr-2" />
                          Desligar
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Nota:</strong> Ao desligar uma conexão OAuth, você ainda poderá fazer login 
                      com email/password se tiver configurado uma password para sua conta.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Preferências</CardTitle>
                  <CardDescription>
                    Configure suas preferências de idioma e outras opções.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Idioma</Label>
                    <LanguageSelector />
                    <p className="text-sm text-muted-foreground">
                      Escolha seu idioma preferido para a interface.
                    </p>
                  </div>

                  <div className="pt-6 border-t">
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Tem certeza que deseja sair?")) {
                          signOut();
                        }
                      }}
                    >
                      Sair da Conta
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}