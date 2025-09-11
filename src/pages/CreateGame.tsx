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
import { Badge } from "@/components/ui/badge";
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
  Heart,
  User,
  Handshake,
  Sparkles,
  Lightbulb,
  Plus
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
  { 
    value: "startup-pitch", 
    label: "Startup Pitch Day", 
    tag: "Popular",
    icon: User,
    tagline: "Compete to raise the highest valuation.",
    defaults: "Founder $10k | Angel $100k | VC $1M",
    labels: { primary: "Founder", secondary: "Investor" }
  },
  { 
    value: "vc-simulation", 
    label: "VC Investment Simulation", 
    tag: "New",
    icon: Crown,
    tagline: "Play as investors, evaluate and win.",
    defaults: "Founder $10k | Angel $250k | VC $2M",
    labels: { primary: "Startup", secondary: "Investor" }
  },
  { 
    value: "corporate-networking", 
    label: "Corporate Networking Challenge", 
    tag: "",
    icon: Handshake,
    tagline: "Boost team connections through trading.",
    defaults: "Team $5k | Employee $10k",
    labels: { primary: "Team", secondary: "Employee" }
  },
  { 
    value: "conference-expo", 
    label: "Conference & Expo Game", 
    tag: "",
    icon: Sparkles,
    tagline: "Engage attendees by turning stands into stocks.",
    defaults: "Booth $20k | Visitor $50k",
    labels: { primary: "Booth", secondary: "Visitor" }
  },
  { 
    value: "hackathon-university", 
    label: "Hackathon / University Edition", 
    tag: "",
    icon: Lightbulb,
    tagline: "Teams pitch, students invest, growth wins.",
    defaults: "Team $10k | Student $20k",
    labels: { primary: "Team", secondary: "Student" }
  },
  { 
    value: "custom", 
    label: "Custom Game", 
    tag: "",
    icon: Plus,
    tagline: "Design your own event experience.",
    defaults: "All fields free for customization",
    labels: { primary: "Founder", secondary: "Investor" }
  },
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
  const [step, setStep] = useState<"template" | "form">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

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

  const getTemplateLabels = () => {
    const template = GAME_TEMPLATES.find(t => t.value === selectedTemplate);
    return template?.labels || { primary: "Founder", secondary: "Investor" };
  };

  const applyTemplate = (templateValue: string) => {
    setSelectedTemplate(templateValue);
    setFormData(prev => ({ ...prev, gameType: templateValue }));

    switch (templateValue) {
      case "startup-pitch":
        setBudgets({ founder: 10000, angel: 100000, vc: 1000000, team: 50000, investor: 25000 });
        setFormData(prev => ({ 
          ...prev, 
          showPublicLeaderboards: true, 
          circuitBreaker: true, 
          circuitBreakerPercent: 200, 
          circuitBreakerDuration: 60 
        }));
        break;
      case "vc-simulation":
        setBudgets({ founder: 10000, angel: 250000, vc: 2000000, team: 50000, investor: 25000 });
        setFormData(prev => ({ 
          ...prev, 
          allowSecondary: true, 
          showPublicLeaderboards: false, 
          showPrivateLeaderboards: true 
        }));
        break;
      case "corporate-networking":
        setBudgets({ founder: 5000, angel: 10000, vc: 50000, team: 5000, investor: 10000 });
        setFormData(prev => ({ 
          ...prev, 
          votingMode: "points", 
          showPublicLeaderboards: false 
        }));
        break;
      case "conference-expo":
        setBudgets({ founder: 20000, angel: 50000, vc: 100000, team: 20000, investor: 50000 });
        setFormData(prev => ({ 
          ...prev, 
          showPublicLeaderboards: true, 
          allowSecondary: true 
        }));
        break;
      case "hackathon-university":
        setBudgets({ founder: 10000, angel: 20000, vc: 50000, team: 10000, investor: 20000 });
        setFormData(prev => ({ 
          ...prev, 
          showPublicLeaderboards: true, 
          circuitBreaker: false 
        }));
        break;
      case "custom":
      default:
        // Keep current values for custom template
        break;
    }

    setStep("form");
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

  if (step === "template") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Create New Game</h1>
            <p className="text-gray-600 mt-2">Choose a template to get started</p>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {GAME_TEMPLATES.map((template) => {
                const IconComponent = template.icon;
                return (
                  <Card 
                    key={template.value} 
                    className="cursor-pointer hover:shadow-lg transition-shadow bg-white border-gray-200"
                    onClick={() => applyTemplate(template.value)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <IconComponent className="h-6 w-6 text-orange-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-gray-700">{template.label}</CardTitle>
                            {template.tag && (
                              <Badge variant="secondary" className="mt-1 bg-orange-100 text-orange-700">
                                {template.tag}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">{template.tagline}</p>
                      <div className="text-sm text-gray-500">
                        <strong>Defaults:</strong> {template.defaults}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Configure Your Game</h1>
            <p className="text-gray-600 mt-1">
              {GAME_TEMPLATES.find(t => t.value === selectedTemplate)?.label || "Custom Game"}
            </p>
          </div>
          <div className="max-w-4xl mx-auto">

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
                      <Label>Selected Template</Label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center space-x-2">
                          {(() => {
                            const template = GAME_TEMPLATES.find(t => t.value === selectedTemplate);
                            const IconComponent = template?.icon || Plus;
                            return (
                              <>
                                <IconComponent className="h-5 w-5 text-orange-600" />
                                <span className="font-medium">{template?.label || "Custom Game"}</span>
                                {template?.tag && (
                                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                    {template.tag}
                                  </Badge>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Currency</Label>
                        <Select
                          value={formData.currency}
                          onValueChange={(value) => setFormData({ ...formData, currency: value })}
                        >
                          <SelectTrigger className="h-12 bg-white border-gray-200 text-gray-700">
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
                          <SelectTrigger className="h-12 bg-white border-gray-200 text-gray-700">
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
                                "w-full h-12 justify-start text-left font-normal bg-white border-gray-200 text-gray-700",
                                !formData.startsAt && "text-gray-500"
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
                                "w-full h-12 justify-start text-left font-normal bg-white border-gray-200 text-gray-700",
                                !formData.endsAt && "text-gray-500"
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
                      <Label htmlFor="max-participants" className="text-gray-700">Max Participants</Label>
                      <Input
                        id="max-participants"
                        type="number"
                        value={formData.maxParticipants}
                        onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 100 })}
                        className="h-12 bg-white border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                        min="1"
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
                        <p className="text-sm text-gray-600">
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
                        <p className="text-sm text-gray-600">
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
                        <p className="text-sm text-gray-600">
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
                        <p className="text-sm text-gray-600">
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
                          className="h-12 bg-white border-gray-200 text-gray-700"
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
                          className="h-12 bg-white border-gray-200 text-gray-700"
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
                          <SelectTrigger className="h-12 bg-white border-gray-200 text-gray-700">
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
                          <SelectTrigger className="h-12 bg-white border-gray-200 text-gray-700">
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
                        <Label htmlFor="founderBudget">{getTemplateLabels().primary} Budget</Label>
                        <Input
                          id="founderBudget"
                          type="number"
                          value={budgets.founder}
                          onChange={(e) => setBudgets({ ...budgets, founder: Number(e.target.value) })}
                          min="0"
                          className="h-12 bg-white border-gray-200 text-gray-700"
                        />
                        <p className="text-xs text-gray-600 mt-1">
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
                          className="h-12 bg-white border-gray-200 text-gray-700"
                        />
                        <p className="text-xs text-gray-600 mt-1">
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
                          className="h-12 bg-white border-gray-200 text-gray-700"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          {formatBudget(budgets.vc)}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="teamBudget">{getTemplateLabels().secondary} Budget</Label>
                        <Input
                          id="teamBudget"
                          type="number"
                          value={budgets.team}
                          onChange={(e) => setBudgets({ ...budgets, team: Number(e.target.value) })}
                          min="0"
                          className="h-12 bg-white border-gray-200 text-gray-700"
                        />
                        <p className="text-xs text-gray-600 mt-1">
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
                          className="h-12 bg-white border-gray-200 text-gray-700"
                        />
                        <p className="text-xs text-gray-600 mt-1">
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
                          <SelectTrigger className="h-12 bg-white border-gray-200 text-gray-700">
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
                          <p className="text-sm text-gray-600">
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
                <Card className="bg-[#f9f9f9] border-gray-200 shadow-sm sticky top-6">
                  <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center">
                      📘 How it works
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">1️⃣ Pre-Market Phase</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• After creating the game, all players are notified.</li>
                          <li>• Players can create their projects/startups/ideas.</li>
                          <li>• Trading is locked (no buy/sell yet).</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">2️⃣ Open Market</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• On Start Date & Time → trading opens.</li>
                          <li>• Players can pitch, buy and sell shares.</li>
                          <li>• Valuations and leaderboards update in real time.</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">3️⃣ Market Close</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• On End Date & Time → trading stops.</li>
                          <li>• Winners are announced:</li>
                        </ul>
                        <div className="ml-4 mt-2 space-y-1 text-sm text-gray-600">
                          <div>🏆 Most Valued Startup</div>
                          <div>💰 Best Investor (highest portfolio gain)</div>
                          <div>🔄 Most Active Trader</div>
                          <div>🚀 Rising Star (fastest growth)</div>
                          <div>⭐ People's Choice (most unique investors)</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 mt-4 border border-gray-200">
                      <p className="text-sm text-gray-600">
                        ℹ️ <strong>Note:</strong> You can customize winners, rewards, and categories later.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Editable Notice */}
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Don't worry</strong> — you can edit all game settings until the game starts.
              </AlertDescription>
            </Alert>

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
