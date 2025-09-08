import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const CURRENCIES = [
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "CNY", label: "Chinese Yuan (CNY)" },
  { value: "JPY", label: "Japanese Yen (JPY)" },
  { value: "GBP", label: "British Pound (GBP)" },
  { value: "INR", label: "Indian Rupee (INR)" },
  { value: "AUD", label: "Australian Dollar (AUD)" },
  { value: "CAD", label: "Canadian Dollar (CAD)" },
  { value: "CHF", label: "Swiss Franc (CHF)" },
  { value: "HKD", label: "Hong Kong Dollar (HKD)" },
];

const LOCALES = [
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
  { value: "hi", label: "हिन्दी" },
  { value: "es", label: "Español" },
  { value: "ar", label: "العربية" },
  { value: "bn", label: "বাংলা" },
  { value: "pt", label: "Português" },
  { value: "ru", label: "Русский" },
  { value: "ja", label: "日本語" },
  { value: "de", label: "Deutsch" },
];

export default function CreateGame() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    currency: "USD",
    locale: "en",
    startsAt: undefined as Date | undefined,
    endsAt: undefined as Date | undefined,
    allowSecondary: false,
    showPublicLeaderboards: false,
    circuitBreaker: true,
    maxPricePerShare: 10000,
  });

  const [budgets, setBudgets] = useState({
    founder: 10000,
    angel: 100000,
    vc: 1000000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.startsAt || !formData.endsAt) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select start and end dates",
      });
      return;
    }

    if (formData.endsAt < formData.startsAt) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "End date cannot be before start date",
      });
      return;
    }

    setLoading(true);

    try {
      // Create game
      const { data: game, error: gameError } = await supabase
        .from("games")
        .insert({
          owner_user_id: user?.id,
          name: formData.name,
          currency: formData.currency,
          locale: formData.locale,
          starts_at: formData.startsAt.toISOString(),
          ends_at: formData.endsAt.toISOString(),
          allow_secondary: formData.allowSecondary,
          show_public_leaderboards: formData.showPublicLeaderboards,
          circuit_breaker: formData.circuitBreaker,
          max_price_per_share: formData.maxPricePerShare,
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Create default role budgets
      const roleInserts = [
        { game_id: game.id, role: "founder" as const, default_budget: budgets.founder },
        { game_id: game.id, role: "angel" as const, default_budget: budgets.angel },
        { game_id: game.id, role: "vc" as const, default_budget: budgets.vc },
      ];

      const { error: rolesError } = await supabase
        .from("game_roles")
        .insert(roleInserts);

      if (rolesError) throw rolesError;

      toast({
        title: "Success",
        description: "Game created successfully!",
      });

      navigate(`/games/${game.id}/organizer`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Create New Game</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Game Setup</CardTitle>
              <CardDescription>
                Configure your Stox game
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Game Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Tech Summit 2024"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Currency</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => setFormData({ ...formData, currency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Language</Label>
                      <Select
                        value={formData.locale}
                        onValueChange={(value) => setFormData({ ...formData, locale: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LOCALES.map((locale) => (
                            <SelectItem key={locale.value} value={locale.value}>
                              {locale.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.startsAt && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.startsAt ? format(formData.startsAt, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.startsAt}
                            onSelect={(date) => setFormData({ ...formData, startsAt: date })}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label>End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.endsAt && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.endsAt ? format(formData.endsAt, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.endsAt}
                            onSelect={(date) => setFormData({ ...formData, endsAt: date })}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Game Settings</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow Secondary Trading</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow participants to trade shares with each other
                      </p>
                    </div>
                    <Switch
                      checked={formData.allowSecondary}
                      onCheckedChange={(checked) => setFormData({ ...formData, allowSecondary: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Public Leaderboards</Label>
                      <p className="text-sm text-muted-foreground">
                        Show leaderboards publicly during the game
                      </p>
                    </div>
                    <Switch
                      checked={formData.showPublicLeaderboards}
                      onCheckedChange={(checked) => setFormData({ ...formData, showPublicLeaderboards: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Circuit Breaker</Label>
                      <p className="text-sm text-muted-foreground">
                        Pause trading for 60s if price changes &gt; ±200%
                      </p>
                    </div>
                    <Switch
                      checked={formData.circuitBreaker}
                      onCheckedChange={(checked) => setFormData({ ...formData, circuitBreaker: checked })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxPrice">Max Price Per Share</Label>
                    <Input
                      id="maxPrice"
                      type="number"
                      value={formData.maxPricePerShare}
                      onChange={(e) => setFormData({ ...formData, maxPricePerShare: Number(e.target.value) })}
                      min="1"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Default Budgets */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Default Budgets</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="founderBudget">Founder Budget</Label>
                      <Input
                        id="founderBudget"
                        type="number"
                        value={budgets.founder}
                        onChange={(e) => setBudgets({ ...budgets, founder: Number(e.target.value) })}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="angelBudget">Angel Budget</Label>
                      <Input
                        id="angelBudget"
                        type="number"
                        value={budgets.angel}
                        onChange={(e) => setBudgets({ ...budgets, angel: Number(e.target.value) })}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vcBudget">VC Budget</Label>
                      <Input
                        id="vcBudget"
                        type="number"
                        value={budgets.vc}
                        onChange={(e) => setBudgets({ ...budgets, vc: Number(e.target.value) })}
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating..." : "Create Game"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}