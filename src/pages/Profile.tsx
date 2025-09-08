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
import { ArrowLeft, Camera, User, Lock, Globe, Upload } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
        </div>

        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Segurança
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Preferências
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>
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

                    <Button type="submit" disabled={loading}>
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
                    {isGoogleUser ? "Adicionar Password" : "Alterar Password"}
                  </CardTitle>
                  <CardDescription>
                    {isGoogleUser 
                      ? "Adicione uma password à sua conta Google para poder fazer login com email/password também."
                      : "Altere sua password para manter sua conta segura."
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={isGoogleUser ? addPasswordToGoogleAccount : updatePassword} className="space-y-4">
                    {!isGoogleUser && (
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
                        {isGoogleUser ? "Nova Password" : "Nova Password"}
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
                      {loading ? "Salvando..." : (isGoogleUser ? "Adicionar Password" : "Alterar Password")}
                    </Button>
                  </form>
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