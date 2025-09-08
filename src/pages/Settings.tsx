import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Globe, Palette, Smartphone, Moon, Sun, Monitor } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useI18n, SUPPORTED_LOCALES } from "@/hooks/useI18n";
import { useSettings } from "@/hooks/useSettings";
import { toast } from "sonner";

export default function Settings() {
  const navigate = useNavigate();
  const { t, locale, setLocale } = useI18n();
  const { compactMode, setCompactMode, theme, setTheme, resolvedTheme } = useSettings();
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast.success("Settings saved successfully!");
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
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your preferences and appearance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          
          {/* Language Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Language & Region
              </CardTitle>
              <CardDescription>
                Choose your preferred language for the platform interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="language" className="text-sm font-medium">
                    Interface Language
                  </Label>
                  <div className="text-xs text-muted-foreground">
                    Currently: {currentLocale?.flag} {currentLocale?.name}
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

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize how the platform looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Theme Selection */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="theme" className="text-sm font-medium">
                    Color Theme
                  </Label>
                  <div className="text-xs text-muted-foreground">
                    Choose between light, dark, or system preference
                  </div>
                </div>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-48">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        {getThemeIcon()}
                        <span className="capitalize">
                          {theme === 'system' ? 'System' : theme}
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        <span>Light</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        <span>Dark</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        <span>System</span>
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
                    Compact Mode
                  </Label>
                  <div className="text-xs text-muted-foreground">
                    Reduce spacing and make the interface more dense
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
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                See how your settings affect the interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg border bg-card ${compactMode ? 'space-y-2' : 'space-y-4'}`}>
                <div className="flex items-center justify-between">
                  <div className={compactMode ? 'space-y-1' : 'space-y-2'}>
                    <h3 className={compactMode ? 'text-sm font-semibold' : 'text-base font-semibold'}>
                      Sample Game Title
                    </h3>
                    <p className={`text-muted-foreground ${compactMode ? 'text-xs' : 'text-sm'}`}>
                      This is how content will appear with your current settings
                    </p>
                  </div>
                  <Button size={compactMode ? "sm" : "default"} variant="outline">
                    Sample Button
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <div className={`bg-primary/10 border border-primary/20 rounded px-2 ${compactMode ? 'py-1 text-xs' : 'py-1.5 text-sm'}`}>
                    Current theme: {resolvedTheme}
                  </div>
                  <div className={`bg-secondary border rounded px-2 ${compactMode ? 'py-1 text-xs' : 'py-1.5 text-sm'}`}>
                    Language: {currentLocale?.name}
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
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}