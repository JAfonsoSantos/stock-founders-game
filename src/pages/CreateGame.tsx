import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/DatePicker";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { GameProfile } from "@/components/GameProfile";
import { BrandingUpload } from "@/components/BrandingUpload";
import { ImageEditor } from "@/components/ImageEditor";
import { 
  ChevronDown, 
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
  Plus,
  X
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
    labels: { primary: "Founder", secondary: "Investor" },
    colors: { bg: "bg-gradient-to-br from-blue-100 to-blue-200", icon: "text-blue-600", iconBg: "bg-blue-500" }
  },
  { 
    value: "vc-simulation", 
    label: "VC Investment Simulation", 
    tag: "New",
    icon: Crown,
    tagline: "Play as investors, evaluate and win.",
    defaults: "Founder $10k | Angel $250k | VC $2M",
    labels: { primary: "Startup", secondary: "Investor" },
    colors: { bg: "bg-gradient-to-br from-purple-100 to-purple-200", icon: "text-purple-600", iconBg: "bg-purple-500" }
  },
  { 
    value: "corporate-networking", 
    label: "Corporate Networking Challenge", 
    tag: "",
    icon: Handshake,
    tagline: "Boost team connections through trading.",
    defaults: "Team $5k | Employee $10k",
    labels: { primary: "Team", secondary: "Employee" },
    colors: { bg: "bg-gradient-to-br from-green-100 to-green-200", icon: "text-green-600", iconBg: "bg-green-500" }
  },
  { 
    value: "conference-expo", 
    label: "Conference & Expo Game", 
    tag: "",
    icon: Sparkles,
    tagline: "Engage attendees by turning stands into stocks.",
    defaults: "Booth $20k | Visitor $50k",
    labels: { primary: "Booth", secondary: "Visitor" },
    colors: { bg: "bg-gradient-to-br from-amber-100 to-amber-200", icon: "text-amber-600", iconBg: "bg-amber-500" }
  },
  { 
    value: "hackathon-university", 
    label: "Hackathon / University Edition", 
    tag: "",
    icon: Lightbulb,
    tagline: "Teams pitch, students invest, growth wins.",
    defaults: "Team $10k | Student $20k",
    labels: { primary: "Team", secondary: "Student" },
    colors: { bg: "bg-gradient-to-br from-pink-100 to-pink-200", icon: "text-pink-600", iconBg: "bg-pink-500" }
  },
  { 
    value: "custom", 
    label: "Custom Game", 
    tag: "",
    icon: Plus,
    tagline: "Design your own event experience.",
    defaults: "All fields free for customization",
    labels: { primary: "Founder", secondary: "Investor" },
    colors: { bg: "bg-gradient-to-br from-gray-100 to-gray-200", icon: "text-gray-600", iconBg: "bg-gray-500" }
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
  const [step, setStep] = useState<"template" | "form" | "preview" | "image-editor">("template");
  const [howItWorksOpen, setHowItWorksOpen] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [editingImageType, setEditingImageType] = useState<'logo' | 'header' | null>(null);

  const today = new Date();

  const [formData, setFormData] = useState({
    // Event Details
    name: "",
    description: "",
    organizerName: "",
    organizerWebsite: "",
    gameType: "custom",
    currency: "USD",
    locale: "en",
    startsAt: today,
    endsAt: today,
    maxParticipants: 100,
    unlimitedParticipants: true,

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
    profileHeader: "",
    colorTheme: "default",
    notificationSettings: true,
  });

  const [budgets, setBudgets] = useState([
    { id: 'founder', label: 'Founder Budget', value: 10000 },
    { id: 'angel', label: 'Angel Budget', value: 100000 },
    { id: 'vc', label: 'VC Budget', value: 1000000 },
  ]);

  const availableBudgetTypes = [
    { id: 'founder', label: 'Founder Budget' },
    { id: 'angel', label: 'Angel Budget' },
    { id: 'vc', label: 'VC Budget' },
    { id: 'team', label: 'Team Budget' },
    { id: 'investor', label: 'Investor Budget' },
    { id: 'employee', label: 'Employee Budget' },
    { id: 'student', label: 'Student Budget' },
    { id: 'visitor', label: 'Visitor Budget' },
    { id: 'booth', label: 'Booth Budget' },
  ];

  const getCurrencySymbol = () => {
    return CURRENCIES.find(c => c.value === formData.currency)?.symbol || "$";
  };

  const formatBudget = (amount: number) => {
    const symbol = getCurrencySymbol();
    return `${symbol}${amount.toLocaleString()}`;
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString();
  };

  const addBudgetType = (budgetType: string) => {
    const type = availableBudgetTypes.find(t => t.id === budgetType);
    if (type && !budgets.find(b => b.id === budgetType)) {
      setBudgets([...budgets, { id: type.id, label: type.label, value: 10000 }]);
    }
  };

  const removeBudgetType = (budgetId: string) => {
    setBudgets(budgets.filter(b => b.id !== budgetId));
  };

  const updateBudgetValue = (budgetId: string, value: number) => {
    setBudgets(budgets.map(b => b.id === budgetId ? { ...b, value } : b));
  };

  const getColorThemeColors = (theme: string) => {
    const themes = {
      'default': ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
      'corporate': ['#1F2937', '#374151', '#6B7280', '#9CA3AF'],
      'startup': ['#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'],
      'tech': ['#06B6D4', '#10B981', '#84CC16', '#F59E0B'],
    };
    return themes[theme as keyof typeof themes] || themes.default;
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
        setBudgets([
          { id: 'founder', label: 'Founder Budget', value: 10000 },
          { id: 'angel', label: 'Angel Budget', value: 100000 },
          { id: 'vc', label: 'VC Budget', value: 1000000 }
        ]);
        setFormData(prev => ({ 
          ...prev, 
          showPublicLeaderboards: true, 
          circuitBreaker: true, 
          circuitBreakerPercent: 200, 
          circuitBreakerDuration: 60 
        }));
        break;
      case "vc-simulation":
        setBudgets([
          { id: 'founder', label: 'Founder Budget', value: 10000 },
          { id: 'angel', label: 'Angel Budget', value: 250000 },
          { id: 'vc', label: 'VC Budget', value: 2000000 }
        ]);
        setFormData(prev => ({ 
          ...prev, 
          allowSecondary: true, 
          showPublicLeaderboards: false, 
          showPrivateLeaderboards: true 
        }));
        break;
      case "corporate-networking":
        setBudgets([
          { id: 'team', label: 'Team Budget', value: 5000 },
          { id: 'employee', label: 'Employee Budget', value: 10000 }
        ]);
        setFormData(prev => ({ 
          ...prev, 
          votingMode: "points", 
          showPublicLeaderboards: false 
        }));
        break;
      case "conference-expo":
        setBudgets([
          { id: 'booth', label: 'Booth Budget', value: 20000 },
          { id: 'visitor', label: 'Visitor Budget', value: 50000 }
        ]);
        setFormData(prev => ({ 
          ...prev, 
          showPublicLeaderboards: true, 
          allowSecondary: true 
        }));
        break;
      case "hackathon-university":
        setBudgets([
          { id: 'team', label: 'Team Budget', value: 10000 },
          { id: 'student', label: 'Student Budget', value: 20000 }
        ]);
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
      const roleInserts = budgets.map(budget => ({
        game_id: game.id,
        role: budget.id as any,
        default_budget: budget.value,
      }));

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
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <div className="inline-flex items-center justify-center w-4 h-4 ml-2 cursor-help group">
          <div className="relative">
            <div className="w-3 h-3 bg-gray-400 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200 group-hover:scale-110">
              <Info className="h-2 w-2 text-white" />
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent 
        className="max-w-xs bg-gray-100 text-gray-900 border-gray-300 shadow-xl" 
        style={{ backgroundColor: '#f3f4f6', color: '#111827', borderColor: '#d1d5db' }}
      >
        <p className="text-sm leading-relaxed">{content}</p>
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
          <div className="max-w-7xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {GAME_TEMPLATES.map((template) => {
                const IconComponent = template.icon;
                return (
                  <Card 
                    key={template.value} 
                    className={`cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-gray-200 ${template.colors.bg}`}
                    onClick={() => applyTemplate(template.value)}
                  >
                     <CardHeader className="pb-4">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-3">
                           <div className={`p-3 ${template.colors.iconBg} rounded-xl shadow-sm`}>
                             <IconComponent className={`h-6 w-6 text-white`} />
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

  if (step === "preview") {
    const gameData = {
      name: formData.name,
      description: formData.description,
      logo_url: formData.brandingLogo,
      hero_image_url: formData.profileHeader,
      starts_at: formData.startsAt.toISOString(),
      ends_at: formData.endsAt.toISOString(),
      currency: formData.currency,
      locale: formData.locale,
      allow_secondary: formData.allowSecondary,
      show_public_leaderboards: formData.showPublicLeaderboards,
      circuit_breaker: formData.circuitBreaker,
      max_price_per_share: formData.maxPricePerShare,
      default_budgets: {
        founder: budgets.find(b => b.id === 'founder')?.value || 0,
        angel: budgets.find(b => b.id === 'angel')?.value || 0,
        vc: budgets.find(b => b.id === 'vc')?.value || 0,
      },
      organizer: {
        name: user?.user_metadata?.full_name || user?.email || "Event Organizer",
        avatar: user?.user_metadata?.avatar_url,
      },
    };

    const handleCreateGame = () => {
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSubmit(fakeEvent);
    };

    const handleImageEdit = (type?: 'logo' | 'header') => {
      if (type) {
        setEditingImageType(type);
        setStep("image-editor");
      } else {
        setStep("form");
      }
    };

    return (
      <GameProfile
        gameData={gameData}
        isPreview={true}
        onBack={() => setStep("form")}
        onEdit={handleImageEdit}
        onCreateGame={handleCreateGame}
      />
    );
  }

  if (step === "image-editor" && editingImageType) {
    const handleSaveImage = async (imageBlob: Blob) => {
      try {
        console.log("Starting image save...", editingImageType);
        const fileExt = 'png';
        const fileName = `${Date.now()}-edited.${fileExt}`;
        const bucketName = editingImageType === 'logo' ? 'logos' : 'headers';

        console.log("Uploading to bucket:", bucketName, "filename:", fileName);

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, imageBlob);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw uploadError;
        }

        console.log("Upload successful, getting public URL...");

        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);

        console.log("Public URL:", publicUrl);

        // Update form data with new image URL
        if (editingImageType === 'logo') {
          setFormData({ ...formData, brandingLogo: publicUrl });
        } else {
          setFormData({ ...formData, profileHeader: publicUrl });
        }

        setEditingImageType(null);
        setStep("preview");
        
        toast({
          title: "Image saved successfully!",
          description: `${editingImageType === 'logo' ? 'Logo' : 'Header image'} has been updated`,
        });
      } catch (error: any) {
        console.error("Full error:", error);
        toast({
          variant: "destructive",
          title: "Upload failed", 
          description: error.message || "Unknown error occurred",
        });
      }
    };

    const currentImageUrl = editingImageType === 'logo' 
      ? formData.brandingLogo 
      : formData.profileHeader;

    return (
      <ImageEditor
        imageUrl={currentImageUrl}
        type={editingImageType}
        onSave={handleSaveImage}
        onCancel={() => {
          setEditingImageType(null);
          setStep("preview");
        }}
      />
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
          
          <div className="max-w-7xl mx-auto">
            {/* How it works - Collapsible */}
            <Card className="bg-[#f9f9f9] border-gray-200 shadow-sm mb-6">
              <CardHeader 
                className="cursor-pointer" 
                onClick={() => setHowItWorksOpen(!howItWorksOpen)}
              >
                <CardTitle className="text-gray-900 flex items-center justify-between">
                  <span className="flex items-center">
                    📘 How it works
                  </span>
                  <div className={`transition-transform ${howItWorksOpen ? 'rotate-180' : ''}`}>
                    ▼
                  </div>
                </CardTitle>
              </CardHeader>
              {howItWorksOpen && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">1️⃣ Pre-Market Phase</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• After creating the game, all players are notified.</li>
                        <li>• Players can create their projects/startups/ideas.</li>
                        <li>• Trading is locked (no buy/sell yet).</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">2️⃣ Open Market</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• On Start Date & Time → trading opens.</li>
                        <li>• Players can pitch, buy and sell shares.</li>
                        <li>• Valuations and leaderboards update in real time.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">3️⃣ Market Close</h4>
                      <ul className="text-sm text-gray-600 space-y-1 mb-3">
                        <li>• On End Date & Time → trading stops.</li>
                        <li>• Winners are announced:</li>
                      </ul>
                      <div className="text-xs text-gray-600 space-y-1">
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
              )}
            </Card>

            <div className="space-y-6">
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
                      <Label className="text-gray-700 font-medium">Selected Template</Label>
                      <Select
                        value={selectedTemplate}
                        onValueChange={(value) => applyTemplate(value)}
                      >
                        <SelectTrigger className="h-12 bg-white border-gray-300 text-gray-700">
                          <SelectValue>
                            {(() => {
                              const template = GAME_TEMPLATES.find(t => t.value === selectedTemplate);
                              const IconComponent = template?.icon || Plus;
                              return (
                                <div className="flex items-center space-x-2">
                                  <div className={`p-1.5 ${template?.colors?.iconBg || 'bg-gray-500'} rounded-md`}>
                                    <IconComponent className="h-4 w-4 text-white" />
                                  </div>
                                  <span className="font-medium">{template?.label || "Custom Game"}</span>
                                  {template?.tag && (
                                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                                      {template.tag}
                                    </Badge>
                                  )}
                                </div>
                              );
                            })()}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {GAME_TEMPLATES.map((template) => {
                            const IconComponent = template.icon;
                            return (
                              <SelectItem key={template.value} value={template.value}>
                                <div className="flex items-center space-x-2">
                                  <div className={`p-1.5 ${template.colors.iconBg} rounded-md`}>
                                    <IconComponent className="h-4 w-4 text-white" />
                                  </div>
                                  <span className="font-medium">{template.label}</span>
                                  {template.tag && (
                                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs ml-2">
                                      {template.tag}
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
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

                    <div>
                      <Label htmlFor="website" className="text-gray-700">Website (Optional)</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.organizerWebsite}
                        onChange={(e) => setFormData({ ...formData, organizerWebsite: e.target.value })}
                        placeholder="e.g., https://techcorp.com"
                        className="h-12 bg-white border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>

                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <Label className="text-gray-700 font-medium">Currency</Label>
                         <Select
                           value={formData.currency}
                           onValueChange={(value) => setFormData({ ...formData, currency: value })}
                         >
                           <SelectTrigger className="h-12 bg-white border-gray-300 text-gray-700">
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
                         <Label className="text-gray-700 font-medium">Language</Label>
                         <Select
                           value={formData.locale}
                           onValueChange={(value) => setFormData({ ...formData, locale: value })}
                         >
                           <SelectTrigger className="h-12 bg-white border-gray-300 text-gray-700">
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
                          <Label className="text-gray-700 font-medium">Start Date</Label>
                          <DatePicker
                            date={formData.startsAt}
                            onDateSelect={(date) => setFormData({ ...formData, startsAt: date })}
                            placeholder="Pick start date"
                          />
                        </div>

                        <div>
                          <Label className="text-gray-700 font-medium">End Date</Label>
                          <DatePicker
                            date={formData.endsAt}
                            onDateSelect={(date) => setFormData({ ...formData, endsAt: date })}
                            placeholder="Pick end date"
                          />
                        </div>
                      </div>

                     <div className="space-y-3">
                       <div className="flex items-center justify-between">
                         <div className="space-y-0.5">
                           <Label className="text-gray-700 font-medium">Max Participants</Label>
                           <p className="text-sm text-gray-600">
                             Set a limit on the number of participants
                           </p>
                         </div>
                         <div className="flex items-center space-x-2">
                           <span className="text-sm text-gray-600">Unlimited</span>
                           <Switch
                             checked={formData.unlimitedParticipants}
                             onCheckedChange={(checked) => setFormData({ ...formData, unlimitedParticipants: checked })}
                           />
                         </div>
                       </div>
                       {!formData.unlimitedParticipants && (
                         <div>
                           <Input
                             id="max-participants"
                             type="number"
                             value={formData.maxParticipants}
                             onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 100 })}
                             className="h-12 bg-white border-gray-300 text-gray-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                             min="1"
                             placeholder="Enter maximum number of participants"
                           />
                         </div>
                       )}
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
                           <Label className="text-gray-700 font-medium">Allow Secondary Trading</Label>
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
                         <Label className="text-gray-700 font-medium">Public Leaderboards</Label>
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
                         <Label className="text-gray-700 font-medium">Private Leaderboards</Label>
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
                           <Label className="text-gray-700 font-medium">Circuit Breaker</Label>
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
                          <Label htmlFor="maxPrice" className="text-gray-700 font-medium">Max Price Per Share</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                              {getCurrencySymbol()}
                            </span>
                            <Input
                              id="maxPrice"
                              type="number"
                              value={formData.maxPricePerShare}
                              onChange={(e) => setFormData({ ...formData, maxPricePerShare: Number(e.target.value) })}
                              min="1"
                              step="0.01"
                              className="h-12 bg-white border-gray-300 text-gray-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 pl-8"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="initialPrice" className="text-gray-700 font-medium">Initial Share Price</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                              {getCurrencySymbol()}
                            </span>
                            <Input
                              id="initialPrice"
                              type="number"
                              value={formData.initialSharePrice}
                              onChange={(e) => setFormData({ ...formData, initialSharePrice: Number(e.target.value) })}
                              min="0.01"
                              step="0.01"
                              className="h-12 bg-white border-gray-300 text-gray-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 pl-8"
                            />
                          </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <div className="flex items-center">
                           <Label className="text-gray-700 font-medium">Voting / Investment Mode</Label>
                           <InfoTooltip content="Choose how participants invest: real-looking virtual money, points system, or a mix of both" />
                         </div>
                         <Select
                           value={formData.votingMode}
                           onValueChange={(value) => setFormData({ ...formData, votingMode: value })}
                         >
                           <SelectTrigger className="h-12 bg-white border-gray-300 text-gray-700">
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
                           <Label className="text-gray-700 font-medium">Reward System</Label>
                           <InfoTooltip content="How winners will be rewarded: no rewards, manual distribution by organizer, or integrated with prize platform" />
                         </div>
                         <Select
                           value={formData.rewardSystem}
                           onValueChange={(value) => setFormData({ ...formData, rewardSystem: value })}
                         >
                           <SelectTrigger className="h-12 bg-white border-gray-300 text-gray-700">
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
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      {budgets.map((budget) => (
                        <div key={budget.id} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                          <div className="flex-1">
                            <Label className="text-gray-700 font-medium">{budget.label}</Label>
                            <div className="relative mt-1">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                                {getCurrencySymbol()}
                              </span>
                              <Input
                                type="number"
                                value={budget.value}
                                onChange={(e) => updateBudgetValue(budget.id, Number(e.target.value))}
                                min="0"
                                className="h-10 bg-white border-gray-300 text-gray-900 focus:border-orange-500 pl-8"
                              />
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 min-w-[80px]">
                            {formatBudget(budget.value)}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeBudgetType(budget.id)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-2">
                      <Select onValueChange={(value) => addBudgetType(value)}>
                        <SelectTrigger className="h-10 bg-white border-gray-300 text-gray-700">
                          <SelectValue placeholder="Add budget type..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableBudgetTypes
                            .filter(type => !budgets.find(b => b.id === type.id))
                            .map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
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
                     <div className="space-y-4">
                       <BrandingUpload
                         type="logo"
                         currentUrl={formData.brandingLogo}
                         onUpload={(url) => setFormData({ ...formData, brandingLogo: url })}
                         title="Branding / Logo Upload"
                         description="PNG, JPG up to 2MB"
                       />

                       <BrandingUpload
                         type="header"
                         currentUrl={formData.profileHeader}
                         onUpload={(url) => setFormData({ ...formData, profileHeader: url })}
                         title="Profile Header Upload"
                         description="PNG, JPG up to 5MB • Recommended: 1200x400px"
                       />
                     </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <Label className="text-gray-700 font-medium flex items-center">
                            Color Theme
                            <Palette className="h-4 w-4 ml-2 text-gray-400" />
                          </Label>
                          <Select value={formData.colorTheme} onValueChange={(value) => setFormData({ ...formData, colorTheme: value })}>
                            <SelectTrigger className="h-12 bg-white border-gray-300 text-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="default">
                               <div className="flex items-center space-x-2">
                                 <span>Default</span>
                                 <div className="flex space-x-1">
                                   {getColorThemeColors('default').map((color, i) => (
                                     <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                                   ))}
                                 </div>
                               </div>
                             </SelectItem>
                             <SelectItem value="corporate">
                               <div className="flex items-center space-x-2">
                                 <span>Corporate</span>
                                 <div className="flex space-x-1">
                                   {getColorThemeColors('corporate').map((color, i) => (
                                     <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                                   ))}
                                 </div>
                               </div>
                             </SelectItem>
                             <SelectItem value="startup">
                               <div className="flex items-center space-x-2">
                                 <span>Startup</span>
                                 <div className="flex space-x-1">
                                   {getColorThemeColors('startup').map((color, i) => (
                                     <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                                   ))}
                                 </div>
                               </div>
                             </SelectItem>
                             <SelectItem value="tech">
                               <div className="flex items-center space-x-2">
                                 <span>Tech</span>
                                 <div className="flex space-x-1">
                                   {getColorThemeColors('tech').map((color, i) => (
                                     <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                                   ))}
                                 </div>
                               </div>
                             </SelectItem>
                           </SelectContent>
                         </Select>
                       </div>

                       <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="flex items-center">
                              <Label className="text-gray-700 font-medium">Notification Settings</Label>
                              <InfoTooltip content="Send automatic email notifications to participants about game status changes, market opens/closes, and important updates" />
                            </div>
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
               
                {/* Create Game Button */}
                <div className="mt-8">
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <Info className="h-4 w-4 text-blue-600" />
                        <p className="text-sm text-gray-600">
                          <strong>Don't worry</strong> — you can edit all game settings until the game starts.
                        </p>
                      </div>
                      <Button 
                        onClick={() => setStep("preview")}
                        className="w-full h-14 bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-semibold text-lg" 
                        disabled={loading}
                      >
                        Preview Game
                      </Button>
                    </CardContent>
                  </Card>
                 </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
