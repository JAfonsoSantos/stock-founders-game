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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CalendarIcon, 
  ArrowLeft, 
  Info, 
  Upload,
  Palette,
  Bell,
  Trophy,
  Users,
  TrendingUp,
  Zap,
  Crown,
  Heart
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const CURRENCIES = [
  { value: "USD", label: "US Dollar (USD)", symbol: "$" },
  { value: "EUR", label: "Euro (EUR)", symbol: "€" },
  { value: "CNY", label: "Chinese Yuan (CNY)", symbol: "¥" },
  { value: "JPY", label: "Japanese Yen (JPY)", symbol: "¥" },
  { value: "GBP", label: "British Pound (GBP)", symbol: "£" },
  { value: "INR", label: "Indian Rupee (INR)", symbol: "₹" },
  { value: "AUD", label: "Australian Dollar (AUD)", symbol: "A$" },
  { value: "CAD", label: "Canadian Dollar (CAD)", symbol: "C$" },
  { value: "CHF", label: "Swiss Franc (CHF)", symbol: "CHF" },
  { value: "HKD", label: "Hong Kong Dollar (HKD)", symbol: "HK$" },
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

const GAME_TEMPLATES = [
  { value: "startup-pitch", label: "Startup Pitch Day" },
  { value: "vc-simulation", label: "VC Investment Simulation" },
  { value: "innovation-challenge", label: "Innovation Challenge" },
  { value: "custom", label: "Custom Event" },
];

const VOTING_MODES = [
  { value: "virtual-money", label: "Virtual Money" },
  { value: "points", label: "Points System" },
  { value: "mixed", label: "Mixed Mode" },
];

const REWARD_SYSTEMS = [
  { value: "none", label: "No Rewards" },
  { value: "manual", label: "Manual Distribution" },
  { value: "integrated", label: "Integrated Platform" },
];

export default function CreateGame() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const today = new Date();
  
  const [formData, setFormData] = useState({
    // Event Details
    name: "",
    description: "",
    organizerName: "",
    gameType: "custom",
    currency: "USD",
    locale: "en",
    startsAt: today,
    endsAt: today,
    maxParticipants: 100,
    
    // Game Settings
    allowSecondary: false,
    showPublicLeaderboards: false,
    showPrivateLeaderboards: true,
    circuitBreaker: true,
    circuitBreakerPercent: 200,
    circuitBreakerDuration: 60,
    maxPricePerShare: 10000,
    initialSharePrice: 100,
    votingMode: "virtual-money",
    rewardSystem: "none",
    
    // Customization
    brandingLogo: "",
    colorTheme: "default",
    notificationSettings: true,
  });

  const [budgets, setBudgets] = useState({
    founder: 10000,
    angel: 100000,
    vc: 1000000,
    team: 50000,
    investor: 25000,
  });

  const getCurrencySymbol = () => {
    return CURRENCIES.find(c => c.value === formData.currency)?.symbol || "$";
  };

  const formatBudget = (amount: number) => {
    const symbol = getCurrencySymbol();
    return `${symbol}${amount.toLocaleString()}`;
  };

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

  const InfoTooltip = ({ content }: { content: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex items-center justify-center w-4 h-4 bg-gray-400 rounded-full ml-2 cursor-help">
          <Info className="h-2.5 w-2.5 text-white" />
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="mb-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Create New Game</h1>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Editable Notice */}
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Don't worry</strong> — you can edit all game settings until the game starts.
              </AlertDescription>
            </Alert>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Event Details */}
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Event Details</CardTitle>
                    <CardDescription className="text-gray-600">
                      Basic information about your event
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-gray-700">Event Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Tech Summit 2024"
                        className="h-12 bg-white border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-gray-700">Event Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe your event and what participants can expect..."
                        className="bg-white border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="organizer" className="text-gray-700">Organizer Name / Company</Label>
                      <Input
                        id="organizer"
                        value={formData.organizerName}
                        onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
                        placeholder="e.g., TechCorp Inc."
                        className="h-12 bg-white border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>

                    <div>
                      <Label>Game Type / Template</Label>
                      <Select
                        value={formData.gameType}
                        onValueChange={(value) => setFormData({ ...formData, gameType: value })}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GAME_TEMPLATES.map((template) => (
                            <SelectItem key={template.value} value={template.value}>
                              {template.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Currency</Label>
                        <Select
                          value={formData.currency}
                          onValueChange={(value) => setFormData({ ...formData, currency: value })}
                        >
                          <SelectTrigger className="h-12">
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
                          <SelectTrigger className="h-12">
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full h-12 justify-start text-left font-normal",
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
                              onSelect={(date) => setFormData({ ...formData, startsAt: date || today })}
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
                                "w-full h-12 justify-start text-left font-normal",
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
                              onSelect={(date) => setFormData({ ...formData, endsAt: date || today })}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="maxParticipants" className="text-gray-700">Max Participants</Label>
                      <Input
                        id="maxParticipants"
                        type="number"
                        value={formData.maxParticipants}
                        onChange={(e) => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
                        min="1"
                        className="h-12 bg-white border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Game Settings */}
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Game Settings</CardTitle>
                    <CardDescription className="text-gray-600">
                      Configure how your game will work
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center">
                          <Label>Allow Secondary Trading</Label>
                          <InfoTooltip content="Allow participants to trade shares with each other during the game" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Players can buy and sell shares from each other
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
                          Show rankings publicly during the game
                        </p>
                      </div>
                      <Switch
                        checked={formData.showPublicLeaderboards}
                        onCheckedChange={(checked) => setFormData({ ...formData, showPublicLeaderboards: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Private Leaderboards</Label>
                        <p className="text-sm text-muted-foreground">
                          Show rankings to participants only
                        </p>
                      </div>
                      <Switch
                        checked={formData.showPrivateLeaderboards}
                        onCheckedChange={(checked) => setFormData({ ...formData, showPrivateLeaderboards: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center">
                          <Label>Circuit Breaker</Label>
                          <InfoTooltip content="Pauses trading temporarily if stock prices fluctuate too much." />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Pause trading if prices change by ±{formData.circuitBreakerPercent}%
                        </p>
                      </div>
                      <Switch
                        checked={formData.circuitBreaker}
                        onCheckedChange={(checked) => setFormData({ ...formData, circuitBreaker: checked })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="maxPrice">Max Price Per Share</Label>
                        <Input
                          id="maxPrice"
                          type="number"
                          value={formData.maxPricePerShare}
                          onChange={(e) => setFormData({ ...formData, maxPricePerShare: Number(e.target.value) })}
                          min="1"
                          step="0.01"
                          className="h-12"
                        />
                      </div>

                      <div>
                        <Label htmlFor="initialPrice">Initial Share Price</Label>
                        <Input
                          id="initialPrice"
                          type="number"
                          value={formData.initialSharePrice}
                          onChange={(e) => setFormData({ ...formData, initialSharePrice: Number(e.target.value) })}
                          min="0.01"
                          step="0.01"
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center">
                          <Label>Voting / Investment Mode</Label>
                          <InfoTooltip content="Choose how participants invest: real-looking virtual money, points system, or a mix of both" />
                        </div>
                        <Select
                          value={formData.votingMode}
                          onValueChange={(value) => setFormData({ ...formData, votingMode: value })}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VOTING_MODES.map((mode) => (
                              <SelectItem key={mode.value} value={mode.value}>
                                {mode.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <div className="flex items-center">
                          <Label>Reward System</Label>
                          <InfoTooltip content="How winners will be rewarded: no rewards, manual distribution by organizer, or integrated with prize platform" />
                        </div>
                        <Select
                          value={formData.rewardSystem}
                          onValueChange={(value) => setFormData({ ...formData, rewardSystem: value })}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {REWARD_SYSTEMS.map((system) => (
                              <SelectItem key={system.value} value={system.value}>
                                {system.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Default Budgets */}
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Default Budgets</CardTitle>
                    <CardDescription className="text-gray-600">
                      Set starting budgets for each participant type
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="founderBudget">Founder Budget</Label>
                        <Input
                          id="founderBudget"
                          type="number"
                          value={budgets.founder}
                          onChange={(e) => setBudgets({ ...budgets, founder: Number(e.target.value) })}
                          min="0"
                          className="h-12"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatBudget(budgets.founder)}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="angelBudget">Angel Budget</Label>
                        <Input
                          id="angelBudget"
                          type="number"
                          value={budgets.angel}
                          onChange={(e) => setBudgets({ ...budgets, angel: Number(e.target.value) })}
                          min="0"
                          className="h-12"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatBudget(budgets.angel)}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="vcBudget">VC Budget</Label>
                        <Input
                          id="vcBudget"
                          type="number"
                          value={budgets.vc}
                          onChange={(e) => setBudgets({ ...budgets, vc: Number(e.target.value) })}
                          min="0"
                          className="h-12"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatBudget(budgets.vc)}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="teamBudget">Team Budget</Label>
                        <Input
                          id="teamBudget"
                          type="number"
                          value={budgets.team}
                          onChange={(e) => setBudgets({ ...budgets, team: Number(e.target.value) })}
                          min="0"
                          className="h-12"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatBudget(budgets.team)}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="investorBudget">Investor Budget</Label>
                        <Input
                          id="investorBudget"
                          type="number"
                          value={budgets.investor}
                          onChange={(e) => setBudgets({ ...budgets, investor: Number(e.target.value) })}
                          min="0"
                          className="h-12"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatBudget(budgets.investor)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Customization */}
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Customization (Optional)</CardTitle>
                    <CardDescription className="text-gray-600">
                      Personalize your event appearance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="flex items-center">
                        Branding / Logo Upload
                        <Upload className="h-4 w-4 ml-2 text-gray-400" />
                      </Label>
                      <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
                        <p>Click to upload or drag and drop</p>
                        <p className="text-xs">PNG, JPG up to 2MB</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="flex items-center">
                          Color Theme
                          <Palette className="h-4 w-4 ml-2 text-gray-400" />
                        </Label>
                        <Select value={formData.colorTheme} onValueChange={(value) => setFormData({ ...formData, colorTheme: value })}>
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="corporate">Corporate</SelectItem>
                            <SelectItem value="startup">Startup</SelectItem>
                            <SelectItem value="tech">Tech</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="flex items-center">
                            Notification Settings
                            <Bell className="h-4 w-4 ml-2 text-gray-400" />
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Send event updates to participants
                          </p>
                        </div>
                        <Switch
                          checked={formData.notificationSettings}
                          onCheckedChange={(checked) => setFormData({ ...formData, notificationSettings: checked })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar - How it works */}
              <div className="lg:col-span-1">
                <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200 shadow-sm sticky top-6">
                  <CardHeader>
                    <CardTitle className="text-orange-900 flex items-center">
                      <Trophy className="h-5 w-5 mr-2" />
                      How it works
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-orange-600">1</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-orange-900 mb-1">Create Game → Pre-Market Phase</h4>
                        <p className="text-sm text-orange-700">
                          All players are notified and can create their projects/startups/ideas. Trading is locked (no buy/sell yet).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-green-600">2</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-900 mb-1">Game Start → Open Market</h4>
                        <p className="text-sm text-green-700">
                          On the scheduled start date/time, trading opens. Players can pitch, buy and sell shares, and grow their valuation.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">3</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-1">Game End → Market Close</h4>
                        <p className="text-sm text-blue-700">
                          On the scheduled end date/time, the market closes. Winners are announced:
                        </p>
                        <ul className="text-xs text-blue-600 mt-2 space-y-1">
                          <li className="flex items-center"><Crown className="h-3 w-3 mr-1" />Most Valued Startup</li>
                          <li className="flex items-center"><TrendingUp className="h-3 w-3 mr-1" />Best Investor (highest portfolio gain)</li>
                          <li className="flex items-center"><Zap className="h-3 w-3 mr-1" />Most Active Trader</li>
                          <li className="flex items-center"><Users className="h-3 w-3 mr-1" />Rising Star (startup with fastest growth)</li>
                          <li className="flex items-center"><Heart className="h-3 w-3 mr-1" />People's Choice (most unique investors)</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-white/70 rounded-lg p-3 mt-4">
                      <p className="text-sm text-gray-600 text-center">
                        <strong>You can customize winners, rewards, and categories later.</strong>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Create Game Button */}
            <div className="mt-8">
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="pt-6">
                  <Button 
                    onClick={handleSubmit}
                    className="w-full h-14 bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-semibold text-lg" 
                    disabled={loading}
                  >
                    {loading ? "Creating Game..." : "Create Game"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}