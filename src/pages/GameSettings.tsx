import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Game {
  id: string;
  name: string;
  status: string;
  starts_at: string;
  ends_at: string;
  currency: string;
  locale: string;
  allow_secondary: boolean;
  show_public_leaderboards: boolean;
  circuit_breaker: boolean;
  max_price_per_share: number;
}

interface GameRole {
  id: string;
  role: string;
  default_budget: number;
}

export default function GameSettings() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [gameRoles, setGameRoles] = useState<GameRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const currencies = [
    { code: "USD", name: "US Dollar" },
    { code: "EUR", name: "Euro" },
    { code: "CNY", name: "Chinese Yuan" },
    { code: "JPY", name: "Japanese Yen" },
    { code: "GBP", name: "British Pound" },
    { code: "INR", name: "Indian Rupee" },
    { code: "AUD", name: "Australian Dollar" },
    { code: "CAD", name: "Canadian Dollar" },
    { code: "CHF", name: "Swiss Franc" },
    { code: "HKD", name: "Hong Kong Dollar" }
  ];

  const languages = [
    { code: "en", name: "English" },
    { code: "zh", name: "Chinese" },
    { code: "hi", name: "Hindi" },
    { code: "es", name: "Spanish" },
    { code: "ar", name: "Arabic" },
    { code: "bn", name: "Bengali" },
    { code: "pt", name: "Portuguese" },
    { code: "ru", name: "Russian" },
    { code: "ja", name: "Japanese" },
    { code: "de", name: "German" }
  ];

  useEffect(() => {
    if (gameId) {
      fetchData();
    }
  }, [gameId]);

  const fetchData = async () => {
    try {
      // Fetch game
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (gameError) throw gameError;

      // Fetch game roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("game_roles")
        .select("*")
        .eq("game_id", gameId);

      if (rolesError) throw rolesError;

      setGame(gameData);
      setGameRoles(rolesData || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      navigate(`/games/${gameId}/organizer`);
    } finally {
      setLoading(false);
    }
  };

  const updateGameRole = (role: string, budget: number) => {
    setGameRoles(prev => prev.map(gr => 
      gr.role === role ? { ...gr, default_budget: budget } : gr
    ));
  };

  const saveSettings = async () => {
    if (!game) return;

    try {
      setSaving(true);

      // Update game settings
      const { error: gameError } = await supabase
        .from("games")
        .update({
          name: game.name,
          currency: game.currency,
          locale: game.locale,
          allow_secondary: game.allow_secondary,
          show_public_leaderboards: game.show_public_leaderboards,
          circuit_breaker: game.circuit_breaker,
          max_price_per_share: game.max_price_per_share,
          starts_at: game.starts_at,
          ends_at: game.ends_at
        })
        .eq("id", gameId);

      if (gameError) throw gameError;

      // Update game roles
      for (const role of gameRoles) {
        const { error: roleError } = await supabase
          .from("game_roles")
          .update({ default_budget: role.default_budget })
          .eq("id", role.id);

        if (roleError) throw roleError;
      }

      toast({
        title: "Success",
        description: "Game settings updated successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/games/${gameId}/organizer`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Game Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Game Settings</h1>
            <p className="text-muted-foreground">Configure game parameters and rules</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="gameName">Game Name</Label>
                <Input
                  id="gameName"
                  value={game.name}
                  onChange={(e) => setGame(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={game.currency} onValueChange={(value) => setGame(prev => prev ? { ...prev, currency: value } : null)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select value={game.locale} onValueChange={(value) => setGame(prev => prev ? { ...prev, locale: value } : null)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={new Date(game.starts_at).toISOString().slice(0, 16)}
                    onChange={(e) => setGame(prev => prev ? { ...prev, starts_at: new Date(e.target.value).toISOString() } : null)}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={new Date(game.ends_at).toISOString().slice(0, 16)}
                    onChange={(e) => setGame(prev => prev ? { ...prev, ends_at: new Date(e.target.value).toISOString() } : null)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trading Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Trading Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="maxPrice">Maximum Price Per Share</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  min="1"
                  value={game.max_price_per_share}
                  onChange={(e) => setGame(prev => prev ? { ...prev, max_price_per_share: Number(e.target.value) } : null)}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allowSecondary">Allow Secondary Market</Label>
                    <p className="text-sm text-muted-foreground">Allow participants to trade shares between each other</p>
                  </div>
                  <Switch
                    id="allowSecondary"
                    checked={game.allow_secondary}
                    onCheckedChange={(checked) => setGame(prev => prev ? { ...prev, allow_secondary: checked } : null)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="circuitBreaker">Circuit Breaker</Label>
                    <p className="text-sm text-muted-foreground">Pause trading for 60s if price changes more than ±200%</p>
                  </div>
                  <Switch
                    id="circuitBreaker"
                    checked={game.circuit_breaker}
                    onCheckedChange={(checked) => setGame(prev => prev ? { ...prev, circuit_breaker: checked } : null)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="publicLeaderboards">Public Leaderboards</Label>
                    <p className="text-sm text-muted-foreground">Show leaderboards to all participants</p>
                  </div>
                  <Switch
                    id="publicLeaderboards"
                    checked={game.show_public_leaderboards}
                    onCheckedChange={(checked) => setGame(prev => prev ? { ...prev, show_public_leaderboards: checked } : null)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Budgets */}
          <Card>
            <CardHeader>
              <CardTitle>Role Default Budgets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gameRoles.map((role) => (
                  <div key={role.id} className="flex items-center justify-between">
                    <Label className="capitalize">{role.role} Budget</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{game.currency}</span>
                      <Input
                        type="number"
                        min="0"
                        value={role.default_budget}
                        onChange={(e) => updateGameRole(role.role, Number(e.target.value))}
                        className="w-32"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveSettings} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}