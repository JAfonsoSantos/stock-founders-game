import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Globe, Palette, Smartphone, Moon, Sun, Monitor, Shield, Trash2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useI18n, SUPPORTED_LOCALES } from "@/hooks/useI18n";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";
import { AdminDeleteUsers } from "@/components/AdminDeleteUsers";
import { AdminDeleteStartups } from "@/components/AdminDeleteStartups";
import { toast } from "sonner";

export default function Settings() {
  const navigate = useNavigate();
  const { t, locale, setLocale } = useI18n();
  const { compactMode, setCompactMode, theme, setTheme, resolvedTheme } = useSettings();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [showDeleteUsers, setShowDeleteUsers] = useState(false);
  const [showDeleteStartups, setShowDeleteStartups] = useState(false);

  // Check if user is admin
  const isAdmin = user?.email === "joseafonsosantos@gmail.com";

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast.success(t('settings.savedSuccess'));
    setIsSaving(false);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'light':
        return <Sun className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const currentLocale = SUPPORTED_LOCALES.find(l => l.code === locale);

  if (showDeleteUsers) {
    return <AdminDeleteUsers />;
  }

  if (showDeleteStartups) {
    return <AdminDeleteStartups />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.back')}
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
              <p className="text-muted-foreground">{t('settings.description')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            {/* Language Settings */}
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                {t('settings.language.title')}
              </CardTitle>
              <CardDescription>
                {t('settings.language.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="language" className="text-sm font-medium">
                    {t('settings.language.interface')}
                  </Label>
                  <div className="text-xs text-muted-foreground">
                    {t('settings.language.current')}: {currentLocale?.flag} {currentLocale?.name}
                  </div>
                </div>
                <Select value={locale} onValueChange={(value: any) => setLocale(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <span>{currentLocale?.flag}</span>
                        <span>{currentLocale?.name}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LOCALES.map((localeOption) => (
                      <SelectItem key={localeOption.code} value={localeOption.code}>
                        <div className="flex items-center gap-2">
                          <span>{localeOption.flag}</span>
                          <span>{localeOption.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            {/* Appearance Settings */}
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                {t('settings.appearance.title')}
              </CardTitle>
              <CardDescription>
                {t('settings.appearance.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Theme Selection */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="theme" className="text-sm font-medium">
                    {t('settings.appearance.theme.title')}
                  </Label>
                  <div className="text-xs text-muted-foreground">
                    {t('settings.appearance.theme.description')}
                  </div>
                </div>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-48">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        {getThemeIcon()}
                        <span className="capitalize">
                          {theme === 'system' ? t('settings.appearance.theme.system') : 
                           theme === 'light' ? t('settings.appearance.theme.light') : 
                           t('settings.appearance.theme.dark')}
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        <span>{t('settings.appearance.theme.light')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        <span>{t('settings.appearance.theme.dark')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        <span>{t('settings.appearance.theme.system')}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Compact Mode */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compact-mode" className="text-sm font-medium">
                    {t('settings.appearance.compactMode.title')}
                  </Label>
                  <div className="text-xs text-muted-foreground">
                    {t('settings.appearance.compactMode.description')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <Switch
                    id="compact-mode"
                    checked={compactMode}
                    onCheckedChange={setCompactMode}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Display Settings Preview */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.preview.title')}</CardTitle>
              <CardDescription>
                {t('settings.preview.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg border bg-card ${compactMode ? 'space-y-2' : 'space-y-4'}`}>
                <div className="flex items-center justify-between">
                  <div className={compactMode ? 'space-y-1' : 'space-y-2'}>
                    <h3 className={compactMode ? 'text-sm font-semibold' : 'text-base font-semibold'}>
                      {t('settings.preview.sampleTitle')}
                    </h3>
                    <p className={`text-muted-foreground ${compactMode ? 'text-xs' : 'text-sm'}`}>
                      {t('settings.preview.sampleDescription')}
                    </p>
                  </div>
                  <Button size={compactMode ? "sm" : "default"} variant="outline">
                    {t('settings.preview.sampleButton')}
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <div className={`bg-primary/10 border border-primary/20 rounded px-2 ${compactMode ? 'py-1 text-xs' : 'py-1.5 text-sm'}`}>
                    {t('settings.preview.currentTheme')}: {resolvedTheme}
                  </div>
                  <div className={`bg-secondary border rounded px-2 ${compactMode ? 'py-1 text-xs' : 'py-1.5 text-sm'}`}>
                    {t('settings.preview.language')}: {currentLocale?.name}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t('settings.saving')}
                </>
              ) : (
                t('settings.saveSettings')
              )}
            </Button>
          </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Administração
                  </CardTitle>
                  <CardDescription>
                    Ferramentas de administração do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteUsers(true)}
                      className="gap-2 h-20 flex-col"
                    >
                      <Users className="h-6 w-6" />
                      <span>Delete Users</span>
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteStartups(true)}
                      className="gap-2 h-20 flex-col"
                    >
                      <Trash2 className="h-6 w-6" />
                      <span>Delete Startups</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}